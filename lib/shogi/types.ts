export type Color = "sente" | "gote";

export type BasePieceType = "FU" | "KY" | "KE" | "GI" | "KI" | "KA" | "HI" | "OU";
export type PromotedPieceType = "TO" | "NY" | "NK" | "NG" | "UM" | "RY";
export type PieceType = BasePieceType | PromotedPieceType;

export interface Piece {
  type: PieceType;
  owner: Color;
}

export type Square = Piece | null;

/** 9x9 board. board[row][col], row 0 = rank 1 (top / gote side), col 0 = file 9 (left). */
export type Board = Square[][];

export interface Position {
  row: number;
  col: number;
}

export type Hand = Partial<Record<Exclude<BasePieceType, "OU">, number>>;

export interface GameState {
  board: Board;
  hands: Record<Color, Hand>;
  turn: Color;
}

export interface BoardMove {
  kind: "board";
  from: Position;
  to: Position;
  promote: boolean;
  color: Color;
}

export interface DropMove {
  kind: "drop";
  to: Position;
  piece: Exclude<BasePieceType, "OU">;
  color: Color;
}

export type Move = BoardMove | DropMove;

export interface Puzzle {
  id: string;
  title: string;
  moveCount: 1 | 3 | 5;
  difficulty: number;
  initialBoard: Board;
  initialHands: Record<Color, Hand>;
  /** Full alternating move sequence: sente, gote, sente, gote, sente... */
  solution: Move[];
  explanation: string;
}
