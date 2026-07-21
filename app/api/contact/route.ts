import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

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

  try {
    const admin = createServiceRoleClient();
    const { error } = await admin
      .from("contact_messages")
      .insert({ name: body.name, email: body.email, message: body.message });
    if (error) throw error;
  } catch (error) {
    console.error("Failed to store contact submission:", error);
    return NextResponse.json({ error: "送信に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
