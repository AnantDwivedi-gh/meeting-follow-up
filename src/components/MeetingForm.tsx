"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Loader2, Sparkles } from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

export default function MeetingForm({
  onCreated,
}: {
  onCreated?: (id: Id<"meetings">) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [participants, setParticipants] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const createMeeting = useMutation(api.meetings.create);
  const createFollowUp = useMutation(api.followUps.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !notes) return;
    setLoading(true);

    try {
      const meetingId = await createMeeting({
        title,
        date,
        participants: participants
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
        notes,
      });

      // Auto-extract follow-ups with AI
      setAiLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Extract action items from these meeting notes. Return ONLY valid JSON, no other text:\n\nMeeting: ${title}\nDate: ${date}\nParticipants: ${participants}\nNotes:\n${notes}`,
              },
            ],
          }),
        });

        const data = await res.json();
        const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.followUps) {
            for (const fu of parsed.followUps) {
              await createFollowUp({
                meetingId,
                task: fu.task,
                assignee: fu.assignee || "Unassigned",
                dueDate: fu.dueDate || date,
                priority: fu.priority || "medium",
              });
            }
          }
        }
      } catch {
        // AI extraction failed silently — user can add follow-ups manually
      }
      setAiLoading(false);

      setTitle("");
      setNotes("");
      setParticipants("");
      onCreated?.(meetingId);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Meeting Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sprint Planning"
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">
          Participants (comma-separated)
        </label>
        <input
          type="text"
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          placeholder="Alice, Bob, Charlie"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">
          Meeting Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste your meeting notes here... The AI will extract action items automatically."
          rows={6}
          required
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/50 transition resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !title || !notes}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium py-3 rounded-xl transition cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {aiLoading ? "AI extracting follow-ups..." : "Creating..."}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Add Meeting & Extract Follow-ups
          </>
        )}
      </button>
    </form>
  );
}
