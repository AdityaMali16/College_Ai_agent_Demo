# College AI Agent — Phase 1 (Proof of Concept)

FastAPI + LangGraph agent backend with a Dummy ERP, matching Phase 1 of the
project roadmap. Runs in two modes:

- **DEMO MODE** (default, zero setup) — no API key needed. Uses simple
  keyword-based routing so you can demo the full architecture and data
  flow to your guide immediately.
- **LLM MODE** — set an API key in `.env` and the same LangGraph graph
  routes through a real LLM (Claude, OpenAI, or your self-hosted vLLM
  endpoint) instead.

## 1. Setup

```bash
cd college_ai_agent
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

(Optional, for LLM mode only)
```bash
cp .env.example .env
# edit .env and uncomment/fill ONE provider block
pip install langchain-anthropic     # or: pip install langchain-openai
```

## 2. Run

```bash
uvicorn backend.main:app --reload --port 8000
```

Open **http://localhost:8000** in your browser. That's it — no separate
frontend build needed for this demo (a proper Next.js frontend comes in a
later phase).

## 3. Demo login (Dummy ERP)

| Student ID | Password | Branch |
|---|---|---|
| CS101 | demo123 | CSE |
| CS102 | demo123 | CSE |
| EC101 | demo123 | ECE |
| ME101 | demo123 | MECH |
| CS103 | demo123 | CSE (deliberately low attendance, for testing warnings) |
| IT101 | demo123 | IT |

## 4. Demo script (for showing your guide)

1. Login with `CS101` / `demo123`.
2. Ask: **"Meri attendance kitni hai?"** → agent calls `get_my_attendance`
   tool against the Dummy ERP and returns a per-subject breakdown.
3. Ask: **"Kal ki classes kya hai?"** → agent resolves "kal" to tomorrow's
   weekday and calls `get_my_timetable`.
4. Ask: **"Agar main 5 classes miss karu Data Structures me to kya hoga?"**
   → agent calls the `what_if_miss_classes` calculation tool and warns if
   it would drop below 75%.
5. Try logging in as `CS103` (low attendance student) and ask the same
   attendance question — shows the warning branch.
6. Point out the small `tool: ... · mode: ...` label under each bot
   reply — this is a transparency feature showing exactly which
   whitelisted tool the agent called, and whether it's running in demo
   or live-LLM mode. This maps directly to the "Output/Action Validator"
   and tool-whitelisting security principle in the proposal.

## 5. Project structure

```
college_ai_agent/
├── backend/
│   ├── main.py           # FastAPI app: /api/login, /api/chat
│   ├── mock_erp.py        # Dummy ERP — fake student data
│   ├── agent/
│   │   ├── graph.py        # LangGraph: route_intent -> call_tool -> generate_response
│   │   └── tools.py        # Whitelisted tools (bound to logged-in student only)
│   └── static/
│       └── index.html      # Zero-setup test chat UI
├── requirements.txt
├── .env.example
└── README.md
```

## 6. Why this maps to your proposal

- **LangGraph Agent Orchestrator** → `agent/graph.py`'s `StateGraph`
  (Intent Router node → Tool Call node → Response node).
- **Agent Tools (whitelisted)** → `agent/tools.py` — the LLM can only call
  these 5 typed functions, never raw ERP/DB access. Tools are bound to the
  server-side session's `student_id`, so the LLM cannot be tricked into
  fetching another student's data.
- **College ERP (mock for now)** → `mock_erp.py`, swapped for real ERP
  calls in Phase 3 without touching the tools/agent layer.
- **Security principle** ("read freely, confirm before writing") → Phase 1
  only implements reads; the confirmation flow for write actions (e.g.
  leave application) is Phase 4.

## 7. Next steps (later phases)

- Phase 2: add a RAG tool over college PDFs/circulars (pgvector).
- Phase 3: replace `mock_erp.py` internals with real ERP API calls.
- Phase 4: add a write-tool (`apply_leave`) behind a human-confirmation step.
- Phase 5: RBAC, rate limiting, monitoring, pilot rollout.
