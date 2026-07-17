import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { RankingEntry, RankingType } from "@/types/ranking";

const VALID_TYPES: RankingType[] = ["daily", "weekly", "monthly", "total", "streak", "no_hint", "speed"];

interface AttemptRow {
  user_id: string;
  is_correct: boolean;
  used_hints: number;
  answer_time: number;
  score: number;
  profiles: { username: string; current_streak: number } | { username: string; current_streak: number }[] | null;
}

interface UserAgg {
  username: string;
  currentStreak: number;
  score: number;
  correct: number;
  total: number;
  hintSum: number;
  timeSum: number;
  timeCount: number;
}

/** Start of the aggregation window for period-based ranking types (UTC, matching the rest of the app's date-key convention). */
function periodStart(type: RankingType): string | null {
  if (type === "daily") {
    return `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
  }
  if (type === "weekly") {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 7);
    return d.toISOString();
  }
  if (type === "monthly") {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - 1);
    return d.toISOString();
  }
  return null;
}

function profileOf(row: AttemptRow) {
  const p = row.profiles;
  if (!p) return { username: "名無しさん", current_streak: 0 };
  return Array.isArray(p) ? (p[0] ?? { username: "名無しさん", current_streak: 0 }) : p;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get("type") ?? "total") as RankingType;

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "invalid ranking type" }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Ranking spans every user's attempts, so it must bypass the
    // "users can only view their own attempts" RLS policy via the
    // service-role client (never exposed to the browser).
    const admin = createServiceRoleClient();

    let entries: RankingEntry[];

    if (type === "streak") {
      const { data, error } = await admin
        .from("profiles")
        .select("id, username, current_streak")
        .order("current_streak", { ascending: false })
        .limit(100);
      if (error) throw error;

      entries = (data ?? [])
        .filter((p) => p.current_streak > 0)
        .map((p, index) => ({
          rank: index + 1,
          userId: p.id,
          username: p.username,
          score: p.current_streak,
          correctCount: 0,
          accuracy: 0,
          answerTime: null,
          hintsUsed: 0,
          currentStreak: p.current_streak,
        }));
    } else {
      let query = admin
        .from("puzzle_attempts")
        .select("user_id, is_correct, used_hints, answer_time, score, attempted_at, profiles(username, current_streak)");

      const since = periodStart(type);
      if (since) query = query.gte("attempted_at", since);
      if (type === "no_hint") query = query.eq("is_correct", true).eq("used_hints", 0);

      const { data, error } = await query.limit(5000);
      if (error) throw error;

      const byUser = new Map<string, UserAgg>();
      for (const row of (data ?? []) as AttemptRow[]) {
        const profile = profileOf(row);
        const agg = byUser.get(row.user_id) ?? {
          username: profile.username,
          currentStreak: profile.current_streak,
          score: 0,
          correct: 0,
          total: 0,
          hintSum: 0,
          timeSum: 0,
          timeCount: 0,
        };
        agg.total += 1;
        agg.hintSum += row.used_hints ?? 0;
        if (row.is_correct) {
          agg.correct += 1;
          agg.score += row.score ?? 0;
          agg.timeSum += row.answer_time ?? 0;
          agg.timeCount += 1;
        }
        byUser.set(row.user_id, agg);
      }

      let rows = Array.from(byUser.entries())
        .map(([userId, agg]) => ({
          userId,
          username: agg.username,
          score: agg.score,
          correctCount: agg.correct,
          accuracy: agg.total > 0 ? Math.round((agg.correct / agg.total) * 100) : 0,
          answerTime: agg.timeCount > 0 ? Number((agg.timeSum / agg.timeCount).toFixed(1)) : null,
          hintsUsed: agg.hintSum,
          currentStreak: agg.currentStreak,
          avgTime: agg.timeCount > 0 ? agg.timeSum / agg.timeCount : Infinity,
        }))
        .filter((r) => r.correctCount > 0);

      rows =
        type === "speed"
          ? rows.sort((a, b) => a.avgTime - b.avgTime)
          : rows.sort((a, b) => b.score - a.score);

      entries = rows.slice(0, 100).map((r, index) => ({
        rank: index + 1,
        userId: r.userId,
        username: r.username,
        score: r.score,
        correctCount: r.correctCount,
        accuracy: r.accuracy,
        answerTime: r.answerTime,
        hintsUsed: r.hintsUsed,
        currentStreak: r.currentStreak,
      }));
    }

    const myRank = user ? entries.find((e) => e.userId === user.id)?.rank ?? null : null;

    return NextResponse.json({ entries, myRank });
  } catch {
    return NextResponse.json({ entries: [], myRank: null, note: "ranking data not available yet" });
  }
}
