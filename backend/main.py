"""
main.py
-------
Phase 1 FastAPI backend.

Endpoints:
  POST /api/login   - dummy auth against mock_erp.STUDENTS, returns a token
  POST /api/chat     - main agent endpoint, requires the token from /login
  GET  /             - serves the test chat UI (static/index.html)
  GET  /api/health   - simple health check

Run with:  uvicorn backend.main:app --reload --port 8000
"""

import os
import uuid
from fastapi import FastAPI, HTTPException, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend import mock_erp
from backend.agent.graph import run_agent, LLM_AVAILABLE

app = FastAPI(title="College AI Agent - Phase 1 Demo")

# In-memory session store. Good enough for a local demo; Phase 3+ should
# use Redis (already in the project's planned architecture).
_SESSIONS: dict[str, str] = {}  # token -> student_id


class LoginRequest(BaseModel):
    student_id: str
    password: str


class LoginResponse(BaseModel):
    token: str
    student_id: str
    name: str


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
    tool_used: str | None
    mode: str


def _require_session(authorization: str | None) -> str:
    """Pull the student_id out of a Bearer token. This is intentionally
    simple for Phase 1 -- swap for real JWT verification in later phases."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    student_id = _SESSIONS.get(token)
    if not student_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")
    return student_id


@app.get("/api/health")
def health():
    return {"status": "ok", "llm_mode": "live" if LLM_AVAILABLE else "demo (no API key set)"}


@app.post("/api/login", response_model=LoginResponse)
def login(req: LoginRequest):
    student = mock_erp.authenticate(req.student_id, req.password)
    if not student:
        raise HTTPException(status_code=401, detail="Invalid student ID or password")
    token = str(uuid.uuid4())
    _SESSIONS[token] = student["student_id"]
    return LoginResponse(token=token, student_id=student["student_id"], name=student["name"])


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest, authorization: str | None = Header(default=None)):
    student_id = _require_session(authorization)
    result = run_agent(student_id, req.message)
    return ChatResponse(**result)


# Serve the minimal test chat UI at "/"
_STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=_STATIC_DIR), name="static")


@app.get("/")
def index():
    return FileResponse(os.path.join(_STATIC_DIR, "index.html"))
