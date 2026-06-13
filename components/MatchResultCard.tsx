"use client";

import { useState } from "react";
import type {
  MatchEventSummary,
  MatchInfo,
  MatchPlayerPoints,
  MatchTimelineEntry,
  TimelineEntryKind,
} from "@/lib/fifa";

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

const outcomeLabel: Record<"WIN" | "DRAW" | "LOSS", string> = {
  WIN: "WIN",
  DRAW: "DRAW",
  LOSS: "LOSS",
};

const outcomeColor: Record<"WIN" | "DRAW" | "LOSS", string> = {
  WIN: "text-emerald-400",
  DRAW: "text-amber-400",
  LOSS: "text-red-400/70",
};

function flagImg(countryCode: string, size = 5) {
  if (!countryCode) return null;
  const url = `https://api.fifa.com/api/v3/picture/flags-sq-2/${countryCode}`;
  return (
    <img
      src={url}
      alt=""
      width={size * 4}
      height={size * 4}
      className={`w-${size} h-${size} rounded-sm object-cover shrink-0`}
    />
  );
}

const posColor: Record<string, string> = {
  GK: "bg-amber-400/20 text-amber-300",
  DEF: "bg-blue-500/20 text-blue-300",
  MID: "bg-emerald-500/20 text-emerald-300",
  ATT: "bg-red-500/20 text-red-300",
};

function PlayerPointsRow({ player }: { player: MatchPlayerPoints }) {
  const icons: string[] = [];
  if (player.goalsScored > 0)
    icons.push(`⚽${player.goalsScored > 1 ? `×${player.goalsScored}` : ""}`);
  if (player.ownGoals > 0)
    icons.push(`⚽(OG)${player.ownGoals > 1 ? `×${player.ownGoals}` : ""}`);
  if (player.cleanSheet) icons.push("🧤");
  if (player.goalsConceded > 0)
    icons.push(
      `⚽−${player.goalsConceded > 1 ? `×${player.goalsConceded}` : ""}`,
    );
  if (player.yellowCards > 0)
    icons.push(`🟨${player.yellowCards > 1 ? `×${player.yellowCards}` : ""}`);
  if (player.redCards > 0)
    icons.push(`🟥${player.redCards > 1 ? `×${player.redCards}` : ""}`);

  const pts = player.specialPoints;

  return (
    <div className="flex items-center gap-2 py-1 text-xs">
      <span className="text-white/80 min-w-0 truncate flex-1">
        {player.playerName}
      </span>
      <span
        className={`rounded px-1 py-0.5 text-[10px] font-bold uppercase shrink-0 ${posColor[player.position]}`}
      >
        {player.position}
      </span>
      <span className="text-white/40 shrink-0 text-[11px]">
        {icons.join(" ")}
      </span>
      <span
        className={`font-bold tabular-nums shrink-0 w-8 text-right ${pts > 0 ? "text-emerald-400" : pts < 0 ? "text-red-400" : "text-white/30"}`}
      >
        {pts > 0 ? `+${pts}` : pts}
      </span>
    </div>
  );
}

const kindMarker: Record<TimelineEntryKind, string> = {
  goal: "⚽",
  owngoal: "⚽",
  yellow: "🟨",
  red: "🟥",
  yellowred: "🟥",
  sub: "🔄",
};

function EventLabel({ entry }: { entry: MatchTimelineEntry }) {
  if (entry.kind === "sub") {
    return (
      <span className="inline-flex items-center gap-1 text-xs">
        <span className="text-emerald-400">{entry.subIn ?? "—"}</span>
        <span className="text-white/25">↔</span>
        <span className="text-red-400/60">{entry.player}</span>
      </span>
    );
  }
  return (
    <span className="text-xs text-white/80">
      {entry.player}
      {entry.penalty && <span className="text-white/40"> (pen)</span>}
      {entry.kind === "owngoal" && (
        <span className="text-red-400/70"> (OG)</span>
      )}
      {entry.kind === "yellowred" && (
        <span className="text-white/40"> (2nd yellow)</span>
      )}
    </span>
  );
}

function EventRow({ entry }: { entry: MatchTimelineEntry }) {
  const isHome = entry.side === "home";
  const marker = (
    <span className="shrink-0 text-xs leading-none">
      {kindMarker[entry.kind]}
    </span>
  );
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1">
      <div className="flex items-center justify-end gap-1.5">
        {isHome && (
          <>
            <EventLabel entry={entry} />
            {marker}
          </>
        )}
      </div>
      <div className="min-w-[2.5rem] text-center text-[11px] font-bold tabular-nums text-white/40">
        {entry.minuteLabel}
      </div>
      <div className="flex items-center justify-start gap-1.5">
        {!isHome && (
          <>
            {marker}
            <EventLabel entry={entry} />
          </>
        )}
      </div>
    </div>
  );
}

function EventsTimeline({ timeline }: { timeline: MatchTimelineEntry[] }) {
  if (timeline.length === 0) {
    return (
      <p className="text-center text-xs text-white/30 py-2">
        No events recorded
      </p>
    );
  }
  return (
    <div className="divide-y divide-white/5">
      {timeline.map((e, i) => (
        <EventRow
          key={`${e.minute}-${e.side}-${e.kind}-${e.player}-${i}`}
          entry={e}
        />
      ))}
    </div>
  );
}

