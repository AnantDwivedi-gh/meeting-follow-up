import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("chatMessages").order("asc").collect();
  },
});

export const send = mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const clear = mutation({
  handler: async (ctx) => {
    const messages = await ctx.db.query("chatMessages").collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  },
});
