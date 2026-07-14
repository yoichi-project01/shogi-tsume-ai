import { notFound } from "next/navigation";
import ArchivePuzzleRunner from "@/components/ArchivePuzzleRunner";
import { SAMPLE_PUZZLES, puzzleFromRow } from "@/lib/shogi/puzzles";
import { createClient } from "@/lib/supabase/server";
import type { Puzzle } from "@/lib/shogi/types";
import type { PuzzleRow } from "@/types/puzzle";

interface PuzzleDetailPageProps {
  params: Promise<{ id: string }>;
}

async function loadPuzzle(id: string): Promise<Puzzle | undefined> {
  const sample = SAMPLE_PUZZLES.find((p) => p.id === id);
  if (sample) return sample;

  try {
    const supabase = await createClient();
    const { data: row } = await supabase
      .from("puzzles")
      .select("*")
      .eq("id", id)
      .eq("status", "valid")
      .maybeSingle();
    if (row) return puzzleFromRow(row as PuzzleRow);
  } catch {
    // Supabase unavailable — fall through to notFound() below.
  }

  return undefined;
}

export default async function PuzzleDetailPage({ params }: PuzzleDetailPageProps) {
  const { id } = await params;
  const puzzle = await loadPuzzle(id);

  if (!puzzle) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <ArchivePuzzleRunner puzzle={puzzle} />
    </div>
  );
}
