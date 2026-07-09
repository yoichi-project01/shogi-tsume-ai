"use client";

import { useState } from "react";
import AdBanner from "@/components/AdBanner";
import type { RankingEntry } from "@/types/ranking";

const TABS = [
  { key: "daily", label: "デイリー" },
  { key: "weekly", label: "週間" },
  { key: "total", label: "累計" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Placeholder data shown until the `rankings` table is populated via Supabase.
const SAMPLE_RANKING: RankingEntry[] = [
  { rank: 1, userId: "1", username: "しょうぎ太郎", score: 980, correctCount: 12, accuracy: 100, answerTime: 8.2, hintsUsed: 0, currentStreak: 12 },
  { rank: 2, userId: "2", username: "つめキング", score: 860, correctCount: 11, accuracy: 92, answerTime: 11.5, hintsUsed: 1, currentStreak: 7 },
  { rank: 3, userId: "3", username: "初心者A", score: 540, correctCount: 8, accuracy: 80, answerTime: 20.1, hintsUsed: 3, currentStreak: 2 },
];

export default function RankingPage() {
  const [tab, setTab] = useState<TabKey>("daily");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-bold text-neutral-900">ランキング</h1>

      <div className="mt-4 flex gap-2 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-bold ${
              tab === t.key ? "border-b-2 border-amber-600 text-amber-700" : "text-neutral-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-3 py-2">順位</th>
              <th className="px-3 py-2">ユーザー名</th>
              <th className="px-3 py-2">スコア</th>
              <th className="px-3 py-2">正答数</th>
              <th className="px-3 py-2">正答率</th>
              <th className="px-3 py-2">解答時間</th>
              <th className="px-3 py-2">ヒント</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_RANKING.map((entry) => (
              <tr key={entry.userId} className="border-t border-neutral-100">
                <td className="px-3 py-2 font-bold">{entry.rank}</td>
                <td className="px-3 py-2">{entry.username}</td>
                <td className="px-3 py-2 font-bold text-amber-700">{entry.score}</td>
                <td className="px-3 py-2">{entry.correctCount}</td>
                <td className="px-3 py-2">{entry.accuracy}%</td>
                <td className="px-3 py-2">{entry.answerTime}秒</td>
                <td className="px-3 py-2">{entry.hintsUsed}回</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-neutral-400">
        ※ 現在はサンプルデータを表示しています。Supabase接続後、実際の解答記録に基づくランキングに切り替わります。
      </p>

      <AdBanner slot="ranking-bottom" className="mt-8" />
    </div>
  );
}
