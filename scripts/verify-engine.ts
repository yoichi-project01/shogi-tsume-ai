import { SAMPLE_PUZZLES } from "../lib/shogi/puzzles";
import { createSession, submitMove } from "../lib/shogi/validator";
import { isCheckmate, isInCheck } from "../lib/shogi/rules";
import { generateDailyPuzzle } from "../lib/shogi/generator";

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
