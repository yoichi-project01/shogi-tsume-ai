import { SAMPLE_PUZZLES } from "../lib/shogi/puzzles";
import { createSession, submitMove } from "../lib/shogi/validator";
import { isCheckmate, isInCheck, generateLegalMoves, emptyBoard } from "../lib/shogi/rules";
import { generateDailyPuzzle, solveForced, hasForcedMateWithin } from "../lib/shogi/generator";
import type { GameState } from "../lib/shogi/types";

let failures = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++;
    console.error(`FAIL: ${msg}`);
  } else {
    console.log(`OK:   ${msg}`);
  }
}

for (const puzzle of SAMPLE_PUZZLES) {
  console.log(`\n--- ${puzzle.id}: ${puzzle.title} ---`);
  let session = createSession(puzzle);

  assert(!isInCheck(session.state, "gote"), "gote not in check at start");

  for (let i = 0; i < puzzle.solution.length; i += 2) {
    const move = puzzle.solution[i];
    const result = submitMove(puzzle, session, move);
    assert(result.outcome === "progress" || result.outcome === "solved", `move ${i} accepted (got ${result.outcome})`);
    if (result.outcome === "progress" || result.outcome === "solved") {
      session = result.session;
    }
  }

  assert(session.finished && session.success, "puzzle ends solved");
  assert(isCheckmate(session.state, "gote"), "final position is checkmate");
}

// Negative test: a wrong move on puzzle 1 should be rejected as incorrect (not solved).
{
  const puzzle = SAMPLE_PUZZLES[0];
  const session = createSession(puzzle);
  const wrongMove = { kind: "drop" as const, piece: "KI" as const, to: { row: 8, col: 8 }, color: "sente" as const };
  const result = submitMove(puzzle, session, wrongMove);
  assert(result.outcome === "incorrect", `wrong move on ${puzzle.id} rejected as incorrect`);
}

// Negative test: a wrong FIRST move on a multi-move puzzle must not end the
// session — the player should be able to try again from the same position
// and still solve it (this must never surface a "finished" result modal).
{
  const puzzle = SAMPLE_PUZZLES.find((p) => p.moveCount > 1)!;
  let session = createSession(puzzle);
  const legalMoves = generateLegalMoves(session.state, "sente");
  const correctFirst = puzzle.solution[0];
  const wrongFirst = legalMoves.find((m) => JSON.stringify(m) !== JSON.stringify(correctFirst))!;

  const wrongResult = submitMove(puzzle, session, wrongFirst);
  assert(wrongResult.outcome === "incorrect", `wrong first move on ${puzzle.id} rejected as incorrect`);
  assert(
    wrongResult.outcome === "incorrect" && !wrongResult.isFinalAttempt,
    `wrong first move on ${puzzle.id} is not flagged as a final attempt (UI must not show "incorrect" for it)`,
  );
  assert(
    wrongResult.outcome !== "illegal" && !wrongResult.session.finished,
    `session not finished after a wrong (non-final) move on ${puzzle.id}`,
  );
  if (wrongResult.outcome !== "illegal") session = wrongResult.session;

  for (let i = 0; i < puzzle.solution.length; i += 2) {
    const result = submitMove(puzzle, session, puzzle.solution[i]);
    if (result.outcome === "progress" || result.outcome === "solved") session = result.session;
  }
  assert(session.finished && session.success, `${puzzle.id} still solvable after recovering from the wrong first move`);
}

// Negative test: a wrong FINAL move (the one that should deliver mate) must
// be flagged as a final attempt, so the UI does show "incorrect" for it.
{
  const puzzle = SAMPLE_PUZZLES.find((p) => p.moveCount > 1)!;
  let session = createSession(puzzle);
  for (let i = 0; i < puzzle.solution.length - 2; i += 2) {
    const result = submitMove(puzzle, session, puzzle.solution[i]);
    if (result.outcome === "progress" || result.outcome === "solved") session = result.session;
  }

  const legalMoves = generateLegalMoves(session.state, "sente");
  const correctFinal = puzzle.solution[puzzle.solution.length - 1];
  const wrongFinal = legalMoves.find((m) => JSON.stringify(m) !== JSON.stringify(correctFinal))!;

  const result = submitMove(puzzle, session, wrongFinal);
  assert(
    result.outcome === "incorrect" && result.isFinalAttempt,
    `wrong final move on ${puzzle.id} is flagged as a final attempt (UI should show "incorrect" for it)`,
  );
}

// Regression test for a cook-detection bug: solveForced used to detect a
// shorter mate only when it was unique, because its shorter-ply check
// reused solveExact (which returns null both when no mate exists AND when
// the mate is ambiguous/dual). A position with two different mate-in-1
// moves was therefore wrongly accepted as a valid 3-/5-move puzzle. Build
// exactly that dual-mate-in-1 shape (corner king defended so two different
// gold-drop squares both mate) and confirm the generator's building blocks
// now correctly recognize it as "a shorter mate exists".
{
  const board = emptyBoard();
  board[0][0] = { type: "OU", owner: "gote" };
  board[2][1] = { type: "GI", owner: "sente" };
  const dualMateState: GameState = { board, hands: { sente: { KI: 1 }, gote: {} }, turn: "sente" };

  assert(
    hasForcedMateWithin(dualMateState, 1),
    "hasForcedMateWithin detects a dual (non-unique) mate-in-1 as a mate existing",
  );
  assert(
    solveForced(dualMateState, 3) === null,
    "solveForced rejects a position with a dual mate-in-1 even when claimed as a longer puzzle",
  );
}

// Auto-generator: every generated puzzle must independently replay as a
// legal, forced mate through the same validator used at runtime (guards
// against subtly-wrong hand-derived templates producing cooked puzzles).
console.log("\n--- generator: 15 generated puzzles ---");
for (let i = 0; i < 15; i++) {
  const generated = generateDailyPuzzle();
  const puzzle = { id: `gen-check-${i}`, ...generated };
  let session = createSession(puzzle);

  assert(!isInCheck(session.state, "gote"), `[gen ${i}] gote not in check at start`);

  let replayOk = true;
  for (let m = 0; m < puzzle.solution.length; m += 2) {
    const result = submitMove(puzzle, session, puzzle.solution[m]);
    if (result.outcome !== "progress" && result.outcome !== "solved") {
      assert(false, `[gen ${i}] move ${m} accepted (got ${result.outcome})`);
      replayOk = false;
      break;
    }
    session = result.session;
  }

  if (replayOk) {
    assert(session.finished && session.success, `[gen ${i}] puzzle ends solved`);
    assert(isCheckmate(session.state, "gote"), `[gen ${i}] final position is checkmate`);
  }
}

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
