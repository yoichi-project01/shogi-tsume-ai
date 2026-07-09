"use client";

import { useState } from "react";
import PuzzleRunner from "@/components/PuzzleRunner";
import { SAMPLE_PUZZLES } from "@/lib/shogi/puzzles";

export default function PlayPage() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [streak, setStreak] = useState(0);
  const puzzle = SAMPLE_PUZZLES[puzzleIndex % SAMPLE_PUZZLES.length];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
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
