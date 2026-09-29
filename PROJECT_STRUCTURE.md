# Campus AI Agent — Project Structure

AI agent for NIT Jalandhar (NITJ) built with **Vite + React + TypeScript + Convex + Tailwind + shadcn/ui**, styled in a **Minimalism** theme. The agent answers campus questions from ERP + Xceed data (RAG + ERP tools) and performs actions (complaints, bookings, registrations) through a human-approval gate.

---

## Full Tree

```
campus-ai-agent/
│
├── index.html                      # App shell; title "NITJ Campus AI — Your campus, on call."
├── package.json                    # Scripts + dependencies (react, convex, tailwind, shadcn/ui)
├── components.json                 # shadcn/ui generator config
├── integrations.md                 # Docs for the built-in VLY AI integration (LLM completion API)
├── README.md                       # Project readme
├── PROJECT_STRUCTURE.md            # This file
│
├── public/
│   ├── logo.svg                    # Public logo (favicon)
│   └── manifest.webmanifest        # PWA manifest
│
└── src/
    │
    ├── main.tsx                    # Entry: providers (Convex, Auth) + routes
    │                               #   /           → Landing (public)
    │                               #   /auth       → Auth (OTP + guest sign-in)
    │                               #   /dashboard  → Agent chat (RequireAuth + CampusGate)
    │                               #   /campus     → ERP + Xceed portal (protected)
    │                               #   /approvals  → Action approval queue (protected)
    │                               #   /knowledge  → Knowledge base browser (protected)
    │                               #   *           → NotFound
    │
    ├── App.tsx                     # (unused shell kept from template)
    ├── index.css                   # Minimalism theme: oklch near-monochrome tokens,
    │                               #   hairline dividers, 6px radii, Tailwind directives
    ├── instrumentation.tsx         # Error/reporting bootstrap
    ├── vite-env.d.ts               # Vite client types
    │
    ├── types/
    │   └── global.d.ts             # Ambient type declarations
    │
    ├── hooks/
    │   ├── use-auth.ts             # useAuth: current user, sign-in/out state (Convex Auth)
    │   └── use-mobile.ts           # Media-query hook (breakpoint detection)
    │
    ├── lib/
    │   ├── utils.ts                # cn() class merger + small helpers
    │   └── vly-integrations.ts     # vly.ai.completion wrapper — LLM calls for the agent
    │
    ├── components/
    │   ├── RequireAuth.tsx         # Route guard → redirects to /auth?returnTo=<path>
    │   ├── AppShell.tsx            # Top nav (Campus / Agent / Approvals / Knowledge) +
    │   │                           #   hairline layout container for all signed-in pages
    │   ├── CampusGate.tsx          # Onboarding: role picker (student/faculty/admin) +
    │   │                           #   triggers one-time seeding of all demo data
    │   ├── LogoDropdown.tsx        # Logo + user menu dropdown
    │   │
    │   └── ui/                     # shadcn/ui primitives (unmodified)
    │       ├── accordion.tsx       alert-dialog.tsx   alert.tsx
    │       ├── aspect-ratio.tsx    avatar.tsx          badge.tsx
    │       ├── breadcrumb.tsx      button-group.tsx    button.tsx
    │       ├── calendar.tsx        card.tsx            carousel.tsx
    │       ├── chart.tsx           checkbox.tsx        collapsible.tsx
    │       ├── command.tsx         context-menu.tsx    dialog.tsx
    │       ├── drawer.tsx          dropdown-menu.tsx   empty.tsx
    │       ├── field.tsx           form.tsx            hover-card.tsx
    │       ├── index.ts            input-group.tsx     input-otp.tsx
    │       ├── input.tsx           item.tsx            kbd.tsx
    │       ├── label.tsx           menubar.tsx         navigation-menu.tsx
    │       ├── pagination.tsx      popover.tsx         progress.tsx
    │       ├── radio-group.tsx     resizable.tsx       scroll-area.tsx
    │       ├── select.tsx          separator.tsx       sheet.tsx
    │       ├── sidebar.tsx         skeleton.tsx        slider.tsx
    │       ├── sonner.tsx          spinner.tsx         switch.tsx
    │       ├── table.tsx           tabs.tsx            textarea.tsx
    │       ├── toggle-group.tsx    toggle.tsx          tooltip.tsx
    │
    ├── pages/
    │   ├── Landing.tsx             # Public marketing page — typographic hero
    │   │                           #   ("Your campus, on call."), capability grid,
    │   │                           #   "try asking" strip, CTAs → /auth
    │   ├── Auth.tsx                # Email-OTP sign-in + guest mode
    │   ├── Dashboard.tsx           # ⭐ Agent workspace — conversation sidebar,
    │   │                           #   chat stream with tool-use badges (knowledge_rag /
    │   │                           #   erp_tools / human_approval), cited sources, and
    │   │                           #   inline approval cards (Confirm / Decline)
    │   ├── Campus.tsx              # ERP + Xceed portal:
    │   │                           #   • Student profile card (roll, program, section,
    │   │                           #     hostel, mentor, mobile)
    │   │                           #   • ERP modules grid — Academic / Complaint /
    │   │                           #     Guest House / Equipment / CONNECT
    │   │                           #   • Xceed classes grid + announcements
    │   │                           #   • Tabs: Timetable, Attendance (75% bars),
    │   │                           #     Assignments, Exams, Results (SGPA), Fees,
    │   │                           #     Registrations, Events, Complaints, Guest House,
    │   │                           #     Equipment, Wellness, Exam Regs, Leave, Tickets
    │   ├── Approvals.tsx           # Pending actions queue + resolved history + audit log
    │   ├── Knowledge.tsx           # Searchable policy documents (the agent's RAG corpus)
    │   └── NotFound.tsx            # 404 page
    │
    └── convex/                     # ── Backend (database + server functions) ──
        │
        ├── schema.ts               # All tables:
        │                           #   users, authSessions (Convex Auth)
        │                           #   campusProfiles (role + ERP profile fields)
        │                           #   conversations, messages
        │                           #   pendingActions (type, payload, status, audit)
        │                           #   knowledgeDocs (RAG corpus)
        │                           #   timetable, attendance, examSchedule, fees,
        │                           #   leaves, tickets, registrations, results, notices
        │                           #   complaints, guestHouseBookings, equipmentBookings,
        │                           #   connectRequests, examRegistrations
        │                           #   xceedClasses, xceedAssignments, xceedAnnouncements,
        │                           #   xceedAttendance, xceedEvents, xceedNotifications
        │                           #   syncMeta
        │                           # Indexes on every user-scoped lookup field
        │
        ├── users.ts                # getCurrentUser helper (auth → users row)
        ├── campus.ts               # Profiles: myProfile, createProfile (with ERP fields)
        │
        ├── agent.ts                # ⭐ The agent brain (public queries/mutations + action):
        │                           #   askAgent — full pipeline:
        │                           #     1. intent routing (academic / ERP / xceed /
        │                           #        action / knowledge)
        │                           #     2. gatherErpContext via internal queries:
        │                           #        profile, timetable, attendance, fees,
        │                           #        results, registrations, leaves, tickets,
        │                           #        complaints, bookings, xceed data
        │                           #     3. knowledge_rag tool — keyword retrieval +
        │                           #        reranking over knowledgeDocs
        │                           #     4. action extraction → insertPendingAction
        │                           #        (approval card shown in chat)
        │                           #     5. LLM reply via vly.ai.completion
        │                           #   getMessages, listConversations,
        │                           #   createConversation, deleteConversation, getAction
        │
        ├── executeAction.ts        # Executor: approved pendingActions → real mutations
        │                           #   (course registration, leave, ticket, complaint,
        │                           #   guest house, equipment, CONNECT, exam reg, notice)
        │                           #   resolveAction: approve/decline + audit trail
        │
        ├── erp.ts                  # ERP queries (per-user): timetable, attendance,
        │                           #   fees, exams, results, leaves, tickets,
        │                           #   registrations, notices + mutations
        │                           #   (addTicket, applyLeave, registerCourse, …)
        │                           #   + five-module queries (complaints, guest house,
        │                           #   equipment, connect, exam registrations)
        │
        ├── xceed.ts                # Xceed queries: classes, assignments, announcements,
        │                           #   events, notifications (reads the seeded tables —
        │                           #   shapes match the real Xceed API 1:1)
        │
        ├── seed.ts                 # Public mutation: seedOnboarding (idempotent, called
        │                           #   after role pick) → runs internal seeding
        │
        ├── seedInternals.ts        # seedUserData internal mutation — populates EVERYTHING
        │                           #   from sampleData/ (ERP, Xceed, results, knowledge
        │                           #   docs, module data), enriches profile, cleans
        │                           #   prior rows first
        │
        ├── sampleData/             # ── Offline data mirrors (no live scraping) ──
        │   ├── erp.ts              # ERP-portal-shaped data: profile (24103007, Aditya
        │                           #   Mali, adityam.cs.24@nitj.ac.in, 8770496150),
        │                           #   timetable, attendance, fees, results, exams,
        │                           #   notices, complaint types, guest houses with
        │                           #   real rates (Main ₹800/₹1000, SAC ₹600, Mega ₹600)
        │                           #   + cancellation policy, equipment catalog,
        │                           #   CONNECT info, exam-reg types
        │   └── xceed.ts            # Xceed-API-shaped data: classes (Data Mining &
        │                           #   Analytics / CSDC0307 / Jagdeep Kaur, …),
        │                           #   assignments, announcements, events
        │                           #   (Utkansh, HackNITJ), notifications
        │
        ├── auth.config.ts          # Convex Auth providers config
        ├── auth.ts                 # Convex Auth setup (client)
        ├── auth/emailOtp.ts        # Email OTP auth component
        ├── http.ts                 # HTTP routes (auth webhook endpoints)
        └── _generated/             # Convex codegen output (DO NOT EDIT)
```

