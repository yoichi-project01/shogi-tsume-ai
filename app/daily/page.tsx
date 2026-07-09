"use client";

import { useState } from "react";
import PuzzleRunner from "@/components/PuzzleRunner";
import { getDailyPuzzle } from "@/lib/dailyPuzzle";

export default function DailyPage() {
  const puzzle = getDailyPuzzle();
  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  const [attempt, setAttempt] = useState(0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-neutral-900">デイリーチャレンジ（{today}）</h1>
      </div>
      <PuzzleRunner
        key={`${puzzle.id}-${attempt}`}
        puzzle={puzzle}
        streak={0}
        showStreak={false}
        adSlot="daily-bottom"
        onSolved={() => {}}
        onResigned={() => {}}
        onNext={() => setAttempt((a) => a + 1)}
        onRetry={() => setAttempt((a) => a + 1)}
      />
    </div>
  );
}
