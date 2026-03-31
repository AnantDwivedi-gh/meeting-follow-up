import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  meetings: defineTable({
    title: v.string(),
    date: v.string(),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    participants: v.array(v.string()),
    notes: v.string(),
    summary: v.optional(v.string()),
    source: v.union(v.literal("manual"), v.literal("calendar"), v.literal("paste")),
    processed: v.boolean(),
    createdAt: v.number(),
  }),

  followUps: defineTable({
    meetingId: v.id("meetings"),
    task: v.string(),
    assignee: v.string(),
    assigneeEmail: v.optional(v.string()),
    dueDate: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("overdue"),
      v.literal("email_sent")
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    emailDraft: v.optional(v.string()),
    emailSentAt: v.optional(v.number()),
    createdAt: v.number(),
  }),

  agentActivity: defineTable({
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
    createdAt: v.number(),
  }),

  chatMessages: defineTable({
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
  }),

  settings: defineTable({
    key: v.string(),
    value: v.string(),
  }),
});
