import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("agentActivity").order("desc").take(50);
  },
});

export const log = mutation({
  args: {
    type: v.union(
      v.literal("processing"),
      v.literal("extracted"),
      v.literal("email_drafted"),
      v.literal("email_sent"),
      v.literal("reminder"),
      v.literal("status_check"),
      v.literal("insight")
    ),
    title: v.string(),
    description: v.string(),
    meetingId: v.optional(v.id("meetings")),
    followUpId: v.optional(v.id("followUps")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("agentActivity", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
