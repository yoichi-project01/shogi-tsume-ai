import { NextResponse } from "next/server";

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<ContactPayload>;

  if (!body.name || !body.email || !body.message) {
    return NextResponse.json({ error: "必須項目が入力されていません。" }, { status: 400 });
  }

  // TODO: forward to an email service (e.g. Resend) or store in Supabase once configured.
  console.log("Contact form submission:", { name: body.name, email: body.email });

  return NextResponse.json({ ok: true });
}
