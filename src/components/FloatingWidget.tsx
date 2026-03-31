"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Minimize2,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

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
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const buildContext = () => {
    const meetingCtx = meetings
      .slice(0, 5)
      .map(
        (m) =>
          `Meeting: "${m.title}" on ${m.date} with ${m.participants.join(", ")}. Notes: ${m.notes.slice(0, 200)}${m.summary ? ` Summary: ${m.summary}` : ""}`
      )
      .join("\n");

    const followUpCtx = pendingFollowUps
      .map(
        (f) =>
          `- [${f.priority.toUpperCase()}] ${f.task} → ${f.assignee} (due: ${f.dueDate}, status: ${f.status})`
      )
      .join("\n");

    return `Recent meetings:\n${meetingCtx || "No meetings yet."}\n\nPending follow-ups:\n${followUpCtx || "No pending follow-ups."}`;
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
      setLocalMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err: any) {
      const errMsg = `Error: ${err.message}`;
      await sendMessage({ role: "assistant", content: errMsg });
      setLocalMessages((prev) => [
        ...prev,
        { role: "assistant", content: errMsg },
      ]);
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
      {/* Floating Favicon Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Sparkles className="w-6 h-6 text-white" />
            {pendingFollowUps.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                {pendingFollowUps.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Chat Bar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] rounded-2xl overflow-hidden flex flex-col shadow-2xl shadow-indigo-500/20"
            style={{
              background: "linear-gradient(180deg, #1a1a2e 0%, #0f0f23 100%)",
              border: "1px solid rgba(99, 102, 241, 0.3)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                borderBottom: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <span className="font-semibold text-sm text-white">
                  FollowUp Agent
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                  Online
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {displayMessages.length === 0 && (
                <div className="text-center text-gray-500 mt-8 space-y-3">
                  <MessageCircle className="w-10 h-10 mx-auto opacity-50" />
                  <p className="text-sm">
                    Hi! I'm your meeting follow-up assistant.
                  </p>
                  <div className="space-y-2 text-xs">
                    <p className="text-gray-600">Try asking:</p>
                    {[
                      '"Parse my meeting notes"',
                      '"What follow-ups are pending?"',
                      '"Draft a follow-up email"',
                      '"Summarize last meeting"',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(suggestion.replace(/"/g, ""));
                        }}
                        className="block w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-gray-400 cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {displayMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-md"
                        : "bg-white/8 text-gray-200 rounded-bl-md"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/8 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                      <span
                        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <span
                        className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="p-3"
              style={{
                borderTop: "1px solid rgba(99,102,241,0.2)",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask about your follow-ups..."
                  className="flex-1 bg-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 transition cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-white" />
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
