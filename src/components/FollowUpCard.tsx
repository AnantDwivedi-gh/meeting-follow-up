"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Mail,
  MailCheck,
  Trash2,
  ChevronDown,
  Send,
} from "lucide-react";
import { useAgent } from "@/lib/useAgent";

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "#f5a623", label: "Pending" },
  in_progress: { icon: ArrowRight, color: "#3b82f6", label: "In Progress" },
  completed: { icon: CheckCircle2, color: "#3ecf8e", label: "Done" },
  overdue: { icon: AlertCircle, color: "#ef4444", label: "Overdue" },
  email_sent: { icon: MailCheck, color: "#3ecf8e", label: "Email Sent" },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  low: { color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  medium: { color: "#f5a623", bg: "rgba(245,166,35,0.1)" },
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

export default function FollowUpCard({
  followUp,
  meetingTitle,
}: {
  followUp: any;
  meetingTitle: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const updateStatus = useMutation(api.followUps.updateStatus);
  const removeFollowUp = useMutation(api.followUps.remove);
  const markEmailSent = useMutation(api.followUps.markEmailSent);
  const { sendFollowUpEmail } = useAgent();

  const status = statusConfig[followUp.status] || statusConfig.pending;
  const priority = priorityConfig[followUp.priority] || priorityConfig.medium;
  const StatusIcon = status.icon;

  const cycleStatus = async () => {
    const order = ["pending", "in_progress", "completed"] as const;
    const idx = order.indexOf(followUp.status as any);
    if (idx === -1) return;
    const next = order[(idx + 1) % order.length];
    await updateStatus({ id: followUp._id, status: next });
  };

  const handleSendEmail = async () => {
    if (!followUp.assigneeEmail || !followUp.emailDraft) return;
    setSending(true);
    try {
      await sendFollowUpEmail(followUp, meetingTitle);
      await markEmailSent({ id: followUp._id });
    } catch {
      // email send failed
    }
    setSending(false);
  };

  return (
    <div
      className="rounded-lg transition-all"
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-start gap-3 p-3.5">
        <button
          onClick={cycleStatus}
          className="mt-0.5 shrink-0 cursor-pointer transition-transform hover:scale-110"
          title={`Status: ${status.label} — click to change`}
        >
          <StatusIcon className="w-5 h-5" style={{ color: status.color }} />
        </button>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium leading-snug"
            style={{
              color:
                followUp.status === "completed"
                  ? "var(--text-muted)"
                  : "var(--text-primary)",
              textDecoration:
                followUp.status === "completed" ? "line-through" : "none",
            }}
          >
            {followUp.task}
          </p>
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: "var(--bg-hover)", color: "var(--text-secondary)" }}
            >
              {followUp.assignee}
            </span>
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Due {followUp.dueDate}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider"
              style={{ color: priority.color, background: priority.bg }}
            >
              {followUp.priority}
            </span>
            {followUp.emailDraft && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1"
                style={{
                  color: followUp.emailSentAt ? "#3ecf8e" : "#f5a623",
                  background: followUp.emailSentAt
                    ? "rgba(62,207,142,0.1)"
                    : "rgba(245,166,35,0.1)",
                }}
              >
                {followUp.emailSentAt ? (
                  <><MailCheck className="w-3 h-3" /> Sent</>
                ) : (
                  <><Mail className="w-3 h-3" /> Draft ready</>
                )}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {followUp.emailDraft && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-md transition cursor-pointer"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <ChevronDown
                className="w-4 h-4 transition-transform"
                style={{ transform: expanded ? "rotate(180deg)" : "none" }}
              />
            </button>
          )}
          <button
            onClick={() => removeFollowUp({ id: followUp._id })}
            className="p-1.5 rounded-md transition cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239,68,68,0.1)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded email draft */}
      {expanded && followUp.emailDraft && (
        <div
          className="px-4 pb-4 pt-0"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div
            className="mt-3 p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap"
            style={{
              background: "var(--bg-primary)",
              color: "var(--text-secondary)",
            }}
          >
            {followUp.emailDraft}
          </div>
          {followUp.assigneeEmail && !followUp.emailSentAt && (
            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #635bff, #7c3aed)",
                color: "#fff",
              }}
            >
              {sending ? (
                "Sending..."
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  Send to {followUp.assigneeEmail}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
