import { cacheLife, cacheTag } from "next/cache";
import { TeamPitchView } from "@/components/TeamPitchView";
import { getAdvancedTeamIds, runPipeline, selectTeam } from "@/lib/fifa";

export default async function BestTeamPage() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fifa-pipeline");
  const { players, teamCountry, matches } = await runPipeline();
  const teamStrict = selectTeam(players, "best", teamCountry, 2);
  const teamOpen = selectTeam(players, "best", teamCountry);

  // "Best of the rest" — players whose nation did not advance from stage 1.
  const advanced = getAdvancedTeamIds(matches);
  const eliminated = players.filter((p) => !advanced.has(p.player.teamId));
  const altStrict = selectTeam(eliminated, "best", teamCountry, 2);
  const altOpen = selectTeam(eliminated, "best", teamCountry);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          Best Fantasy XI
        </h1>
        <p className="mt-1 text-white/50 text-sm">
          Optimal 1-3-4-3 formation by points scored
        </p>
      </div>
      <TeamPitchView
        teamStrict={teamStrict}
        teamOpen={teamOpen}
        altTeamStrict={altStrict}
        altTeamOpen={altOpen}
        primaryLabel="All players"
        altLabel="Didn't advance from stage 1"
        mode="best"
      />
    </div>
  );
}
