"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAgent } from "@/lib/useAgent";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ClipboardPaste,
  Sparkles,
  FileText,
  Users,
  Calendar,
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

export default function NoteInput({
  onProcessing,
}: {
  onProcessing: (id: Id<"meetings">) => void;
}) {
  const [notes, setNotes] = useState("");
  const [title, setTitle] = useState("");
  const [participants, setParticipants] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createMeeting = useMutation(api.meetings.create);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setNotes(text);
      textareaRef.current?.focus();
    } catch {}
  };

  const handleSubmit = async () => {
    if (!notes.trim()) return;

    const meetingTitle =
      title.trim() || `Meeting — ${new Date().toLocaleDateString()}`;
    const participantList = participants
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const meetingId = await createMeeting({
      title: meetingTitle,
      date: new Date().toISOString().split("T")[0],
      participants: participantList.length > 0 ? participantList : ["You"],
      notes: notes.trim(),
      source: "paste",
    });

    onProcessing(meetingId);
  };

  const canSubmit = notes.trim().length > 20;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4">
          <Sparkles className="w-3 h-3" />
          Powered by AI
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Paste your meeting notes
        </h1>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          MeetBud will extract action items, assign owners, set deadlines, and
          draft follow-up emails — automatically.
        </p>
      </div>

      {/* Main Input Card */}
      <div className="rounded-xl border border-border bg-bg-card overflow-hidden">
        {/* Optional details toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center gap-2 px-4 py-3 text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer border-b border-border"
        >
          <FileText className="w-3.5 h-3.5" />
          {showDetails
            ? "Hide meeting details"
            : "Add title & participants (optional)"}
        </button>

        {showDetails && (
          <div className="px-4 py-3 border-b border-border space-y-3 bg-bg-elevated/50">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted mb-1.5">
                  <Calendar className="w-3 h-3" />
                  Meeting title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sprint Planning"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-1.5 text-[11px] font-medium text-text-muted mb-1.5">
                  <Users className="w-3 h-3" />
                  Participants
                </label>
                <input
                  type="text"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  placeholder="Alice, Bob, Charlie"
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-text-muted outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste your meeting notes, transcript, or key discussion points here...

Example:
• Alice to finalize the Q2 budget by Friday
• Bob will set up the client demo next Tuesday
• Team agreed to migrate to new auth system before April 15
• Sarah to review and approve the design mockups"
            rows={12}
            className="w-full bg-transparent px-4 py-4 text-sm text-text placeholder:text-text-muted/60 outline-none resize-none leading-relaxed"
          />

          {/* Paste button overlay */}
          {!notes && (
            <button
              onClick={handlePaste}
              className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-hover border border-border text-xs text-text-secondary hover:text-text hover:border-border-bright transition-all cursor-pointer"
            >
              <ClipboardPaste className="w-3 h-3" />
              Paste
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-elevated/30">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-text-muted">
              {notes.length > 0
                ? `${notes.split(/\s+/).filter(Boolean).length} words`
                : "Paste or type your notes"}
            </span>
            {notes.length > 0 && notes.length < 20 && (
              <span className="text-[11px] text-warning">
                Add more detail for better results
              </span>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
              canSubmit
                ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
                : "bg-bg-hover text-text-muted cursor-not-allowed"
            )}
          >
            Process with AI
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {[
          {
            step: "1",
            title: "Paste notes",
            desc: "Drop in your meeting notes, transcript, or bullet points",
          },
          {
            step: "2",
            title: "AI processes",
            desc: "Extracts action items, assigns owners, sets deadlines",
          },
          {
            step: "3",
            title: "Follow up",
            desc: "Review drafted emails and send them with one click",
          },
        ].map((item) => (
          <div
            key={item.step}
            className="text-center p-4 rounded-xl border border-border/50 bg-bg-card/50"
          >
            <div className="w-7 h-7 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center mx-auto mb-2.5">
              {item.step}
            </div>
            <p className="text-xs font-medium mb-1">{item.title}</p>
            <p className="text-[11px] text-text-muted leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
