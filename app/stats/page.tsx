import { cacheLife, cacheTag } from "next/cache";
import { type LeaderRow, StatLeaderboard } from "@/components/StatLeaderboard";
import {
  getStatLeaders,
  getTeamStatLeaders,
  runPipeline,
  type StatLeader,
  type TeamStatLeader,
} from "@/lib/fifa";

const playerRow = (l: StatLeader): LeaderRow => ({
  id: l.playerId,
  name: l.name,
  countryCode: l.countryCode,
  value: l.value,
  matchesPlayed: l.matchesPlayed,
});

const teamRow = (l: TeamStatLeader): LeaderRow => ({
  id: l.teamId,
  name: l.teamName,
  countryCode: l.countryCode,
  value: l.value,
  matchesPlayed: l.matchesPlayed,
});

export default async function StatsPage() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fifa-pipeline");

  const { players, matches, teamCountry } = await runPipeline();
  const leaders = getStatLeaders(players, teamCountry);
  const teamLeaders = getTeamStatLeaders(players, matches);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Stats</h1>
        <p className="mt-1 text-sm text-white/50">Tournament leaderboards</p>
      </div>

      {/* Players — top 10 */}
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[color:var(--color-gold)]">
        Players · Top 10
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatLeaderboard
          title="Top Scorers"
          icon="⚽"
          leaders={leaders.scorers.map(playerRow)}
          accent="text-emerald-400"
        />
        <StatLeaderboard
          title="GK Goals Conceded"
          icon="🧤"
          leaders={leaders.gkConceded.map(playerRow)}
          accent="text-red-400"
        />
        <StatLeaderboard
          title="Yellow Cards"
          icon="🟨"
          leaders={leaders.yellowCards.map(playerRow)}
          accent="text-amber-400"
        />
        <StatLeaderboard
          title="Red Cards"
          icon="🟥"
          leaders={leaders.redCards.map(playerRow)}
          accent="text-red-400"
        />
      </div>

      {/* Teams — top 5 */}
      <h2 className="mt-8 mb-3 text-xs font-bold uppercase tracking-widest text-[color:var(--color-gold)]">
        Teams · Top 5
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatLeaderboard
          title="Goals Scored"
          icon="⚽"
          leaders={teamLeaders.scorers.map(teamRow)}
          accent="text-emerald-400"
        />
        <StatLeaderboard
          title="Goals Conceded"
          icon="🧤"
          leaders={teamLeaders.conceded.map(teamRow)}
          accent="text-red-400"
        />
        <StatLeaderboard
          title="Yellow Cards"
          icon="🟨"
          leaders={teamLeaders.yellowCards.map(teamRow)}
          accent="text-amber-400"
        />
        <StatLeaderboard
          title="Red Cards"
          icon="🟥"
          leaders={teamLeaders.redCards.map(teamRow)}
          accent="text-red-400"
        />
      </div>
    </div>
  );
}
