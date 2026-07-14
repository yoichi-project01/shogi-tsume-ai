/**
 * Bulk-generates general practice-pool puzzles for every difficulty level
 * (1/3/5 手詰), independent of any calendar date (unlike
 * scripts/backfill-puzzles.ts, which links each puzzle to a specific day).
 * These show up in /puzzles alongside the daily-challenge archive.
 *
 * Usage: npm run seed:levels -- [countPerLevel]   (defaults to 30)
 */
import { createClient } from "@supabase/supabase-js";
import { generatePuzzleForLevel } from "../lib/shogi/generator";
import { LEVELS } from "../lib/puzzlePool";

const COUNT_PER_LEVEL = Number(process.argv[2] ?? 30);

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

  if (!Number.isInteger(COUNT_PER_LEVEL) || COUNT_PER_LEVEL < 1) {
    console.error("件数は1以上の整数で指定してください（例: npm run seed:levels -- 30）。");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  let totalCreated = 0;
  let totalFailed = 0;

  for (const level of LEVELS) {
    let created = 0;
    let failed = 0;

    for (let i = 0; i < COUNT_PER_LEVEL; i++) {
      const generated = generatePuzzleForLevel(level);
      if (!generated) {
        failed++;
        continue;
      }

      const { error } = await admin.from("puzzles").insert({
        title: generated.title,
        board_state: generated.initialBoard,
        hand_pieces: generated.initialHands,
        solution: generated.solution,
        move_count: generated.moveCount,
        difficulty: generated.difficulty,
        status: "valid",
        generation_type: "algorithmic",
        explanation: generated.explanation,
      });

      if (error) {
        console.error(`[Lv.${level}] 保存に失敗: ${error.message}`);
        failed++;
        continue;
      }
      created++;
    }

    console.log(`Lv.${level}: 作成 ${created}件 / 失敗 ${failed}件`);
    totalCreated += created;
    totalFailed += failed;
  }

  console.log(`\n合計: 作成 ${totalCreated}件 / 失敗 ${totalFailed}件`);
  process.exit(totalFailed > 0 && totalCreated === 0 ? 1 : 0);
}

main();
