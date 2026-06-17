import { cacheLife, cacheTag } from "next/cache";
import type { BracketMatch, BracketSlot } from "@/lib/fifa";
import { fetchStandings, getRound32, runPipeline } from "@/lib/fifa";

function formatDate(dateStr: string): string {
  if (dateStr === "TBD") return "Date TBD";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function groupByDate(items: BracketMatch[]): Map<string, BracketMatch[]> {
  const groups = new Map<string, BracketMatch[]>();
  for (const m of items) {
    const key = m.date ? m.date.slice(0, 10) : "TBD";
    if (!groups.has(key)) groups.set(key, []);
    (groups.get(key) ?? []).push(m);
  }
  return groups;
}

function flag(countryCode?: string) {
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
  const team = slot.resolved ? (
    <span className="truncate font-semibold text-white">{slot.teamName}</span>
  ) : (
    <span className="truncate text-sm text-white/40 italic">{slot.label}</span>
  );
  return (
    <div
      className={`flex min-w-0 flex-col gap-0.5 ${align === "right" ? "items-end" : "items-start"}`}
    >
      <div
        className={`flex min-w-0 items-center gap-1.5 ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {slot.resolved && flag(slot.countryCode)}
        {team}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-gold)]/60">
        {slot.code}
      </span>
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

  const grouped = groupByDate(round32);

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

      <div className="space-y-8">
        {[...grouped.entries()].map(([dateKey, dayMatches]) => (
          <div key={dateKey}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[color:var(--color-gold)]">
              {formatDate(dateKey)}
            </h2>
            <div className="space-y-2">
              {dayMatches.map((m) => (
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
          </div>
        ))}
      </div>
    </div>
  );
}
