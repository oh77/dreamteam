"use client";

import { useState } from "react";
import type { BroadcastSource, MatchInfo, StandingRow } from "@/lib/fifa";

// All kickoff times are shown in Central European Time for the Swedish audience.
const CET_TZ = "Europe/Stockholm";

function formatTimeCET(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: CET_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// CET calendar day (YYYY-MM-DD) used for grouping, so a late North-American
// kickoff lands on the day Swedish viewers actually watch it.
function cetDateKey(iso: string | null): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: CET_TZ });
}

function formatFullDate(iso: string | null): string {
  if (!iso) return "Date TBD";
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: CET_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(iso: string | null): string {
  if (!iso) return "TBD";
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: CET_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function ordinal(n: number): string {
  const rem = n % 100;
  if (rem >= 11 && rem <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function byDate(a: MatchInfo, b: MatchInfo): number {
  return (a.date ?? "").localeCompare(b.date ?? "");
}

function SwedishBroadcasters({ sources }: { sources: BroadcastSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2">
      {sources.map((s) => (
        <a
          key={s.idChannel}
          href={s.url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 hover:bg-white/10 transition-colors"
          title={s.language ? `${s.name} (${s.language})` : s.name}
        >
          {s.logo && (
            <img
              src={s.logo}
              alt=""
              width={20}
              height={20}
              className="w-5 h-5 rounded object-contain bg-white/10"
            />
          )}
          <span className="text-[11px] font-medium text-white/70">
            {s.name}
          </span>
        </a>
      ))}
    </div>
  );
}

// One past/future fixture, told from `teamId`'s point of view: opponent on the
// left, the team's score (played) or kickoff date (upcoming) on the right.
function TeamMatchRow({ m, teamId }: { m: MatchInfo; teamId: string }) {
  const isHome = m.homeTeamId === teamId;
  const oppName = isHome ? m.awayTeamName : m.homeTeamName;
  const teamScore = isHome ? m.homeScore : m.awayScore;
  const oppScore = isHome ? m.awayScore : m.homeScore;

  const result = m.finished
    ? teamScore > oppScore
      ? "text-emerald-400"
      : teamScore < oppScore
        ? "text-red-400/80"
        : "text-white/50"
    : "text-white/30";

  return (
    <div className="flex items-center justify-between gap-2 py-1 text-[12px]">
      <span className="min-w-0 truncate text-white/70">{oppName}</span>
      {m.finished ? (
        <span className={`shrink-0 font-bold tabular-nums ${result}`}>
          {teamScore}–{oppScore}
        </span>
      ) : m.live ? (
        <span className="shrink-0 font-bold tabular-nums text-red-400">
          {teamScore}–{oppScore}
        </span>
      ) : (
        <span className="shrink-0 text-white/40">
          {formatShortDate(m.date)}
        </span>
      )}
    </div>
  );
}

// One side of the fold: a single team's group standing + its fixtures.
function TeamColumn({
  teamId,
  teamName,
  currentMatchId,
  allMatches,
  standings,
  teamToGroup,
}: {
  teamId: string;
  teamName: string;
  currentMatchId: string;
  allMatches: MatchInfo[];
  standings: Record<string, StandingRow[]>;
  teamToGroup: Record<string, string>;
}) {
  const letter = teamToGroup[teamId];
  const row = letter
    ? standings[letter]?.find((r) => r.teamId === teamId)
    : undefined;

  const mine = allMatches
    .filter(
      (m) =>
        m.matchId !== currentMatchId &&
        (m.homeTeamId === teamId || m.awayTeamId === teamId),
    )
    .sort(byDate);
  const played = mine.filter((m) => m.finished);
  const upcoming = mine.filter((m) => !m.finished);

  return (
    <div className="min-w-0">
      <div className="mb-2">
        <div className="truncate font-bold text-white text-sm">
          {teamName || "TBD"}
        </div>
        {row && (
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-white/50">
            {letter && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-white/70">
                {letter}
              </span>
            )}
            <span className="text-white">{ordinal(row.position)}</span>
            <span className="text-white/20">·</span>
            <span className="tabular-nums">
              {row.won} {row.drawn} {row.lost}
            </span>
            <span className="text-white/20">·</span>
            <span className="tabular-nums">
              {row.goalsFor}–{row.goalsAgainst}
            </span>
            <span className="text-white/20">·</span>
            <span className="font-semibold text-[color:var(--color-gold)]">
              {row.points}
            </span>
          </div>
        )}
      </div>

      {played.length > 0 && (
        <div className="mt-2">
          <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/30">
            Results
          </div>
          <div className="divide-y divide-white/5">
            {played.map((m) => (
              <TeamMatchRow key={m.matchId} m={m} teamId={teamId} />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mt-2">
          <div className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-white/30">
            Upcoming
          </div>
          <div className="divide-y divide-white/5">
            {upcoming.map((m) => (
              <TeamMatchRow key={m.matchId} m={m} teamId={teamId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GameCard({
  match,
  groupGameNo,
  groupStageRounds,
  sources,
  allMatches,
  standings,
  teamToGroup,
}: {
  match: MatchInfo;
  groupGameNo?: number;
  groupStageRounds: number;
  sources: BroadcastSource[];
  allMatches: MatchInfo[];
  standings: Record<string, StandingRow[]>;
  teamToGroup: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass rounded-2xl px-5 py-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full cursor-pointer text-left"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Home team */}
          <div className="flex-1 text-right">
            <span className="font-semibold text-white text-sm sm:text-base">
              {match.homeTeamName}
            </span>
          </div>

          {/* Live score + minute, or VS + kickoff time (CET) */}
          <div className="flex flex-col items-center gap-0.5 min-w-[72px]">
            {match.live ? (
              <>
                <span className="text-base font-black tabular-nums text-white">
                  {match.homeScore}–{match.awayScore}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                  </span>
                  {match.matchMinute ?? "Live"}
                </span>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                  vs
                </span>
                {match.date && (
                  <span className="text-[10px] text-white/30">
                    {formatTimeCET(match.date)} CET
                  </span>
                )}
              </>
            )}
          </div>

          {/* Away team */}
          <div className="flex-1">
            <span className="font-semibold text-white text-sm sm:text-base">
              {match.awayTeamName}
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2">
          {(groupGameNo || match.stageName) && (
            <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">
              {groupGameNo
                ? `Stage 1 · Game ${groupGameNo}/${groupStageRounds}`
                : match.stageName}
            </span>
          )}
          <svg
            className={`h-3.5 w-3.5 text-white/30 transition-transform ${
              open ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <path
              d="M6 9l6 6 6-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </button>

      <SwedishBroadcasters sources={sources} />

      {open && (
        <div className="mt-4 grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 pt-4">
          <div className="pr-2">
            <TeamColumn
              teamId={match.homeTeamId}
              teamName={match.homeTeamName}
              currentMatchId={match.matchId}
              allMatches={allMatches}
              standings={standings}
              teamToGroup={teamToGroup}
            />
          </div>
          <div className="pl-2">
            <TeamColumn
              teamId={match.awayTeamId}
              teamName={match.awayTeamName}
              currentMatchId={match.matchId}
              allMatches={allMatches}
              standings={standings}
              teamToGroup={teamToGroup}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function UpcomingGamesList({
  matches,
  upcoming,
  broadcasts,
  groupGame,
  groupStageRounds,
  standings,
  teamToGroup,
}: {
  matches: MatchInfo[];
  upcoming: MatchInfo[];
  broadcasts: Record<string, BroadcastSource[]>;
  groupGame: Record<string, number>;
  groupStageRounds: number;
  standings: Record<string, StandingRow[]>;
  teamToGroup: Record<string, string>;
}) {
  // Group the sorted upcoming matches by their CET calendar day.
  const groups: { key: string; iso: string | null; items: MatchInfo[] }[] = [];
  for (const m of upcoming) {
    const key = cetDateKey(m.date);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(m);
    } else {
      groups.push({ key, iso: m.date, items: [m] });
    }
  }

  return (
    <div className="space-y-8">
      {groups.map((g) => (
        <div key={g.key}>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[color:var(--color-gold)]">
            {formatFullDate(g.iso)}
          </h2>
          <div className="space-y-2">
            {g.items.map((m) => (
              <GameCard
                key={m.matchId}
                match={m}
                groupGameNo={groupGame[m.matchId]}
                groupStageRounds={groupStageRounds}
                sources={broadcasts[m.matchId] ?? []}
                allMatches={matches}
                standings={standings}
                teamToGroup={teamToGroup}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
