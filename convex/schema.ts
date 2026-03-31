import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  meetings: defineTable({
    title: v.string(),
    date: v.string(),
    participants: v.array(v.string()),
    notes: v.string(),
    summary: v.optional(v.string()),
    createdAt: v.number(),
  }),

  followUps: defineTable({
    meetingId: v.id("meetings"),
    task: v.string(),
    assignee: v.string(),
    dueDate: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("overdue")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    reminderSent: v.boolean(),
    createdAt: v.number(),
  }),

  chatMessages: defineTable({
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }),
});
