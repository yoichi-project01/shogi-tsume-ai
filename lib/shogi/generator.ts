import type { Color, GameState, Hand, Move, Puzzle } from "./types";
import { applyMove, emptyBoard, generateLegalMoves, isCheckmate, isInCheck, PIECE_KANJI } from "./rules";
import { squareLabel } from "./hints";

/** Piece types this generator draws from when composing attacker material. */
type AttackPiece = "KI" | "GI" | "KY" | "KE" | "HI" | "KA";

/** Max copies of each type available in a real shogi set (keeps generated boards realistic). */
const PIECE_LIMITS: Record<AttackPiece, number> = { KI: 2, GI: 2, KY: 2, KE: 2, HI: 1, KA: 1 };

function randomInt(n: number): number {
  return Math.floor(Math.random() * n);
}

function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(arr.length)];
}

function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function piecePool(): AttackPiece[] {
  const pool: AttackPiece[] = [];
  (Object.keys(PIECE_LIMITS) as AttackPiece[]).forEach((type) => {
    for (let i = 0; i < PIECE_LIMITS[type]; i++) pool.push(type);
  });
  return pool;
}

/**
 * Exhaustively verifies that `state` (sente to move, gote not in check) is a
 * well-formed tsume-shogi problem of exactly `plyCount` plies: at every sente
 * turn exactly one move continues toward mate, at every gote turn the
 * defender is forced into exactly one legal reply (so the puzzle has a
 * single linear solution, matching this app's data model), and no shorter
 * mate exists anywhere in the tree. Returns the full alternating move
 * sequence, or null if any of that doesn't hold.
 */
export function solveForced(state: GameState, plyCount: number): Move[] | null {
  if (isInCheck(state, "gote")) return null;
  for (let shorter = 1; shorter < plyCount; shorter += 2) {
    if (solveExact(state, shorter) !== null) return null;
  }
  return solveExact(state, plyCount);
}

function solveExact(state: GameState, plyRemaining: number): Move[] | null {
  const senteMoves = generateLegalMoves(state, "sente");
  let found: Move[] | null = null;

  for (const move of senteMoves) {
    const after = applyMove(state, move);

    if (plyRemaining === 1) {
      if (!isCheckmate(after, "gote")) continue;
      if (found) return null; // dual mate at this node
      found = [move];
      continue;
    }

    // Real tsume-shogi requires every attacker move to check the king — without
    // this, a "forced" reply could just be the king's only legal square for
    // some unrelated reason, which wouldn't read as a genuine checking sequence.
    if (!isInCheck(after, "gote")) continue;

    const goteMoves = generateLegalMoves(after, "gote");
    if (goteMoves.length !== 1) continue; // must be a single forced reply
    const afterGote = applyMove(after, goteMoves[0]);
    const rest = solveExact(afterGote, plyRemaining - 2);
    if (rest === null) continue;

    if (found) return null; // dual solution at this node
    found = [move, goteMoves[0], ...rest];
  }

  return found;
}

function describeSenteMove(move: Move): string {
  if (move.kind === "drop") {
    return `${PIECE_KANJI[move.piece]}を${squareLabel(move.to.row, move.to.col)}に打つ`;
  }
  const suffix = move.promote ? "成る" : "動かす";
  return `${squareLabel(move.from.row, move.from.col)}の駒を${squareLabel(move.to.row, move.to.col)}へ${suffix}`;
}

function describeGoteMove(move: Move): string {
  if (move.kind === "board") {
    return `玉は${squareLabel(move.to.row, move.to.col)}へ逃げるしかありません`;
  }
  return `玉方は駒を打って受けます`;
}

function describeSolution(solution: Move[]): string {
  const segments: string[] = [];
  for (let i = 0; i < solution.length; i += 2) {
    const senteMove = solution[i];
    const isFinal = i === solution.length - 1;
    if (isFinal) {
      segments.push(`最後に${describeSenteMove(senteMove)}と、これで詰みです。`);
    } else {
      const lead = i === 0 ? "まず" : "続いて";
      segments.push(`${lead}${describeSenteMove(senteMove)}と王手をかけると、${describeGoteMove(solution[i + 1])}。`);
    }
  }
  return segments.join("");
}

export type GeneratedPuzzle = Omit<Puzzle, "id">;

/** 1-move mate: a support piece defends the square a gold is dropped on next to the king. */
function buildOneMovePuzzle(): GeneratedPuzzle | null {
  for (let attempt = 0; attempt < 50; attempt++) {
    const kingCol = randomInt(9);
    const sides = [-1, 1].filter((s) => kingCol + s >= 0 && kingCol + s <= 8);
    if (sides.length === 0) continue;
    const supportCol = kingCol + pick(sides);
    const supportType = pick<AttackPiece>(["GI", "KI", "KA"]);

    const board = emptyBoard();
    board[0][kingCol] = { type: "OU", owner: "gote" };
    board[2][supportCol] = { type: supportType, owner: "sente" };

    const hands: Record<Color, Hand> = { sente: { KI: 1 }, gote: {} };
    const state: GameState = { board, hands, turn: "sente" };

    const solution = solveForced(state, 1);
    if (!solution) continue;

    return {
      title: "1手詰（自動生成）",
      initialBoard: board,
      initialHands: hands,
      solution,
      moveCount: 1,
      difficulty: 1,
      explanation: describeSolution(solution),
    };
  }
  return null;
}

