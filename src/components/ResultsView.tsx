"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Mail,
  MailCheck,
  Send,
  Trash2,
  ChevronDown,
  Plus,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";
import { useAgent } from "@/lib/useAgent";

const priorityStyles: Record<string, string> = {
  high: "bg-danger/10 text-danger",
  medium: "bg-warning/10 text-warning",
  low: "bg-info/10 text-info",
};

const statusStyles: Record<string, { icon: any; color: string }> = {
  pending: { icon: Clock, color: "text-warning" },
  in_progress: { icon: ArrowRight, color: "text-info" },
  completed: { icon: CheckCircle2, color: "text-success" },
  overdue: { icon: AlertCircle, color: "text-danger" },
  email_sent: { icon: MailCheck, color: "text-success" },
};

export default function ResultsView({
  meetingId,
  onBack,
}: {
  meetingId: Id<"meetings">;
  onBack: () => void;
}) {
  const meeting = useQuery(api.meetings.get, { id: meetingId });
  const followUps = useQuery(api.followUps.listByMeeting, { meetingId }) || [];
  const activities = useQuery(api.agentActivity.list) || [];
  const updateStatus = useMutation(api.followUps.updateStatus);
  const removeFollowUp = useMutation(api.followUps.remove);
  const markEmailSent = useMutation(api.followUps.markEmailSent);
  const { sendFollowUpEmail } = useAgent();

  const [expandedId, setExpandedId] = useState<Id<"followUps"> | null>(null);
  const [copiedId, setCopiedId] = useState<Id<"followUps"> | null>(null);

  const meetingActivities = activities.filter(
    (a) => a.meetingId === meetingId
  );

  if (!meeting) return null;

  const stats = {
    total: followUps.length,
    pending: followUps.filter(
      (f) => f.status === "pending" || f.status === "in_progress"
    ).length,
    done: followUps.filter(
      (f) => f.status === "completed" || f.status === "email_sent"
    ).length,
  };

  const cycleStatus = async (id: Id<"followUps">, current: string) => {
    const order = ["pending", "in_progress", "completed"] as const;
    const idx = order.indexOf(current as any);
    if (idx === -1) return;
    await updateStatus({ id, status: order[(idx + 1) % order.length] });
  };

  const handleCopyEmail = async (id: Id<"followUps">, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="animate-fade-in">
      {/* Back + Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <div>
          <h2 className="text-lg font-bold tracking-tight">{meeting.title}</h2>
          <p className="text-xs text-text-muted">
            {meeting.date} · {meeting.participants.join(", ")}
          </p>
        </div>
      </div>

      {/* Summary Card */}
      {meeting.summary && (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">AI Summary</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">
            {meeting.summary}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Action Items", value: stats.total, color: "text-text" },
          { label: "Pending", value: stats.pending, color: "text-warning" },
          { label: "Completed", value: stats.done, color: "text-success" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-bg-card p-3 text-center"
          >
            <div className={cn("text-xl font-bold", color)}>{value}</div>
            <div className="text-[11px] text-text-muted mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Follow-up Items */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
          Action Items
        </h3>

        {followUps.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">
            No action items extracted. The notes might need more specific tasks.
          </div>
        ) : (
          followUps.map((fu) => {
            const status = statusStyles[fu.status] || statusStyles.pending;
            const StatusIcon = status.icon;
            const isExpanded = expandedId === fu._id;

            return (
              <div
                key={fu._id}
                className="rounded-xl border border-border bg-bg-card overflow-hidden transition-all hover:border-border-bright"
              >
                {/* Main row */}
                <div className="flex items-start gap-3 p-4">
                  <button
                    onClick={() => cycleStatus(fu._id, fu.status)}
                    className="mt-0.5 shrink-0 cursor-pointer transition-transform hover:scale-110"
                    title={`Click to change status`}
                  >
                    <StatusIcon className={cn("w-5 h-5", status.color)} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium leading-snug",
                        fu.status === "completed" &&
                          "line-through text-text-muted"
                      )}
                    >
                      {fu.task}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-bg-hover text-text-secondary font-medium">
                        {fu.assignee}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        Due {fu.dueDate}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider",
                          priorityStyles[fu.priority]
                        )}
                      >
                        {fu.priority}
                      </span>
                      {fu.emailDraft && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1",
                            fu.emailSentAt
                              ? "bg-success/10 text-success"
                              : "bg-accent/10 text-accent"
                          )}
                        >
                          {fu.emailSentAt ? (
                            <>
                              <MailCheck className="w-3 h-3" /> Sent
                            </>
                          ) : (
                            <>
                              <Mail className="w-3 h-3" /> Email ready
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {fu.emailDraft && (
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : fu._id)
                        }
                        className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
                      >
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-text-muted transition-transform",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </button>
                    )}
                    <button
                      onClick={() => removeFollowUp({ id: fu._id })}
                      className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded email */}
                {isExpanded && fu.emailDraft && (
                  <div className="border-t border-border px-4 py-4 bg-bg-elevated/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
                        Drafted follow-up email
                      </span>
                      <button
                        onClick={() =>
                          handleCopyEmail(fu._id, fu.emailDraft!)
                        }
                        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-text-secondary hover:text-text hover:bg-bg-hover transition-colors cursor-pointer"
                      >
                        {copiedId === fu._id ? (
                          <>
                            <Check className="w-3 h-3 text-success" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="rounded-lg border border-border bg-bg p-3.5 text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                      {fu.emailDraft}
                    </div>
                    {fu.assigneeEmail && !fu.emailSentAt && (
                      <button
                        onClick={async () => {
                          try {
                            await sendFollowUpEmail(fu, meeting.title);
                            await markEmailSent({ id: fu._id });
                          } catch {}
                        }}
                        className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/90 transition-colors cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        Send to {fu.assigneeEmail}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Agent Activity for this meeting */}
      {meetingActivities.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
            Agent Activity
          </h3>
          <div className="space-y-1.5">
            {meetingActivities.map((a) => (
              <div
                key={a._id}
                className="flex items-start gap-2.5 px-3 py-2 rounded-lg hover:bg-bg-card transition-colors"
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                    a.type === "extracted" || a.type === "email_sent"
                      ? "bg-success"
                      : a.type === "email_drafted"
                        ? "bg-warning"
                        : a.type === "insight"
                          ? "bg-accent"
                          : "bg-text-muted"
                  )}
                />
                <div>
                  <p className="text-xs font-medium">{a.title}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {a.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New meeting button */}
      <div className="mt-8 text-center">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:text-text hover:border-border-bright transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Process another meeting
        </button>
      </div>
    </div>
  );
}