export function MatchResultCard({ match }: { match: MatchInfo }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<MatchEventSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"points" | "events">("points");

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
        homeCountryCode: match.homeCountryCode,
        awayTeamId: match.awayTeamId,
        awayTeamName: match.awayTeamName,
        awayCountryCode: match.awayCountryCode,
        homeScore: String(match.homeScore),
        awayScore: String(match.awayScore),
      });
      const res = await fetch(`/api/match-events?${params}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  const homePlayers =
    data?.players.filter((p) => p.teamId === match.homeTeamId) ?? [];
  const awayPlayers =
    data?.players.filter((p) => p.teamId === match.awayTeamId) ?? [];
  const hasPlayers = homePlayers.length > 0 || awayPlayers.length > 0;

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Score row */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-5 py-4 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
      >
        <div
          className={`flex-1 min-w-0 flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:justify-end sm:gap-2 text-sm sm:text-base ${styles.home}`}
        >
          {flagImg(match.homeCountryCode, 5)}
          <span className="max-w-full break-words text-center leading-tight sm:order-first sm:truncate sm:text-right">
            {match.homeTeamName}
          </span>
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

        <div
          className={`flex-1 min-w-0 flex flex-col items-center gap-1 sm:flex-row sm:items-center sm:justify-start sm:gap-2 text-sm sm:text-base ${styles.away}`}
        >
          {flagImg(match.awayCountryCode, 5)}
          <span className="max-w-full break-words text-center leading-tight sm:truncate sm:text-left">
            {match.awayTeamName}
          </span>
        </div>

        <span
          className={`ml-1 text-white/30 text-xs transition-transform shrink-0 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {match.live && (
        <div className="pb-2 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400 ring-1 ring-red-500/30">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
            </span>
            Live{match.matchMinute ? ` · ${match.matchMinute}` : ""}
          </span>
        </div>
      )}

      {match.stageName && !open && !match.live && (
        <div className="pb-2 text-center">
          <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">
            {match.stageName}
          </span>
        </div>
      )}

      {/* Expanded dream-team points */}
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
                Loading…
              </span>
            </div>
          )}

          {!loading && data && (
            <div className="space-y-4">
              {/* View toggle */}
              <div className="flex justify-center">
                <div className="inline-flex rounded-lg bg-white/5 p-0.5">
                  {(["points", "events"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                        view === v
                          ? "bg-white/15 text-white"
                          : "text-white/40 hover:text-white/70"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {view === "events" ? (
                <div className="space-y-2">
                  {/* Home / Away header */}
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pb-1">
                    <div className="flex items-center justify-end gap-1.5 min-w-0">
                      <span className="truncate text-[10px] font-bold uppercase tracking-widest text-white/30">
                        {match.homeTeamName}
                      </span>
                      {flagImg(data.homeCountryCode, 4)}
                    </div>
                    <div className="min-w-[2.5rem] text-center text-[10px] uppercase tracking-widest text-white/20">
                      min
                    </div>
                    <div className="flex items-center justify-start gap-1.5 min-w-0">
                      {flagImg(data.awayCountryCode, 4)}
                      <span className="truncate text-[10px] font-bold uppercase tracking-widest text-white/30">
                        {match.awayTeamName}
                      </span>
                    </div>
                  </div>
                  <EventsTimeline timeline={data.timeline} />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Match result row */}
                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        {
                          teamName: match.homeTeamName,
                          countryCode: data.homeCountryCode,
                          outcome: data.homeOutcome,
                          pts: data.homeResultPoints,
                        },
                        {
                          teamName: match.awayTeamName,
                          countryCode: data.awayCountryCode,
                          outcome: data.awayOutcome,
                          pts: data.awayResultPoints,
                        },
                      ] as const
                    ).map((side) => (
                      <div
                        key={side.teamName}
                        className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2"
                      >
                        {flagImg(side.countryCode, 5)}
                        <div className="min-w-0">
                          <div className="text-xs text-white/50 truncate">
                            {side.teamName}
                          </div>
                          <div
                            className={`text-sm font-bold ${outcomeColor[side.outcome]}`}
                          >
                            {outcomeLabel[side.outcome]}{" "}
                            <span className="text-white/40 font-normal text-xs">
                              {side.pts > 0 ? `+${side.pts}` : side.pts}{" "}
                              pts/player
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Player points */}
                  {hasPlayers && (
                    <div className="space-y-3">
                      {homePlayers.length > 0 && (
                        <div>
                          <div className="mb-1 flex items-center gap-1.5">
                            {flagImg(data.homeCountryCode, 4)}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                              {match.homeTeamName}
                            </span>
                          </div>
                          <div className="divide-y divide-white/5">
                            {homePlayers.map((p) => (
                              <PlayerPointsRow key={p.playerName} player={p} />
                            ))}
                          </div>
                        </div>
                      )}

                      {awayPlayers.length > 0 && (
                        <div>
                          <div className="mb-1 flex items-center gap-1.5">
                            {flagImg(data.awayCountryCode, 4)}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                              {match.awayTeamName}
                            </span>
                          </div>
                          <div className="divide-y divide-white/5">
                            {awayPlayers.map((p) => (
                              <PlayerPointsRow key={p.playerName} player={p} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!hasPlayers && (
                    <p className="text-center text-xs text-white/30 py-2">
                      No special events recorded
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
