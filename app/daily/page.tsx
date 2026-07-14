import DailyPuzzleRunner from "@/components/DailyPuzzleRunner";
import { getTodayChallenge } from "@/lib/dailyChallenge";

export const metadata = { title: "デイリーチャレンジ | AI詰将棋トレーナー" };

export default async function DailyPage() {
  const { puzzle, attempted, result } = await getTodayChallenge();
  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-neutral-900">デイリーチャレンジ（{today}）</h1>
        {attempted && result && (
          <p className="mt-1 text-sm text-amber-700">
            本日のデイリーチャレンジは解答済みです（スコア: {result.score}点）。練習として何度でも挑戦できます。
          </p>
        )}
      </div>
      <DailyPuzzleRunner puzzle={puzzle} />
    </div>
  );
}
