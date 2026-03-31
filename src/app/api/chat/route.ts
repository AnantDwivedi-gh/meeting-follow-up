import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are MeetBud AI — an autonomous meeting follow-up agent. You're proactive, concise, and action-oriented.

Your capabilities:
1. Parse meeting notes → extract action items with owners, deadlines, priorities
2. Draft professional follow-up emails for each action item owner
3. Provide meeting summaries and insights
4. Track and report on follow-up status
5. Suggest next steps and identify risks

When extracting follow-ups from meeting notes, return ONLY this JSON:
\`\`\`json
{
  "summary": "2-3 sentence meeting summary",
  "followUps": [
    {
      "task": "Specific action item",
      "assignee": "Person name",
      "assigneeEmail": "email@example.com or null",
      "dueDate": "YYYY-MM-DD",
      "priority": "low|medium|high"
    }
  ],
  "insights": ["Key insight or risk identified"]
}
\`\`\`

When drafting emails, write professional but warm follow-up emails. Be specific about action items and deadlines.

When chatting, be brief and actionable. You're an assistant that gets things done, not one that explains things.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const systemContent = context
      ? `${SYSTEM_PROMPT}\n\nCurrent context:\n${context}`
      : SYSTEM_PROMPT;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemContent }, ...messages],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const reply =
      completion.choices[0]?.message?.content ||
      "Sorry, I couldn't process that.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get AI response" },
      { status: 500 }
    );
  }
}
