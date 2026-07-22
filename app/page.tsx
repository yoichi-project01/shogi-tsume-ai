import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import { getTodayChallenge } from "@/lib/dailyChallenge";
import { isLoggedIn } from "@/lib/supabase/server";

export default async function Home() {
  const today = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  const { puzzle: dailyPuzzle } = await getTodayChallenge();
  const loggedIn = await isLoggedIn();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <section className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">AI詰将棋トレーナー</h1>
        <p className="mt-4 text-neutral-600">
          毎日出題される詰将棋を解いて、1手詰から段階的に将棋力を伸ばそう。
          <br />
          正答率や解答時間に応じて、次に出題される問題の難易度が自動で調整されます。
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {loggedIn ? (
            <Link
              href="/puzzles"
              className="rounded bg-amber-600 px-6 py-3 font-bold text-white hover:bg-amber-700"
            >
              問題集に挑戦する
            </Link>
          ) : (
            <>
              <Link
                href="/play"
                className="rounded bg-amber-600 px-6 py-3 font-bold text-white hover:bg-amber-700"
              >
                今すぐゲストプレイ
              </Link>
              <Link
                href="/signup"
                className="rounded border border-amber-600 px-6 py-3 font-bold text-amber-700 hover:bg-amber-50"
              >
                新規登録
              </Link>
              <Link
                href="/login"
                className="rounded border border-neutral-300 px-6 py-3 font-bold text-neutral-700 hover:bg-neutral-50"
              >
                ログイン
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mt-12 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-bold text-neutral-900">今日のデイリーチャレンジ（{today}）</h2>
        <p className="mt-2 text-sm text-neutral-600">
          「{dailyPuzzle.title}」（{dailyPuzzle.moveCount}手詰・難易度 Lv.{dailyPuzzle.difficulty}）
        </p>
        <Link href="/daily" className="mt-3 inline-block text-sm font-bold text-amber-700 hover:underline">
          デイリーチャレンジに挑戦する →
        </Link>
      </section>

      <section className="mt-8 flex justify-between text-sm">
        <Link href="/ranking" className="font-bold text-amber-700 hover:underline">
          ランキングを見る →
        </Link>
      </section>

      <AdBanner slot="top-bottom" className="mt-10" />
    </div>
  );
}
