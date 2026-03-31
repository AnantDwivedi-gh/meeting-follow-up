import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are FollowUp Agent — an AI assistant specialized in managing meeting follow-ups. You help users:

1. Parse meeting notes and extract action items, owners, and deadlines
2. Track follow-up status and send reminders
3. Draft follow-up emails
4. Summarize meeting outcomes
5. Answer questions about past meetings and their follow-ups

When given meeting notes, extract structured follow-ups in this JSON format:
\`\`\`json
{
  "summary": "Brief meeting summary",
  "followUps": [
    {
      "task": "Description of the action item",
      "assignee": "Person responsible",
      "dueDate": "YYYY-MM-DD",
      "priority": "low|medium|high"
    }
  ]
}
\`\`\`

When asked to draft an email, write a professional but friendly follow-up email.
When asked about status, provide a clear overview of pending items.
Be concise, actionable, and helpful. Use markdown formatting.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const systemContent = context
      ? `${SYSTEM_PROMPT}\n\nCurrent context from the database:\n${context}`
      : SYSTEM_PROMPT;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemContent },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, I couldn't process that.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get AI response" },
      { status: 500 }
    );
  }
}
