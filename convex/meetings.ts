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
    participants: v.array(v.string()),
    notes: v.string(),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("meetings", {
      ...args,
      createdAt: Date.now(),
    });
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
    await ctx.db.delete(args.id);
  },
});
