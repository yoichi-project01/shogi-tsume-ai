"use client";

import { useEffect, useState } from "react";
import { createSession, submitMove, markHintUsed, type PuzzleSessionState } from "@/lib/shogi/validator";
import type { Move, Puzzle } from "@/lib/shogi/types";

interface UsePuzzleSessionOptions {
  onSolved?: () => void;
  onResigned?: () => void;
}

export function usePuzzleSession(puzzle: Puzzle, options: UsePuzzleSessionOptions = {}) {
  const [session, setSession] = useState<PuzzleSessionState>(() => createSession(puzzle));
  const [message, setMessage] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState<number | null>(null);
  const [resigned, setResigned] = useState(false);

  useEffect(() => {
    if (session.finished || resigned) return;
    const timer = setInterval(() => setElapsed((Date.now() - startedAt) / 1000), 200);
    return () => clearInterval(timer);
  }, [startedAt, session.finished, resigned]);

  const answerTimeSeconds = finalElapsed ?? elapsed;

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

  const showResult = session.finished || resigned;

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
