/**
 * One-off migration: renames every existing `puzzles` row to its
 * finishing-mate-shape title (see lib/shogi/tsumekata.ts), replacing the old
 * generic "N手詰（自動生成）" / hand-written titles. Recomputes from each
 * row's stored board_state + solution, so it's safe to re-run (idempotent —
 * rows already matching the derived title are skipped).
 *
 * Usage: npm run retitle:puzzles
 */
import { createClient } from "@supabase/supabase-js";
import { deriveMateTitle } from "../lib/shogi/tsumekata";
import type { Board, Move } from "../lib/shogi/types";

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

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const { data: puzzles, error } = await admin
    .from("puzzles")
    .select("id, title, board_state, solution");

  if (error || !puzzles) {
    console.error(`puzzles の取得に失敗: ${error?.message}`);
    process.exit(1);
  }

  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  for (const row of puzzles) {
    let newTitle: string;
    try {
      newTitle = deriveMateTitle(row.board_state as Board, row.solution as Move[]);
    } catch (e) {
      console.error(`[${row.id}] タイトル算出に失敗: ${(e as Error).message}`);
      failed++;
      continue;
    }

    if (newTitle === row.title) {
      unchanged++;
      continue;
    }

    const { error: updateError } = await admin.from("puzzles").update({ title: newTitle }).eq("id", row.id);
    if (updateError) {
      console.error(`[${row.id}] 更新に失敗: ${updateError.message}`);
      failed++;
      continue;
    }

    console.log(`[${row.id}] "${row.title}" -> "${newTitle}"`);
    updated++;
  }

  console.log(`\n更新: ${updated}件 / 変更なし: ${unchanged}件 / 失敗: ${failed}件`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
