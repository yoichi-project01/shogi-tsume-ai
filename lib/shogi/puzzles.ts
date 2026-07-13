import type { Board, Puzzle } from "./types";
import { emptyBoard } from "./rules";

function board(pieces: Array<[number, number, Board[number][number]]>): Board {
  const b = emptyBoard();
  for (const [row, col, piece] of pieces) {
    b[row][col] = piece;
  }
  return b;
}

export const SAMPLE_PUZZLES: Puzzle[] = [
  {
    id: "1te-001",
    title: "1手詰 その1（頭金）",
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
  },
  {
    id: "1te-002",
    title: "1手詰 その2（隅の頭金）",
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
  },
  {
    id: "3te-001",
    title: "3手詰 その1（捨て金からの寄せ）",
    moveCount: 3,
    difficulty: 3,
    initialBoard: board([
      [0, 0, { type: "OU", owner: "gote" }],
      [2, 0, { type: "GI", owner: "sente" }],
    ]),
    initialHands: { sente: { KI: 2 }, gote: {} },
    solution: [
      { kind: "drop", piece: "KI", to: { row: 0, col: 1 }, color: "sente" },
      { kind: "board", from: { row: 0, col: 0 }, to: { row: 0, col: 1 }, promote: false, color: "gote" },
      { kind: "drop", piece: "KI", to: { row: 1, col: 1 }, color: "sente" },
    ],
    explanation:
      "まず八一に金を捨てるように打って王手をかけます。この金はどこにも守られていませんが、玉が他へ逃げることは九三の銀の利きでふさがれているため、玉はこの金を取るしかありません。玉が八一に来たところで、二枚目の金を八二に打ちます。この金は九三の銀に守られていて取れず、玉の逃げ場もすべて金の利きでふさがれているため、これで詰みです。",
  },
];

export function getPuzzleById(id: string): Puzzle | undefined {
  return SAMPLE_PUZZLES.find((p) => p.id === id);
}
