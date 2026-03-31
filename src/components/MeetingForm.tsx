"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader2, Sparkles, ClipboardPaste } from "lucide-react";
import { useAgent } from "@/lib/useAgent";

export default function MeetingForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [participants, setParticipants] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");

  const createMeeting = useMutation(api.meetings.create);
  const { processMeeting } = useAgent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !notes) return;
    setLoading(true);

    try {
      setStage("Creating meeting...");
      const participantList = participants
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const meetingId = await createMeeting({
        title,
        date,
        participants: participantList,
        notes,
        source: "manual",
      });

      setStage("Agent is analyzing notes...");
      await processMeeting({
        _id: meetingId,
        title,
        date,
        participants: participantList,
        notes,
      });

      setStage("Done!");
      onClose();
    } catch (err) {
      setStage("Error processing — follow-ups may need manual input");
      setTimeout(onClose, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setNotes(text);
    } catch {
      // Clipboard access denied
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Meeting Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sprint Planning Q2"
            required
            className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-bright)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-bright)")}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-bright)",
              color: "var(--text-primary)",
              colorScheme: "dark",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border-bright)")}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
          Participants
        </label>
        <input
          type="text"
          value={participants}
          onChange={(e) => setParticipants(e.target.value)}
          placeholder="Alice, Bob, Charlie"
          className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border-bright)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border-bright)")}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
            Meeting Notes
          </label>
          <button
            type="button"
            onClick={handlePaste}
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition cursor-pointer"
            style={{ color: "var(--accent)", background: "var(--accent-glow)" }}
          >
            <ClipboardPaste className="w-3 h-3" />
            Paste
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste your meeting notes, transcript, or key points here. The agent will automatically extract action items, assign owners, set deadlines, and draft follow-up emails."
          rows={8}
          required
          className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none transition resize-none"
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border-bright)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border-bright)")}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !title || !notes}
        className="w-full flex items-center justify-center gap-2.5 py-3 rounded-lg text-sm font-medium transition cursor-pointer disabled:opacity-40"
        style={{
          background: loading
            ? "var(--bg-hover)"
            : "linear-gradient(135deg, #635bff, #7c3aed)",
          color: "#fff",
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{stage}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Add Meeting — Agent Will Process Automatically
          </>
        )}
      </button>
    </form>
  );
}
