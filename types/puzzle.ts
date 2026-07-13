import type { Board, Hand } from "@/lib/shogi/types";

export type PuzzleStatus =
  | "unchecked"
  | "valid"
  | "invalid_no_mate"
  | "invalid_dual_solution"
  | "invalid_rule"
  | "invalid_other";

export type GenerationType = "ai" | "manual" | "algorithmic";

/** Row shape for the `puzzles` table in Supabase. */
export interface PuzzleRow {
  id: string;
  title: string;
  board_state: Board;
  hand_pieces: { sente: Hand; gote: Hand };
  solution: unknown;
  move_count: number;
  difficulty: number;
  status: PuzzleStatus;
  generation_type: GenerationType;
  explanation: string | null;
  created_at: string;
}

export interface PuzzleAttemptRow {
  id: string;
  user_id: string;
  puzzle_id: string;
  is_correct: boolean;
  used_hints: number;
  answer_moves: unknown;
  answer_time: number;
  score: number;
  attempted_at: string;
}

export interface DailyChallengeRow {
  id: string;
  puzzle_id: string;
  challenge_date: string;
  difficulty: number;
  created_at: string;
}
