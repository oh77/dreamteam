"use client";

import { useState } from "react";
import type { MatchEventSummary, MatchInfo } from "@/lib/fifa";

type Side = "home" | "away" | "draw";

function matchOutcome(homeScore: number, awayScore: number): Side {
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  return "draw";
}

const sideStyle: Record<Side, { home: string; away: string }> = {
  home: { home: "text-emerald-400 font-black", away: "text-red-400/70" },
  away: { home: "text-red-400/70", away: "text-emerald-400 font-black" },
  draw: { home: "text-amber-400 font-bold", away: "text-amber-400 font-bold" },
};

function EventRow({
  minute,
  label,
  sub,
  side,
}: {
  minute: number;
  label: string;
  sub?: string;
  side: "left" | "right" | "center";
}) {
  return (
    <div
      className={`flex items-baseline gap-2 text-xs ${
        side === "right" ? "flex-row-reverse text-right" : ""
      } ${side === "center" ? "justify-center" : ""}`}
    >
      <span className="text-white/30 tabular-nums w-7 shrink-0 text-right">
        {minute}&apos;
      </span>
      <span className="text-white/80">{label}</span>
      {sub && <span className="text-white/40 text-[10px]">{sub}</span>}
    </div>
  );
}

export function MatchResultCard({ match }: { match: MatchInfo }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MatchEventSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const outcome = matchOutcome(match.homeScore, match.awayScore);
  const styles = sideStyle[outcome];

  async function handleToggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (data) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        stageId: match.stageId,
        matchId: match.matchId,
        homeTeamId: match.homeTeamId,
        homeTeamName: match.homeTeamName,
        awayTeamId: match.awayTeamId,
        awayTeamName: match.awayTeamName,
        homeScore: String(match.homeScore),
        awayScore: String(match.awayScore),
      });
      const res = await fetch(`/api/match-events?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const hasEvents =
    data &&
    (data.goals.length > 0 ||
      data.yellowCards.length > 0 ||
      data.redCards.length > 0 ||
      data.cleanSheets.length > 0);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Score row */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-5 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
      >
        <div
          className={`flex-1 text-right text-sm sm:text-base ${styles.home}`}
        >
          {match.homeTeamName}
        </div>

        <div className="flex items-center gap-1.5 min-w-[80px] justify-center shrink-0">
          <span className={`text-2xl font-black tabular-nums ${styles.home}`}>
            {match.homeScore}
          </span>
          <span className="text-white/30 font-light">–</span>
          <span className={`text-2xl font-black tabular-nums ${styles.away}`}>
            {match.awayScore}
          </span>
        </div>

        <div className={`flex-1 text-sm sm:text-base ${styles.away}`}>
          {match.awayTeamName}
        </div>

        <span
          className={`ml-1 text-white/30 text-xs transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {match.stageName && !open && (
        <div className="pb-2 text-center">
          <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">
            {match.stageName}
          </span>
        </div>
      )}

      {/* Expanded events */}
      {open && (
        <div className="border-t border-white/10 px-5 py-4">
          {match.stageName && (
            <div className="mb-3 text-center">
              <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">
                {match.stageName}
              </span>
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-4">
              <span className="text-white/30 text-sm animate-pulse">
                Loading events…
              </span>
            </div>
          )}

          {!loading && data && !hasEvents && (
            <p className="text-center text-xs text-white/30 py-2">
              No events recorded
            </p>
          )}

          {!loading && data && hasEvents && (
            <div className="space-y-4">
              {/* Goals */}
              {data.goals.length > 0 && (
                <div>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30 text-center">
                    ⚽ Goals
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {data.goals.map((g, i) => {
                      const isHome = g.teamId === match.homeTeamId;
                      return (
                        <EventRow
                          // biome-ignore lint/suspicious/noArrayIndexKey: events are ordered, stable
                          key={i}
                          minute={g.minute}
                          label={
                            g.isOwnGoal ? `${g.playerName} (OG)` : g.playerName
                          }
                          side={isHome ? "left" : "right"}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cards */}
              {(data.yellowCards.length > 0 || data.redCards.length > 0) && (
                <div>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30 text-center">
                    Cards
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {data.yellowCards.map((c, i) => {
                      const isHome = c.teamId === match.homeTeamId;
                      return (
                        <EventRow
                          // biome-ignore lint/suspicious/noArrayIndexKey: events are ordered, stable
                          key={`y${i}`}
                          minute={c.minute}
                          label={c.playerName}
                          sub={c.isDoubleYellow ? "🟨🟨" : "🟨"}
                          side={isHome ? "left" : "right"}
                        />
                      );
                    })}
                    {data.redCards.map((c, i) => {
                      const isHome = c.teamId === match.homeTeamId;
                      return (
                        <EventRow
                          // biome-ignore lint/suspicious/noArrayIndexKey: events are ordered, stable
                          key={`r${i}`}
                          minute={c.minute}
                          label={c.playerName}
                          sub={c.isDoubleYellow ? undefined : "🟥"}
                          side={isHome ? "left" : "right"}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Clean sheets */}
              {data.cleanSheets.length > 0 && (
                <div>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30 text-center">
                    🧤 Clean Sheet{data.cleanSheets.length > 1 ? "s" : ""}
                  </div>
                  <div className="flex justify-center gap-6">
                    {data.cleanSheets.map((cs, i) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: max 2, stable
                        key={i}
                        className="text-center"
                      >
                        <div className="text-xs text-white/70">
                          {cs.playerName}
                        </div>
                        <div className="text-[10px] text-white/30">
                          {cs.teamId === match.homeTeamId
                            ? match.homeTeamName
                            : match.awayTeamName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
