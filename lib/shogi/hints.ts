import type { Puzzle } from "./types";
import { PIECE_KANJI } from "./rules";
import type { PuzzleSessionState } from "./validator";

export const FILE_LABELS = ["九", "八", "七", "六", "五", "四", "三", "二", "一"];
export const RANK_LABELS = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];

export function squareLabel(row: number, col: number): string {
  return `${FILE_LABELS[col]}${RANK_LABELS[row]}`;
}

export const HINT_STAGES = 4;

/** Returns hint text for stages 1-4. Stage 4 reveals the exact next move. */
export function getHint(puzzle: Puzzle, session: PuzzleSessionState, stage: number): string {
  const nextMove = puzzle.solution[session.moveIndex];
  if (!nextMove) return "この問題はすでに解けています。";

  switch (stage) {
    case 1:
      return "王手を続けて、玉方の逃げ場をなくす手を探しましょう。持ち駒や盤上の駒の利きに注目してください。";
    case 2: {
      if (nextMove.kind === "drop") {
        return `注目すべきマス: ${squareLabel(nextMove.to.row, nextMove.to.col)} 付近です。`;
      }
      return `注目すべき駒: ${squareLabel(nextMove.from.row, nextMove.from.col)} にある駒です。`;
    }
    case 3: {
      if (nextMove.kind === "drop") {
        return `初手の候補: ${PIECE_KANJI[nextMove.piece]}を打つ手です。`;
      }
      const piece = session.state.board[nextMove.from.row][nextMove.from.col];
      const pieceName = piece ? PIECE_KANJI[piece.type] : "";
      return `初手の候補: ${squareLabel(nextMove.from.row, nextMove.from.col)}の${pieceName}を動かす手です。`;
    }
    case 4:
    default: {
      if (nextMove.kind === "drop") {
        return `${PIECE_KANJI[nextMove.piece]}を${squareLabel(nextMove.to.row, nextMove.to.col)}に打ちます。`;
      }
      const promo = nextMove.promote ? "成" : "";
      return `${squareLabel(nextMove.from.row, nextMove.from.col)}から${squareLabel(
        nextMove.to.row,
        nextMove.to.col,
      )}へ${promo}動かします。`;
    }
  }
}
