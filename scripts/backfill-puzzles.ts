/**
 * Bulk-seeds the puzzle archive by generating and persisting daily-challenge
 * puzzles for the last N days (skipping any date that already has one, so
 * this is safe to re-run). Requires real Supabase connectivity — this is
 * also the definitive end-to-end check that the generate -> insert pipeline
 * (lib/dailyChallenge.ts) actually works against a live project, since
 * lib/shogi/generator.ts is already verified in isolation by
 * `npm run verify:engine`.
 *
 * Usage: npm run seed:puzzles -- [count]   (defaults to 30 days)
 */
import { createClient } from "@supabase/supabase-js";
import { generateDailyPuzzle } from "../lib/shogi/generator";

const DAYS = Number(process.argv[2] ?? 30);

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません。" +
        ".env.local を確認してください（このスクリプトは --env-file=.env.local 付きで実行される想定です）。",
    );
    process.exit(1);
  }

  if (!Number.isInteger(DAYS) || DAYS < 1) {
    console.error("件数は1以上の整数で指定してください（例: npm run seed:puzzles -- 30）。");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < DAYS; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().slice(0, 10);

    const { data: existing, error: existingError } = await admin
      .from("daily_challenges")
      .select("id")
      .eq("challenge_date", dateKey)
      .maybeSingle();

    if (existingError) {
      console.error(`[${dateKey}] 既存チェックに失敗: ${existingError.message}`);
      failed++;
      continue;
    }

    if (existing) {
      console.log(`[${dateKey}] 既に問題があるためスキップ`);
      skipped++;
      continue;
    }

    const generated = generateDailyPuzzle();

    const { data: puzzleRow, error: puzzleError } = await admin
      .from("puzzles")
      .insert({
        title: generated.title,
        board_state: generated.initialBoard,
        hand_pieces: generated.initialHands,
        solution: generated.solution,
        move_count: generated.moveCount,
        difficulty: generated.difficulty,
        status: "valid",
        generation_type: "algorithmic",
        explanation: generated.explanation,
      })
      .select()
      .single();

    if (puzzleError || !puzzleRow) {
      console.error(`[${dateKey}] puzzles への保存に失敗: ${puzzleError?.message}`);
      failed++;
      continue;
    }

    const { error: challengeError } = await admin
      .from("daily_challenges")
      .insert({ puzzle_id: puzzleRow.id, challenge_date: dateKey, difficulty: generated.difficulty });

    if (challengeError) {
      console.error(`[${dateKey}] daily_challenges への保存に失敗: ${challengeError.message}`);
      failed++;
      continue;
    }

    created++;
    console.log(`[${dateKey}] OK: ${generated.title}`);
  }

  console.log(`\n作成: ${created}件 / スキップ: ${skipped}件 / 失敗: ${failed}件`);
  process.exit(failed > 0 && created === 0 ? 1 : 0);
}

main();