---

## Architecture (data flow)

```
                 ┌──────────────────────────────────────────────┐
                 │                  Frontend                    │
                 │  Landing → Auth → CampusGate (role + seed)   │
                 │  Dashboard(chat)  Campus(portal)  Approvals  │
                 └───────────────┬──────────────────────────────┘
                                 │ useQuery / useMutation (reactive)
                 ┌───────────────▼──────────────────────────────┐
                 │              Convex backend                  │
                 │  agent.askAgent ──► intent router            │
                 │      ├── knowledge_rag ──► knowledgeDocs     │
                 │      ├── erp_tools ──► per-user ERP/Xceed    │
                 │      └── human_approval ──► pendingActions   │
                 │                                │ approve     │
                 │  executeAction ◄───────────────┘             │
                 │        └──► registrations/leaves/complaints… │
                 └───────────────┬──────────────────────────────┘
                                 │ vly.ai.completion
                                 ▼
                            LLM replies
```

**Key behaviors**
- **Human-in-the-loop**: nothing executes on the ERP side without an explicit Confirm in an approval card; every resolution writes an audit trail.
- **RBAC**: role (student/faculty/admin) chosen at onboarding, stored on `campusProfiles`.
- **Auto-seeding**: one idempotent mutation populates all tables from `sampleData/` at onboarding — app is fully usable without any live scraping.
- **Live-sync ready**: sample rows mirror real API shapes, so swapping the seed source for an authenticated fetch touches no other code.

---

## Commands

```bash
bun install                # install deps
bunx convex dev --once     # push Convex functions + regenerate types
bun tsc -b --noEmit        # typecheck
bun run dev                # dev server (managed by the platform)
```
