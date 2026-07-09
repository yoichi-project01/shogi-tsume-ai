import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_PUZZLES } from "@/lib/shogi/puzzles";

/**
 * Returns the next puzzle for the current user, matched to their level.
 * Falls back to the bundled sample puzzle set if Supabase has no `valid`
 * puzzles yet (see section 12.3: availability must not depend on AI
 * generation succeeding at request time).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let difficulty = 1;
    let solvedPuzzleIds: string[] = [];

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("level")
        .eq("id", user.id)
        .maybeSingle();
      difficulty = profile?.level ?? 1;

      const { data: attempts } = await supabase
        .from("puzzle_attempts")
        .select("puzzle_id")
        .eq("user_id", user.id)
        .eq("is_correct", true);
      solvedPuzzleIds = attempts?.map((a) => a.puzzle_id) ?? [];
    }

    let query = supabase
      .from("puzzles")
      .select("*")
      .eq("status", "valid")
      .eq("difficulty", difficulty)
      .limit(1);

    if (solvedPuzzleIds.length > 0) {
      query = query.not("id", "in", `(${solvedPuzzleIds.join(",")})`);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) throw error ?? new Error("no puzzles");

    return NextResponse.json({ puzzle: data[0], source: "supabase" });
  } catch {
    const fallback = SAMPLE_PUZZLES[Math.floor(Math.random() * SAMPLE_PUZZLES.length)];
    return NextResponse.json({ puzzle: fallback, source: "fallback" });
  }
}
