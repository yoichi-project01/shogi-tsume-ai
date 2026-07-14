import { NextResponse } from "next/server";
import { getTodayChallenge } from "@/lib/dailyChallenge";

export async function GET() {
  const result = await getTodayChallenge();
  return NextResponse.json(result);
}
