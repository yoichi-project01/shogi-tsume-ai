import { createServiceRoleClient } from "./supabase/server";
import { generatePuzzleForLevel, type GeneratedPuzzle } from "./shogi/generator";

export const LEVELS = [1, 3, 5] as const;
export type Level = (typeof LEVELS)[number];

export function isLevel(value: number): value is Level {
  return (LEVELS as readonly number[]).includes(value);
}

/** Inserts one generated puzzle into the general (non-date-linked) pool. Returns the new row's id, or null on failure. */
export async function insertPoolPuzzle(
  admin: ReturnType<typeof createServiceRoleClient>,
  generated: GeneratedPuzzle,
): Promise<string | null> {
  const { data, error } = await admin
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
    .select("id")
    .single();

  if (error || !data) return null;
  return data.id as string;
}

// 5-move generation can take several seconds per attempt under the correct
// (stricter) cook-detection in lib/shogi/generator.ts, and this whole batch
// runs unattended in the background (see ensurePoolStocked's doc comment) —
// keep the batch small enough that even a run of bad luck stays well within
// a serverless function's execution budget. Level 5 gets a smaller batch
// since each attempt there is the most expensive by a wide margin.
function refillBatchSize(difficulty: Level): number {
  return difficulty === 5 ? 3 : 5;
}

/**
 * If `userId` has correctly solved every currently-available valid puzzle at
 * `difficulty`, generates and persists REFILL_BATCH_SIZE more so there's
 * always something left in the pool. Best-effort by design: any failure
 * here (network issue, generation exhausting its search budget, etc.) must
 * never surface to the caller — see app/api/attempts/route.ts, which runs
 * this via next/server's `after()` so it also can't add response latency.
 */
export async function ensurePoolStocked(difficulty: number, userId: string): Promise<void> {
  if (!isLevel(difficulty)) return;

  try {
    const admin = createServiceRoleClient();

    const { count: totalCount } = await admin
      .from("puzzles")
      .select("id", { count: "exact", head: true })
      .eq("status", "valid")
      .eq("difficulty", difficulty);

    if (!totalCount) return;

    const { data: solvedRows } = await admin
      .from("puzzle_attempts")
      .select("puzzle_id, puzzles!inner(difficulty)")
      .eq("user_id", userId)
      .eq("is_correct", true)
      .eq("puzzles.difficulty", difficulty);

    const solvedCount = new Set((solvedRows ?? []).map((row) => row.puzzle_id as string)).size;
    if (solvedCount < totalCount) return;

    for (let i = 0; i < refillBatchSize(difficulty); i++) {
      const generated = generatePuzzleForLevel(difficulty);
      if (!generated) continue;
      await insertPoolPuzzle(admin, generated);
    }
  } catch {
    // Best-effort background job — Supabase misconfiguration or a transient
    // network error here must never propagate (this runs unattended inside
    // next/server's after(), after the response has already been sent).
  }
}
