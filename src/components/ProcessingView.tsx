"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAgent } from "@/lib/useAgent";
import { cn } from "@/lib/utils";
import {
  Loader2,
  FileSearch,
  Users,
  Mail,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Id } from "../../convex/_generated/dataModel";

const stages = [
  { id: "reading", label: "Reading meeting notes", icon: FileSearch },
  { id: "extracting", label: "Extracting action items", icon: Zap },
  { id: "assigning", label: "Identifying owners & deadlines", icon: Users },
  { id: "drafting", label: "Drafting follow-up emails", icon: Mail },
  { id: "done", label: "All done!", icon: CheckCircle2 },
];

export default function ProcessingView({
  meetingId,
  onDone,
}: {
  meetingId: Id<"meetings">;
  onDone: () => void;
}) {
  const [currentStage, setCurrentStage] = useState(0);
  const [started, setStarted] = useState(false);
  const meeting = useQuery(api.meetings.get, { id: meetingId });
  const { processMeeting } = useAgent();

  useEffect(() => {
    if (!meeting || started) return;
    if (meeting.processed) {
      setCurrentStage(4);
      setTimeout(onDone, 800);
      return;
    }
    setStarted(true);

    const stageTimer = setInterval(() => {
      setCurrentStage((prev) => Math.min(prev + 1, 3));
    }, 1500);

    processMeeting(meeting).then(() => {
      clearInterval(stageTimer);
      setCurrentStage(4);
      setTimeout(onDone, 1200);
    }).catch(() => {
      clearInterval(stageTimer);
      setCurrentStage(4);
      setTimeout(onDone, 1200);
    });

    return () => clearInterval(stageTimer);
  }, [meeting]);

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-7 h-7 text-accent animate-spin" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-1">
          Processing your meeting
        </h2>
        <p className="text-sm text-text-secondary">
          {meeting?.title || "Working on it..."}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="max-w-sm mx-auto space-y-2">
        {stages.map((stage, i) => {
          const Icon = stage.icon;
          const isActive = i === currentStage;
          const isDone = i < currentStage;
          const isPending = i > currentStage;

          return (
            <div
              key={stage.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500",
                isActive && "bg-accent/5 border border-accent/20",
                isDone && "opacity-60",
                isPending && "opacity-20"
              )}
              style={{
                animation: isActive ? "fade-in 0.3s ease-out" : undefined,
              }}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isActive && "bg-accent/15",
                  isDone && "bg-success/15",
                  isPending && "bg-bg-hover"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 text-accent animate-spin" />
                ) : (
                  <Icon className="w-4 h-4 text-text-muted" />
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  isActive && "text-text",
                  isDone && "text-text-secondary",
                  isPending && "text-text-muted"
                )}
              >
                {stage.label}
              </span>
              {isActive && (
                <div className="ml-auto flex gap-1">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-1 h-1 rounded-full bg-accent animate-pulse-dot"
                      style={{ animationDelay: `${d * 0.2}s` }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Shimmer bar */}
      {currentStage < 4 && (
        <div className="mt-8 h-1 rounded-full bg-bg-hover overflow-hidden max-w-sm mx-auto">
          <div className="h-full w-full animate-shimmer rounded-full" />
        </div>
      )}
    </div>
  );
}
