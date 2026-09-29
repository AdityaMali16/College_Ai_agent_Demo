import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

// campus roles for the AI agent workspace
export const CAMPUS_ROLES = {
  STUDENT: "student",
  FACULTY: "faculty",
  ADMIN: "admin",
} as const;

export const campusRoleValidator = v.union(
  v.literal(CAMPUS_ROLES.STUDENT),
  v.literal(CAMPUS_ROLES.FACULTY),
  v.literal(CAMPUS_ROLES.ADMIN),
);
export type CampusRole = Infer<typeof campusRoleValidator>;

export const ACTION_TYPES = [
  "register_course",
  "apply_leave",
  "raise_ticket",
  "send_notice",
  "pay_fee",
  "submit_complaint",
  "book_guest_house",
  "book_equipment",
  "connect_request",
  "register_exam",
] as const;
export const actionTypeValidator = v.union(
  ...ACTION_TYPES.map((t) => v.literal(t)),
);
export type ActionType = (typeof ACTION_TYPES)[number];

export const ACTION_STATUSES = [
  "pending",
  "approved",
  "declined",
  "executed",
  "failed",
] as const;
export const actionStatusValidator = v.union(
  ...ACTION_STATUSES.map((s) => v.literal(s)),
);
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const TICKET_STATUSES = ["open", "in_progress", "resolved"] as const;
export const ticketStatusValidator = v.union(
  ...TICKET_STATUSES.map((s) => v.literal(s)),
);
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // add other tables here

    campusProfiles: defineTable({
      userId: v.id("users"),
      campusRole: campusRoleValidator,
      displayName: v.string(),
      department: v.optional(v.string()),
      year: v.optional(v.number()),

      // ERP portal profile (auto-attached from the portal data)
      rollNumber: v.optional(v.string()),
      program: v.optional(v.string()),
      semester: v.optional(v.string()),
      section: v.optional(v.string()),
      hostel: v.optional(v.string()),
      mentor: v.optional(v.string()),
      portalEmail: v.optional(v.string()),
      mobile: v.optional(v.string()),
    })
      .index("by_user", ["userId"])
      .index("by_role", ["campusRole"]),

    documents: defineTable({
      title: v.string(),
      category: v.string(),
      content: v.string(),
      createdBy: v.optional(v.id("users")),
      createdAt: v.number(),
    }).index("by_category", ["category"]),

    messages: defineTable({
      conversationId: v.id("conversations"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      sources: v.optional(
        v.array(v.object({ id: v.id("documents"), title: v.string() })),
      ),
      tools: v.optional(v.array(v.string())),
      pendingActionId: v.optional(v.id("actions")),
      createdAt: v.number(),
    })
      .index("by_conversation", ["conversationId"])
      .index("by_action", ["pendingActionId"]),

    conversations: defineTable({
      userId: v.id("users"),
      title: v.string(),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    actions: defineTable({
      userId: v.id("users"),
      type: actionTypeValidator,
      status: actionStatusValidator,
      payload: v.any(),
      result: v.optional(v.string()),
      createdAt: v.number(),
      resolvedAt: v.optional(v.number()),
    }).index("by_user", ["userId"]),

    notices: defineTable({
      title: v.string(),
      body: v.string(),
      category: v.string(),
      authorRole: campusRoleValidator,
      createdAt: v.number(),
    }).index("by_category", ["category"]),

    timetable: defineTable({
      studentUserId: v.id("users"),
      day: v.string(),
      startTime: v.string(),
      endTime: v.string(),
      courseCode: v.string(),
      courseTitle: v.string(),
      room: v.string(),
      faculty: v.string(),
    }).index("by_student", ["studentUserId"]),

    attendance: defineTable({
      studentUserId: v.id("users"),
      courseCode: v.string(),
      held: v.number(),
      attended: v.number(),
    })
      .index("by_student", ["studentUserId"])
      .index("by_student_course", ["studentUserId", "courseCode"]),

    examSchedule: defineTable({
      courseCode: v.string(),
      courseTitle: v.string(),
      date: v.string(),
      startTime: v.string(),
      room: v.string(),
      seat: v.string(),
    }).index("by_course", ["courseCode"]),

    fees: defineTable({
      studentUserId: v.id("users"),
      label: v.string(),
      amount: v.number(),
      dueDate: v.string(),
      paid: v.boolean(),
    }).index("by_student", ["studentUserId"]),

    leaveApplications: defineTable({
      studentUserId: v.id("users"),
      fromDate: v.string(),
      toDate: v.string(),
      reason: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("declined"),
      ),
      createdAt: v.number(),
    }).index("by_student", ["studentUserId"]),

    tickets: defineTable({
      userId: v.id("users"),
      subject: v.string(),
      detail: v.string(),
      status: ticketStatusValidator,
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    // ERP Complaint Portal (mirror of the complaint module form)
    complaints: defineTable({
      userId: v.id("users"),
      mobile: v.optional(v.string()),
      complaintType: v.string(),
      location: v.string(),
      roomNo: v.optional(v.string()),
      description: v.string(),
      status: v.union(
        v.literal("submitted"),
        v.literal("in_progress"),
        v.literal("resolved"),
      ),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    // ERP Guest House Booking module
    guestHouseBookings: defineTable({
      userId: v.id("users"),
      guestName: v.string(),
      guestHouse: v.string(),
      checkIn: v.string(),
      checkOut: v.string(),
      guests: v.number(),
      purpose: v.string(),
      perNightRate: v.number(),
      status: v.union(
        v.literal("requested"),
        v.literal("confirmed"),
        v.literal("cancelled"),
      ),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    // ERP Equipment Booking module
    equipmentBookings: defineTable({
      userId: v.id("users"),
      equipmentName: v.string(),
      purpose: v.string(),
      remarks: v.optional(v.string()),
      neededBy: v.optional(v.string()),
      status: v.union(
        v.literal("requested"),
        v.literal("approved"),
        v.literal("returned"),
        v.literal("rejected"),
      ),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    // ERP CONNECT portal — Student Wellness Program requests
    connectRequests: defineTable({
      userId: v.id("users"),
      topic: v.string(),
      message: v.string(),
      preferredMode: v.optional(v.string()),
      status: v.union(
        v.literal("submitted"),
        v.literal("scheduled"),
        v.literal("closed"),
      ),
      createdAt: v.number(),
    }).index("by_user", ["userId"]),

    // ERP Academic module — carry / makeup / supplementary exam registrations
    examRegistrations: defineTable({
      studentUserId: v.id("users"),
      examType: v.union(
        v.literal("carry"),
        v.literal("makeup"),
        v.literal("supplementary"),
        v.literal("i_grade"),
        v.literal("summer"),
      ),
      courseCode: v.string(),
      courseTitle: v.string(),
      status: v.union(
        v.literal("requested"),
        v.literal("approved"),
        v.literal("rejected"),
      ),
      createdAt: v.number(),
    }).index("by_student", ["studentUserId"]),

    registrations: defineTable({
      studentUserId: v.id("users"),
      courseCode: v.string(),
      courseTitle: v.string(),
      credits: v.number(),
      semester: v.string(),
    }).index("by_student", ["studentUserId"]),

    // Live data synced from the Xceed portal
    xceedClasses: defineTable({
      userId: v.id("users"),
      xceedId: v.string(),
      name: v.string(),
      subject: v.optional(v.string()),
      subjectCode: v.optional(v.string()),
      section: v.optional(v.string()),
      instructor: v.optional(v.string()),
      instructorEmail: v.optional(v.string()),
      dept: v.optional(v.string()),
      session: v.optional(v.string()),
      coverColor: v.optional(v.string()),
      meetLink: v.optional(v.string()),
      syncedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_xceed", ["userId", "xceedId"]),

    xceedAssignments: defineTable({
      userId: v.id("users"),
      xceedId: v.string(),
      classXceedId: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      dueAt: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),
        v.literal("submitted"),
        v.literal("graded"),
      ),
      score: v.optional(v.number()),
      maxScore: v.optional(v.number()),
      syncedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_xceed", ["userId", "xceedId"]),

    xceedAnnouncements: defineTable({
      userId: v.id("users"),
      xceedId: v.string(),
      classXceedId: v.optional(v.string()),
      title: v.string(),
      body: v.optional(v.string()),
      postedAt: v.optional(v.number()),
      syncedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_xceed", ["userId", "xceedId"]),

    xceedAttendance: defineTable({
      userId: v.id("users"),
      classXceedId: v.string(),
      subjectCode: v.string(),
      held: v.number(),
      attended: v.number(),
      syncedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_class", ["userId", "classXceedId"]),

    xceedEvents: defineTable({
      userId: v.id("users"),
      xceedId: v.string(),
      title: v.string(),
      description: v.optional(v.string()),
      club: v.optional(v.string()),
      startsAt: v.optional(v.number()),
      endsAt: v.optional(v.number()),
      venue: v.optional(v.string()),
      status: v.union(
        v.literal("upcoming"),
        v.literal("ongoing"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
      syncedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_xceed", ["userId", "xceedId"]),

    xceedNotifications: defineTable({
      userId: v.id("users"),
      xceedId: v.string(),
      title: v.string(),
      body: v.optional(v.string()),
      kind: v.optional(v.string()),
      link: v.optional(v.string()),
      isRead: v.optional(v.boolean()),
      syncedAt: v.number(),
    })
      .index("by_user", ["userId"])
      .index("by_user_xceed", ["userId", "xceedId"]),

    results: defineTable({
      studentUserId: v.id("users"),
      courseCode: v.string(),
      courseTitle: v.string(),
      credits: v.number(),
      grade: v.string(),
      gradePoints: v.number(),
      semester: v.string(),
      declaredAt: v.number(),
    }).index("by_student", ["studentUserId"]),

    // Tracks the state of external portal syncs
    syncMeta: defineTable({
      userId: v.id("users"),
      source: v.string(), // "xceed" | "erp"
      status: v.union(
        v.literal("ok"),
        v.literal("auth_expired"),
        v.literal("error"),
      ),
      message: v.optional(v.string()),
      lastSyncedAt: v.number(),
    }).index("by_user_source", ["userId", "source"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
