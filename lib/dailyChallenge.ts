import { createClient, createServiceRoleClient } from "./supabase/server";
import { getDailyPuzzle } from "./dailyPuzzle";
import { generateDailyPuzzle } from "./shogi/generator";
import { puzzleFromRow } from "./shogi/puzzles";
import type { Puzzle } from "./shogi/types";
import type { PuzzleRow } from "@/types/puzzle";

export interface AttemptSummary {
  is_correct: boolean;
  answer_time: number;
  score: number;
}

export interface DailyChallengeResult {
  puzzle: Puzzle;
  attempted: boolean;
  result?: AttemptSummary;
}

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

/** Fetches (generating and persisting if necessary) today's daily-challenge puzzle. */
export async function getTodayChallenge(): Promise<DailyChallengeResult> {
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
    const rawPuzzle = challenge?.puzzles as PuzzleRow | undefined;
    const puzzle: Puzzle = rawPuzzle ? puzzleFromRow(rawPuzzle) : getDailyPuzzle();

    if (user) {
      const { data: attempt } = await supabase
        .from("puzzle_attempts")
        .select("is_correct, answer_time, score")
        .eq("user_id", user.id)
        .eq("puzzle_id", puzzle.id)
        .maybeSingle();
      if (attempt) return { puzzle, attempted: true, result: attempt };
    }

    return { puzzle, attempted: false };
  } catch {
    return { puzzle: getDailyPuzzle(), attempted: false };
  }
}
