"""
agent/graph.py
---------------
The core LangGraph agent: Intent Router -> Tool Call -> Response.

Two modes, auto-detected:

1. LLM MODE (real) - if an API key is configured (ANTHROPIC_API_KEY,
   OPENAI_API_KEY, or a vLLM-compatible OPENAI_BASE_URL), the agent uses
   an actual LLM to understand free-form questions and pick tools. This
   is the real Phase-1 architecture described in the proposal.

2. DEMO MODE (fallback) - if no key is configured, the same graph runs
   with simple keyword-based routing instead of an LLM call. This lets
   you demo the *architecture and data flow* (LangGraph -> Tool ->
   Mock ERP -> Response) to your guide with zero setup, no API key,
   no cost. Swap in a real key later and nothing else changes.

This dual-mode design is only for a student project demo. In production
you would not ship a non-LLM fallback.
"""

import os
import re
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END
from backend.agent.tools import make_tools
from langchain_groq import ChatGroq

LLM_AVAILABLE = bool(
    os.environ.get("GROQ_API_KEY") # e.g. a self-hosted vLLM endpoint
)


class AgentState(TypedDict):
    student_id: str
    user_message: str
    intent: Optional[str]
    tool_name: Optional[str]
    tool_args: dict
    tool_result: Optional[dict]
    response: Optional[str]


# ---------------------------------------------------------------------------
# LLM builder (only imported/constructed if a key is actually present)
# ---------------------------------------------------------------------------
def _build_llm():
    if os.environ.get("ANTHROPIC_API_KEY"):
        return ChatGroq(model="qwen/qwen3.6-27b", temperature=0)
    raise RuntimeError("No LLM configured")


# ---------------------------------------------------------------------------
# DEMO MODE: keyword-based intent routing (no API key needed)
# ---------------------------------------------------------------------------
_MISS_PATTERN = re.compile(r"(\d+)\s*(class|classes)", re.IGNORECASE)

def _keyword_route(message: str) -> tuple[str, dict]:
    m = message.lower()

    if any(w in m for w in ["miss", "skip", "bunk", "agar"]) and _MISS_PATTERN.search(m):
        n = int(_MISS_PATTERN.search(m).group(1))
        subject = "Data Structures"
        for subj in ["data structures", "os", "operating systems", "dbms",
                     "computer networks", "signals", "electronics", "thermodynamics",
                     "fluid mechanics", "machine design", "web technologies", "cloud computing"]:
            if subj in m:
                subject = subj
                break
        return "what_if_miss_classes", {"subject": subject, "classes_to_miss": n}

    if "attendance" in m or "attend" in m:
        subject = ""
        for subj in ["data structures", "os", "operating systems", "dbms",
                     "computer networks", "signals", "electronics", "thermodynamics",
                     "fluid mechanics", "machine design", "web technologies", "cloud computing"]:
            if subj in m:
                subject = subj
                break
        return "get_my_attendance", {"subject": subject}

    if "timetable" in m or "class" in m or "schedule" in m and "exam" not in m:
        day = ""
        if "tomorrow" in m or "kal" in m:
            day = "tomorrow"
        elif "today" in m or "aaj" in m:
            day = "today"
        else:
            for wd in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]:
                if wd in m:
                    day = wd
                    break
        return "get_my_timetable", {"day": day}

    if "exam" in m:
        return "get_my_exam_schedule", {}

    if "fee" in m:
        return "get_my_fee_status", {}

    return "unknown", {}


