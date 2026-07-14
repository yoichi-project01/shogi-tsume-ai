"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PuzzleRunner from "@/components/PuzzleRunner";
import type { Puzzle } from "@/lib/shogi/types";

interface DailyPuzzleRunnerProps {
  puzzle: Puzzle;
}

export default function DailyPuzzleRunner({ puzzle }: DailyPuzzleRunnerProps) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  return (
    <PuzzleRunner
      key={`${puzzle.id}-${attempt}`}
      puzzle={puzzle}
      streak={0}
      showStreak={false}
      adSlot="daily-bottom"
      nextLabel="問題集を見る"
      onSolved={() => {}}
      onResigned={() => {}}
      onNext={() => router.push("/puzzles")}
      onRetry={() => setAttempt((a) => a + 1)}
    />
  );
}
