import type {
  Board,
  BoardMove,
  Color,
  DropMove,
  GameState,
  Hand,
  Move,
  Piece,
  PieceType,
  Position,
} from "./types";

export const BOARD_SIZE = 9;

export const PIECE_KANJI: Record<PieceType, string> = {
  FU: "歩",
  KY: "香",
  KE: "桂",
  GI: "銀",
  KI: "金",
  KA: "角",
  HI: "飛",
  OU: "玉",
  TO: "と",
  NY: "杏",
  NK: "圭",
  NG: "全",
  UM: "馬",
  RY: "龍",
};

export const PROMOTE_MAP: Partial<Record<PieceType, PieceType>> = {
  FU: "TO",
  KY: "NY",
  KE: "NK",
  GI: "NG",
  KA: "UM",
  HI: "RY",
};

export const DEMOTE_MAP: Partial<Record<PieceType, PieceType>> = {
  TO: "FU",
  NY: "KY",
  NK: "KE",
  NG: "GI",
  UM: "KA",
  RY: "HI",
};

export function baseType(type: PieceType): PieceType {
  return DEMOTE_MAP[type] ?? type;
}

export function canPromote(type: PieceType): boolean {
  return type in PROMOTE_MAP;
}

export function opponent(color: Color): Color {
  return color === "sente" ? "gote" : "sente";
}

export function inBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < BOARD_SIZE && pos.col >= 0 && pos.col < BOARD_SIZE;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((sq) => (sq ? { ...sq } : null)));
}

export function cloneHand(hand: Hand): Hand {
  return { ...hand };
}

export function cloneState(state: GameState): GameState {
  return {
    board: cloneBoard(state.board),
    hands: {
      sente: cloneHand(state.hands.sente),
      gote: cloneHand(state.hands.gote),
    },
    turn: state.turn,
  };
}

export function emptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array<null>(BOARD_SIZE).fill(null));
}

export function findKing(board: Board, color: Color): Position | null {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const sq = board[row][col];
      if (sq && sq.owner === color && sq.type === "OU") return { row, col };
    }
  }
  return null;
}

interface MoveDef {
  offsets: [number, number][];
  sliding: [number, number][];
}

function moveDef(type: PieceType, color: Color): MoveDef {
  const f = color === "sente" ? -1 : 1;
  switch (type) {
    case "FU":
      return { offsets: [[f, 0]], sliding: [] };
    case "KY":
      return { offsets: [], sliding: [[f, 0]] };
    case "KE":
      return { offsets: [[2 * f, -1], [2 * f, 1]], sliding: [] };
    case "GI":
      return { offsets: [[f, -1], [f, 0], [f, 1], [-f, -1], [-f, 1]], sliding: [] };
    case "KI":
    case "TO":
    case "NY":
    case "NK":
    case "NG":
      return { offsets: [[f, -1], [f, 0], [f, 1], [0, -1], [0, 1], [-f, 0]], sliding: [] };
    case "KA":
      return { offsets: [], sliding: [[1, 1], [1, -1], [-1, 1], [-1, -1]] };
    case "HI":
      return { offsets: [], sliding: [[1, 0], [-1, 0], [0, 1], [0, -1]] };
    case "UM":
      return { offsets: [[1, 0], [-1, 0], [0, 1], [0, -1]], sliding: [[1, 1], [1, -1], [-1, 1], [-1, -1]] };
    case "RY":
      return { offsets: [[1, 1], [1, -1], [-1, 1], [-1, -1]], sliding: [[1, 0], [-1, 0], [0, 1], [0, -1]] };
    case "OU":
      return {
        offsets: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
        sliding: [],
      };
    default:
      return { offsets: [], sliding: [] };
  }
}

/** Pseudo-legal destinations for the piece at `pos` (does not check for self-check). */
export function pieceDestinations(board: Board, pos: Position): Position[] {
  const piece = board[pos.row][pos.col];
  if (!piece) return [];
  const { offsets, sliding } = moveDef(piece.type, piece.owner);
  const dests: Position[] = [];

  for (const [dr, dc] of offsets) {
    const dest = { row: pos.row + dr, col: pos.col + dc };
    if (!inBounds(dest)) continue;
    const target = board[dest.row][dest.col];
    if (!target || target.owner !== piece.owner) dests.push(dest);
  }

  for (const [dr, dc] of sliding) {
    let r = pos.row + dr;
    let c = pos.col + dc;
    while (inBounds({ row: r, col: c })) {
      const target = board[r][c];
      if (!target) {
        dests.push({ row: r, col: c });
      } else {
        if (target.owner !== piece.owner) dests.push({ row: r, col: c });
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return dests;
}

/** True if `pos` is attacked by any piece owned by `byColor`. */
export function isSquareAttacked(board: Board, pos: Position, byColor: Color): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const sq = board[row][col];
      if (!sq || sq.owner !== byColor) continue;
      const dests = pieceDestinations(board, { row, col });
      if (dests.some((d) => d.row === pos.row && d.col === pos.col)) return true;
    }
  }
  return false;
}

