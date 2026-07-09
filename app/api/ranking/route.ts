import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { RankingType } from "@/types/ranking";

const VALID_TYPES: RankingType[] = ["daily", "weekly", "monthly", "total", "streak", "no_hint", "speed"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") ?? "total") as RankingType;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "invalid ranking type" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("rankings")
      .select("id, user_id, score, rank_date, profiles(username)")
      .eq("ranking_type", type)
      .order("score", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ entries: [], myRank: null, note: "ranking data not available yet" });
    }

    const entries = (data ?? []).map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      score: row.score,
    }));

    const myRank = user ? entries.find((e) => e.userId === user.id)?.rank ?? null : null;

    return NextResponse.json({ entries, myRank });
  } catch {
    return NextResponse.json({ entries: [], myRank: null, note: "ranking data not available yet" });
  }
}
