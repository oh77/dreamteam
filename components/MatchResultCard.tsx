"use client";

import { useState } from "react";
import type {
  MatchEventSummary,
  MatchInfo,
  MatchPlayerPoints,
  MatchTimelineEntry,
  ShootoutInfo,
  ShootoutKick,
  TimelineEntryKind,
} from "@/lib/fifa";
import { Flag } from "./Flag";

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

const outcomeChip: Record<"WIN" | "DRAW" | "LOSS", string> = {
  WIN: "bg-emerald-500/20 text-emerald-300",
  DRAW: "bg-amber-400/20 text-amber-300",
  LOSS: "bg-red-500/20 text-red-300",
};

const FLAG_SIZE: Record<number, string> = { 4: "h-4 w-4", 5: "h-5 w-5" };

function flagImg(countryCode: string, size = 5) {
  return (
    <Flag countryCode={countryCode} className={FLAG_SIZE[size] ?? "h-5 w-5"} />
  );
}

const posColor: Record<string, string> = {
  GK: "bg-amber-400/20 text-amber-300",
  DEF: "bg-blue-500/20 text-blue-300",
  MID: "bg-emerald-500/20 text-emerald-300",
  ATT: "bg-red-500/20 text-red-300",
};

function PlayerPointsRow({ player }: { player: MatchPlayerPoints }) {
  // One icon per occurrence (e.g. two goals → ⚽⚽).
  const icons: string[] = [];
  if (player.goalsScored > 0) icons.push("⚽".repeat(player.goalsScored));
  if (player.ownGoals > 0) icons.push(`${"⚽".repeat(player.ownGoals)}(OG)`);
  if (player.cleanSheet) icons.push("🧤");
  if (player.goalsConceded > 0) icons.push("🔴".repeat(player.goalsConceded));
  if (player.yellowCards > 0) icons.push("🟨".repeat(player.yellowCards));
  if (player.redCards > 0) icons.push("🟥".repeat(player.redCards));

  const pts = player.specialPoints;

  // Squad members are credited for their nation's result even without playing;
  // de-emphasise those who didn't take the field.
  const dnp = !player.played;

  return (
    <div
      className={`flex items-center gap-2 py-1 text-xs ${dnp ? "opacity-45" : ""}`}
    >
      <span
        className={`rounded px-1 py-0.5 text-[10px] font-bold uppercase shrink-0 ${posColor[player.position]}`}
      >
        {player.position}
      </span>
      <span className="text-white/80 min-w-0 truncate flex-1">
        {player.playerName}
        {dnp && (
          <span className="ml-1.5 text-[9px] font-medium uppercase tracking-wider text-white/30">
            DNP
          </span>
        )}
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

function lastName(name: string | undefined): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  // Drop only the given name so multi-word surnames survive (e.g.
  // "Virgil VAN DIJK" → "VAN DIJK", "Scott MC TOMINAY" → "MC TOMINAY").
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
}

function EventContent({
  entry,
  align,
}: {
  entry: MatchTimelineEntry;
  align: "left" | "right";
}) {
  // Substitution: two rows — player on (↙) above, player off (↗) below.
  if (entry.kind === "sub") {
    return (
      <div
        className={`flex flex-col gap-0.5 text-xs ${align === "right" ? "items-end" : "items-start"}`}
      >
        <span className="inline-flex items-center gap-1 text-emerald-400">
          <span className="text-[10px] leading-none">←</span>
          <span>{lastName(entry.subIn)}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-red-400/70">
          <span className="text-[10px] leading-none">→</span>
          <span>{lastName(entry.player)}</span>
        </span>
      </div>
    );
  }

  const marker = (
    <span className="shrink-0 text-xs leading-none">
      {kindMarker[entry.kind]}
    </span>
  );
  const label = (
    <span className="text-xs text-white/80">
      {lastName(entry.player)}
      {entry.penalty && <span className="text-white/40"> (pen)</span>}
      {entry.kind === "owngoal" && (
        <span className="text-red-400/70"> (OG)</span>
      )}
      {entry.kind === "yellowred" && (
        <span className="text-white/40"> (2nd Y)</span>
      )}
    </span>
  );
  // Keep the icon nearest the centered minute column.
  return (
    <span className="inline-flex items-center gap-1.5">
      {align === "right" ? (
        <>
          {label}
          {marker}
        </>
      ) : (
        <>
          {marker}
          {label}
        </>
      )}
    </span>
  );
}

function EventRow({ entry }: { entry: MatchTimelineEntry }) {
  const isHome = entry.side === "home";
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1">
      <div className="flex items-center justify-end gap-1.5">
        {isHome && <EventContent entry={entry} align="right" />}
      </div>
      <div className="min-w-[2.5rem] text-center text-[11px] font-bold tabular-nums text-white/40">
        {entry.minuteLabel}
      </div>
      <div className="flex items-center justify-start gap-1.5">
        {!isHome && <EventContent entry={entry} align="left" />}
      </div>
    </div>
  );
}

