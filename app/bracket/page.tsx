import { cacheLife, cacheTag } from "next/cache";
import type { BracketSlot, ThirdPlaceRow } from "@/lib/fifa";
import {
  fetchStandings,
  getRound32,
  getThirdPlaceRanking,
  runPipeline,
} from "@/lib/fifa";

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

function Side({ slot, align }: { slot: BracketSlot; align: "left" | "right" }) {
  const thirdFlags = slot.groupCountryCodes ?? [];
  return (
    <div
      className={`flex min-w-0 flex-col gap-0.5 ${align === "right" ? "items-end" : "items-start"}`}
    >
      <div
        className={`flex min-w-0 items-center gap-1.5 ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {slot.resolved ? (
          <>
            <Flag countryCode={slot.countryCode} />
            <span className="truncate font-semibold text-white">
              {slot.teamName}
            </span>
          </>
        ) : thirdFlags.length > 0 ? (
          // Best third-placed qualifiers: show each group's current third-placed
          // team as a flag (no name — FIFA assigns the actual matchup later).
          <div className="flex min-w-0 flex-wrap items-center gap-1">
            {thirdFlags.map((c) => (
              <Flag key={c} countryCode={c} />
            ))}
          </div>
        ) : (
          <span className="truncate text-sm text-white/40 italic">
            {slot.label}
          </span>
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-gold)]/60">
        {slot.code}
      </span>
    </div>
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

export default async function BracketPage() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fifa-pipeline");

  const { matches } = await runPipeline();
  const groupStageId =
    matches.find((m) => /first stage|group/i.test(m.stageName ?? ""))
      ?.stageId ?? "";
  const standings = groupStageId ? await fetchStandings(groupStageId) : {};
  const round32 = getRound32(matches, standings);

  if (round32.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="mb-4 text-6xl">🗺️</div>
        <h1 className="text-2xl font-bold text-white">Bracket unavailable</h1>
        <p className="mt-2 text-white/50">
          The knockout fixtures aren't published yet.
        </p>
      </div>
    );
  }

  // Best third-placed teams ranked head-to-head. The number that actually
  // qualify equals the count of third-place slots in the Round of 32 bracket.
  const thirdRanking = getThirdPlaceRanking(standings);
  const thirdQualifyCount = round32
    .flatMap((m) => [m.a, m.b])
    .filter((s) => /^3/.test(s.code)).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Round of 32</h1>
        <p className="mt-1 text-sm text-white/50">Projected bracket</p>
        <p className="mt-2 text-xs text-white/30">
          Group winners and runners-up are projected from current standings and
          will change as the group stage plays out. Third-placed qualifiers are
          shown as their group set until FIFA assigns them.
        </p>
      </div>

      <div className="space-y-2">
        {round32.map((m) => (
          <div
            key={`${m.a.code}-${m.b.code}`}
            className="glass grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl px-5 py-4"
          >
            <Side slot={m.a} align="right" />
            <span className="text-xs font-bold uppercase tracking-wider text-white/30">
              vs
            </span>
            <Side slot={m.b} align="left" />
          </div>
        ))}
      </div>

      {thirdRanking.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-black text-white">
            Third-placed ranking
          </h2>
          <p className="mt-1 mb-4 text-xs text-white/30">
            All third-placed teams ranked by points, then goal difference, then
            goals scored.
            {thirdQualifyCount > 0 &&
              ` The top ${thirdQualifyCount} advance to the Round of 32.`}
          </p>
          <ThirdPlaceTable
            rows={thirdRanking}
            qualifyCount={thirdQualifyCount}
          />
        </div>
      )}
    </div>
  );
}