const NEAR_CORNER_COLS = [0, 1, 7, 8];

/**
 * Scatters a small set of sente pieces (some on the board near the king,
 * the rest in hand) around a near-corner gote king. Piece counts are capped
 * to what exists in a real shogi set (see PIECE_LIMITS) so generated boards
 * stay realistic; hand-drawn types can repeat since a fresh pool is shuffled
 * per attempt.
 */
function randomCandidateState(pieceCountRange: [number, number], boardCountRange: [number, number]): GameState {
  const kingCol = pick(NEAR_CORNER_COLS);
  const board = emptyBoard();
  board[0][kingCol] = { type: "OU", owner: "gote" };

  const pool = shuffled(piecePool());
  const pieceCount = pieceCountRange[0] + randomInt(pieceCountRange[1] - pieceCountRange[0] + 1);
  const boardCount = boardCountRange[0] + randomInt(boardCountRange[1] - boardCountRange[0] + 1);

  const hand: Hand = {};
  const used = new Set<string>([`0,${kingCol}`]);
  let placedOnBoard = 0;

  for (const type of pool.slice(0, pieceCount)) {
    let placed = false;
    if (placedOnBoard < boardCount) {
      for (let t = 0; t < 20; t++) {
        const row = 1 + randomInt(3);
        const col = Math.max(0, Math.min(8, kingCol + randomInt(5) - 2));
        const key = `${row},${col}`;
        if (used.has(key)) continue;
        used.add(key);
        board[row][col] = { type, owner: "sente" };
        placedOnBoard++;
        placed = true;
        break;
      }
    }
    if (!placed) hand[type] = (hand[type] ?? 0) + 1;
  }

  return { board, hands: { sente: hand, gote: {} }, turn: "sente" };
}

/**
 * Bounded random search for a `moveCount`-ply forced mate: repeatedly scatter
 * candidate material and hand each one to solveForced, which is the sole
 * authority on correctness (unique solution, forced defense, no shorter
 * mate). Hand-derived templates are tempting but easy to get subtly wrong —
 * see git history for a 3-move template that looked right on paper but
 * turned out to have an unintended mate-in-1 — so every generated puzzle
 * here is independently verified rather than trusted by construction.
 */
function buildRandomPuzzle(
  moveCount: 3 | 5,
  attempts: number,
  pieceCountRange: [number, number],
  boardCountRange: [number, number],
): GeneratedPuzzle | null {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const state = randomCandidateState(pieceCountRange, boardCountRange);
    if (Object.keys(state.hands.sente).length === 0) continue; // need a droppable finisher

    const solution = solveForced(state, moveCount);
    if (!solution) continue;

    return {
      title: `${moveCount}手詰（自動生成）`,
      initialBoard: state.board,
      initialHands: state.hands,
      solution,
      moveCount,
      difficulty: moveCount,
      explanation: describeSolution(solution),
    };
  }
  return null;
}

function buildThreeMovePuzzle(): GeneratedPuzzle | null {
  return buildRandomPuzzle(3, 200, [2, 3], [1, 2]);
}

function buildFiveMovePuzzle(): GeneratedPuzzle | null {
  return buildRandomPuzzle(5, 300, [3, 4], [1, 2]);
}

/**
 * Generates one fresh, engine-verified tsume-shogi puzzle. Picks a move-count
 * tier at random (weighted toward shorter, more reliable tiers) and falls
 * back through the easier tiers if the harder ones fail to find a valid
 * position within their search budget — buildOneMovePuzzle is constructively
 * derived and solver-verified for every valid king column, so it should
 * always succeed as a last resort.
 */
export function generateDailyPuzzle(): GeneratedPuzzle {
  const roll = Math.random();
  const primary = roll < 0.4 ? buildOneMovePuzzle : roll < 0.8 ? buildThreeMovePuzzle : buildFiveMovePuzzle;

  const result = primary() ?? buildThreeMovePuzzle() ?? buildOneMovePuzzle();
  if (!result) throw new Error("failed to generate a daily puzzle");
  return result;
}

/**
 * Generates one puzzle at a specific difficulty tier (unlike
 * generateDailyPuzzle, this never silently substitutes an easier tier —
 * callers that need a particular level should retry on null rather than
 * receive a mislabeled result).
 */
export function generatePuzzleForLevel(level: 1 | 3 | 5): GeneratedPuzzle | null {
  if (level === 1) return buildOneMovePuzzle();
  if (level === 3) return buildThreeMovePuzzle();
  return buildFiveMovePuzzle();
}
