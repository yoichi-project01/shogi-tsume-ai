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

  return (
    <PuzzleRunner
      key={`${puzzle.id}-${attempt}`}
      puzzle={puzzle}
      streak={0}
      showStreak={false}
      adSlot="puzzles-detail-bottom"
      nextLabel="問題集に戻る"
      onSolved={() => {}}
      onResigned={() => {}}
      onNext={() => router.push("/puzzles")}
      onRetry={() => setAttempt((a) => a + 1)}
    />
  );
}
