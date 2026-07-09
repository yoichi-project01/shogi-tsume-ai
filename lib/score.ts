export interface ScoreInput {
  isCorrect: boolean;
  resigned?: boolean;
  hintsUsed: number;
  answerTimeSeconds: number;
  currentStreak: number;
  /** Answers at or under this time earn the speed bonus. Defaults to 30s. */
  fastThresholdSeconds?: number;
}

export interface ScoreBreakdown {
  base: number;
  noHintBonus: number;
  fastBonus: number;
  streakBonus: number;
  hintPenalty: number;
  total: number;
}

const BASE_CORRECT = 100;
const NO_HINT_BONUS = 50;
const FAST_BONUS = 30;
const STREAK_BONUS_PER = 10;
const STREAK_BONUS_CAP = 100;
const HINT_PENALTY_PER_USE = 10;

export function calculateScore(input: ScoreInput): ScoreBreakdown {
  if (input.resigned || !input.isCorrect) {
    return { base: 0, noHintBonus: 0, fastBonus: 0, streakBonus: 0, hintPenalty: 0, total: 0 };
  }

  const fastThreshold = input.fastThresholdSeconds ?? 30;
  const base = BASE_CORRECT;
  const noHintBonus = input.hintsUsed === 0 ? NO_HINT_BONUS : 0;
  const fastBonus = input.answerTimeSeconds <= fastThreshold ? FAST_BONUS : 0;
  const streakBonus = Math.min(input.currentStreak * STREAK_BONUS_PER, STREAK_BONUS_CAP);
  const hintPenalty = input.hintsUsed * HINT_PENALTY_PER_USE;

  const total = Math.max(0, base + noHintBonus + fastBonus + streakBonus - hintPenalty);

  return { base, noHintBonus, fastBonus, streakBonus, hintPenalty, total };
}
