import { cacheLife, cacheTag } from "next/cache";
import { MatchResultCard } from "@/components/MatchResultCard";
import type { MatchInfo } from "@/lib/fifa";
import { runPipeline } from "@/lib/fifa";

function groupByDate(matches: MatchInfo[]): Map<string, MatchInfo[]> {
  const groups = new Map<string, MatchInfo[]>();
  for (const m of matches) {
    const key = m.date ? m.date.slice(0, 10) : "Unknown";
    if (!groups.has(key)) groups.set(key, []);
    (groups.get(key) ?? []).push(m);
  }
  return groups;
}

function formatDate(dateStr: string): string {
  if (dateStr === "Unknown") return "Unknown Date";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function ResultsPage() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fifa-pipeline");
  const { matches } = await runPipeline();
  const finished = matches.filter((m) => m.finished);
  // Live matches show here too, pinned above the finished results.
  const shown = matches.filter((m) => m.finished || m.live);

  if (shown.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <div className="text-6xl mb-4">📅</div>
        <h1 className="text-2xl font-bold text-white">No results yet</h1>
        <p className="mt-2 text-white/50">
          The tournament hasn't started. Check back soon.
        </p>
      </div>
    );
  }

  const sorted = [...shown].sort((a, b) => {
    if (a.live !== b.live) return a.live ? -1 : 1; // live first
    if (!a.date) return 1;
    if (!b.date) return -1;
    return b.date.localeCompare(a.date);
  });

  const grouped = groupByDate(sorted);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Results</h1>
        <p className="mt-1 text-white/50 text-sm">
          {finished.length} matches played · tap a match for details
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
                <MatchResultCard key={m.matchId} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
