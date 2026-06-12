import type { NextRequest } from "next/server";
import type { Position } from "@/lib/fifa";
import { runPipeline } from "@/lib/fifa";

export async function GET(request: NextRequest) {
  const { players } = await runPipeline();
  const pos = request.nextUrl.searchParams.get("position") as Position | null;

  const filtered = pos
    ? players.filter((p) => p.player.position === pos)
    : players;

  return Response.json(filtered);
}
