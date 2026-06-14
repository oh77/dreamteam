export interface LeaderRow {
  id: string;
  name: string;
  countryCode: string;
  value: number;
  matchesPlayed: number;
}

function flag(countryCode: string) {
  if (!countryCode) return <div className="h-4 w-4 shrink-0" />;
  return (
    <img
      src={`https://api.fifa.com/api/v3/picture/flags-sq-2/${countryCode}`}
      alt=""
      width={16}
      height={16}
      className="h-4 w-4 shrink-0 rounded-sm object-cover"
    />
  );
}

const rankColor = (i: number) =>
  i === 0
    ? "text-[color:var(--color-gold)]"
    : i === 1
      ? "text-[color:var(--color-silver)]"
      : i === 2
        ? "text-[color:var(--color-bronze)]"
        : "text-white/30";

export function StatLeaderboard({
  title,
  icon,
  leaders,
  accent,
}: {
  title: string;
  icon: string;
  leaders: LeaderRow[];
  accent: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">
          {title}
        </h2>
      </div>

      {leaders.length === 0 ? (
        <p className="py-6 text-center text-xs text-white/30">No data yet</p>
      ) : (
        <ol className="space-y-0.5">
          {leaders.map((l, i) => (
            <li
              key={l.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5"
            >
              <span
                className={`w-5 shrink-0 text-right text-xs font-black tabular-nums ${rankColor(i)}`}
              >
                {i + 1}
              </span>
              {flag(l.countryCode)}
              <span className="min-w-0 flex-1 truncate text-sm text-white/80">
                {l.name}
              </span>
              <span className="shrink-0 text-[11px] tabular-nums text-white/25">
                {l.matchesPlayed} GP
              </span>
              <span
                className={`w-7 shrink-0 text-right font-bold tabular-nums ${accent}`}
              >
                {l.value}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