def _format_demo_response(tool_name: str, result: dict) -> str:
    if "error" in result:
        return f"Sorry, {result['error']}"

    if tool_name == "get_my_attendance":
        if "overall_percentage" in result:
            lines = [f"Overall attendance: {result['overall_percentage']}%"]
            for subj, rec in result["subjects"].items():
                lines.append(f"  - {subj}: {rec['percentage']}% ({rec['attended']}/{rec['held']})")
            return "\n".join(lines)
        return f"{result['subject']}: {result['percentage']}% ({result['attended']}/{result['held']} classes)"

    if tool_name == "get_my_timetable":
        if "classes" in result:
            if not result["classes"]:
                return f"No classes scheduled on {result['day']}."
            return f"Classes on {result['day']}:\n" + "\n".join(f"  - {c}" for c in result["classes"])
        lines = []
        for day, classes in result["week"].items():
            lines.append(f"{day}: " + (", ".join(classes) if classes else "No classes"))
        return "\n".join(lines)

    if tool_name == "get_my_exam_schedule":
        if not result["exams"]:
            return "No upcoming exams scheduled."
        lines = ["Upcoming exams:"]
        for e in result["exams"]:
            lines.append(f"  - {e['subject']}: {e['date']} at {e['time']}, {e['venue']}")
        return "\n".join(lines)

    if tool_name == "get_my_fee_status":
        if result["due"] == 0:
            return "All fees are paid. No dues."
        return f"Due amount: Rs.{result['due']} (out of Rs.{result['total']}), due by {result['due_date']}."

    if tool_name == "what_if_miss_classes":
        warn = " This would drop you below the 75% requirement!" if result["below_75_warning"] else ""
        return (f"If you miss {result['classes_to_miss']} more classes in {result['subject']}, "
                f"your attendance would go from {result['current_percentage']}% to "
                f"{result['projected_percentage']}%.{warn}")

    return "I couldn't understand that. Try asking about attendance, timetable, exams, or fees."


# ---------------------------------------------------------------------------
# Graph nodes
# ---------------------------------------------------------------------------
def route_intent(state: AgentState) -> AgentState:
    if LLM_AVAILABLE:
        # Real routing: the LLM + tool-calling loop happens inside call_tool
        # via bind_tools; this node just marks that we go through the LLM path.
        state["intent"] = "llm"
        return state

    tool_name, tool_args = _keyword_route(state["user_message"])
    state["intent"] = "demo"
    state["tool_name"] = tool_name
    state["tool_args"] = tool_args
    return state


def call_tool(state: AgentState) -> AgentState:
    tools = make_tools(state["student_id"])
    tools_by_name = {t.name: t for t in tools}

    if state["intent"] == "llm":
        llm = _build_llm()
        llm_with_tools = llm.bind_tools(tools)
        result = llm_with_tools.invoke(
            f"You are a college assistant. Answer this student's question by "
            f"calling exactly one tool if needed: {state['user_message']}"
        )
        if not result.tool_calls:
            state["response"] = result.content
            state["tool_result"] = None
            return state

        call = result.tool_calls[0]
        tool = tools_by_name[call["name"]]
        state["tool_name"] = call["name"]
        state["tool_result"] = tool.invoke(call["args"])
        return state

    # demo mode
    if state["tool_name"] == "unknown":
        state["tool_result"] = None
        return state
    tool = tools_by_name[state["tool_name"]]
    state["tool_result"] = tool.invoke(state["tool_args"])
    return state


def generate_response(state: AgentState) -> AgentState:
    if state.get("response"):
        return state  # LLM already answered directly, no tool needed

    if state["tool_result"] is None:
        state["response"] = ("I can help with attendance, timetable, exam schedule, "
                              "or fee status. Could you rephrase your question?")
        return state

    if state["intent"] == "llm":
        llm = _build_llm()
        summary = llm.invoke(
            f"The student asked: '{state['user_message']}'. "
            f"Tool result (JSON): {state['tool_result']}. "
            f"Answer the student's question in one short, friendly paragraph "
            f"using this data. Do not invent numbers not present in the data."
        )
        state["response"] = summary.content
    else:
        state["response"] = _format_demo_response(state["tool_name"], state["tool_result"])

    return state


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("route_intent", route_intent)
    graph.add_node("call_tool", call_tool)
    graph.add_node("generate_response", generate_response)

    graph.set_entry_point("route_intent")
    graph.add_edge("route_intent", "call_tool")
    graph.add_edge("call_tool", "generate_response")
    graph.add_edge("generate_response", END)

    return graph.compile()


_compiled_graph = None

def get_agent():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


def run_agent(student_id: str, user_message: str) -> dict:
    agent = get_agent()
    final_state = agent.invoke({
        "student_id": student_id,
        "user_message": user_message,
        "intent": None,
        "tool_name": None,
        "tool_args": {},
        "tool_result": None,
        "response": None,
    })
    return {
        "response": final_state["response"],
        "tool_used": final_state.get("tool_name"),
        "mode": "llm" if LLM_AVAILABLE else "demo",
    }
