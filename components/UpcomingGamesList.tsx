"use client";

import { useState } from "react";
import type {
  BracketSlot,
  BroadcastSource,
  MatchInfo,
  StandingRow,
} from "@/lib/fifa";
import { resolveSlot } from "@/lib/bracket";

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

// A team is "set" once FIFA has assigned a real team to the slot. Knockout
// fixtures start out with an empty teamId and an "Unknown" name.
function isTeamSet(teamId: string, teamName: string): boolean {
  return Boolean(teamId) && teamName !== "Unknown";
}

// True when FIFA has confirmed this team's knockout qualification, mirroring the
// bracket page's "clinched" badge. Looked up via the team's group standing.
function isClinched(
  teamId: string,
  standings: Record<string, StandingRow[]>,
  teamToGroup: Record<string, string>,
): boolean {
  const letter = teamToGroup[teamId];
  if (!letter) return false;
  const row = standings[letter]?.find((r) => r.teamId === teamId);
  return row?.qualificationStatus === "ConfirmedQualified";
}

// Later knockout rounds reference earlier fixtures: "W73" means "winner of match
// number 73". Returns that match number, or null for group-style placeholders.
function winnerMatchNumber(code: string | null): number | null {
  const m = code?.match(/^W(\d+)$/i);
  return m ? Number(m[1]) : null;
}

// For a "winner of match N" placeholder, the two country codes contesting that
// match — but only once both its teams are actually set, so we show the real
// pair of possible qualifiers rather than nested placeholders.
function winnerFlags(
  code: string | null,
  allMatches: MatchInfo[],
): string[] | null {
  const num = winnerMatchNumber(code);
  if (num === null) return null;
  const src = allMatches.find((m) => m.matchNumber === num);
  if (!src) return null;
  if (!isTeamSet(src.homeTeamId, src.homeTeamName)) return null;
  if (!isTeamSet(src.awayTeamId, src.awayTeamName)) return null;
  return [src.homeCountryCode, src.awayCountryCode];
}

