import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { action, data } = await req.json();

    if (action === "process_meeting") {
      const { title, date, participants, notes } = data;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are MeetBud AI. Extract structured data from meeting notes. Return ONLY valid JSON, no explanation or markdown fences.

Return this exact format:
{"summary":"2-3 sentence summary","followUps":[{"task":"specific action","assignee":"person","assigneeEmail":null,"dueDate":"YYYY-MM-DD","priority":"low|medium|high"}],"insights":["insight1"]}`,
          },
          {
            role: "user",
            content: `Meeting: ${title}\nDate: ${date}\nParticipants: ${participants.join(", ")}\n\nNotes:\n${notes}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
      });

      const raw = completion.choices[0]?.message?.content || "{}";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: raw, followUps: [], insights: [] };

      return NextResponse.json(parsed);
    }

    if (action === "draft_email") {
      const { task, assignee, meetingTitle, meetingDate, dueDate, senderName } = data;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "Write a professional but friendly follow-up email. Be specific about the action item and deadline. Keep it under 150 words. Return ONLY the email body, no subject line.",
          },
          {
            role: "user",
            content: `Draft a follow-up email to ${assignee} about:\nAction item: ${task}\nFrom meeting: "${meetingTitle}" on ${meetingDate}\nDue date: ${dueDate}\nSender: ${senderName || "the team"}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const email = completion.choices[0]?.message?.content || "";
      return NextResponse.json({ email });
    }

    if (action === "check_overdue") {
      const { followUps } = data;
      const today = new Date().toISOString().split("T")[0];
      const overdue = followUps.filter(
        (f: any) =>
          f.dueDate < today &&
          f.status !== "completed" &&
          f.status !== "email_sent"
      );

      return NextResponse.json({
        overdue: overdue.map((f: any) => f._id),
        message:
          overdue.length > 0
            ? `Found ${overdue.length} overdue follow-up${overdue.length > 1 ? "s" : ""}. Preparing reminder emails...`
            : "All follow-ups are on track.",
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Agent error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
