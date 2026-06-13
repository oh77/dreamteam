import { cacheLife, cacheTag } from "next/cache";
import { TeamPitchView } from "@/components/TeamPitchView";
import { runPipeline, selectTeam } from "@/lib/fifa";

export default async function WorstTeamPage() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fifa-pipeline");
  const { players, teamCountry } = await runPipeline();
  const teamStrict = selectTeam(players, "worst", teamCountry, 2);
  const teamOpen = selectTeam(players, "worst", teamCountry);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          Fantasy Nightmare XI
        </h1>
        <p className="mt-1 text-sm text-red-400/80">
          Hall of Shame · The worst of the worst
        </p>
      </div>
      <TeamPitchView teamStrict={teamStrict} teamOpen={teamOpen} mode="worst" />
    </div>
  );
}
