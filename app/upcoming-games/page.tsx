import { cacheLife, cacheTag } from "next/cache";
import UpcomingGamesList from "@/components/UpcomingGamesList";
import type { StandingRow } from "@/lib/fifa";
import {
  fetchStandings,
  fetchSwedishBroadcasts,
  GROUP_STAGE_ROUNDS,
  getGroupGameNumbers,
  runPipeline,
} from "@/lib/fifa";

export default async function UpcomingGamesPage() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fifa-pipeline", "fifa-broadcasts");
  const [{ matches }, broadcasts] = await Promise.all([
    runPipeline(),
    fetchSwedishBroadcasts(),
  ]);
  const groupGame = getGroupGameNumbers(matches);
  const upcoming = matches.filter((m) => !m.finished);

  // The group-stage standings power the "current position" section. All group
  // matches share one stageId, so derive it from any group-stage fixture.
  const groupStageId = matches.find((m) => groupGame[m.matchId])?.stageId ?? "";
  const standings = await fetchStandings(groupStageId);

  // teamId -> group letter, so a card can find the relevant group table.
  const teamToGroup: Record<string, string> = {};
  for (const [letter, rows] of Object.entries(standings)) {
    for (const r of rows as StandingRow[]) teamToGroup[r.teamId] = letter;
  }

  if (upcoming.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-2xl font-bold text-white">Tournament Complete</h1>
        <p className="mt-2 text-white/50">
          All matches have been played. Check the Results page.
        </p>
      </div>
    );
  }

  const sorted = [...upcoming].sort((a, b) => {
    if (a.live !== b.live) return a.live ? -1 : 1; // live first
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Upcoming Games</h1>
        <p className="mt-1 text-white/50 text-sm">
          {upcoming.length} matches remaining · times in CET · tap a game for
          details
        </p>
      </div>

      <UpcomingGamesList
        matches={matches}
        upcoming={sorted}
        broadcasts={broadcasts}
        groupGame={groupGame}
        groupStageRounds={GROUP_STAGE_ROUNDS}
        standings={standings}
        teamToGroup={teamToGroup}
      />
    </div>
  );
}
