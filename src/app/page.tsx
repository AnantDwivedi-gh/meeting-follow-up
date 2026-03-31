"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import NoteInput from "@/components/NoteInput";
import ProcessingView from "@/components/ProcessingView";
import ResultsView from "@/components/ResultsView";
import Navbar from "@/components/Navbar";
import FloatingWidget from "@/components/FloatingWidget";
import { Id } from "../../convex/_generated/dataModel";

type AppState =
  | { step: "input" }
  | { step: "processing"; meetingId: Id<"meetings"> }
  | { step: "results"; meetingId: Id<"meetings"> };

export default function Home() {
  const [state, setState] = useState<AppState>({ step: "input" });
  const meetings = useQuery(api.meetings.list) || [];
  const hasMeetings = meetings.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        hasMeetings={hasMeetings}
        onNewMeeting={() => setState({ step: "input" })}
        onViewMeeting={(id) => setState({ step: "results", meetingId: id })}
        meetings={meetings}
      />

      <main className="flex-1 flex items-start justify-center px-4 pt-8 pb-24">
        <div className="w-full max-w-2xl">
          {state.step === "input" && (
            <NoteInput
              onProcessing={(meetingId) =>
                setState({ step: "processing", meetingId })
              }
            />
          )}
          {state.step === "processing" && (
            <ProcessingView
              meetingId={state.meetingId}
              onDone={() =>
                setState({ step: "results", meetingId: state.meetingId })
              }
            />
          )}
          {state.step === "results" && (
            <ResultsView
              meetingId={state.meetingId}
              onBack={() => setState({ step: "input" })}
            />
          )}
        </div>
      </main>

      <FloatingWidget />
    </div>
  );
}
