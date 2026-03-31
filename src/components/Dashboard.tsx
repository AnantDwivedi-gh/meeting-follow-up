"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import MeetingForm from "./MeetingForm";
import FollowUpCard from "./FollowUpCard";
import AgentTimeline from "./AgentTimeline";
import {
  Plus,
  X,
  Calendar,
  Users,
  ChevronRight,
  Inbox,
  Zap,
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Id<"meetings"> | null>(null);

  const meetings = useQuery(api.meetings.list) || [];
  const allFollowUps = useQuery(api.followUps.listAll) || [];
  const removeMeeting = useMutation(api.meetings.remove);

  const stats = {
    meetings: meetings.length,
    pending: allFollowUps.filter((f) => f.status === "pending" || f.status === "in_progress").length,
    completed: allFollowUps.filter((f) => f.status === "completed" || f.status === "email_sent").length,
    total: allFollowUps.length,
  };

  const activeMeeting = selectedMeeting
    ? meetings.find((m) => m._id === selectedMeeting)
    : null;

  const meetingFollowUps = selectedMeeting
    ? allFollowUps.filter((f) => f.meetingId === selectedMeeting)
    : allFollowUps;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar — Meeting List */}
      <div
        className="w-72 shrink-0 flex flex-col"
        style={{
          background: "var(--bg-secondary)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #635bff, #7c3aed)" }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              MeetBud AI
            </h1>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Autonomous follow-up agent
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="px-4 py-3 grid grid-cols-3 gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
          {[
            { label: "Meetings", value: stats.meetings, color: "var(--accent)" },
            { label: "Pending", value: stats.pending, color: "#f5a623" },
            { label: "Done", value: stats.completed, color: "#3ecf8e" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className="text-lg font-bold" style={{ color }}>{value}</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Add Button */}
        <div className="px-3 py-3">
          <button
            onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer"
            style={{
              background: "var(--accent-glow)",
              color: "var(--accent)",
              border: "1px solid rgba(99,91,255,0.2)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,91,255,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent-glow)")}
          >
            <Plus className="w-3.5 h-3.5" />
            New Meeting
          </button>
        </div>

        {/* View All Button */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setSelectedMeeting(null)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition cursor-pointer"
            style={{
              background: selectedMeeting === null ? "var(--bg-hover)" : "transparent",
              color: selectedMeeting === null ? "var(--text-primary)" : "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              if (selectedMeeting !== null) e.currentTarget.style.background = "var(--bg-hover)";
            }}
            onMouseLeave={(e) => {
              if (selectedMeeting !== null) e.currentTarget.style.background = "transparent";
            }}
          >
            <Inbox className="w-3.5 h-3.5" />
            All Follow-ups
            <span
              className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}
            >
              {stats.total}
            </span>
          </button>
        </div>

        {/* Meeting List */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-0.5">
          <div className="text-[10px] font-medium tracking-wider uppercase px-3 py-2" style={{ color: "var(--text-muted)" }}>
            Meetings
          </div>
          {meetings.map((meeting) => {
            const isActive = selectedMeeting === meeting._id;
            const fuCount = allFollowUps.filter((f) => f.meetingId === meeting._id).length;
            return (
              <div
                key={meeting._id}
                onClick={() => setSelectedMeeting(meeting._id)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg transition cursor-pointer"
                style={{
                  background: isActive ? "var(--bg-hover)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = "var(--bg-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: meeting.processed
                      ? "rgba(62,207,142,0.1)"
                      : "rgba(245,166,35,0.1)",
                  }}
                >
                  <Calendar
                    className="w-4 h-4"
                    style={{ color: meeting.processed ? "#3ecf8e" : "#f5a623" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {meeting.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {meeting.date}
                    </span>
                    <span className="text-[10px] flex items-center gap-0.5" style={{ color: "var(--text-muted)" }}>
                      <Users className="w-2.5 h-2.5" />
                      {meeting.participants.length}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {fuCount > 0 && (
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: "var(--accent-glow)", color: "var(--accent)" }}
                    >
                      {fuCount}
                    </span>
                  )}
                  <ChevronRight className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {activeMeeting ? activeMeeting.title : "All Follow-ups"}
            </h2>
            {activeMeeting && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {activeMeeting.date} · {activeMeeting.participants.join(", ")}
                {activeMeeting.summary && ` · ${activeMeeting.summary}`}
              </p>
            )}
            {!activeMeeting && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {stats.pending} pending · {stats.completed} completed
              </p>
            )}
          </div>
          {activeMeeting && (
            <button
              onClick={() => removeMeeting({ id: activeMeeting._id }).then(() => setSelectedMeeting(null))}
              className="text-xs px-3 py-1.5 rounded-lg transition cursor-pointer"
              style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#ef4444";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              Delete Meeting
            </button>
          )}
        </div>

        {/* Follow-ups List */}
        <div className="flex-1 overflow-y-auto p-6">
          {meetingFollowUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--accent-glow)" }}
              >
                <Inbox className="w-8 h-8" style={{ color: "var(--accent)" }} />
              </div>
              <h3 className="text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                No follow-ups yet
              </h3>
              <p className="text-xs max-w-xs" style={{ color: "var(--text-muted)" }}>
                Add a meeting and the agent will automatically extract action items, assign owners, and draft follow-up emails.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-w-2xl">
              {meetingFollowUps.map((fu) => {
                const meeting = meetings.find((m) => m._id === fu.meetingId);
                return (
                  <FollowUpCard
                    key={fu._id}
                    followUp={fu}
                    meetingTitle={meeting?.title || "Unknown"}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — Agent Activity Timeline */}
      <div
        className="w-80 shrink-0 flex flex-col"
        style={{
          background: "var(--bg-secondary)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <AgentTimeline />
      </div>

      {/* Modal — New Meeting Form */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl overflow-hidden animate-slide-up"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-bright)",
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  New Meeting
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Paste notes and let the agent handle the rest
                </p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg transition cursor-pointer"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <MeetingForm onClose={() => setShowForm(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
