"use client";

import { useMemo, useState } from "react";
import PuzzleRunner from "@/components/PuzzleRunner";
import { SAMPLE_PUZZLES } from "@/lib/shogi/puzzles";

const DIFFICULTIES = Array.from(new Set(SAMPLE_PUZZLES.map((p) => p.difficulty))).sort((a, b) => a - b);

export default function PlayPage() {
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0]);
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [streak, setStreak] = useState(0);

  const puzzlesForDifficulty = useMemo(
    () => SAMPLE_PUZZLES.filter((p) => p.difficulty === difficulty),
    [difficulty],
  );
  const puzzle = puzzlesForDifficulty[puzzleIndex % puzzlesForDifficulty.length];

  function selectDifficulty(level: number) {
    if (level === difficulty) return;
    setDifficulty(level);
    setPuzzleIndex(0);
    setAttempt((a) => a + 1);
    setStreak(0);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-neutral-600">難易度を選ぶ:</span>
        {DIFFICULTIES.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => selectDifficulty(level)}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold ${
              difficulty === level
                ? "border-amber-600 bg-amber-600 text-white"
                : "border-neutral-300 bg-white text-neutral-600 hover:border-amber-400"
            }`}
          >
            Lv.{level}
          </button>
        ))}
      </div>

      <PuzzleRunner
        key={`${puzzle.id}-${attempt}`}
        puzzle={puzzle}
        streak={streak}
        adSlot="play-bottom"
        onSolved={() => setStreak((s) => s + 1)}
        onResigned={() => setStreak(0)}
        onNext={() => {
          setPuzzleIndex((i) => i + 1);
          setAttempt((a) => a + 1);
        }}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    </div>
  );
}
