import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { actionTypeValidator } from "./schema";
import { getCurrentUser } from "./users";
import { vly } from "../lib/vly-integrations";

/* ---------------- queries ---------------- */

export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(30);
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();
  },
});

/* ---------------- mutations ---------------- */

export const createConversation = mutation({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db.insert("conversations", {
      userId: user._id,
      title: args.title?.trim() || "New chat",
      createdAt: Date.now(),
    });
  },
});

export const renameConversation = mutation({
  args: { conversationId: v.id("conversations"), title: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }
    await ctx.db.patch(args.conversationId, { title: args.title });
  },
});

export const deleteConversation = mutation({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();
    for (const message of messages) await ctx.db.delete(message._id);
    await ctx.db.delete(args.conversationId);
  },
});

/** Persist the user's chat bubble; the action call follows separately. */
export const appendUserMessage = mutation({
  args: { conversationId: v.id("conversations"), content: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }
    return ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "user",
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

/** Persist the assistant reply (called by the client after the action finishes). */
export const appendAssistantMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    sources: v.optional(
      v.array(v.object({ id: v.id("documents"), title: v.string() })),
    ),
    tools: v.optional(v.array(v.string())),
    pendingActionId: v.optional(v.id("actions")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== user._id) {
      throw new Error("Conversation not found");
    }
    return ctx.db.insert("messages", {
      conversationId: args.conversationId,
      role: "assistant",
      content: args.content,
      sources: args.sources,
      tools: args.tools,
      pendingActionId: args.pendingActionId,
      createdAt: Date.now(),
    });
  },
});

/* ---------------- action approval ---------------- */

export const getAction = query({
  args: { actionId: v.id("actions") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const record = await ctx.db.get(args.actionId);
    if (!record || record.userId !== user._id) {
      throw new Error("Action not found");
    }
    return record;
  },
});

export const resolveAction = mutation({
  args: { actionId: v.id("actions"), approved: v.boolean() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const record = await ctx.db.get(args.actionId);
    if (!record || record.userId !== user._id) {
      throw new Error("Action not found");
    }
    if (record.status !== "pending") {
      throw new Error("Action already resolved");
    }
    await ctx.db.patch(args.actionId, {
      status: args.approved ? "approved" : "declined",
      resolvedAt: Date.now(),
    });
  },
});

/** Called by the action runner after execution (or failure). */
export const markActionExecuted = mutation({
  args: { actionId: v.id("actions"), ok: v.boolean(), result: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const record = await ctx.db.get(args.actionId);
    if (!record || record.userId !== user._id) {
      throw new Error("Action not found");
    }
    await ctx.db.patch(args.actionId, {
      status: args.ok ? "executed" : "failed",
      result: args.result,
      resolvedAt: Date.now(),
    });
  },
});

/* ---------------- the agent ---------------- */

const SYSTEM_PROMPT = `You are the campus copilot for a college. You help students and staff with notices, timetable, attendance, exams, fees, leave applications, course registration, and support tickets.

Rules:
- Answer only from the provided campus knowledge when the question is about college rules, policies, notices, or facts.
- If action tools were used, summarize the fetched data naturally.
- If a user action was proposed and approved, confirm it in one short sentence.
- Be concise and factual. Never invent policy. If unsure, say so.
- Write plain prose or simple markdown lists. Keep under 150 words.`;

type PendingAction = {
  type:
    | "register_course"
    | "apply_leave"
    | "raise_ticket"
    | "send_notice"
    | "pay_fee"
    | "submit_complaint"
    | "book_guest_house"
    | "book_equipment"
    | "connect_request"
    | "register_exam";
  payload: Record<string, unknown>;
  summary: string;
};

/** Lightweight deterministic intent router (maps to the "Intent Router" node). */
function routeIntent(
  text: string,
  role: string,
): "knowledge" | "erp_read" | "action" {
  const t = text.toLowerCase();

  const actionIntent =
    /\b(register|enroll)\b.*\b(for|in|to)\b|\bapply\b.*\bleave\b|\braise\b.*\bticket\b|\bopen\b.*\bticket\b|\bpost\b.*\bnotice\b|\bpay\b.*\bfee\b|\bfile\b.*\bcomplaint\b|\bregister\b.*\bcomplaint\b|\bbook\b.*\b(guest\s?house|equipment|projector|camera|laptop|room)\b|\breserve\b.*\b(guest\s?house|room)\b|\bconnect\b.*\brequest\b|\btalk\b.*\bcounsel\w*\b|\b(makeup|make\s?up|carry|supplementary|special|summer)\b.*\b(exam|registration)\b/;
  if (actionIntent.test(t)) return "action";

  const erpIntent =
    /\b(my\s)?(timetable|schedule|attendance|fees|fee|results|marks|gpa|cgpa|sgpa|courses|registrations?|exams?|leaves?|tickets?|complaints?|guest\s?house|equipment|bookings?|wellness|connect|dues|assignments?|due|deadline|events?|fest|clubs?|roll|hostel|mentor|section|semester)\b/;
  if (erpIntent.test(t)) return "erp_read";

  if (role === "faculty" || role === "admin") {
    if (/\b(notice|circular|announce)\b/.test(t)) return "action";
  }

  return "knowledge";
}