// Turn a knockout placeholder code into its display form: "1F"/"2F" stay as-is,
// while a third-place set like "3ABCDE" becomes "3A/B/C/D/E".
function formatPlaceholder(code: string | null): string {
  if (!code) return "TBD";
  const m = code.match(/^(\d)([A-Z]+)$/i);
  if (!m) return code;
  const [, rank, groups] = m;
  const letters = groups.toUpperCase().split("");
  return `${rank}${letters.join("/")}`;
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

function Flag({
  countryCode,
  className = "h-5 w-5",
}: {
  countryCode?: string;
  className?: string;
}) {
  if (!countryCode) return null;
  return (
    <img
      src={`https://api.fifa.com/api/v3/picture/flags-sq-2/${countryCode}`}
      alt=""
      className={`shrink-0 rounded-sm object-cover ${className}`}
    />
  );
}

// Gold "verified" badge marking teams that have clinched knockout qualification
// — same icon used on the bracket page.
function VerifiedBadge() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-[color:var(--color-gold)]"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Qualification confirmed"
      role="img"
    >
      <title>Qualification confirmed</title>
      <path d="M12 2l2.4 1.8 3-.2 1 2.8 2.6 1.5-1 2.8 1 2.8-2.6 1.5-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8L3 13.6l1-2.8-1-2.8L5.6 6.5l1-2.8 3 .2L12 2z" />
      <path
        d="M8.5 12.2l2.4 2.4 4.6-4.8"
        fill="none"
        stroke="#000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Tentative marker for slots not yet officially assigned by FIFA: a trending
// line, signalling the team is projected from current standings and may change.
function ProjectedBadge() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0 text-white/40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-label="Projected from current standings"
      role="img"
    >
      <title>Projected</title>
      <path
        d="M3 17l6-6 4 4 8-8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 7h7v7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// One side of a fixture's header. Shows the officially-assigned team when FIFA
// has set it; otherwise the projected team (group winner/runner-up), or a set of
// candidate flags (best third-placed groups, or the two contenders of a "winner
// of match N" slot), all marked as projected.
function TeamSide({
  align,
  set,
  teamName,
  countryCode,
  placeholder,
  clinched,
  projection,
  candidateFlags,
}: {
  align: "left" | "right";
  set: boolean;
  teamName: string;
  countryCode: string;
  placeholder: string;
  clinched: boolean;
  projection: BracketSlot | null;
  candidateFlags: string[] | null;
}) {
  const reverse = align === "right";
  // Home side hugs the centre line: reverse so the flag lands innermost and the
  // badge on the outer edge. In a reversed row the default flex-start already
  // packs items to the right, so no justify override is needed.
  const containerCls = `flex flex-1 items-center gap-2 ${
    reverse ? "flex-row-reverse text-right" : ""
  }`;

  // 1. Official team assigned by FIFA.
  if (set) {
    return (
      <div className={containerCls}>
        <Flag countryCode={countryCode} />
        <span className="min-w-0 truncate text-sm font-semibold text-white sm:text-base">
          {teamName}
        </span>
        {clinched && <VerifiedBadge />}
      </div>
    );
  }

  // 2. Group winner / runner-up projected from current standings.
  if (projection?.resolved) {
    return (
      <div className={containerCls}>
        <Flag countryCode={projection.countryCode} />
        <span className="min-w-0 truncate text-sm font-semibold italic text-white/70 sm:text-base">
          {projection.teamName}
        </span>
        <ProjectedBadge />
      </div>
    );
  }

  // 3. A set of candidate flags, shown without names: either the best third-placed
  // groups, or the two teams contesting a "winner of match N" slot.
  const flags = candidateFlags ?? projection?.groupCountryCodes ?? [];
  if (flags.length > 0) {
    return (
      <div className={containerCls}>
        <div
          className={`flex min-w-0 flex-wrap items-center gap-1 ${
            reverse ? "justify-end" : ""
          }`}
        >
          {flags.map((c) => (
            <Flag key={c} countryCode={c} className="h-4 w-4" />
          ))}
        </div>
        <ProjectedBadge />
      </div>
    );
  }

  // 4. Nothing to project yet — fall back to the raw placeholder code.
  return (
    <div className={containerCls}>
      <span className="min-w-0 truncate text-sm font-semibold italic text-white/40 sm:text-base">
        {placeholder}
      </span>
    </div>
  );
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
  const oppCountry = isHome ? m.awayCountryCode : m.homeCountryCode;
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
      <span className="flex min-w-0 items-center gap-1.5 text-white/70">
        <Flag countryCode={oppCountry} className="h-3.5 w-3.5" />
        <span className="min-w-0 truncate">{oppName}</span>
      </span>
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
  countryCode,
  placeholder,
  currentMatchId,
  allMatches,
  standings,
  teamToGroup,
}: {
  teamId: string;
  teamName: string;
  countryCode: string;
  placeholder: string;
  currentMatchId: string;
  allMatches: MatchInfo[];
  standings: Record<string, StandingRow[]>;
  teamToGroup: Record<string, string>;
}) {
  // Until the slot has a real team, show only its placeholder code — don't try
  // to match fixtures (an empty teamId would collide with other open slots).
  if (!isTeamSet(teamId, teamName)) {
    return (
      <div className="min-w-0">
        <div className="truncate font-bold text-white/40 text-sm italic">
          {placeholder}
        </div>
        <div className="mt-1 text-[11px] text-white/30">
          Awaiting group stage
        </div>
      </div>
    );
  }

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
        <div className="flex min-w-0 items-center gap-1.5">
          <Flag countryCode={countryCode} className="h-4 w-4" />
          <span className="truncate font-bold text-white text-sm">
            {teamName || "TBD"}
          </span>
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

  const homeSet = isTeamSet(match.homeTeamId, match.homeTeamName);
  const awaySet = isTeamSet(match.awayTeamId, match.awayTeamName);
  const homePlaceholder = formatPlaceholder(match.placeholderA);
  const awayPlaceholder = formatPlaceholder(match.placeholderB);
  const homeClinched =
    homeSet && isClinched(match.homeTeamId, standings, teamToGroup);
  const awayClinched =
    awaySet && isClinched(match.awayTeamId, standings, teamToGroup);
  // For unset knockout slots, project the team from the current standings.
  const homeProjection = homeSet
    ? null
    : resolveSlot(match.placeholderA, standings);
  const awayProjection = awaySet
    ? null
    : resolveSlot(match.placeholderB, standings);
  // For "winner of match N" slots, the two flags of that match once it's set.
  const homeCandidateFlags = homeSet
    ? null
    : winnerFlags(match.placeholderA, allMatches);
  const awayCandidateFlags = awaySet
    ? null
    : winnerFlags(match.placeholderB, allMatches);

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
          <TeamSide
            align="right"
            set={homeSet}
            teamName={match.homeTeamName}
            countryCode={match.homeCountryCode}
            placeholder={homePlaceholder}
            clinched={homeClinched}
            projection={homeProjection}
            candidateFlags={homeCandidateFlags}
          />

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
          <TeamSide
            align="left"
            set={awaySet}
            teamName={match.awayTeamName}
            countryCode={match.awayCountryCode}
            placeholder={awayPlaceholder}
            clinched={awayClinched}
            projection={awayProjection}
            candidateFlags={awayCandidateFlags}
          />
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
              countryCode={match.homeCountryCode}
              placeholder={homePlaceholder}
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
              countryCode={match.awayCountryCode}
              placeholder={awayPlaceholder}
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

  const anyClinched = Object.values(standings).some((rows) =>
    rows.some((r) => r.qualificationStatus === "ConfirmedQualified"),
  );
  const anyProjected = upcoming.some((m) =>
    (
      [
        [m.placeholderA, isTeamSet(m.homeTeamId, m.homeTeamName)],
        [m.placeholderB, isTeamSet(m.awayTeamId, m.awayTeamName)],
      ] as [string | null, boolean][]
    ).some(([code, set]) => {
      if (set) return false;
      const slot = resolveSlot(code, standings);
      if (slot.resolved || (slot.groupCountryCodes?.length ?? 0) > 0)
        return true;
      return winnerFlags(code, matches) !== null;
    }),
  );

  return (
    <div className="space-y-8">
      {(anyClinched || anyProjected) && (
        <div className="space-y-1.5">
          {anyClinched && (
            <p className="flex items-center gap-1.5 text-xs text-white/40">
              <VerifiedBadge />
              marks teams that have clinched qualification to the next stage.
            </p>
          )}
          {anyProjected && (
            <p className="flex items-center gap-1.5 text-xs text-white/40">
              <ProjectedBadge />
              marks projected teams not yet confirmed.
            </p>
          )}
        </div>
      )}
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
