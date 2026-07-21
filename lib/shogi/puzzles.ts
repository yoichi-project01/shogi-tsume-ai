import type { Board, Move, Puzzle } from "./types";
import { emptyBoard } from "./rules";
import { deriveMateTitle } from "./tsumekata";
import type { PuzzleRow } from "@/types/puzzle";

function board(pieces: Array<[number, number, Board[number][number]]>): Board {
  const b = emptyBoard();
  for (const [row, col, piece] of pieces) {
    b[row][col] = piece;
  }
  return b;
}

/** Puzzle titles are named after their finishing mate shape (see deriveMateTitle), same as generated puzzles. */
function withTitle(puzzle: Omit<Puzzle, "title">): Puzzle {
  return { ...puzzle, title: deriveMateTitle(puzzle.initialBoard, puzzle.solution) };
}

export const SAMPLE_PUZZLES: Puzzle[] = [
  withTitle({
    id: "1te-001",
    moveCount: 1,
    difficulty: 1,
    initialBoard: board([
      [0, 4, { type: "OU", owner: "gote" }],
      [2, 3, { type: "GI", owner: "sente" }],
    ]),
    initialHands: { sente: { KI: 1 }, gote: {} },
    solution: [{ kind: "drop", piece: "KI", to: { row: 1, col: 4 }, color: "sente" }],
    explanation:
      "五二の地点に金を打つと、玉の逃げ場である四一・六一・四二・六二をすべて金がにらんでおり、金自体は銀に守られているため取ることもできません。これが「頭金」と呼ばれる基本的な1手詰の形です。",
  }),
  withTitle({
    id: "1te-002",
    moveCount: 1,
    difficulty: 1,
    initialBoard: board([
      [0, 0, { type: "OU", owner: "gote" }],
      [2, 1, { type: "GI", owner: "sente" }],
    ]),
    initialHands: { sente: { KI: 1 }, gote: {} },
    solution: [{ kind: "drop", piece: "KI", to: { row: 1, col: 0 }, color: "sente" }],
    explanation:
      "端に追い詰められた玉に金を打つ問題です。玉の逃げ場は二つしかなく、どちらも金の利きに入っています。金は銀に守られているため取られません。",
  }),
  withTitle({
    id: "3te-001",
    moveCount: 3,
    difficulty: 3,
    initialBoard: board([
      [0, 8, { type: "OU", owner: "gote" }],
      [2, 7, { type: "HI", owner: "sente" }],
    ]),
    initialHands: { sente: { GI: 1 }, gote: {} },
    solution: [
      { kind: "drop", piece: "GI", to: { row: 1, col: 7 }, color: "sente" },
      { kind: "board", from: { row: 0, col: 8 }, to: { row: 1, col: 8 }, promote: false, color: "gote" },
      { kind: "board", from: { row: 2, col: 7 }, to: { row: 2, col: 8 }, promote: true, color: "sente" },
    ],
    explanation:
      "まず二二に銀を打って王手をかけます。この銀は二三の飛に守られているため取れず、玉は一二へ逃げるしかありません。玉が一二に来たところで、二三の飛を一三へ成って龍にします。龍は玉のいる一二のマスをにらんでおり、玉の逃げ場となる一一・二二・二三はすべて銀か龍の利きでふさがれているため、これで詰みです。",
  }),
];

export function getPuzzleById(id: string): Puzzle | undefined {
  return SAMPLE_PUZZLES.find((p) => p.id === id);
}

/** Maps a Supabase `puzzles` row onto the shape the rule engine/UI work with. */
export function puzzleFromRow(row: PuzzleRow): Puzzle {
  return {
    id: row.id,
    title: row.title,
    moveCount: row.move_count as Puzzle["moveCount"],
    difficulty: row.difficulty,
    initialBoard: row.board_state,
    initialHands: row.hand_pieces,
    solution: row.solution as Move[],
    explanation: row.explanation ?? "",
  };
}
