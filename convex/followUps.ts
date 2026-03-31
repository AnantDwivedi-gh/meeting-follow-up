import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByMeeting = query({
  args: { meetingId: v.id("meetings") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("followUps")
      .filter((q) => q.eq(q.field("meetingId"), args.meetingId))
      .collect();
  },
});

export const listAll = query({
  handler: async (ctx) => {
    return await ctx.db.query("followUps").order("desc").collect();
  },
});

export const listPending = query({
  handler: async (ctx) => {
    const all = await ctx.db.query("followUps").collect();
    return all.filter(
      (f) => f.status === "pending" || f.status === "in_progress"
    );
  },
});

export const create = mutation({
  args: {
    meetingId: v.id("meetings"),
    task: v.string(),
    assignee: v.string(),
    dueDate: v.string(),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("followUps", {
      ...args,
      status: "pending",
      reminderSent: false,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("followUps"),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("overdue")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: { id: v.id("followUps") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