/** Keyword RAG scorer over the knowledge base (maps to Retriever/Reranker). */
function scoreDocs(
  docs: Array<{ _id: string; title: string; category: string; content: string }>,
  query: string,
  limit = 2,
) {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2);

  const scored = docs.map((doc) => {
    const haystack = `${doc.title} ${doc.category} ${doc.content}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (doc.title.toLowerCase().includes(term)) score += 3;
      if (doc.category.toLowerCase().includes(term)) score += 2;
      const occurrences = haystack.split(term).length - 1;
      score += occurrences;
    }
    return { doc, score };
  });

  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => ({
      id: entry.doc._id,
      title: entry.doc.title,
      category: entry.doc.category,
      content: entry.doc.content,
    }));
}

/** Documents for keyword retrieval — called from the action via runQuery. */
export const allDocuments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("documents").collect();
  },
});

/** The signed-in user's full ERP + Xceed snapshot — called via runQuery. */
export const erpSnapshot = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const [
      timetable,
      attendance,
      fees,
      leaves,
      tickets,
      registrations,
      results,
      xceedClasses,
      xceedAssignments,
      xceedEvents,
      profileDoc,
      complaints,
      guestHouseBookings,
      equipmentBookings,
      connectRequests,
      examRegistrations,
    ] = await Promise.all([
      ctx.db
        .query("timetable")
        .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
        .collect(),
      ctx.db
        .query("attendance")
        .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
        .collect(),
      ctx.db
        .query("fees")
        .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
        .collect(),
      ctx.db
        .query("leaveApplications")
        .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
        .collect(),
      ctx.db
        .query("tickets")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("registrations")
        .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
        .collect(),
      ctx.db
        .query("results")
        .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
        .collect(),
      ctx.db
        .query("xceedClasses")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("xceedAssignments")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("xceedEvents")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("campusProfiles")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .unique(),
      ctx.db
        .query("complaints")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("guestHouseBookings")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("equipmentBookings")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("connectRequests")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("examRegistrations")
        .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
        .collect(),
    ]);
    const profile = profileDoc
      ? {
          displayName: profileDoc.displayName,
          campusRole: profileDoc.campusRole,
          rollNumber: profileDoc.rollNumber,
          program: profileDoc.program,
          semester: profileDoc.semester,
          section: profileDoc.section,
          hostel: profileDoc.hostel,
          mentor: profileDoc.mentor,
          portalEmail: profileDoc.portalEmail,
        }
      : null;
    return {
      timetable,
      attendance,
      fees,
      leaves,
      tickets,
      registrations,
      results,
      xceedClasses,
      xceedAssignments,
      xceedEvents,
      profile,
      complaints,
      guestHouseBookings,
      equipmentBookings,
      connectRequests,
      examRegistrations,
    };
  },
});

export const askAgent = action({
  args: {
    conversationId: v.id("conversations"),
    message: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{
    reply: string;
    sources: { id: string; title: string }[];
    tools: string[];
    pendingAction: {
      actionId: string;
      type: string;
      payload: Record<string, unknown>;
      summary: string;
    } | null;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.runQuery(api.campus.myProfile);
    const role = profile?.campusRole ?? "student";
    const name = profile?.displayName ?? "student";

    const history = await ctx.runQuery(api.agent.getMessages, {
      conversationId: args.conversationId,
    });
    const recentHistory = history.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })).slice(-4);

    const intent = routeIntent(args.message, role);
    const toolsUsed: string[] = [];
    let contextBlock = "";
    let sources: { id: any; title: string }[] = [];
    let pendingAction: PendingAction | null = null;

    if (intent === "knowledge" || intent === "erp_read") {
      const docs = await ctx.runQuery(api.agent.allDocuments);
      const hits = scoreDocs(docs, args.message);
      if (hits.length > 0) {
        toolsUsed.push("knowledge_rag");
        contextBlock =
          "Campus knowledge (use this for policy questions):\n" +
          hits
            .map((h) => `[${h.title}] ${h.content}`)
            .join("\n\n");
        sources = hits.map((h) => ({ id: h.id, title: h.title }));
      }
    }

    if (intent === "erp_read" || intent === "action") {
      const erp = await ctx.runQuery(api.agent.erpSnapshot);
      toolsUsed.push("erp_tools");
      // Trim each array to its 10 most recent rows and cap total size so the
      // prompt stays within smaller models' context windows.
      const trimmed = Object.fromEntries(
        Object.entries(erp).map(([key, value]) => [
          key,
          Array.isArray(value) ? value.slice(-10) : value,
        ]),
      );
      const erpJson = JSON.stringify(trimmed);
      const capped =
        erpJson.length > 8000 ? erpJson.slice(0, 8000) + "…(truncated)" : erpJson;
      contextBlock +=
        (contextBlock ? "\n\n" : "") +
        "User's ERP records (JSON, recent rows only):\n" +
        capped;
    }

    let approvalInstruction = "";
    if (intent === "action") {
      // Decide which tool + payload the user is asking for.
      const t = args.message.toLowerCase();
      if (/\b(register|enroll)\b/.test(t)) {
        const codeMatch = args.message.match(/\b[A-Z]{3,4}\s?\d{3,4}\b/);
        if (codeMatch) {
          pendingAction = {
            type: "register_course",
            payload: {
              courseCode: codeMatch[0].replace(/\s+/g, ""),
              courseTitle: "Elective course",
              credits: 3,
            },
            summary: `Register for course ${codeMatch[0].replace(/\s+/g, "")}`,
          };
        }
      } else if (/\bleave\b/.test(t)) {
        const dateMatch = args.message.match(
          /\b(\d{4}-\d{2}-\d{2})\b.*?\b(\d{4}-\d{2}-\d{2})\b/,
        );
        pendingAction = {
          type: "apply_leave",
          payload: {
            fromDate: dateMatch?.[1] ?? new Date().toISOString().slice(0, 10),
            toDate: dateMatch?.[2] ?? dateMatch?.[1] ?? new Date().toISOString().slice(0, 10),
            reason: args.message.slice(0, 200),
          },
          summary: "Submit a leave application",
        };
      } else if (/\bticket\b/.test(t)) {
        pendingAction = {
          type: "raise_ticket",
          payload: {
            subject: args.message.slice(0, 80),
            detail: args.message.slice(0, 300),
          },
          summary: "Raise a support ticket",
        };
      } else if (/\bnotice\b/.test(t)) {
        pendingAction = {
          type: "send_notice",
          payload: {
            title: args.message.slice(0, 80),
            body: args.message.slice(0, 300),
            category: "General",
          },
          summary: "Publish a campus notice",
        };
      } else if (/\bcomplaint\b/.test(t)) {
        const typeGuess =
          /electr|light|fan|power/.test(t)
            ? "Electrical"
            : /water|tap|pipe|leak|toilet|bathroom/.test(t)
              ? "Plumbing"
              : /wifi|internet|lan|network/.test(t)
                ? "Internet / LAN"
                : /mess|food|canteen/.test(t)
                  ? "Mess / Food"
                  : /furniture|chair|desk|civil/.test(t)
                    ? "Civil / Furniture"
                    : /clean|garbage|housekeep/.test(t)
                      ? "Housekeeping"
                      : "Other";
        const locationGuess = /hostel|room/.test(t)
          ? "Boys Hostel"
          : /academic|class|lecture|lab/.test(t)
            ? "Academic Block"
            : /library/.test(t)
              ? "Central Library"
              : /mess/.test(t)
                ? "Mess"
                : "Boys Hostel";
        const roomMatch = args.message.match(/\b(?:room|rm)\s*-?\s*([A-Z]?-?\d{2,4})\b/i);
        pendingAction = {
          type: "submit_complaint",
          payload: {
            complaintType: typeGuess,
            location: locationGuess,
            roomNo: roomMatch?.[1],
            description: args.message.slice(0, 400),
          },
          summary: `Register a ${typeGuess} complaint${roomMatch ? ` for room ${roomMatch[1]}` : ""}`,
        };
      } else if (/\bguest\s?house\b|\breserve\b.*\broom\b/.test(t)) {
        const houseGuess = /sac/.test(t)
          ? "SAC Guest House"
          : /mega/.test(t)
            ? "Mega Hostel Guest House"
            : "Main Guest House";
        const dates = args.message.match(
          /\b(\d{4}-\d{2}-\d{2})\b/g,
        );
        const checkIn = dates?.[0] ?? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
        const checkOut =
          dates?.[1] ??
          new Date(new Date(checkIn).getTime() + 86400000).toISOString().slice(0, 10);
        const guestsMatch = args.message.match(/\b(\d+)\s*(?:guests?|people|persons?|members?)\b/i);
        const nameMatch = args.message.match(/\bfor\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
        pendingAction = {
          type: "book_guest_house",
          payload: {
            guestName: nameMatch?.[1] ?? "Guest",
            guestHouse: houseGuess,
            checkIn,
            checkOut,
            guests: guestsMatch ? Number(guestsMatch[1]) : 1,
            purpose: args.message.slice(0, 200),
          },
          summary: `Request a guest house booking at ${houseGuess} (${checkIn} → ${checkOut})`,
        };
      } else if (
        /\b(projector|camera|laptop|tripod|pa\s?system|oscilloscope|function\s?generator)\b/.test(
          t,
        )
      ) {
        const equipmentGuess = /projector/.test(t)
          ? "HD Projector (Epson EB-X49)"
          : /camera|dslr/.test(t)
            ? "Digital Camera — Canon EOS 1500D"
            : /laptop/.test(t)
              ? "Laptop — Dell Latitude 5440"
              : /oscilloscope/.test(t)
                ? "Oscilloscope — DSO 4-channel"
                : /pa\s?system|speaker/.test(t)
                  ? "Portable PA System"
                  : "HD Projector (Epson EB-X49)";
        const dateMatch = args.message.match(/\b(\d{4}-\d{2}-\d{2})\b/);
        pendingAction = {
          type: "book_equipment",
          payload: {
            equipmentName: equipmentGuess,
            purpose: args.message.slice(0, 200),
            neededBy: dateMatch?.[1],
          },
          summary: `Book ${equipmentGuess}`,
        };
      } else if (
        /\b(connect|counsel\w*|wellness|anxiety|stress|depress\w*|fomo)\b/.test(t)
      ) {
        const topicGuess = /anxiety/.test(t)
          ? "Anxiety"
          : /depress\w*|low\s?mood|sad/.test(t)
            ? "Low mood / depression"
            : /fomo/.test(t)
              ? "FOMO"
              : /stress|overwhelm/.test(t)
                ? "Stress"
                : "Something else (personal)";
        pendingAction = {
          type: "connect_request",
          payload: {
            topic: topicGuess,
            message: args.message.slice(0, 400),
            preferredMode: /online|video|call/.test(t) ? "Online" : "In-person",
          },
          summary: `Submit a confidential CONNECT request (${topicGuess})`,
        };
      } else if (
        /\b(makeup|make\s?up|carry|supplementary|special|summer|i\s?grade)\b/.test(t)
      ) {
        const examTypeGuess = /carry/.test(t)
          ? "carry"
          : /supplementary/.test(t)
            ? "supplementary"
            : /summer/.test(t)
              ? "summer"
              : /i\s?grade/.test(t)
                ? "i_grade"
                : "makeup";
        const codeMatch = args.message.match(/\b[A-Z]{3,4}\s?\d{3,4}\b/);
        pendingAction = {
          type: "register_exam",
          payload: {
            examType: examTypeGuess,
            courseCode: codeMatch ? codeMatch[0].replace(/\s+/g, "") : "TBD",
            courseTitle: "Course",
          },
          summary: `${examTypeGuess} exam registration${codeMatch ? ` for ${codeMatch[0]}` : ""}`,
        };
      }

      if (pendingAction) {
        toolsUsed.push("human_approval");
        approvalInstruction = `\n\nThe user's request requires an action: ${pendingAction.summary}. Confirm you are about to request approval for exactly this and nothing else. Do not claim it is done.`;
      }
    }

    const completion = await vly.ai.completion({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content:
            `User: ${name} (role: ${role}). Today: ${new Date().toISOString().slice(0, 10)}.` +
            (contextBlock ? `\n\n${contextBlock}` : "") +
            approvalInstruction,
        },
        ...recentHistory,
        { role: "user", content: args.message },
      ],
      temperature: 0.2,
      maxTokens: 400,
    });

    if (!completion.success || !completion.data) {
      throw new Error(completion.error ?? "AI completion failed");
    }

    const reply =
      completion.data.choices[0]?.message?.content ??
      "Sorry, I could not generate a reply.";

    // Create the approval record for human-in-the-loop confirmation.
    let actionId: string | null = null;
    if (pendingAction) {
      actionId = await ctx.runMutation(api.agent.insertPendingAction, {
        userId,
        type: pendingAction.type,
        payload: pendingAction.payload,
        summary: pendingAction.summary,
      });
    }

    return {
      reply,
      sources,
      tools: toolsUsed,
      pendingAction: pendingAction
        ? { actionId: actionId!, ...pendingAction }
        : null,
    };
  },
});

/** Helper so the action can insert into the actions table. */
export const insertPendingAction = mutation({
  args: {
    userId: v.id("users"),
    type: actionTypeValidator,
    payload: v.any(),
    summary: v.string(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("actions", {
      userId: args.userId,
      type: args.type,
      status: "pending",
      payload: { ...args.payload, summary: args.summary },
      createdAt: Date.now(),
    });
  },
});
