"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Zap,
  Mail,
  MailCheck,
  Bell,
  Search,
  Lightbulb,
  Cpu,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const typeConfig = {
  processing: { icon: Cpu, color: "#635bff", label: "Processing" },
  extracted: { icon: Zap, color: "#3ecf8e", label: "Extracted" },
  email_drafted: { icon: Mail, color: "#f5a623", label: "Email Ready" },
  email_sent: { icon: MailCheck, color: "#3ecf8e", label: "Sent" },
  reminder: { icon: Bell, color: "#ef4444", label: "Reminder" },
  status_check: { icon: Search, color: "#3b82f6", label: "Check" },
  insight: { icon: Lightbulb, color: "#f5a623", label: "Insight" },
};

export default function AgentTimeline() {
  const activities = useQuery(api.agentActivity.list) || [];

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 flex items-center gap-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: "#3ecf8e",
            boxShadow: "0 0 8px rgba(62,207,142,0.5)",
            animation: "pulse-glow 2s infinite",
          }}
        />
        <span className="text-xs font-medium tracking-wide uppercase" style={{ color: "var(--text-secondary)" }}>
          Agent Activity
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "var(--accent-glow)" }}
            >
              <Cpu className="w-6 h-6" style={{ color: "var(--accent)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Agent is idle
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Add a meeting to see the agent work
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-1">
            {activities.map((activity, i) => {
              const config = typeConfig[activity.type];
              const Icon = config.icon;
              return (
                <div
                  key={activity._id}
                  className="group flex gap-3 p-3 rounded-lg transition-colors cursor-default"
                  style={{
                    animation: i < 3 ? `slide-up 0.3s ease-out ${i * 0.1}s both` : undefined,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${config.color}15` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {activity.title}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                        style={{
                          background: `${config.color}15`,
                          color: config.color,
                        }}
                      >
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-muted)" }}>
                      {activity.description}
                    </p>
                    <span className="text-[10px] mt-1 block" style={{ color: "var(--text-muted)" }}>
                      {formatDistanceToNow(activity.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
