"use client";

import { useMemo, useState } from "react";
import type { BoardMove, GameState, Move, Position } from "@/lib/shogi/types";
import { PIECE_KANJI, generateLegalMoves } from "@/lib/shogi/rules";
import { FILE_LABELS } from "@/lib/shogi/hints";
import { PIECE_INFO } from "@/lib/shogi/pieceInfo";
import Piece from "./Piece";
import PieceMoveDiagram from "./PieceMoveDiagram";

type HandPieceKey = "FU" | "KY" | "KE" | "GI" | "KI" | "KA" | "HI";

type Selection = { kind: "board"; pos: Position } | { kind: "hand"; piece: HandPieceKey } | null;

interface BoardProps {
  state: GameState;
  onMove: (move: Move) => void;
  disabled?: boolean;
}

export default function Board({ state, onMove, disabled = false }: BoardProps) {
  const [selection, setSelection] = useState<Selection>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Position; to: Position } | null>(null);

  const legalMoves = useMemo(() => generateLegalMoves(state, "sente"), [state]);

  const legalDestinations = useMemo(() => {
    if (!selection) return [];
    if (selection.kind === "board") {
      return legalMoves.filter(
        (m): m is BoardMove =>
          m.kind === "board" && m.from.row === selection.pos.row && m.from.col === selection.pos.col,
      );
    }
    return legalMoves.filter((m) => m.kind === "drop" && m.piece === selection.piece);
  }, [selection, legalMoves]);

  const destinationSet = new Set(legalDestinations.map((m) => `${m.to.row},${m.to.col}`));

  const selectedPieceInfo =
    selection?.kind === "board"
      ? PIECE_INFO[state.board[selection.pos.row][selection.pos.col]!.type]
      : selection?.kind === "hand"
        ? PIECE_INFO[selection.piece]
        : null;

  function selectBoardPiece(pos: Position) {
    const piece = state.board[pos.row][pos.col];
    if (piece && piece.owner === "sente") {
      setSelection({ kind: "board", pos });
    } else {
      setSelection(null);
    }
  }

  function selectHandPiece(piece: HandPieceKey) {
    setSelection((prev) => (prev?.kind === "hand" && prev.piece === piece ? null : { kind: "hand", piece }));
  }

  function attemptMoveTo(to: Position) {
    if (!selection || !destinationSet.has(`${to.row},${to.col}`)) {
      setSelection(null);
      return;
    }

    if (selection.kind === "hand") {
      onMove({ kind: "drop", piece: selection.piece, to, color: "sente" });
      setSelection(null);
      return;
    }

    const from = selection.pos;
    const candidates = legalDestinations.filter(
      (m): m is BoardMove => m.kind === "board" && m.to.row === to.row && m.to.col === to.col,
    );

    if (candidates.length === 2) {
      setPendingPromotion({ from, to });
      return;
    }

    onMove({ kind: "board", from, to, promote: candidates[0].promote, color: "sente" });
    setSelection(null);
  }

  function resolvePromotion(promote: boolean) {
    if (!pendingPromotion) return;
    onMove({ kind: "board", from: pendingPromotion.from, to: pendingPromotion.to, promote, color: "sente" });
    setPendingPromotion(null);
    setSelection(null);
  }

  function handleSquareClick(pos: Position) {
    if (disabled) return;
    if (selection && destinationSet.has(`${pos.row},${pos.col}`)) {
      attemptMoveTo(pos);
      return;
    }
    selectBoardPiece(pos);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <HandTray hand={state.hands.gote} owner="gote" />

      <div className="relative">
        {pendingPromotion && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
            <div className="flex gap-2 rounded bg-white p-4 shadow-lg">
              <button
                type="button"
                className="rounded bg-amber-600 px-4 py-2 font-bold text-white hover:bg-amber-700"
                onClick={() => resolvePromotion(true)}
              >
                成る
              </button>
              <button
                type="button"
                className="rounded bg-neutral-300 px-4 py-2 font-bold hover:bg-neutral-400"
                onClick={() => resolvePromotion(false)}
              >
                不成
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-9 border-2 border-neutral-800 bg-amber-100">
          {state.board.map((row, r) =>
            row.map((sq, c) => {
              const isDest = destinationSet.has(`${r},${c}`);
              const isSelected = selection?.kind === "board" && selection.pos.row === r && selection.pos.col === c;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  onClick={() => handleSquareClick({ row: r, col: c })}
                  disabled={disabled}
                  className={`relative flex h-10 w-10 items-center justify-center border border-neutral-400 sm:h-12 sm:w-12 ${
                    isSelected ? "bg-amber-300" : isDest ? "bg-green-200" : ""
                  }`}
                >
                  {sq && <Piece piece={sq} />}
                  {isDest && !sq && <span className="absolute h-2.5 w-2.5 rounded-full bg-green-600" />}
                </button>
              );
            }),
          )}
        </div>

        <div className="mt-1 grid grid-cols-9 text-center text-xs text-neutral-500">
          {FILE_LABELS.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>
      </div>

      <HandTray
        hand={state.hands.sente}
        owner="sente"
        selectable={!disabled}
        selectedPiece={selection?.kind === "hand" ? selection.piece : null}
        onSelect={selectHandPiece}
      />

      {selectedPieceInfo && (
        <div className="flex w-full max-w-sm items-start gap-3 rounded border border-sky-200 bg-sky-50 p-3 text-sm text-sky-900">
          <div className="shrink-0">
            <PieceMoveDiagram type={selectedPieceInfo.type} size="sm" />
          </div>
          <p className="min-w-0">
            <span className="font-bold">
              {selectedPieceInfo.kanji}（{selectedPieceInfo.name}）
            </span>
            は緑色のマスに動けます。{selectedPieceInfo.description}
          </p>
        </div>
      )}
    </div>
  );
}

interface HandTrayProps {
  hand: Partial<Record<HandPieceKey, number>>;
  owner: "sente" | "gote";
  selectable?: boolean;
  selectedPiece?: HandPieceKey | null;
  onSelect?: (piece: HandPieceKey) => void;
}

function HandTray({ hand, owner, selectable, selectedPiece, onSelect }: HandTrayProps) {
  const entries = Object.entries(hand).filter(([, count]) => (count ?? 0) > 0) as [HandPieceKey, number][];

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-2 rounded border border-neutral-300 bg-neutral-50 px-3 py-2">
      <span className="text-xs text-neutral-500">{owner === "sente" ? "持ち駒（あなた）" : "持ち駒（相手）"}</span>
      {entries.length === 0 && <span className="text-xs text-neutral-400">なし</span>}
      {entries.map(([piece, count]) => (
        <button
          key={piece}
          type="button"
          disabled={!selectable}
          onClick={() => onSelect?.(piece)}
          className={`flex items-center gap-1 rounded border px-2 py-1 text-sm font-bold ${
            selectedPiece === piece ? "border-amber-600 bg-amber-200" : "border-neutral-300 bg-white"
          } ${selectable ? "cursor-pointer hover:bg-amber-50" : "cursor-default"}`}
        >
          <span>{PIECE_KANJI[piece]}</span>
          {count > 1 && <span className="text-xs">x{count}</span>}
        </button>
      ))}
    </div>
  );
}
