import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { campusRoleValidator } from "./schema";
import { getCurrentUser } from "./users";
import { sampleMobileNumber } from "./sampleData/erp";

/** Get the current user's campus profile (null when not onboarded yet). */
export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const profile = await ctx.db
      .query("campusProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return profile;
  },
});

/** Onboard: pick a campus role once. */
export const createProfile = mutation({
  args: {
    campusRole: campusRoleValidator,
    displayName: v.string(),
    department: v.optional(v.string()),
    year: v.optional(v.number()),
    // ERP portal fields, attached from the seeded portal data
    rollNumber: v.optional(v.string()),
    program: v.optional(v.string()),
    semester: v.optional(v.string()),
    section: v.optional(v.string()),
    hostel: v.optional(v.string()),
    mentor: v.optional(v.string()),
    portalEmail: v.optional(v.string()),
    mobile: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("campusProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (existing) return existing._id;

    return ctx.db.insert("campusProfiles", {
      userId: user._id,
      campusRole: args.campusRole,
      displayName: args.displayName.trim() || "New member",
      department: args.department?.trim() || undefined,
      year: args.year,
      rollNumber: args.rollNumber,
      program: args.program,
      semester: args.semester,
      section: args.section,
      hostel: args.hostel,
      mentor: args.mentor,
      portalEmail: args.portalEmail,
      mobile: args.mobile ?? sampleMobileNumber,
    });
  },
});
