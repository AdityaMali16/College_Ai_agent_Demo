import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

/* Queries over the seeded Xceed data. Shapes match the live portal so a
   future real sync can upsert into the same tables without changes. */

export const myClasses = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db
      .query("xceedClasses")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const myAssignments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db
      .query("xceedAssignments")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const myAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db
      .query("xceedAnnouncements")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const myEvents = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db
      .query("xceedEvents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const myNotifications = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db
      .query("xceedNotifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);
  },
});

export const myAttendance = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db
      .query("xceedAttendance")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const myResults = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.db
      .query("results")
      .withIndex("by_student", (q) => q.eq("studentUserId", userId))
      .collect();
  },
});
