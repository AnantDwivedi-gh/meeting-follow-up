"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useAgent() {
  const createFollowUp = useMutation(api.followUps.create);
  const markProcessed = useMutation(api.meetings.markProcessed);
  const logActivity = useMutation(api.agentActivity.log);
  const setEmailDraft = useMutation(api.followUps.setEmailDraft);

  const processMeeting = async (meeting: {
    _id: Id<"meetings">;
    title: string;
    date: string;
    participants: string[];
    notes: string;
  }) => {
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process_meeting",
          data: meeting,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Create follow-ups
      const createdIds: Id<"followUps">[] = [];
      for (const fu of data.followUps || []) {
        const id = await createFollowUp({
          meetingId: meeting._id,
          task: fu.task,
          assignee: fu.assignee || "Unassigned",
          assigneeEmail: fu.assigneeEmail || undefined,
          dueDate: fu.dueDate || meeting.date,
          priority: ["low", "medium", "high"].includes(fu.priority)
            ? fu.priority
            : "medium",
        });
        createdIds.push(id);
      }

      // Mark meeting as processed
      await markProcessed({
        id: meeting._id,
        summary: data.summary || "Meeting processed",
      });

      // Log extraction
      await logActivity({
        type: "extracted",
        title: `Extracted ${data.followUps?.length || 0} action items`,
        description: data.summary || "Meeting processed successfully",
        meetingId: meeting._id,
      });

      // Log insights
      for (const insight of data.insights || []) {
        await logActivity({
          type: "insight",
          title: "Insight",
          description: insight,
          meetingId: meeting._id,
        });
      }

      // Auto-draft emails for each follow-up
      for (let i = 0; i < createdIds.length; i++) {
        const fu = data.followUps[i];
        try {
          const emailRes = await fetch("/api/agent", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "draft_email",
              data: {
                task: fu.task,
                assignee: fu.assignee,
                meetingTitle: meeting.title,
                meetingDate: meeting.date,
                dueDate: fu.dueDate,
              },
            }),
          });

          const emailData = await emailRes.json();
          if (emailData.email) {
            await setEmailDraft({
              id: createdIds[i],
              emailDraft: emailData.email,
            });

            await logActivity({
              type: "email_drafted",
              title: `Email drafted for ${fu.assignee}`,
              description: `Follow-up email ready to send regarding: ${fu.task}`,
              meetingId: meeting._id,
              followUpId: createdIds[i],
            });
          }
        } catch {
          // Email draft failed silently
        }
      }

      return data;
    } catch (error: any) {
      await logActivity({
        type: "processing",
        title: "Processing failed",
        description: error.message,
        meetingId: meeting._id,
      });
      throw error;
    }
  };

  const sendFollowUpEmail = async (
    followUp: any,
    meetingTitle: string
  ) => {
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: followUp.assigneeEmail,
          subject: `Follow-up: ${followUp.task} — from "${meetingTitle}"`,
          body: followUp.emailDraft,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      await logActivity({
        type: "email_sent",
        title: `Email sent to ${followUp.assignee}`,
        description: `Follow-up email delivered for: ${followUp.task}`,
        followUpId: followUp._id,
      });

      return data;
    } catch (error: any) {
      throw error;
    }
  };

  return { processMeeting, sendFollowUpEmail };
}
