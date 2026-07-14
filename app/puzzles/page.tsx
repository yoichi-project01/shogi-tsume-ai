import Link from "next/link";
import AdBanner from "@/components/AdBanner";
import { SAMPLE_PUZZLES } from "@/lib/shogi/puzzles";
import { createClient } from "@/lib/supabase/server";
import { LEVELS, isLevel } from "@/lib/puzzlePool";

export const metadata = { title: "問題集 | AI詰将棋トレーナー" };

interface ArchiveEntry {
  id: string;
  title: string;
  moveCount: number;
  difficulty: number;
  dateLabel: string | null;
  solved: boolean;
}

interface PuzzleWithChallenge {
  id: string;
  title: string;
  move_count: number;
  difficulty: number;
  daily_challenges: { challenge_date: string }[] | null;
}

function formatDate(dateKey: string): string {
  return new Date(dateKey).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

async function loadArchive(level: number | null): Promise<ArchiveEntry[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("puzzles")
    .select("id, title, move_count, difficulty, daily_challenges(challenge_date)")
    .eq("status", "valid")
    .order("difficulty", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(300);

  if (level !== null) query = query.eq("difficulty", level);

  const { data: puzzles, error } = await query;

  if (error || !puzzles || puzzles.length === 0) {
    throw error ?? new Error("no puzzles yet");
  }

  let solvedIds = new Set<string>();
  if (user) {
    const { data: attempts } = await supabase
      .from("puzzle_attempts")
      .select("puzzle_id")
      .eq("user_id", user.id)
      .eq("is_correct", true);
    solvedIds = new Set((attempts ?? []).map((a) => a.puzzle_id as string));
  }

  return (puzzles as unknown as PuzzleWithChallenge[]).map((p) => ({
    id: p.id,
    title: p.title,
    moveCount: p.move_count,
    difficulty: p.difficulty,
    dateLabel: p.daily_challenges?.[0] ? formatDate(p.daily_challenges[0].challenge_date) : null,
    solved: solvedIds.has(p.id),
  }));
}

interface PuzzlesPageProps {
  searchParams: Promise<{ level?: string }>;
}

export default async function PuzzlesPage({ searchParams }: PuzzlesPageProps) {
  const { level: levelParam } = await searchParams;
  const parsedLevel = levelParam ? Number(levelParam) : null;
  const level = parsedLevel !== null && isLevel(parsedLevel) ? parsedLevel : null;

  let entries: ArchiveEntry[];
  let usingFallback = false;

  try {
    entries = await loadArchive(level);
  } catch {
    usingFallback = true;
    entries = SAMPLE_PUZZLES.filter((p) => level === null || p.difficulty === level).map((p) => ({
      id: p.id,
      title: p.title,
      moveCount: p.moveCount,
      difficulty: p.difficulty,
      dateLabel: null,
      solved: false,
    }));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-bold text-neutral-900">問題集</h1>
      <p className="mt-1 text-sm text-neutral-600">
        {usingFallback ? "サンプル問題を表示しています。" : "これまでに生成された詰将棋をいつでも解けます。"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/puzzles"
          className={`rounded-full border px-4 py-1.5 text-sm font-bold ${
            level === null
              ? "border-amber-600 bg-amber-600 text-white"
              : "border-neutral-300 bg-white text-neutral-600 hover:border-amber-400"
          }`}
        >
          すべて
        </Link>
        {LEVELS.map((l) => (
          <Link
            key={l}
            href={`/puzzles?level=${l}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold ${
              level === l
                ? "border-amber-600 bg-amber-600 text-white"
                : "border-neutral-300 bg-white text-neutral-600 hover:border-amber-400"
            }`}
          >
            Lv.{l}
          </Link>
        ))}
      </div>

      <ul className="mt-6 divide-y divide-neutral-200 rounded border border-neutral-200 bg-white">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              href={`/puzzles/${entry.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
            >
              <div>
                <p className="font-bold text-neutral-900">{entry.title}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {entry.dateLabel ? `${entry.dateLabel} ・ ` : ""}
                  {entry.moveCount}手詰 ・ 難易度 Lv.{entry.difficulty}
                </p>
              </div>
              {entry.solved && (
                <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  解答済み
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <AdBanner slot="puzzles-bottom" className="mt-8" />
    </div>
  );
}
