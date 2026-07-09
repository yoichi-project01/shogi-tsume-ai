import { SAMPLE_PUZZLES } from "./shogi/puzzles";
import type { Puzzle } from "./shogi/types";

/**
 * Deterministically picks today's puzzle from the sample set based on the date.
 * This stands in for the `daily_challenges` table until Supabase is wired up
 * (see section 6.10 / 10.4 of the requirements doc).
 */
export function getDailyPuzzle(date: Date = new Date()): Puzzle {
  const dateKey = date.toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  }
  return SAMPLE_PUZZLES[hash % SAMPLE_PUZZLES.length];
}
