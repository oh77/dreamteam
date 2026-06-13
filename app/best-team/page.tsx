import { cacheLife, cacheTag } from "next/cache";
import { TeamPitchView } from "@/components/TeamPitchView";
import { runPipeline, selectTeam } from "@/lib/fifa";

export default async function BestTeamPage() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fifa-pipeline");
  const { players, teamCountry } = await runPipeline();
  const teamStrict = selectTeam(players, "best", teamCountry, 2);
  const teamOpen = selectTeam(players, "best", teamCountry);

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
      <TeamPitchView teamStrict={teamStrict} teamOpen={teamOpen} mode="best" />
    </div>
  );
}
