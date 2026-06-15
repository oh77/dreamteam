import { cacheLife, cacheTag } from "next/cache";
import { ClubTable } from "@/components/ClubTable";
import { getClubTeams, runPipeline } from "@/lib/fifa";

export default async function ClubsPage() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fifa-pipeline");

  const { players, teamCountry } = await runPipeline();
  const clubs = getClubTeams(players, teamCountry);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Clubs</h1>
        <p className="mt-1 text-sm text-white/50">
          A fantasy XI for each club, built from its World Cup players · tap a
          club for the lineup
        </p>
        <p className="mt-2 text-xs text-white/30">
          The max-2-per-nation rule is applied where possible, but is overruled
          when a position can only be filled by exceeding it.
        </p>
      </div>
      <ClubTable clubs={clubs} />
    </div>
  );
}
