"use client";

import type { Piece as PieceModel } from "@/lib/shogi/types";
import { PIECE_KANJI } from "@/lib/shogi/rules";

const PROMOTED = new Set(["TO", "NY", "NK", "NG", "UM", "RY"]);

interface PieceProps {
  piece: PieceModel;
  size?: "sm" | "md";
}

export default function Piece({ piece, size = "md" }: PieceProps) {
  const isPromoted = PROMOTED.has(piece.type);
  const textSize = size === "sm" ? "text-lg" : "text-2xl";

  return (
    <div
      className={`flex h-full w-full select-none items-center justify-center font-bold ${textSize} ${
        piece.owner === "gote" ? "rotate-180" : ""
      } ${isPromoted ? "text-red-600" : "text-neutral-900"}`}
    >
      {PIECE_KANJI[piece.type]}
    </div>
  );
}
