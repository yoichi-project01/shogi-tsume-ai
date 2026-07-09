"use client";

import type { Puzzle } from "@/lib/shogi/types";
import { HINT_STAGES, getHint } from "@/lib/shogi/hints";
import type { PuzzleSessionState } from "@/lib/shogi/validator";

interface HintBoxProps {
  puzzle: Puzzle;
  session: PuzzleSessionState;
  onUseHint: () => void;
}

export default function HintBox({ puzzle, session, onUseHint }: HintBoxProps) {
  const revealed = Math.min(session.hintsUsed, HINT_STAGES);

  return (
    <div className="rounded border border-amber-200 bg-amber-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-amber-800">ヒント</h3>
        <button
          type="button"
          onClick={onUseHint}
          disabled={revealed >= HINT_STAGES || session.finished}
          className="rounded bg-amber-600 px-3 py-1 text-xs font-bold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          次のヒントを見る（スコア減少）
        </button>
      </div>
      {revealed === 0 ? (
        <p className="text-sm text-neutral-500">わからないときはヒントを使いましょう。</p>
      ) : (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-700">
          {Array.from({ length: revealed }, (_, i) => (
            <li key={i}>{getHint(puzzle, session, i + 1)}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
