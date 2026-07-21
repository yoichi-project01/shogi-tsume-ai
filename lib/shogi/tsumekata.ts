import type { Board, GameState, Move, PieceType } from "./types";
import { applyMove, cloneBoard, findKing, PIECE_KANJI, PROMOTE_MAP } from "./rules";

/**
 * Classic tsume-shogi vocabulary for a piece sitting on one of the eight
 * squares around the king: 頭 (directly in front, i.e. one step further into
 * the board from the king's own side), 尻 (directly behind), 腹 (either
 * side), and 脇/背 (front/back diagonals). "Front" here means the direction
 * the king is retreating from — for a gote king this is the row-increasing
 * direction, matching how buildOneMoveVariedPuzzle already identifies 頭金.
 */
const POSITION_WORDS: Record<string, string> = {
  "1,0": "頭",
  "-1,0": "尻",
  "0,1": "腹",
  "0,-1": "腹",
  "1,1": "脇",
  "1,-1": "脇",
  "-1,1": "背",
  "-1,-1": "背",
};

/**
 * Names a solved puzzle after the shape of its finishing (mating) move —
 * the same vocabulary a solver would use to describe how the king actually
 * got mated (頭金/腹銀/... for a piece landing adjacent to the king, or
 * "<piece>の寄せ" for a check delivered from further away, e.g. a lance,
 * knight, or a rook/bishop sliding in along an open line). For multi-move
 * puzzles this only looks at the last ply — the setup moves vary too much to
 * name generically, but the finishing shape is always well-defined.
 */
export function deriveMateTitle(initialBoard: Board, solution: Move[]): string {
  let state: GameState = { board: cloneBoard(initialBoard), hands: { sente: {}, gote: {} }, turn: "sente" };
  for (let i = 0; i < solution.length - 1; i++) {
    state = applyMove(state, solution[i]);
  }

  const king = findKing(state.board, "gote");
  const finalMove = solution[solution.length - 1];

  let pieceType: PieceType;
  if (finalMove.kind === "drop") {
    pieceType = finalMove.piece;
  } else {
    const moved = state.board[finalMove.from.row][finalMove.from.col];
    const baseType = moved!.type;
    pieceType = finalMove.promote ? (PROMOTE_MAP[baseType] ?? baseType) : baseType;
  }
  const kanji = PIECE_KANJI[pieceType];

  if (!king) return `${kanji}での一手`;

  const dr = finalMove.to.row - king.row;
  const dc = finalMove.to.col - king.col;
  const word = POSITION_WORDS[`${dr},${dc}`];

  return word ? `${word}${kanji}` : `${kanji}の寄せ`;
}
