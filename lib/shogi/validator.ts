import type { GameState, Move, Puzzle } from "./types";
import { applyMove, cloneState, generateLegalMoves, isCheckmate, movesEqual } from "./rules";

export interface PuzzleSessionState {
  state: GameState;
  moveIndex: number;
  finished: boolean;
  success: boolean;
  wrongAttempts: number;
  hintsUsed: number;
}

export function createSession(puzzle: Puzzle): PuzzleSessionState {
  return {
    state: {
      board: puzzle.initialBoard,
      hands: puzzle.initialHands,
      turn: "sente",
    },
    moveIndex: 0,
    finished: false,
    success: false,
    wrongAttempts: 0,
    hintsUsed: 0,
  };
}

export type SubmitResult =
  | { outcome: "illegal" }
  | { outcome: "incorrect"; session: PuzzleSessionState; isFinalAttempt: boolean }
  | { outcome: "progress"; session: PuzzleSessionState }
  | { outcome: "solved"; session: PuzzleSessionState };

/**
 * Validates a user (attacker/sente) move against the puzzle's precomputed solution.
 * On success, auto-plays the defender's (gote) reply and advances the session.
 * Intermediate moves must match the stored solution move exactly; on the final
 * attacker move, any move that produces checkmate is also accepted.
 */
export function submitMove(
  puzzle: Puzzle,
  session: PuzzleSessionState,
  move: Move,
): SubmitResult {
  if (session.finished) return { outcome: "illegal" };

  const legalMoves = generateLegalMoves(session.state, "sente");
  const isLegal = legalMoves.some((m) => movesEqual(m, move));
  if (!isLegal) return { outcome: "illegal" };

  const isFinalAttackerMove = session.moveIndex === puzzle.solution.length - 1;
  const expected = puzzle.solution[session.moveIndex];
  const matchesSolution = movesEqual(move, expected);

  const afterMove = applyMove(session.state, move);
  const resultsInMate = isCheckmate(afterMove, "gote");

  if (!matchesSolution && !(isFinalAttackerMove && resultsInMate)) {
    return {
      outcome: "incorrect",
      session: { ...session, wrongAttempts: session.wrongAttempts + 1 },
      isFinalAttempt: isFinalAttackerMove,
    };
  }

  if (isFinalAttackerMove && resultsInMate) {
    const solved: PuzzleSessionState = {
      state: afterMove,
      moveIndex: session.moveIndex + 1,
      finished: true,
      success: true,
      wrongAttempts: session.wrongAttempts,
      hintsUsed: session.hintsUsed,
    };
    return { outcome: "solved", session: solved };
  }

  // Correct intermediate move: auto-play the defender's stored reply.
  const gotesReply = puzzle.solution[session.moveIndex + 1];
  const afterReply = gotesReply ? applyMove(afterMove, gotesReply) : afterMove;

  const advanced: PuzzleSessionState = {
    state: afterReply,
    moveIndex: session.moveIndex + 2,
    finished: false,
    success: false,
    wrongAttempts: session.wrongAttempts,
    hintsUsed: session.hintsUsed,
  };
  return { outcome: "progress", session: advanced };
}

export function markHintUsed(session: PuzzleSessionState): PuzzleSessionState {
  return { ...session, hintsUsed: session.hintsUsed + 1 };
}

export function resetSession(puzzle: Puzzle): PuzzleSessionState {
  return createSession(puzzle);
}

export function cloneSession(session: PuzzleSessionState): PuzzleSessionState {
  return { ...session, state: cloneState(session.state) };
}
