"use client";

import { useEffect, useRef, useState } from "react";
import { createSession, submitMove, markHintUsed, type PuzzleSessionState } from "@/lib/shogi/validator";
import type { Move, Puzzle } from "@/lib/shogi/types";

interface UsePuzzleSessionOptions {
  onSolved?: () => void;
  onResigned?: () => void;
}

/** Posts the finished attempt to the server for authoritative re-validation
 * and (for logged-in users) persistence — see app/api/attempts/route.ts. */
function reportAttempt(puzzleId: string, moves: Move[], hintsUsed: number, answerTimeSeconds: number, resigned: boolean) {
  fetch("/api/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ puzzleId, moves, hintsUsed, answerTimeSeconds, resigned }),
  }).catch(() => {});
}

export function usePuzzleSession(puzzle: Puzzle, options: UsePuzzleSessionOptions = {}) {
  const [session, setSession] = useState<PuzzleSessionState>(() => createSession(puzzle));
  const [moves, setMoves] = useState<Move[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState<number | null>(null);
  const [resigned, setResigned] = useState(false);
  const reportedRef = useRef(false);

  useEffect(() => {
    if (session.finished || resigned) return;
    const timer = setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 200);
    return () => clearInterval(timer);
  }, [startedAt, session.finished, resigned]);

  const answerTimeSeconds = finalElapsed ?? elapsed;
  const showResult = session.finished || resigned;

  useEffect(() => {
    if (!showResult || reportedRef.current) return;
    reportedRef.current = true;
    reportAttempt(puzzle.id, moves, session.hintsUsed, answerTimeSeconds, resigned);
    // Only fires once, right after the session ends — later changes to these
    // values (e.g. answerTimeSeconds ticking) must not re-trigger the report.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult]);

  function handleMove(move: Move) {
    const result = submitMove(puzzle, session, move);
    if (result.outcome === "illegal") {
      setMessage("その手は指せません。");
      return;
    }
    if (result.outcome === "incorrect") {
      setMessage("不正解です。もう一度、玉方の逃げ場をふさぐ手を考えてみましょう。");
      setSession(result.session);
      return;
    }

    setMessage(null);
    setSession(result.session);
    setMoves((prev) => [...prev, move]);

    if (result.outcome === "solved") {
      setFinalElapsed((Date.now() - startedAt) / 1000);
      options.onSolved?.();
    }
  }

  function handleUseHint() {
    setSession((prev) => markHintUsed(prev));
  }

  function handleResign() {
    setFinalElapsed((Date.now() - startedAt) / 1000);
    setResigned(true);
    options.onResigned?.();
  }

  return {
    session,
    message,
    answerTimeSeconds,
    resigned,
    showResult,
    handleMove,
    handleUseHint,
    handleResign,
  };
}
