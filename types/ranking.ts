export type RankingType =
  | "daily"
  | "weekly"
  | "monthly"
  | "total"
  | "streak"
  | "no_hint"
  | "speed";

export interface RankingRow {
  id: string;
  user_id: string;
  ranking_type: RankingType;
  score: number;
  rank_date: string;
  created_at: string;
}

export interface RankingEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  correctCount: number;
  accuracy: number;
  answerTime: number | null;
  hintsUsed: number;
  currentStreak: number;
}
