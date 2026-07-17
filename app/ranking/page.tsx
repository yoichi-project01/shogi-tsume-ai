"use client";

import { useEffect, useState } from "react";
import AdBanner from "@/components/AdBanner";
import type { RankingEntry } from "@/types/ranking";

const TABS = [
  { key: "daily", label: "デイリー" },
  { key: "weekly", label: "週間" },
  { key: "total", label: "累計" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface RankingResponse {
  entries: RankingEntry[];
  myRank: number | null;
  note?: string;
}

export default function RankingPage() {
  const [tab, setTab] = useState<TabKey>("daily");
  const [data, setData] = useState<RankingResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/ranking?type=${tab}`)
      .then((res) => res.json())
      .then((json: RankingResponse) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData({ entries: [], myRank: null, note: "ranking data not available yet" });
      });

    return () => {
      cancelled = true;
    };
  }, [tab]);

  const loading = data === null;
  const entries = data?.entries ?? [];

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
            {entries.map((entry) => (
              <tr key={entry.userId} className="border-t border-neutral-100">
                <td className="px-3 py-2 font-bold">{entry.rank}</td>
                <td className="px-3 py-2">{entry.username}</td>
                <td className="px-3 py-2 font-bold text-amber-700">{entry.score}</td>
                <td className="px-3 py-2">{entry.correctCount}</td>
                <td className="px-3 py-2">{entry.accuracy}%</td>
                <td className="px-3 py-2">{entry.answerTime != null ? `${entry.answerTime}秒` : "-"}</td>
                <td className="px-3 py-2">{entry.hintsUsed}回</td>
              </tr>
            ))}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-neutral-400">
                  まだこの期間の解答記録がありません。
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-neutral-400">
                  読み込み中…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data?.myRank != null && (
        <p className="mt-2 text-sm text-neutral-600">
          あなたの順位: <span className="font-bold text-amber-700">{data.myRank}位</span>
        </p>
      )}

      <AdBanner slot="ranking-bottom" className="mt-8" />
    </div>
  );
}
