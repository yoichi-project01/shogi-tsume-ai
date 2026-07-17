import type { PieceType } from "@/lib/shogi/types";
import { PIECE_KANJI, pieceMoveShape } from "@/lib/shogi/rules";

const SIZE = 5;
const CENTER = 2;

interface PieceMoveDiagramProps {
  type: PieceType;
  size?: "sm" | "md";
}

/** Small board diagram showing every square a piece can reach from the center. Sliding pieces
 * are shown as a filled line all the way to the edge of the diagram, standing in for "as far as it likes". */
export default function PieceMoveDiagram({ type, size = "md" }: PieceMoveDiagramProps) {
  const { offsets, sliding } = pieceMoveShape(type, "sente");
  const reachable = new Set<string>();

  for (const [dr, dc] of offsets) {
    const r = CENTER + dr;
    const c = CENTER + dc;
    if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) reachable.add(`${r},${c}`);
  }
  for (const [dr, dc] of sliding) {
    for (let step = 1; step < SIZE; step++) {
      const r = CENTER + dr * step;
      const c = CENTER + dc * step;
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) break;
      reachable.add(`${r},${c}`);
    }
  }

  const cellSize = size === "sm" ? "h-7 w-7 text-sm sm:h-8 sm:w-8" : "h-8 w-8 text-base sm:h-9 sm:w-9";

  return (
    <div className="inline-grid grid-cols-5 gap-0.5">
      {Array.from({ length: SIZE }, (_, r) =>
        Array.from({ length: SIZE }, (_, c) => {
          const key = `${r},${c}`;
          const isCenter = r === CENTER && c === CENTER;
          const isReachable = reachable.has(key);
          return (
            <div
              key={key}
              className={`flex items-center justify-center rounded-sm border font-bold ${cellSize} ${
                isCenter
                  ? "border-neutral-800 bg-amber-200 text-neutral-900"
                  : isReachable
                    ? "border-green-400 bg-green-100 text-green-600"
                    : "border-neutral-200 bg-white"
              }`}
            >
              {isCenter ? PIECE_KANJI[type] : isReachable ? "●" : ""}
            </div>
          );
        }),
      )}
    </div>
  );
}