function EventRows({ entries }: { entries: MatchTimelineEntry[] }) {
  return (
    <div className="divide-y divide-white/5">
      {entries.map((e, i) => (
        <EventRow
          key={`${e.minute}-${e.side}-${e.kind}-${e.player}-${i}`}
          entry={e}
        />
      ))}
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
  // Extra-time events run past the 90th minute (regular-time stoppage stays at
  // a leading minute of 90); split them off behind a plain, title-less divider.
  const regular = timeline.filter((e) => e.minute <= 90);
  const extra = timeline.filter((e) => e.minute > 90);
  return (
    <div>
      <EventRows entries={regular} />
      {extra.length > 0 && (
        <>
          {regular.length > 0 && (
            <div className="my-1.5 border-t border-white/10" />
          )}
          <EventRows entries={extra} />
        </>
      )}
    </div>
  );
}

// Green (scored) / red (missed) dots, in kick order, for one team.
function ShootoutDots({
  kicks,
  align,
}: {
  kicks: ShootoutKick[];
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-1 ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      {kicks.map((k, i) => (
        <span
          key={`${k.player}-${i}`}
          title={`${lastName(k.player)} — ${k.scored ? "scored" : "missed"}`}
          className={`h-2 w-2 rounded-full ${
            k.scored ? "bg-emerald-400" : "bg-red-500"
          }`}
        />
      ))}
    </div>
  );
}

function ShootoutKickRow({ kick }: { kick: ShootoutKick }) {
  const isHome = kick.side === "home";
  const marker = (
    <span
      className={`shrink-0 text-xs leading-none ${kick.scored ? "" : "text-red-400"}`}
    >
      {kick.scored ? "⚽" : "✗"}
    </span>
  );
  const label = (
    <span
      className={`text-xs ${kick.scored ? "text-white/80" : "text-white/40"}`}
    >
      {lastName(kick.player)}
    </span>
  );
  const content = (
    <span className="inline-flex items-center gap-1.5">
      {isHome ? (
        <>
          {label}
          {marker}
        </>
      ) : (
        <>
          {marker}
          {label}
        </>
      )}
    </span>
  );
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1">
      <div className="flex items-center justify-end gap-1.5">
        {isHome && content}
      </div>
      <div className="min-w-[2.5rem]" />
      <div className="flex items-center justify-start gap-1.5">
        {!isHome && content}
      </div>
    </div>
  );
}

// Penalty shoot-out: a divider carrying the result + green/red dots, then each
// kick listed in order, after the regular timeline.
function ShootoutSection({ shootout }: { shootout: ShootoutInfo }) {
  const homeKicks = shootout.kicks.filter((k) => k.side === "home");
  const awayKicks = shootout.kicks.filter((k) => k.side === "away");
  return (
    <div className="mt-1 border-t border-white/10 pt-2">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 pb-1">
        <ShootoutDots kicks={homeKicks} align="right" />
        <div className="flex min-w-[2.5rem] flex-col items-center leading-tight">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">
            Pens
          </span>
          <span className="text-xs font-black tabular-nums text-white/70">
            {shootout.homeScore}–{shootout.awayScore}
          </span>
        </div>
        <ShootoutDots kicks={awayKicks} align="left" />
      </div>
      <div className="divide-y divide-white/5">
        {shootout.kicks.map((k, i) => (
          <ShootoutKickRow key={`${k.side}-${k.player}-${i}`} kick={k} />
        ))}
      </div>
    </div>
  );
}

// Per-player match-result points (awarded to every player on the team).
function ResultPointsRow({
  outcome,
  pts,
}: {
  outcome: "WIN" | "DRAW" | "LOSS";
  pts: number;
}) {
  return (
    <div className="flex items-center gap-2 py-1 text-xs">
      <span
        className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-bold uppercase ${outcomeChip[outcome]}`}
      >
        {outcomeLabel[outcome]}
      </span>
      <span className="min-w-0 flex-1 truncate text-white/50 italic">
        Match result (all players)
      </span>
      <span
        className={`w-8 shrink-0 text-right font-bold tabular-nums ${pts > 0 ? "text-emerald-400" : pts < 0 ? "text-red-400" : "text-white/30"}`}
      >
        {pts > 0 ? `+${pts}` : pts}
      </span>
    </div>
  );
}

function TeamPointsBlock({
  name,
  countryCode,
  outcome,
  pts,
  players,
}: {
  name: string;
  countryCode: string;
  outcome: "WIN" | "DRAW" | "LOSS";
  pts: number;
  players: MatchPlayerPoints[];
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        {flagImg(countryCode, 4)}
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
          {name}
        </span>
      </div>
      <div className="divide-y divide-white/5">
        <ResultPointsRow outcome={outcome} pts={pts} />
        {players.map((p) => (
          <PlayerPointsRow key={p.playerName} player={p} />
        ))}
      </div>
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
          {(match.stageName || match.venue) && (
            <div className="mb-3 text-center">
              {match.stageName && (
                <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">
                  {match.stageName}
                </span>
              )}
              {match.venue && (
                <div className="mt-1 text-[11px] text-white/40">
                  {match.venue}
                  {match.city && `, ${match.city}`}
                </div>
              )}
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
                  {data.shootout && (
                    <ShootoutSection shootout={data.shootout} />
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <TeamPointsBlock
                    name={match.homeTeamName}
                    countryCode={data.homeCountryCode}
                    outcome={data.homeOutcome}
                    pts={data.homeResultPoints}
                    players={homePlayers}
                  />
                  <TeamPointsBlock
                    name={match.awayTeamName}
                    countryCode={data.awayCountryCode}
                    outcome={data.awayOutcome}
                    pts={data.awayResultPoints}
                    players={awayPlayers}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