export function isInCheck(state: GameState, color: Color): boolean {
  const king = findKing(state.board, color);
  if (!king) return false;
  return isSquareAttacked(state.board, king, opponent(color));
}

function promotionZone(color: Color, row: number): boolean {
  return color === "sente" ? row <= 2 : row >= 6;
}

function mustPromote(type: PieceType, color: Color, row: number): boolean {
  const lastRow = color === "sente" ? 0 : BOARD_SIZE - 1;
  const secondLastRow = color === "sente" ? 1 : BOARD_SIZE - 2;
  if ((type === "FU" || type === "KY") && row === lastRow) return true;
  if (type === "KE" && (row === lastRow || row === secondLastRow)) return true;
  return false;
}

export function applyMove(state: GameState, move: Move): GameState {
  const next = cloneState(state);
  const { board, hands } = next;

  if (move.kind === "drop") {
    board[move.to.row][move.to.col] = { type: move.piece, owner: move.color };
    const hand = hands[move.color];
    hand[move.piece] = (hand[move.piece] ?? 0) - 1;
    if (hand[move.piece]! <= 0) delete hand[move.piece];
  } else {
    const piece = board[move.from.row][move.from.col];
    if (!piece) throw new Error("No piece at from-square");
    const captured = board[move.to.row][move.to.col];
    if (captured) {
      const base = baseType(captured.type);
      if (base !== "OU") {
        const hand = hands[move.color];
        const key = base as keyof Hand;
        hand[key] = (hand[key] ?? 0) + 1;
      }
    }
    board[move.from.row][move.from.col] = null;
    const finalType = move.promote ? (PROMOTE_MAP[piece.type] ?? piece.type) : piece.type;
    board[move.to.row][move.to.col] = { type: finalType, owner: piece.owner };
  }

  next.turn = opponent(move.color);
  return next;
}

function hasPawnOnFile(board: Board, col: number, color: Color): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    const sq = board[row][col];
    if (sq && sq.owner === color && sq.type === "FU") return true;
  }
  return false;
}

function wouldBeUchifuzume(state: GameState, move: DropMove): boolean {
  if (move.piece !== "FU") return false;
  const next = applyMove(state, move);
  const opp = opponent(move.color);
  return isInCheck(next, opp) && generateLegalMoves(next, opp).length === 0;
}

function leavesOwnKingInCheck(state: GameState, move: Move): boolean {
  const next = applyMove(state, move);
  return isInCheck(next, move.color);
}

/** All fully legal moves (board moves + drops) for `color`, filtered for self-check. */
export function generateLegalMoves(state: GameState, color: Color): Move[] {
  const { board } = state;
  const moves: Move[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (!piece || piece.owner !== color) continue;
      const dests = pieceDestinations(board, { row, col });
      for (const to of dests) {
        const forced = mustPromote(piece.type, color, to.row);
        const canProm = canPromote(piece.type) && !forced &&
          (promotionZone(color, row) || promotionZone(color, to.row));

        if (!forced) {
          const move: BoardMove = { kind: "board", from: { row, col }, to, promote: false, color };
          if (!leavesOwnKingInCheck(state, move)) moves.push(move);
        }
        if (forced || canProm) {
          const move: BoardMove = { kind: "board", from: { row, col }, to, promote: true, color };
          if (!leavesOwnKingInCheck(state, move)) moves.push(move);
        }
      }
    }
  }

  const hand = state.hands[color];
  for (const key of Object.keys(hand) as (keyof Hand)[]) {
    const count = hand[key] ?? 0;
    if (count <= 0) continue;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col]) continue;
        if (mustPromote(key, color, row)) continue;
        if (key === "FU" && hasPawnOnFile(board, col, color)) continue;
        const move: DropMove = { kind: "drop", to: { row, col }, piece: key, color };
        if (leavesOwnKingInCheck(state, move)) continue;
        if (wouldBeUchifuzume(state, move)) continue;
        moves.push(move);
      }
    }
  }

  return moves;
}

export function isCheckmate(state: GameState, color: Color): boolean {
  return isInCheck(state, color) && generateLegalMoves(state, color).length === 0;
}

export function isStalemateLike(state: GameState, color: Color): boolean {
  return !isInCheck(state, color) && generateLegalMoves(state, color).length === 0;
}

export function movesEqual(a: Move, b: Move): boolean {
  if (a.kind !== b.kind || a.color !== b.color) return false;
  if (a.kind === "drop" && b.kind === "drop") {
    return a.piece === b.piece && a.to.row === b.to.row && a.to.col === b.to.col;
  }
  if (a.kind === "board" && b.kind === "board") {
    return (
      a.from.row === b.from.row &&
      a.from.col === b.from.col &&
      a.to.row === b.to.row &&
      a.to.col === b.to.col &&
      a.promote === b.promote
    );
  }
  return false;
}

export function placePiece(board: Board, pos: Position, piece: Piece): void {
  board[pos.row][pos.col] = piece;
}
