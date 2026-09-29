import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Seeds demo ERP data and a starter knowledge base for the current user's
 * campus. Idempotent — safe to call more than once.
 */
export const seedCampusData = action({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const alreadySeeded = await ctx.runQuery(internal.seedInternals.checkSeeded, {
      userId,
    });
    if (alreadySeeded && !args.force) {
      return { seeded: false as const };
    }

    if (args.force) {
      await ctx.runMutation(internal.seedInternals.clearUserData, { userId });
    }

    await ctx.runMutation(internal.seedInternals.seedUserData, { userId });

    const docCount = await ctx.runQuery(internal.seedInternals.countDocuments);
    if (docCount === 0) {
      await ctx.runMutation(internal.seedInternals.seedKnowledgeBase);
    }

    return { seeded: true as const };
  },
});
