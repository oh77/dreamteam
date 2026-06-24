import { cacheLife, cacheTag } from "next/cache";
import type { ThirdPlaceRow } from "@/lib/fifa";
import { fetchStandings, getThirdPlaceRanking, runPipeline } from "@/lib/fifa";

function Flag({ countryCode }: { countryCode?: string }) {
  if (!countryCode) return null;
  return (
    <img
      src={`https://api.fifa.com/api/v3/picture/flags-sq-2/${countryCode}`}
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 shrink-0 rounded-sm object-cover"
    />
  );
}

function ThirdPlaceTable({
  rows,
  qualifyCount,
}: {
  rows: ThirdPlaceRow[];
  qualifyCount: number;
}) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="grid grid-cols-[1.5rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem] items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white/30">
        <span className="text-right">#</span>
        <span>Team</span>
        <span className="text-right">P</span>
        <span className="text-right">Pts</span>
        <span className="text-right">GD</span>
        <span className="text-right">GF</span>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((r, i) => {
          const qualifies = qualifyCount > 0 && i < qualifyCount;
          return (
            <div
              key={r.teamId}
              className={`grid grid-cols-[1.5rem_1fr_2.5rem_2.5rem_2.5rem_2.5rem] items-center gap-2 px-4 py-2.5 ${
                qualifies ? "" : "opacity-50"
              }`}
            >
              <span className="text-right text-sm font-bold tabular-nums text-white/40">
                {i + 1}
              </span>
              <div className="flex min-w-0 items-center gap-2">
                <Flag countryCode={r.countryCode} />
                <span className="truncate text-sm font-semibold text-white">
                  {r.teamName}
                </span>
                <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/60">
                  {r.group}
                </span>
              </div>
              <span className="text-right text-sm tabular-nums text-white/60">
                {r.played}
              </span>
              <span className="text-right text-sm font-bold tabular-nums text-[color:var(--color-gold)]">
                {r.points}
              </span>
              <span className="text-right text-sm tabular-nums text-white/60">
                {r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}
              </span>
              <span className="text-right text-sm tabular-nums text-white/60">
                {r.goalsFor}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function ThirdPlacePage() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fifa-pipeline");

  const { matches } = await runPipeline();
  const groupStageId =
    matches.find((m) => /first stage|group/i.test(m.stageName ?? ""))
      ?.stageId ?? "";
  const standings = groupStageId ? await fetchStandings(groupStageId) : {};

  // Best third-placed teams ranked head-to-head. The number that actually
  // qualify equals the count of third-place slots ("3…") in the Round of 32.
  const thirdRanking = getThirdPlaceRanking(standings);
  const thirdQualifyCount = matches
    .filter((m) => /round of 32/i.test(m.stageName ?? ""))
    .flatMap((m) => [m.placeholderA, m.placeholderB])
    .filter((c) => c && /^3/.test(c)).length;

  if (thirdRanking.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mb-4 text-6xl">🥉</div>
        <h1 className="text-2xl font-bold text-white">Ranking unavailable</h1>
        <p className="mt-2 text-white/50">
          Group standings aren't published yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Third-placed ranking</h1>
        <p className="mt-1 text-sm text-white/50">
          All third-placed teams ranked by points, then goal difference, then
          goals scored.
          {thirdQualifyCount > 0 &&
            ` The top ${thirdQualifyCount} advance to the Round of 32.`}
        </p>
      </div>

      <ThirdPlaceTable rows={thirdRanking} qualifyCount={thirdQualifyCount} />
    </div>
  );
}
