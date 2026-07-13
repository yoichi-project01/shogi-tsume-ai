import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getDailyPuzzle } from "@/lib/dailyPuzzle";
import { generateDailyPuzzle } from "@/lib/shogi/generator";

/**
 * Generates and persists today's puzzle the first time it's requested for a
 * given date. Uses the service-role client because `puzzles`/`daily_challenges`
 * have no client-facing insert policy (writes are admin/server-only by design).
 * Returns null on any failure so the caller can fall back to the bundled
 * sample puzzle set (section 12.3: availability must not depend on this).
 */
async function createTodayChallenge(todayKey: string) {
  try {
    const admin = createServiceRoleClient();
    const generated = generateDailyPuzzle();

    const { data: puzzleRow, error: puzzleError } = await admin
      .from("puzzles")
      .insert({
        title: generated.title,
        board_state: generated.initialBoard,
        hand_pieces: generated.initialHands,
        solution: generated.solution,
        move_count: generated.moveCount,
        difficulty: generated.difficulty,
        status: "valid",
        generation_type: "algorithmic",
        explanation: generated.explanation,
      })
      .select()
      .single();

    if (puzzleError || !puzzleRow) return null;

    const { data: challengeRow, error: challengeError } = await admin
      .from("daily_challenges")
      .insert({ puzzle_id: puzzleRow.id, challenge_date: todayKey, difficulty: generated.difficulty })
      .select("*, puzzles(*)")
      .single();

    if (challengeError) {
      // Another request generated today's challenge concurrently; use that one.
      const { data: raceWinner } = await admin
        .from("daily_challenges")
        .select("*, puzzles(*)")
        .eq("challenge_date", todayKey)
        .maybeSingle();
      return raceWinner ?? null;
    }

    return challengeRow;
  } catch {
    return null;
  }
}

export async function GET() {
  const todayKey = new Date().toISOString().slice(0, 10);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: existing } = await supabase
      .from("daily_challenges")
      .select("*, puzzles(*)")
      .eq("challenge_date", todayKey)
      .maybeSingle();

    const challenge = existing ?? (await createTodayChallenge(todayKey));

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
