"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import MeetingForm from "./MeetingForm";
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  ArrowUpCircle,
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

const priorityColors = {
  low: "text-blue-400 bg-blue-500/10",
  medium: "text-yellow-400 bg-yellow-500/10",
  high: "text-red-400 bg-red-500/10",
};

const statusIcons = {
  pending: <Clock className="w-4 h-4 text-yellow-400" />,
  in_progress: <ArrowUpCircle className="w-4 h-4 text-blue-400" />,
  completed: <CheckCircle2 className="w-4 h-4 text-green-400" />,
  overdue: <AlertCircle className="w-4 h-4 text-red-400" />,
};

export default function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [expandedMeeting, setExpandedMeeting] =
    useState<Id<"meetings"> | null>(null);

  const meetings = useQuery(api.meetings.list) || [];
  const allFollowUps = useQuery(api.followUps.listAll) || [];
  const updateStatus = useMutation(api.followUps.updateStatus);
  const removeMeeting = useMutation(api.meetings.remove);
  const removeFollowUp = useMutation(api.followUps.remove);

  const stats = {
    total: allFollowUps.length,
    pending: allFollowUps.filter(
      (f) => f.status === "pending" || f.status === "in_progress"
    ).length,
    completed: allFollowUps.filter((f) => f.status === "completed").length,
    overdue: allFollowUps.filter((f) => f.status === "overdue").length,
  };

  const getFollowUpsForMeeting = (meetingId: Id<"meetings">) =>
    allFollowUps.filter((f) => f.meetingId === meetingId);

  const cycleStatus = async (
    id: Id<"followUps">,
    current: string
  ) => {
    const order = ["pending", "in_progress", "completed"] as const;
    const idx = order.indexOf(current as any);
    const next = order[(idx + 1) % order.length];
    await updateStatus({ id, status: next });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          FollowUp Agent
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          AI-powered meeting follow-up tracker
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          {
            label: "Total",
            value: stats.total,
            color: "text-gray-300",
            bg: "bg-white/5",
          },
          {
            label: "Pending",
            value: stats.pending,
            color: "text-yellow-400",
            bg: "bg-yellow-500/5",
          },
          {
            label: "Done",
            value: stats.completed,
            color: "text-green-400",
            bg: "bg-green-500/5",
          },
          {
            label: "Overdue",
            value: stats.overdue,
            color: "text-red-400",
            bg: "bg-red-500/5",
          },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className={`${bg} rounded-xl p-4 border border-white/5`}
          >
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Add Meeting Button / Form */}
      <div className="mb-8">
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-3 rounded-xl border border-dashed border-indigo-500/30 text-indigo-400 text-sm hover:bg-indigo-500/5 transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          {showForm ? "Hide Form" : "Add Meeting Notes"}
        </button>
        {showForm && (
          <div className="mt-4 p-5 rounded-xl bg-white/[0.02] border border-white/5">
            <MeetingForm onCreated={() => setShowForm(false)} />
          </div>
        )}
      </div>

      {/* Meetings List */}
      <div className="space-y-3">
        {meetings.length === 0 && (
          <div className="text-center py-16 text-gray-600">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No meetings yet. Add your first meeting above.</p>
          </div>
        )}
        {meetings.map((meeting) => {
          const followUps = getFollowUpsForMeeting(meeting._id);
          const isExpanded = expandedMeeting === meeting._id;

          return (
            <div
              key={meeting._id}
              className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden"
            >
              {/* Meeting Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/[0.02] transition"
                onClick={() =>
                  setExpandedMeeting(isExpanded ? null : meeting._id)
                }
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white text-sm">
                      {meeting.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span>{meeting.date}</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {meeting.participants.length}
                      </span>
                      <span>{followUps.length} follow-ups</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMeeting({ id: meeting._id });
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-white/5 p-4 space-y-3">
                  {/* Notes Preview */}
                  <div className="text-xs text-gray-500 bg-white/[0.02] rounded-lg p-3 max-h-32 overflow-y-auto">
                    {meeting.notes}
                  </div>

                  {/* Follow-ups */}
                  {followUps.length === 0 ? (
                    <p className="text-xs text-gray-600 text-center py-4">
                      No follow-ups extracted. Ask the AI to parse the notes.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {followUps.map((fu) => (
                        <div
                          key={fu._id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition ${
                            fu.status === "completed"
                              ? "border-green-500/10 bg-green-500/[0.02] opacity-60"
                              : "border-white/5 bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button
                              onClick={() =>
                                cycleStatus(fu._id, fu.status)
                              }
                              className="shrink-0 cursor-pointer"
                            >
                              {
                                statusIcons[
                                  fu.status as keyof typeof statusIcons
                                ]
                              }
                            </button>
                            <div className="min-w-0">
                              <p
                                className={`text-sm ${fu.status === "completed" ? "line-through text-gray-500" : "text-white"}`}
                              >
                                {fu.task}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">
                                  {fu.assignee}
                                </span>
                                <span className="text-xs text-gray-600">
                                  Due: {fu.dueDate}
                                </span>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[fu.priority]}`}
                                >
                                  {fu.priority}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFollowUp({ id: fu._id })}
                            className="p-1.5 rounded hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
