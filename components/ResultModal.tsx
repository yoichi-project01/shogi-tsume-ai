"use client";

import Link from "next/link";
import type { Puzzle } from "@/lib/shogi/types";
import type { ScoreBreakdown } from "@/lib/score";
import AdBanner from "./AdBanner";

interface ResultModalProps {
  puzzle: Puzzle;
  success: boolean;
  score: ScoreBreakdown;
  answerTimeSeconds: number;
  hintsUsed: number;
  nextLabel?: string;
  onNext: () => void;
  onRetry: () => void;
}

export default function ResultModal({
  puzzle,
  success,
  score,
  answerTimeSeconds,
  hintsUsed,
  nextLabel = "次の問題へ",
  onNext,
  onRetry,
}: ResultModalProps) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <h2 className={`text-xl font-bold ${success ? "text-green-700" : "text-red-700"}`}>
          {success ? "正解！" : "不正解"}
        </h2>

        {success ? (
          <>
            <dl className="mt-4 space-y-1 text-sm text-neutral-700">
              <div className="flex justify-between">
                <dt>解答時間</dt>
                <dd>{answerTimeSeconds.toFixed(1)}秒</dd>
              </div>
              <div className="flex justify-between">
                <dt>ヒント使用回数</dt>
                <dd>{hintsUsed}回</dd>
              </div>
              <div className="flex justify-between font-bold">
                <dt>獲得スコア</dt>
                <dd>{score.total}点</dd>
              </div>
            </dl>

            <div className="mt-4 rounded bg-neutral-50 p-3 text-sm">
              <h3 className="mb-1 font-bold text-neutral-800">AI解説</h3>
              <p className="text-neutral-600">{puzzle.explanation}</p>
            </div>

            <AdBanner slot="result" className="mt-4" />

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onNext}
                className="flex-1 rounded bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700"
              >
                {nextLabel}
              </button>
              <Link
                href="/mypage"
                className="flex-1 rounded border border-neutral-300 px-4 py-2 text-center font-bold text-neutral-700 hover:bg-neutral-50"
              >
                マイページへ
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm text-neutral-600">
              その手では詰みません。もう一度、玉の逃げ場をふさぐ手を探してみましょう。
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="flex-1 rounded bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700"
              >
                もう一度挑戦する
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
