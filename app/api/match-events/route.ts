import type { NextRequest } from "next/server";
import type { MatchInfo } from "@/lib/fifa";
import { getMatchEventSummary } from "@/lib/fifa";

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const stageId = p.get("stageId") ?? "";
  const matchId = p.get("matchId") ?? "";
  const homeTeamId = p.get("homeTeamId") ?? "";
  const awayTeamId = p.get("awayTeamId") ?? "";
  const homeTeamName = p.get("homeTeamName") ?? "";
  const awayTeamName = p.get("awayTeamName") ?? "";
  const homeScore = Number(p.get("homeScore") ?? 0);
  const awayScore = Number(p.get("awayScore") ?? 0);

  if (!stageId || !matchId) {
    return Response.json(
      { error: "stageId and matchId required" },
      { status: 400 },
    );
  }

  const match: MatchInfo = {
    matchId,
    stageId,
    homeTeamId,
    homeTeamName,
    awayTeamId,
    awayTeamName,
    homeScore,
    awayScore,
    finished: true,
    date: null,
    stageName: null,
  };

  const summary = await getMatchEventSummary(match);
  return Response.json(summary);
}
