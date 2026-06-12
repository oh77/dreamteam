import { runPipeline } from "@/lib/fifa";

export async function GET() {
  const { players, matches, fetchedAt } = await runPipeline();

  const finishedMatches = matches.filter((m) => m.finished);
  const upcomingMatches = matches.filter((m) => !m.finished);

  const teamIds = new Set(players.map((p) => p.player.teamId));

  return Response.json({
    totalPlayers: players.length,
    totalMatches: matches.length,
    finishedMatches: finishedMatches.length,
    upcomingMatches: upcomingMatches.length,
    totalTeams: teamIds.size,
    fetchedAt,
  });
}
