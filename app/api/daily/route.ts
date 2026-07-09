import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDailyPuzzle } from "@/lib/dailyPuzzle";

export async function GET() {
  const todayKey = new Date().toISOString().slice(0, 10);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: challenge } = await supabase
      .from("daily_challenges")
      .select("*, puzzles(*)")
      .eq("challenge_date", todayKey)
      .maybeSingle();

    const puzzle: unknown = challenge?.puzzles ?? getDailyPuzzle();

    let attempted = false;
    if (user) {
      const puzzleId = challenge?.puzzle_id ?? (puzzle as { id?: string }).id;
      const { data: attempt } = await supabase
        .from("puzzle_attempts")
        .select("is_correct, answer_time, score")
        .eq("user_id", user.id)
        .eq("puzzle_id", puzzleId)
        .maybeSingle();
      attempted = Boolean(attempt);
      if (attempt) {
        return NextResponse.json({ puzzle, attempted, result: attempt });
      }
    }

    return NextResponse.json({ puzzle, attempted });
  } catch {
    return NextResponse.json({ puzzle: getDailyPuzzle(), attempted: false });
  }
}
