"use client";

import Board from "@/components/Board";
import HintBox from "@/components/HintBox";
import ResultModal from "@/components/ResultModal";
import AdBanner from "@/components/AdBanner";
import { usePuzzleSession } from "@/hooks/usePuzzleSession";
import { calculateScore } from "@/lib/score";
import type { Puzzle } from "@/lib/shogi/types";

interface PuzzleRunnerProps {
  puzzle: Puzzle;
  streak: number;
  adSlot: string;
  showStreak?: boolean;
  onSolved: () => void;
  onResigned: () => void;
  onNext: () => void;
  onRetry: () => void;
}

export default function PuzzleRunner({
  puzzle,
  streak,
  adSlot,
  showStreak = true,
  onSolved,
  onResigned,
  onNext,
  onRetry,
}: PuzzleRunnerProps) {
  const { session, message, answerTimeSeconds, resigned, showResult, handleMove, handleUseHint, handleResign } =
    usePuzzleSession(puzzle, { onSolved, onResigned });

  const success = session.success && !resigned;
  const finalScore = calculateScore({
    isCorrect: success,
    hintsUsed: session.hintsUsed,
    answerTimeSeconds,
    currentStreak: success ? streak : 0,
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{puzzle.title}</h1>
          <p className="text-sm text-neutral-500">
            {puzzle.moveCount}手詰 ・ 難易度 Lv.{puzzle.difficulty}
          </p>
        </div>
        <div className="flex gap-4 text-sm text-neutral-600">
          <span>解答時間: {answerTimeSeconds.toFixed(1)}秒</span>
          {showStreak && <span>連続正解: {streak}</span>}
        </div>
      </div>

      {message && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </div>
      )}

      <Board state={session.state} onMove={handleMove} disabled={showResult} />

      <div className="mt-4 flex items-center justify-between gap-2">
        <HintBox puzzle={puzzle} session={session} onUseHint={handleUseHint} />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleResign}
          disabled={showResult}
          className="rounded border border-neutral-300 px-4 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
        >
          投了する
        </button>
      </div>

      <AdBanner slot={adSlot} className="mt-8" />

      {showResult && (
        <ResultModal
          puzzle={puzzle}
          success={success}
          score={finalScore}
          answerTimeSeconds={answerTimeSeconds}
          hintsUsed={session.hintsUsed}
          onNext={onNext}
          onRetry={onRetry}
        />
      )}
    </div>
  );
}
