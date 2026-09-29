# 🎓 College Agent Automation — NITJ Campus AI

An AI-powered campus assistant for **Dr B R Ambedkar National Institute of Technology Jalandhar**. Ask questions in natural language and get answers from your ERP and Xceed data — attendance, timetable, fees, results, assignments, events, guest house rates, complaint status — and let the agent **perform actions for you** (file complaints, book the guest house, register for exams) through a human-approval gate.

> **Theme:** Minimalism — near-monochrome, spacious, hairline dividers.

---

## ✨ Features

### 🤖 AI Agent (chat)
- **Natural-language Q&A** over your campus data — *"What's my attendance in CSDC0304?"*, *"When is HackNITJ?"*, *"What's the guest house cancellation policy?"*
- **RAG over the knowledge base** — keyword retrieval + reranking across 16+ policy documents, with **cited sources** shown in chat
- **Tool use visible in-chat** — the agent shows which tools it used (`knowledge_rag`, `erp_tools`, `human_approval`)
- **Human-in-the-loop actions** — every write action (registration, leave, complaint, booking) appears as an **approval card**; nothing executes until you Confirm, and every resolution is audit-logged

### 🏫 ERP Portal (mirrors v1.nitj.ac.in/erp)
- Student profile card — roll no., program, section, hostel, mentor, mobile
- All five ERP modules: **Academic, Complaint, Guest House, Equipment, CONNECT**
- Timetable, attendance with 75% threshold bars, exam schedule, fees, results with SGPA, registrations, leave, tickets
- Complaint portal, guest house (real rates: Main ₹800/₹1000, SAC ₹600, Mega ₹600), equipment booking, wellness (CONNECT), exam registrations (carry/makeup/supplementary/I-grade)

### 📚 Xceed (mirrors xceed.nitj.ac.in)
- Classes grid, assignments with due dates, announcements, events, notifications

### 👥 Roles
- **Student / Faculty / Admin** picked at onboarding — RBAC gates every page

---

## 🏗️ How it works

```
Frontend (React + Vite + Tailwind + shadcn/ui)
   │  reactive queries/mutations
   ▼
Convex backend ──► agent.askAgent
   │                  ├─ intent routing
   │                  ├─ knowledge_rag  ──► knowledgeDocs
   │                  ├─ erp_tools      ──► per-user ERP + Xceed snapshot
   │                  └─ human_approval ──► pendingActions
   │                                            │ Confirm/Decline
   │ executeAction ◄────────────────────────────┘
   │        └─► registrations / complaints / bookings / …
   ▼
LLM (vly.ai.completion) — final replies
```

**Key behaviors**
- **Nothing executes without approval** — the agent proposes; you confirm; the executor writes to the database; the audit trail records everything.
- **Fully automated seeding** — one idempotent mutation populates all tables from offline sample files the moment you complete onboarding. No live scraping required.
- **Live-sync ready** — sample rows mirror the real portal/API shapes 1:1, so swapping in an authenticated fetch later touches no other code.

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for the complete annotated file tree.

---

## 🛠️ Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind v4, shadcn/ui, Framer Motion, Lucide |
| Backend | Convex (queries / mutations / actions), Convex Auth (email OTP + guest) |
| AI | vly.ai.completion integration, RAG over knowledge documents |
| Package manager | Bun (or npm) |

---

## 🚀 Getting started

### Prerequisites
- Node.js 18+ (or Bun)
- A free [Convex](https://convex.dev) account

### Setup

```bash
# 1. Install dependencies
bun install        # or: npm install

# 2. Link a Convex deployment (first run asks you to log in)
npx convex dev --once

# 3. Start the dev server
bun run dev        # or: npm run dev
```

Environment variables (see `.env.example`):

```
VITE_CONVEX_URL=      # printed by `npx convex dev`
CONVEX_SITE_URL=      # http://localhost:5173
CONVEX_DEPLOYMENT=    # set by `npx convex dev`
```

### First run
1. Open the app → sign in via **email OTP** (or continue as guest)
2. Pick your role (student / faculty / admin) at onboarding
3. All demo data (ERP + Xceed + knowledge base) seeds automatically
4. Start asking: *"What's my attendance?"*, *"File a complaint about wifi in B-214"*, *"Book the guest house for my father"*

---

## 📁 Project structure

```
src/
├── main.tsx               # Routes: / /auth /dashboard /campus /approvals /knowledge
├── index.css              # Minimalism theme (oklch tokens)
├── components/            # AppShell, CampusGate (onboarding), RequireAuth, ui/*
├── pages/                 # Landing, Auth, Dashboard (chat), Campus, Approvals, Knowledge
├── hooks/                 # useAuth, useMobile
├── lib/                   # utils, LLM integration wrapper
└── convex/                # Backend
    ├── schema.ts          # 25+ tables (ERP, Xceed, chat, actions, knowledge, audit)
    ├── agent.ts           # Agent brain: intent routing, RAG, tool calls
    ├── executeAction.ts   # Approved-action executor + audit trail
    ├── erp.ts / xceed.ts  # Portal queries
    ├── seedInternals.ts   # Auto-seeding
    └── sampleData/        # Offline mirrors of ERP + Xceed data shapes
```

Full annotated tree: [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

---

## ⚠️ Notes

- All data in this repo is **sample/demo data** shaped like the real portals — no real credentials or scraped data are included.
- The Xceed API and ERP portal are login-walled; live integration would require your own session token (never commit one) and your institution's permission.

---

## 📄 License

Built as a college project — Dr B R Ambedkar National Institute of Technology Jalandhar.
