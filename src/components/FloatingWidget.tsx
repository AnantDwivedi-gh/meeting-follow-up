"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Zap,
  Minimize2,
  Activity,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function FloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"chat" | "activity">("chat");
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
  const activities = useQuery(api.agentActivity.list) || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, chatMessages]);

  useEffect(() => {
    if (isOpen && tab === "chat") inputRef.current?.focus();
  }, [isOpen, tab]);

  const buildContext = () => {
    const meetingCtx = meetings
      .slice(0, 5)
      .map(
        (m) =>
          `Meeting: "${m.title}" on ${m.date} with ${m.participants.join(", ")}. ${m.summary || ""}`
      )
      .join("\n");

    const followUpCtx = pendingFollowUps
      .map(
        (f) =>
          `- [${f.priority}] ${f.task} → ${f.assignee} (due: ${f.dueDate}, status: ${f.status})`
      )
      .join("\n");

    return `Recent meetings:\n${meetingCtx || "None"}\n\nPending follow-ups:\n${followUpCtx || "None"}`;
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
      setLocalMessages((prev) => [...prev, { role: "assistant", content: errMsg }]);
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
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #635bff, #7c3aed)",
              boxShadow: "0 4px 20px rgba(99,91,255,0.3)",
            }}
          >
            <Zap className="w-5 h-5 text-white" />
            {pendingFollowUps.length > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full text-[10px] text-white flex items-center justify-center font-bold"
                style={{ background: "#ef4444", minWidth: 18, height: 18 }}
              >
                {pendingFollowUps.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 350 }}
            className="fixed bottom-5 right-5 z-50 w-[380px] h-[520px] rounded-xl overflow-hidden flex flex-col"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-bright)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,91,255,0.1)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #635bff, #7c3aed)" }}
                >
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  MeetBud AI
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg transition cursor-pointer"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex px-4 pt-2 gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
              {(["chat", "activity"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition cursor-pointer"
                  style={{
                    color: tab === t ? "var(--accent)" : "var(--text-muted)",
                    background: tab === t ? "var(--accent-glow)" : "transparent",
                    borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                  }}
                >
                  {t === "chat" ? <MessageCircle className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                  {t === "chat" ? "Chat" : "Activity"}
                  {t === "activity" && activities.length > 0 && (
                    <span
                      className="text-[9px] px-1 rounded-full"
                      style={{ background: "var(--accent-glow)", color: "var(--accent)" }}
                    >
                      {activities.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            {tab === "chat" ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {displayMessages.length === 0 && (
                    <div className="text-center mt-6 space-y-3">
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Ask me anything about your meetings and follow-ups
                      </p>
                      {[
                        "What follow-ups are overdue?",
                        "Draft a reminder email",
                        "Summarize today's meetings",
                      ].map((s) => (
                        <button
                          key={s}
                          onClick={() => setInput(s)}
                          className="block w-full text-left px-3 py-2 rounded-lg text-xs transition cursor-pointer"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border)",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-bright)")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                  {displayMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className="max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed"
                        style={{
                          background:
                            msg.role === "user"
                              ? "linear-gradient(135deg, #635bff, #7c3aed)"
                              : "var(--bg-elevated)",
                          color: msg.role === "user" ? "#fff" : "var(--text-secondary)",
                          border: msg.role === "user" ? "none" : "1px solid var(--border)",
                        }}
                      >
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div
                        className="rounded-xl px-4 py-3"
                        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                      >
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full animate-bounce"
                              style={{ background: "var(--accent)", animationDelay: `${i * 0.1}s` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Ask about your follow-ups..."
                      className="flex-1 rounded-lg px-3.5 py-2.5 text-xs outline-none transition"
                      style={{
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    />
                    <button
                      onClick={handleSend}
                      disabled={loading || !input.trim()}
                      className="p-2.5 rounded-lg transition cursor-pointer disabled:opacity-30"
                      style={{ background: "linear-gradient(135deg, #635bff, #7c3aed)" }}
                    >
                      {loading ? (
                        <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {activities.length === 0 ? (
                  <p className="text-xs text-center mt-8" style={{ color: "var(--text-muted)" }}>
                    No agent activity yet
                  </p>
                ) : (
                  activities.slice(0, 20).map((a) => (
                    <div
                      key={a._id}
                      className="p-2.5 rounded-lg"
                      style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{
                            background:
                              a.type === "extracted" || a.type === "email_sent"
                                ? "#3ecf8e"
                                : a.type === "email_drafted"
                                  ? "#f5a623"
                                  : "var(--accent)",
                          }}
                        />
                        <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {a.title}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1 line-clamp-2 pl-3.5" style={{ color: "var(--text-muted)" }}>
                        {a.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
