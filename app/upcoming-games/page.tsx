import type { MatchInfo } from "@/lib/fifa";
import { runPipeline } from "@/lib/fifa";

function groupByDate(matches: MatchInfo[]): Map<string, MatchInfo[]> {
  const groups = new Map<string, MatchInfo[]>();
  for (const m of matches) {
    const key = m.date ? m.date.slice(0, 10) : "TBD";
    if (!groups.has(key)) groups.set(key, []);
    (groups.get(key) ?? []).push(m);
  }
  return groups;
}

function formatDate(dateStr: string): string {
  if (dateStr === "TBD") return "Date TBD";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(isoDate: string | null): string {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default async function UpcomingGamesPage() {
  const { matches } = await runPipeline();
  const upcoming = matches.filter((m) => !m.finished);

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
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  const grouped = groupByDate(sorted);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white">Upcoming Games</h1>
        <p className="mt-1 text-white/50 text-sm">
          {upcoming.length} matches remaining
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
                <div key={m.matchId} className="glass rounded-2xl px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    {/* Home team */}
                    <div className="flex-1 text-right">
                      <span className="font-semibold text-white text-sm sm:text-base">
                        {m.homeTeamName}
                      </span>
                    </div>

                    {/* VS + time */}
                    <div className="flex flex-col items-center gap-0.5 min-w-[64px]">
                      <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                        vs
                      </span>
                      {m.date && (
                        <span className="text-[10px] text-white/30">
                          {formatTime(m.date)}
                        </span>
                      )}
                    </div>

                    {/* Away team */}
                    <div className="flex-1">
                      <span className="font-semibold text-white text-sm sm:text-base">
                        {m.awayTeamName}
                      </span>
                    </div>
                  </div>

                  {m.stageName && (
                    <div className="mt-2 text-center">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">
                        {m.stageName}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
