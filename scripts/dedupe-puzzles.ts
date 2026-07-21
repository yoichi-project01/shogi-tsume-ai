/**
 * One-off migration: within a difficulty level, finds puzzles that are the
 * same underlying shape (board pieces + hand + solution, all normalized
 * relative to the gote king's square so the same shape at a different board
 * location still counts as a duplicate) and marks the extras
 * status='invalid_other' so they drop out of /puzzles. A puzzle tied to a
 * daily challenge or with any solve history is never invalidated, even if
 * it's part of a duplicate group — those stay untouched, matching the
 * dedup pass documented in CLAUDE.md for the original Lv1 cleanup. Among
 * the rest, the earliest-created copy of each shape is kept and the others
 * are invalidated.
 *
 * Usage: npm run dedupe:puzzles -- [level]   (defaults to 1)
 */
import { createClient } from "@supabase/supabase-js";
import type { Board, Hand, Move } from "../lib/shogi/types";
import { findKing } from "../lib/shogi/rules";

const LEVEL = Number(process.argv[2] ?? 1);

interface PuzzleRow {
  id: string;
  board_state: Board;
  hand_pieces: Record<"sente" | "gote", Hand>;
  solution: Move[];
  created_at: string;
}

function shapeSignature(row: PuzzleRow): string | null {
  const king = findKing(row.board_state, "gote");
  if (!king) return null;

  const boardSig = row.board_state
    .flatMap((rowSquares, r) =>
      rowSquares.map((sq, c) => (sq ? `${r - king.row},${c - king.col},${sq.owner[0]}${sq.type}` : null)),
    )
    .filter((s): s is string => s !== null)
    .sort()
    .join("|");

  const hand = row.hand_pieces.sente ?? {};
  const handSig = Object.entries(hand)
    .filter(([, n]) => (n ?? 0) > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, n]) => `${type}:${n}`)
    .join(",");

  const solutionSig = row.solution
    .map((move) =>
      move.kind === "drop"
        ? `D:${move.piece}:${move.to.row - king.row},${move.to.col - king.col}`
        : `B:${move.from.row - king.row},${move.from.col - king.col}->${move.to.row - king.row},${move.to.col - king.col}:${move.promote}`,
    )
    .join(";");

  return `${boardSig}::${handSig}::${solutionSig}`;
}

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
    .select("id, board_state, hand_pieces, solution, created_at")
    .eq("status", "valid")
    .eq("difficulty", LEVEL)
    .order("created_at", { ascending: true });

  if (error || !puzzles) {
    console.error(`puzzles の取得に失敗: ${error?.message}`);
    process.exit(1);
  }

  const { data: dailyRows, error: dailyError } = await admin.from("daily_challenges").select("puzzle_id");
  if (dailyError) {
    console.error(`daily_challenges の取得に失敗: ${dailyError.message}`);
    process.exit(1);
  }
  const dailyLinked = new Set((dailyRows ?? []).map((r) => r.puzzle_id as string));

  const { data: attemptRows, error: attemptError } = await admin.from("puzzle_attempts").select("puzzle_id");
  if (attemptError) {
    console.error(`puzzle_attempts の取得に失敗: ${attemptError.message}`);
    process.exit(1);
  }
  const attempted = new Set((attemptRows ?? []).map((r) => r.puzzle_id as string));

  const groups = new Map<string, PuzzleRow[]>();
  for (const row of puzzles as PuzzleRow[]) {
    const sig = shapeSignature(row);
    if (!sig) continue;
    const group = groups.get(sig) ?? [];
    group.push(row);
    groups.set(sig, group);
  }

  const toInvalidate: string[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const protectedRows = group.filter((r) => dailyLinked.has(r.id) || attempted.has(r.id));
    const keep = protectedRows.length > 0 ? protectedRows : [group[0]];
    const keepIds = new Set(keep.map((r) => r.id));
    for (const row of group) {
      if (!keepIds.has(row.id)) toInvalidate.push(row.id);
    }
  }

  console.log(`Lv.${LEVEL}: ${puzzles.length}件中 ${toInvalidate.length}件を重複として無効化します`);

  let updated = 0;
  let failed = 0;
  for (const id of toInvalidate) {
    const { error: updateError } = await admin.from("puzzles").update({ status: "invalid_other" }).eq("id", id);
    if (updateError) {
      console.error(`[${id}] 更新に失敗: ${updateError.message}`);
      failed++;
      continue;
    }
    updated++;
  }

  console.log(`\n無効化: ${updated}件 / 失敗: ${failed}件 / 残存: ${puzzles.length - updated}件`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
