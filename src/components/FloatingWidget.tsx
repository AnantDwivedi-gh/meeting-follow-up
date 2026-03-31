"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Zap, MessageCircle } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";

export default function FloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [localMessages, setLocalMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMessages = useQuery(api.chat.list) || [];
  const sendMessage = useMutation(api.chat.send);
  const meetings = useQuery(api.meetings.list) || [];
  const pendingFollowUps = useQuery(api.followUps.listPending) || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, chatMessages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const buildContext = () => {
    const m = meetings
      .slice(0, 5)
      .map((m) => `"${m.title}" (${m.date}): ${m.summary || "No summary"}`)
      .join("\n");
    const f = pendingFollowUps
      .map((f) => `- ${f.task} → ${f.assignee} (due ${f.dueDate})`)
      .join("\n");
    return `Meetings:\n${m || "None"}\n\nPending:\n${f || "None"}`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setLoading(true);

    await sendMessage({ role: "user", content: userMsg });
    const allMessages = [
      ...chatMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userMsg },
    ];
    setLocalMessages(allMessages);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: allMessages.slice(-10),
          context: buildContext(),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await sendMessage({ role: "assistant", content: data.reply });
      setLocalMessages((p) => [...p, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      const errMsg = `Something went wrong. Try again.`;
      await sendMessage({ role: "assistant", content: errMsg });
      setLocalMessages((p) => [...p, { role: "assistant", content: errMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const displayMessages =
    localMessages.length > 0
      ? localMessages
      : chatMessages.map((m) => ({ role: m.role, content: m.content }));

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-accent to-purple-600 shadow-lg shadow-accent/25"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            {pendingFollowUps.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-danger text-[10px] text-white flex items-center justify-center font-bold px-1">
                {pendingFollowUps.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="fixed bottom-5 right-5 z-50 w-[360px] h-[480px] rounded-xl overflow-hidden flex flex-col border border-border bg-bg-card shadow-2xl shadow-black/60"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-semibold">MeetBud AI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors cursor-pointer text-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {displayMessages.length === 0 && (
                <div className="text-center mt-8 space-y-3 px-4">
                  <p className="text-xs text-text-muted">
                    Ask about your meetings, follow-ups, or get help drafting emails.
                  </p>
                  {[
                    "What's overdue?",
                    "Draft a reminder for Alice",
                    "Summarize my last meeting",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="block w-full text-left px-3 py-2 rounded-lg text-xs border border-border hover:border-border-bright hover:bg-bg-hover transition-all cursor-pointer text-text-secondary"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {displayMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-accent text-accent-foreground rounded-br-sm"
                        : "bg-bg-elevated border border-border text-text-secondary rounded-bl-sm"
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-bg-elevated border border-border rounded-xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask MeetBud anything..."
                  className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text placeholder:text-text-muted outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="p-2 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
