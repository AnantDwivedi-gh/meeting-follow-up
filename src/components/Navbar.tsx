"use client";

import { useState } from "react";
import { Zap, Plus, ChevronDown, Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "../../convex/_generated/dataModel";

interface NavbarProps {
  hasMeetings: boolean;
  onNewMeeting: () => void;
  onViewMeeting: (id: Id<"meetings">) => void;
  meetings: any[];
}

export default function Navbar({
  hasMeetings,
  onNewMeeting,
  onViewMeeting,
  meetings,
}: NavbarProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-xl">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            MeetBud
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent/10 text-accent">
            AI
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {hasMeetings && (
            <div className="relative">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                  "text-text-secondary hover:text-text hover:bg-bg-hover"
                )}
              >
                <Calendar className="w-3.5 h-3.5" />
                History
                <ChevronDown
                  className={cn(
                    "w-3 h-3 transition-transform",
                    showHistory && "rotate-180"
                  )}
                />
              </button>

              {showHistory && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowHistory(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-border bg-bg-card shadow-2xl shadow-black/50 z-50 overflow-hidden">
                    <div className="p-3 border-b border-border">
                      <p className="text-xs font-medium text-text-secondary">
                        Recent meetings
                      </p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {meetings.map((m) => (
                        <button
                          key={m._id}
                          onClick={() => {
                            onViewMeeting(m._id);
                            setShowHistory(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-bg-hover transition-colors cursor-pointer"
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              m.processed
                                ? "bg-success/10"
                                : "bg-warning/10"
                            )}
                          >
                            {m.processed ? (
                              <CheckCircle2 className="w-4 h-4 text-success" />
                            ) : (
                              <Calendar className="w-4 h-4 text-warning" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {m.title}
                            </p>
                            <p className="text-[10px] text-text-muted">
                              {m.date} · {m.participants.length} people
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={onNewMeeting}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer",
              "bg-accent text-accent-foreground hover:bg-accent/90"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>
      </div>
    </nav>
  );
}
