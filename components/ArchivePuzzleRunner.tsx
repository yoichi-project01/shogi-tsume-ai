"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PuzzleRunner from "@/components/PuzzleRunner";
import type { Puzzle } from "@/lib/shogi/types";

interface ArchivePuzzleRunnerProps {
  puzzle: Puzzle;
}

export default function ArchivePuzzleRunner({ puzzle }: ArchivePuzzleRunnerProps) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [movingOn, setMovingOn] = useState(false);

  async function handleNext() {
    if (movingOn) return;
    setMovingOn(true);
    try {
      const res = await fetch(`/api/puzzles/next?difficulty=${puzzle.difficulty}`);
      const data = await res.json();
      if (data?.puzzle?.id && data.puzzle.id !== puzzle.id) {
        router.push(`/puzzles/${data.puzzle.id}`);
        return;
      }
    } catch {
      // Fall through to the puzzle list below.
    }
    router.push("/puzzles");
    setMovingOn(false);
  }

  return (
    <PuzzleRunner
      key={`${puzzle.id}-${attempt}`}
      puzzle={puzzle}
      streak={0}
      showStreak={false}
      adSlot="puzzles-detail-bottom"
      nextLabel={movingOn ? "読み込み中..." : "次の問題へ"}
      onSolved={() => {}}
      onResigned={() => {}}
      onNext={handleNext}
      onRetry={() => setAttempt((a) => a + 1)}
    />
  );
}
