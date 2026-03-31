import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("meetings").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("meetings") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    participants: v.array(v.string()),
    notes: v.string(),
    source: v.union(v.literal("manual"), v.literal("calendar"), v.literal("paste")),
  },
  handler: async (ctx, args) => {
    const meetingId = await ctx.db.insert("meetings", {
      ...args,
      processed: false,
      createdAt: Date.now(),
    });

    await ctx.db.insert("agentActivity", {
      type: "processing",
      title: "New meeting detected",
      description: `Processing "${args.title}" — extracting action items and preparing follow-ups...`,
      meetingId,
      createdAt: Date.now(),
    });

    return meetingId;
  },
});

export const markProcessed = mutation({
  args: { id: v.id("meetings"), summary: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { processed: true, summary: args.summary });
  },
});

export const remove = mutation({
  args: { id: v.id("meetings") },
  handler: async (ctx, args) => {
    const followUps = await ctx.db
      .query("followUps")
      .filter((q) => q.eq(q.field("meetingId"), args.id))
      .collect();
    for (const fu of followUps) {
      await ctx.db.delete(fu._id);
    }
    const activities = await ctx.db
      .query("agentActivity")
      .filter((q) => q.eq(q.field("meetingId"), args.id))
      .collect();
    for (const a of activities) {
      await ctx.db.delete(a._id);
    }
    await ctx.db.delete(args.id);
  },
});
