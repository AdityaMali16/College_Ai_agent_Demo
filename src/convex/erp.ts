import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { sampleGuestHouses } from "./sampleData/erp";

/* ---------- public campus data ---------- */

export const listNotices = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("notices").withIndex("by_category").collect();
  },
});

export const listExamSchedule = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("examSchedule").withIndex("by_course").collect();
  },
});

/* ---------- user-scoped data ---------- */

export const myTimetable = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db
      .query("timetable")
      .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
      .collect();
  },
});

export const myAttendance = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db
      .query("attendance")
      .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
      .collect();
  },
});

export const myFees = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db
      .query("fees")
      .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
      .collect();
  },
});

export const myLeaves = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db
      .query("leaveApplications")
      .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
      .collect();
  },
});

export const myTickets = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db
      .query("tickets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const myRegistrations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db
      .query("registrations")
      .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
      .collect();
  },
});

export const myActions = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return await ctx.db
      .query("actions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);
  },
});

/* ---------- direct mutations (also used by the agent via ctx.runMutation) ---------- */

export const applyLeave = mutation({
  args: {
    fromDate: v.string(),
    toDate: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db.insert("leaveApplications", {
      studentUserId: user._id,
      fromDate: args.fromDate,
      toDate: args.toDate,
      reason: args.reason,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const raiseTicket = mutation({
  args: { subject: v.string(), detail: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db.insert("tickets", {
      userId: user._id,
      subject: args.subject,
      detail: args.detail,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

export const registerCourse = mutation({
  args: {
    courseCode: v.string(),
    courseTitle: v.string(),
    credits: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
      .collect();
    if (existing.some((r) => r.courseCode === args.courseCode)) {
      throw new Error(`Already registered for ${args.courseCode}`);
    }
    return ctx.db.insert("registrations", {
      studentUserId: user._id,
      courseCode: args.courseCode,
      courseTitle: args.courseTitle,
      credits: args.credits,
      semester: "Monsoon 2026",
    });
  },
});

export const payFee = mutation({
  args: { feeId: v.id("fees") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const fee = await ctx.db.get(args.feeId);
    if (!fee || fee.studentUserId !== user._id) {
      throw new Error("Fee record not found");
    }
    if (fee.paid) throw new Error("Already paid");
    await ctx.db.patch(args.feeId, { paid: true });
    return true;
  },
});

export const postNotice = mutation({
  args: { title: v.string(), body: v.string(), category: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db.insert("notices", {
      title: args.title,
      body: args.body,
      category: args.category,
      authorRole: "admin",
      createdAt: Date.now(),
    });
  },
});

export const addDocument = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db.insert("documents", {
      title: args.title,
      category: args.category,
      content: args.content,
      createdBy: user._id,
      createdAt: Date.now(),
    });
  },
});

export const listDocuments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("documents").withIndex("by_category").collect();
  },
});

/* ---------- ERP module 2: Complaint Portal ---------- */

export const myComplaints = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db
      .query("complaints")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const submitComplaint = mutation({
  args: {
    complaintType: v.string(),
    location: v.string(),
    roomNo: v.optional(v.string()),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("campusProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return ctx.db.insert("complaints", {
      userId: user._id,
      mobile: profile?.mobile,
      complaintType: args.complaintType,
      location: args.location,
      roomNo: args.roomNo,
      description: args.description,
      status: "submitted",
      createdAt: Date.now(),
    });
  },
});

/* ---------- ERP module 3: Guest House Booking ---------- */

export const myGuestHouseBookings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db
      .query("guestHouseBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const bookGuestHouse = mutation({
  args: {
    guestName: v.string(),
    guestHouse: v.string(),
    checkIn: v.string(),
    checkOut: v.string(),
    guests: v.number(),
    purpose: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    const house = sampleGuestHouses.find((h) => h.name === args.guestHouse);
    if (!house) {
      throw new Error(
        `Unknown guest house. Options: ${sampleGuestHouses.map((h) => h.name).join(", ")}`,
      );
    }
    return ctx.db.insert("guestHouseBookings", {
      userId: user._id,
      guestName: args.guestName,
      guestHouse: args.guestHouse,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guests: args.guests,
      purpose: args.purpose,
      perNightRate: house.officialRate,
      status: "requested",
      createdAt: Date.now(),
    });
  },
});

/* ---------- ERP module 4: Equipment Booking ---------- */

export const myEquipmentBookings = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db
      .query("equipmentBookings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const bookEquipment = mutation({
  args: {
    equipmentName: v.string(),
    purpose: v.string(),
    remarks: v.optional(v.string()),
    neededBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db.insert("equipmentBookings", {
      userId: user._id,
      equipmentName: args.equipmentName,
      purpose: args.purpose,
      remarks: args.remarks,
      neededBy: args.neededBy,
      status: "requested",
      createdAt: Date.now(),
    });
  },
});

/* ---------- ERP module 5: CONNECT (Student Wellness) ---------- */

export const myConnectRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db
      .query("connectRequests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const submitConnectRequest = mutation({
  args: {
    topic: v.string(),
    message: v.string(),
    preferredMode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db.insert("connectRequests", {
      userId: user._id,
      topic: args.topic,
      message: args.message,
      preferredMode: args.preferredMode,
      status: "submitted",
      createdAt: Date.now(),
    });
  },
});

/* ---------- ERP module 1: Academic — exam registrations ---------- */

export const myExamRegistrations = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db
      .query("examRegistrations")
      .withIndex("by_student", (q) => q.eq("studentUserId", user._id))
      .collect();
  },
});

export const registerExam = mutation({
  args: {
    examType: v.union(
      v.literal("carry"),
      v.literal("makeup"),
      v.literal("supplementary"),
      v.literal("i_grade"),
      v.literal("summer"),
    ),
    courseCode: v.string(),
    courseTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return ctx.db.insert("examRegistrations", {
      studentUserId: user._id,
      examType: args.examType,
      courseCode: args.courseCode,
      courseTitle: args.courseTitle,
      status: "requested",
      createdAt: Date.now(),
    });
  },
});
