import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_PUZZLES } from "@/lib/shogi/puzzles";
import { createSession, submitMove } from "@/lib/shogi/validator";
import { calculateScore } from "@/lib/score";
import type { Move, Puzzle } from "@/lib/shogi/types";
import type { PuzzleRow } from "@/types/puzzle";

function puzzleFromRow(row: PuzzleRow): Puzzle {
  return {
    id: row.id,
    title: row.title,
    moveCount: row.move_count as Puzzle["moveCount"],
    difficulty: row.difficulty,
    initialBoard: row.board_state,
    initialHands: row.hand_pieces,
    solution: row.solution as Move[],
    explanation: row.explanation ?? "",
  };
}

interface AttemptPayload {
  puzzleId: string;
  moves: Move[];
  hintsUsed: number;
  answerTimeSeconds: number;
  resigned?: boolean;
}

/**
 * Judges a puzzle attempt server-side (never trust the client's win/lose claim
 * directly — see section 6.11 anti-cheat requirements) and persists the result.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AttemptPayload>;

  if (!body.puzzleId || !Array.isArray(body.moves)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  // Supabase may not be configured in this environment (see section 12.3:
  // guest play must keep working without it) — treat any failure as "no user".
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  let user: { id: string } | null = null;
  try {
    supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    user = authUser;
  } catch {
    supabase = null;
    user = null;
  }

  let puzzle: Puzzle | undefined = SAMPLE_PUZZLES.find((p) => p.id === body.puzzleId);

  // Not one of the bundled samples — it may be a generated puzzle stored in Supabase.
  if (!puzzle && supabase) {
    const { data: row } = await supabase
      .from("puzzles")
      .select("*")
      .eq("id", body.puzzleId)
      .eq("status", "valid")
      .maybeSingle();
    if (row) puzzle = puzzleFromRow(row as PuzzleRow);
  }

  if (!puzzle) {
    return NextResponse.json({ error: "puzzle not found" }, { status: 404 });
  }

  // Replay the attacker's submitted moves through the real rule engine —
  // this is the authoritative correctness check, not anything the client sends.
  let session = createSession(puzzle);
  let isCorrect = false;

  if (!body.resigned) {
    for (const move of body.moves) {
      const result = submitMove(puzzle, session, move);
      if (result.outcome === "illegal" || result.outcome === "incorrect") break;
      session = result.session;
      if (result.outcome === "solved") {
        isCorrect = true;
        break;
      }
    }
  }

  let currentStreak = 0;
  if (user && supabase) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("current_streak")
      .eq("id", user.id)
      .maybeSingle();
    currentStreak = profile?.current_streak ?? 0;
  }

  const nextStreak = isCorrect ? currentStreak + 1 : 0;
  const score = calculateScore({
    isCorrect,
    resigned: body.resigned,
    hintsUsed: body.hintsUsed ?? session.hintsUsed,
    answerTimeSeconds: body.answerTimeSeconds ?? 0,
    currentStreak: nextStreak,
  });

  if (user && supabase) {
    await supabase.from("puzzle_attempts").insert({
      user_id: user.id,
      puzzle_id: puzzle.id,
      is_correct: isCorrect,
      used_hints: body.hintsUsed ?? session.hintsUsed,
      answer_moves: body.moves,
      answer_time: body.answerTimeSeconds ?? 0,
      score: score.total,
    });

    await supabase.from("profiles").update({ current_streak: nextStreak }).eq("id", user.id);
  }

  return NextResponse.json({ isCorrect, score, streak: nextStreak });
}
