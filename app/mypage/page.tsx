import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function MyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-neutral-900">マイページ</h1>
        <p className="mt-3 text-sm text-neutral-600">
          マイページを見るにはログインが必要です。
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700"
        >
          ログインする
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const { data: attempts } = await supabase
    .from("puzzle_attempts")
    .select("is_correct, used_hints, answer_time")
    .eq("user_id", user.id);

  const totalAttempts = attempts?.length ?? 0;
  const correctAttempts = attempts?.filter((a) => a.is_correct).length ?? 0;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
  const avgTime =
    totalAttempts > 0
      ? (attempts!.reduce((sum, a) => sum + (a.answer_time ?? 0), 0) / totalAttempts).toFixed(1)
      : "-";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-bold text-neutral-900">
        {profile?.username ?? "ユーザー"} さんのマイページ
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="現在レベル" value={profile?.level ?? 1} />
        <Stat label="経験値" value={profile?.experience ?? 0} />
        <Stat label="累計解答数" value={totalAttempts} />
        <Stat label="累計正解数" value={correctAttempts} />
        <Stat label="正答率" value={`${accuracy}%`} />
        <Stat label="平均解答時間" value={avgTime === "-" ? "-" : `${avgTime}秒`} />
        <Stat label="現在の連続正解" value={profile?.current_streak ?? 0} />
        <Stat label="最大連続正解" value={profile?.max_streak ?? 0} />
      </div>

      <div className="mt-8">
        <Link href="/puzzles" className="rounded bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700">
          問題集に挑戦する
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-neutral-200 bg-white p-4 text-center">
      <div className="text-2xl font-bold text-amber-700">{value}</div>
      <div className="mt-1 text-xs text-neutral-500">{label}</div>
    </div>
  );
}
