import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json(
        { error: "Email not configured. Add RESEND_API_KEY to enable." },
        { status: 400 }
      );
    }

    const resend = new Resend(resendKey);
    const { to, subject, body } = await req.json();

    const { data, error } = await resend.emails.send({
      from: "MeetBud AI <onboarding@resend.dev>",
      to: [to],
      subject,
      text: body,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
