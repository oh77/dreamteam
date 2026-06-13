import { cacheLife, cacheTag } from "next/cache";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = "https://api.fifa.com/api/v3";
const COMPETITION_ID = "17";
const SEASON_ID = "285023";
const LANG = "en";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Position = "GK" | "DEF" | "MID" | "ATT";

export interface MatchInfo {
  matchId: string;
  stageId: string;
  homeTeamId: string;
  homeTeamName: string;
  homeCountryCode: string;
  awayTeamId: string;
  awayTeamName: string;
  awayCountryCode: string;
  homeScore: number;
  awayScore: number;
  finished: boolean;
  live: boolean;
  matchMinute: string | null;
  date: string | null;
  stageName: string | null;
}

export function flagUrl(countryCode: string): string {
  if (!countryCode) return "";
  return `https://api.fifa.com/api/v3/picture/flags-sq-2/${countryCode}`;
}

export interface FifaPlayer {
  id: string;
  name: string;
  position: Position;
  teamId: string;
  teamName: string;
  shirtNumber?: number;
}

export interface TimelineEvent {
  type:
    | "Goal"
    | "OwnGoal"
    | "YellowCard"
    | "RedCard"
    | "YellowRedCard"
    | "SubstituteIn"
    | "SubstituteOut"
    | "Unknown";
  playerId: string;
  teamId: string;
  minute: number;
  // Display string preserving stoppage time / half-time, e.g. "62'", "90'+7'", "HT".
  minuteLabel: string;
  // On a SubstituteOut: the player coming on (keeps the in/out pair linked).
  subInId?: string;
}

export interface MatchLineup {
  matchId: string;
  homeTeamPlayerIds: Set<string>;
  awayTeamPlayerIds: Set<string>;
}

export interface PlayerMatchStats {
  playerId: string;
  matchId: string;
  teamId: string;
  outcome: "WIN" | "DRAW" | "LOSS";
  goalsScored: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  cleanSheet: boolean;
  goalsConceded: number;
}

export interface PlayerTournamentStats {
  player: FifaPlayer;
  points: number;
  breakdown: {
    matchResults: number;
    goals: number;
    cleanSheets: number;
    goalsConceded: number;
    ownGoals: number;
    yellowCards: number;
    redCards: number;
  };
  matchesPlayed: number;
}

export interface SelectedTeam {
  goalkeeper: FormattedPlayer;
  defenders: FormattedPlayer[];
  midfielders: FormattedPlayer[];
  attackers: FormattedPlayer[];
  captain: FormattedPlayer;
  totalPoints: number;
}

export interface FormattedPlayer {
  name: string;
  team: string;
  countryCode: string;
  position: Position;
  points: number;
  matchesPlayed: number;
  breakdown: PlayerTournamentStats["breakdown"];
  baseBreakdown: PlayerTournamentStats["breakdown"];
  isCaptain: boolean;
}

export interface PipelineResult {
  players: PlayerTournamentStats[];
  matches: MatchInfo[];
  teamCountry: Record<string, string>;
  fetchedAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fifaFetch<T>(
  path: string,
  params: Record<string, string> = {},
  fetchOpts: RequestInit = {},
): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("language", LANG);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 300 },
    ...fetchOpts,
  });

  if (!res.ok) throw new Error(`FIFA API ${res.status}: ${url}`);
  return res.json();
}

function localName(
  names: Array<{ Locale: string; Description: string }> | string | undefined,
): string {
  if (!names) return "Unknown";
  if (typeof names === "string") return names;
  return (
    (names.find((n) => n.Locale.startsWith("en")) ?? names[0])?.Description ??
    "Unknown"
  );
}

function mapPosition(pos: number | string | undefined): Position {
  if (pos === 0 || pos === "GKP" || pos === "Goalkeeper") return "GK";
  if (pos === 1 || pos === "DEF" || pos === "Defender") return "DEF";
  if (pos === 2 || pos === "MID" || pos === "Midfielder") return "MID";
  if (pos === 3 || pos === "FWD" || pos === "Forward" || pos === "Attacker")
    return "ATT";
  return "MID";
}

// FIFA MatchStatus: 0 = finished, 1 = scheduled, 3 = in play (live)
function isFinished(status: number): boolean {
  return status === 0;
}

function isLive(status: number): boolean {
  return status === 3;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

const POINTS = {
  WIN: 3,
  DRAW: 1,
  LOSS: 0,
  GOAL_GK: 10,
  GOAL_DEF: 7,
  GOAL_MID: 5,
  GOAL_ATT: 3,
  CLEAN_SHEET_GK: 5,
  GOAL_CONCEDED_GK: -2,
  OWN_GOAL: -2,
  RED_CARD: -3,
  YELLOW_CARD: -1,
};

function goalPoints(position: Position): number {
  return { GK: 10, DEF: 7, MID: 5, ATT: 3 }[position];
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchAllMatches(): Promise<MatchInfo[]> {
  const matches: MatchInfo[] = [];
  let token: string | undefined;

  do {
    const params: Record<string, string> = {
      idSeason: SEASON_ID,
      idCompetition: COMPETITION_ID,
      count: "500",
    };
    if (token) params.continuationToken = token;

    // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
    const data = await fifaFetch<any>("/calendar/matches", params);
    // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
    const results: any[] = data.Results ?? data.results ?? [];

    for (const m of results) {
      const status = m.MatchStatus ?? m.Status ?? 0;
      const live = isLive(status);
      matches.push({
        matchId: String(m.IdMatch ?? m.MatchId ?? ""),
        stageId: String(m.IdStage ?? m.StageId ?? ""),
        homeTeamId: String(m.Home?.IdTeam ?? m.HomeTeamId ?? ""),
        homeTeamName: localName(m.Home?.TeamName),
        homeCountryCode: String(m.Home?.IdCountry ?? m.HomeTeamIdCountry ?? ""),
        awayTeamId: String(m.Away?.IdTeam ?? m.AwayTeamId ?? ""),
        awayTeamName: localName(m.Away?.TeamName),
        awayCountryCode: String(m.Away?.IdCountry ?? m.AwayTeamIdCountry ?? ""),
        homeScore: Number(m.Home?.Score ?? m.HomeTeamScore ?? 0) || 0,
        awayScore: Number(m.Away?.Score ?? m.AwayTeamScore ?? 0) || 0,
        finished: isFinished(status),
        live,
        matchMinute: live ? (m.MatchTime ?? null) : null,
        date: m.Date ?? m.LocalDate ?? null,
        stageName: localName(m.StageName) || null,
      });
    }

    token = data.ContinuationToken ?? data.continuationToken;
  } while (token);

  return matches;
}

async function fetchSquad(
  teamId: string,
  teamName: string,
): Promise<FifaPlayer[]> {
  try {
    // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
    const data = await fifaFetch<any>(`/teams/${teamId}/squad`, {
      idCompetition: COMPETITION_ID,
      idSeason: SEASON_ID,
    });
    // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
    const squad: any[] = data.Players ?? data.Squad ?? data.players ?? [];
    return squad
      .map((p) => ({
        id: String(p.IdPlayer ?? p.PlayerId ?? ""),
        name: localName(p.Name ?? p.PlayerName),
        position: mapPosition(p.Position ?? p.PositionId),
        teamId,
        teamName,
        shirtNumber: p.ShirtNumber ?? p.Number,
      }))
      .filter((p) => p.id);
  } catch {
    return [];
  }
}

async function fetchTimeline(
  stageId: string,
  matchId: string,
): Promise<TimelineEvent[]> {
  if (!stageId || !matchId) return [];
  try {
    // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
    const data = await fifaFetch<any>(
      `/timelines/${COMPETITION_ID}/${SEASON_ID}/${stageId}/${matchId}`,
    );
    // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
    const raw: any[] = data.Event ?? data.Events ?? data.events ?? [];

    const seen = new Set<string>();
    const events = raw.filter((e) => {
      const id = String(e.EventId ?? "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return events.flatMap((e) => parseEvent(e));
  } catch {
    return [];
  }
}

// biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
function parseEvent(e: any): TimelineEvent[] {
  const typeId = e.Type;
  const playerId = String(e.IdPlayer ?? "");
  const teamId = String(e.IdTeam ?? "");
  const rawMin = String(e.MatchMinute ?? e.Minute ?? "").trim();
  // `minute` is the leading match minute used for scoring windows — parse only
  // the leading number so stoppage time stays in range (e.g. "45'+5'" → 45,
  // "90'+8'" → 90), not the digits-concatenated "455"/"908".
  // `minuteLabel` carries the human display (stoppage time / half-time).
  const minute = parseInt(rawMin, 10) || 0;
  const minuteLabel = rawMin
    ? rawMin
    : e.Period === 4
      ? "HT" // half-time substitution: API sends an empty MatchMinute
      : `${minute}'`;

  if (!playerId || !teamId) return [];

  const base = { playerId, teamId, minute, minuteLabel };

  const desc: string = (
    (
      e.TypeLocalized as
        | Array<{ Locale: string; Description: string }>
        | undefined
    )?.find((l) => l.Locale === "en-GB")?.Description ?? ""
  ).toLowerCase();

  // Own goals come through as Type 34 / "Own goal" (not Type 0). Check first.
  if (typeId === 34 || desc.startsWith("own goal"))
    return [{ ...base, type: "OwnGoal" }];
  if (typeId === 0 || desc === "goal!") return [{ ...base, type: "Goal" }];
  if (typeId === 2 || desc.includes("yellow card"))
    return [{ ...base, type: "YellowCard" }];
  if (desc.includes("red card")) return [{ ...base, type: "RedCard" }];
  if (desc.includes("yellow-red") || desc.includes("second yellow"))
    return [{ ...base, type: "YellowRedCard" }];
  if (desc.includes("substitut")) {
    const subInId = String(e.IdSubPlayer ?? "");
    const out: TimelineEvent[] = [
      { ...base, type: "SubstituteOut", subInId: subInId || undefined },
    ];
    if (subInId)
      out.push({
        playerId: subInId,
        teamId,
        minute,
        minuteLabel,
        type: "SubstituteIn",
      });
    return out;
  }

  return [{ ...base, type: "Unknown" }];
}

async function fetchMatchLineup(
  stageId: string,
  matchId: string,
): Promise<MatchLineup | null> {
  try {
    // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
    const data = await fifaFetch<any>(
      `/live/football/${COMPETITION_ID}/${SEASON_ID}/${stageId}/${matchId}`,
    );
    const home: Record<string, unknown> = data.Home ?? data.HomeTeam ?? {};
    const away: Record<string, unknown> = data.Away ?? data.AwayTeam ?? {};

    const extractIds = (team: Record<string, unknown>): Set<string> => {
      const players = [
        // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
        ...((team.Players ?? team.StartingEleven ?? []) as any[]),
        // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
        ...((team.Substitutes ?? team.Bench ?? []) as any[]),
      ];
      const ids = new Set<string>();
      for (const p of players) {
        const id = String(p.IdPlayer ?? p.PlayerId ?? "");
        if (id) ids.add(id);
      }
      return ids;
    };

    return {
      matchId,
      homeTeamPlayerIds: extractIds(home),
      awayTeamPlayerIds: extractIds(away),
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Match stats computation
// ---------------------------------------------------------------------------

function computeMatchStats(
  match: MatchInfo,
  events: TimelineEvent[],
  lineup: MatchLineup | null,
  allPlayers: Map<string, FifaPlayer>,
  squadByTeam: Map<string, FifaPlayer[]>,
): PlayerMatchStats[] {
  let participants: Set<string>;
  if (lineup) {
    participants = new Set([
      ...lineup.homeTeamPlayerIds,
      ...lineup.awayTeamPlayerIds,
    ]);
  } else {
    participants = new Set(
      events.filter((e) => allPlayers.has(e.playerId)).map((e) => e.playerId),
    );
  }

  const goalMinutes = events
    .filter((e) => e.type === "Goal" || e.type === "OwnGoal")
    .map((e) => ({
      minute: e.minute,
      scoringTeamId:
        e.type === "OwnGoal"
          ? e.teamId === match.homeTeamId
            ? match.awayTeamId
            : match.homeTeamId
          : e.teamId,
    }));

  function resolveGkPeriods(
    teamId: string,
  ): Map<string, { from: number; to: number }> {
    const teamGks = (squadByTeam.get(teamId) ?? []).filter(
      (p) => p.position === "GK",
    );
    const gkIds = new Set(teamGks.map((p) => p.id));
    const periods = new Map<string, { from: number; to: number }>();

    const gkSubOut = events.find(
      (e) =>
        e.type === "SubstituteOut" &&
        e.teamId === teamId &&
        gkIds.has(e.playerId),
    );
    const gkSubIn = events.find(
      (e) =>
        e.type === "SubstituteIn" &&
        e.teamId === teamId &&
        gkIds.has(e.playerId),
    );

    if (gkSubOut && gkSubIn) {
      periods.set(gkSubOut.playerId, { from: 0, to: gkSubOut.minute });
      periods.set(gkSubIn.playerId, { from: gkSubOut.minute, to: 90 });
      return periods;
    }

    if (lineup) {
      const lineupIds = new Set([
        ...lineup.homeTeamPlayerIds,
        ...lineup.awayTeamPlayerIds,
      ]);
      const startingGk = teamGks.find((p) => lineupIds.has(p.id));
      if (startingGk) {
        periods.set(startingGk.id, { from: 0, to: 90 });
        return periods;
      }
    }

    if (teamGks.length === 1) periods.set(teamGks[0].id, { from: 0, to: 90 });
    return periods;
  }

  const homeGkPeriods = resolveGkPeriods(match.homeTeamId);
  const awayGkPeriods = resolveGkPeriods(match.awayTeamId);

  function gkGoalsConceded(gkTeamId: string, from: number, to: number): number {
    return goalMinutes.filter(
      (g) => g.scoringTeamId !== gkTeamId && g.minute >= from && g.minute <= to,
    ).length;
  }

  const stats: PlayerMatchStats[] = [];

  for (const playerId of participants) {
    const player = allPlayers.get(playerId);
    if (!player) continue;

    const teamId = player.teamId;
    const isHome = match.homeTeamId === teamId;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const oppScore = isHome ? match.awayScore : match.homeScore;
    const outcomeVal: "WIN" | "DRAW" | "LOSS" =
      teamScore > oppScore ? "WIN" : teamScore === oppScore ? "DRAW" : "LOSS";

    const playerEvents = events.filter((e) => e.playerId === playerId);
    const goalsScored = playerEvents.filter((e) => e.type === "Goal").length;
    const ownGoals = playerEvents.filter((e) => e.type === "OwnGoal").length;
    const yellowCards = playerEvents.filter(
      (e) => e.type === "YellowCard" || e.type === "YellowRedCard",
    ).length;
    const redCards = playerEvents.filter(
      (e) => e.type === "RedCard" || e.type === "YellowRedCard",
    ).length;

    let cleanSheet = false;
    let goalsConceded = 0;

    if (player.position === "GK") {
      const gkPeriods = isHome ? homeGkPeriods : awayGkPeriods;
      const period = gkPeriods.get(playerId);
      if (period) {
        goalsConceded = gkGoalsConceded(teamId, period.from, period.to);
        const concededByTeam = isHome ? match.awayScore : match.homeScore;
        cleanSheet =
          period.from === 0 && period.to === 90 && concededByTeam === 0;
      }
    }

    stats.push({
      playerId,
      matchId: match.matchId,
      teamId,
      outcome: outcomeVal,
      goalsScored,
      ownGoals,
      yellowCards,
      redCards,
      cleanSheet,
      goalsConceded,
    });
  }

  return stats;
}

function aggregatePlayerStats(
  player: FifaPlayer,
  matchStats: PlayerMatchStats[],
): PlayerTournamentStats {
  const breakdown = {
    matchResults: 0,
    goals: 0,
    cleanSheets: 0,
    goalsConceded: 0,
    ownGoals: 0,
    yellowCards: 0,
    redCards: 0,
  };
  const pts = POINTS;

  for (const ms of matchStats) {
    breakdown.matchResults +=
      ms.outcome === "WIN"
        ? pts.WIN
        : ms.outcome === "DRAW"
          ? pts.DRAW
          : pts.LOSS;
    breakdown.goals += ms.goalsScored * goalPoints(player.position);
    breakdown.cleanSheets += ms.cleanSheet ? pts.CLEAN_SHEET_GK : 0;
    breakdown.goalsConceded += ms.goalsConceded * pts.GOAL_CONCEDED_GK;
    breakdown.ownGoals += ms.ownGoals * pts.OWN_GOAL;
    breakdown.yellowCards += ms.yellowCards * pts.YELLOW_CARD;
    breakdown.redCards += ms.redCards * pts.RED_CARD;
  }

  return {
    player,
    points: Object.values(breakdown).reduce((a, b) => a + b, 0),
    breakdown,
    matchesPlayed: matchStats.length,
  };
}

// ---------------------------------------------------------------------------
// Pipeline (cached)
// ---------------------------------------------------------------------------

export async function runPipeline(): Promise<PipelineResult> {
  "use cache";
  cacheTag("fifa-pipeline");
  cacheLife("minutes");

  const allMatches = await fetchAllMatches();
  const finishedMatches = allMatches.filter((m) => m.finished);

  const seen = new Set<string>();
  const uniqueFinished = finishedMatches.filter(
    (m) => !seen.has(m.matchId) && seen.add(m.matchId),
  );

  const teamMeta = new Map<string, string>();
  const teamCountry: Record<string, string> = {};
  for (const m of allMatches) {
    if (m.homeTeamId && m.homeTeamName !== "Unknown")
      teamMeta.set(m.homeTeamId, m.homeTeamName);
    if (m.awayTeamId && m.awayTeamName !== "Unknown")
      teamMeta.set(m.awayTeamId, m.awayTeamName);
    if (m.homeTeamId && m.homeCountryCode)
      teamCountry[m.homeTeamId] = m.homeCountryCode;
    if (m.awayTeamId && m.awayCountryCode)
      teamCountry[m.awayTeamId] = m.awayCountryCode;
  }

  const squadByTeam = new Map<string, FifaPlayer[]>();
  const allPlayersMap = new Map<string, FifaPlayer>();
  await Promise.all(
    [...teamMeta.entries()].map(async ([teamId, teamName]) => {
      const squad = await fetchSquad(teamId, teamName);
      squadByTeam.set(teamId, squad);
      for (const p of squad) allPlayersMap.set(p.id, p);
    }),
  );

  const playerMatchStats = new Map<string, PlayerMatchStats[]>();

  for (const match of uniqueFinished) {
    const [events, lineup] = await Promise.all([
      fetchTimeline(match.stageId, match.matchId),
      fetchMatchLineup(match.stageId, match.matchId),
    ]);

    const matchStats = computeMatchStats(
      match,
      events,
      lineup,
      allPlayersMap,
      squadByTeam,
    );

    for (const ms of matchStats) {
      if (!playerMatchStats.has(ms.playerId))
        playerMatchStats.set(ms.playerId, []);
      const existing = playerMatchStats.get(ms.playerId) ?? [];
      if (!existing.some((e) => e.matchId === ms.matchId)) existing.push(ms);
    }
  }

  const players: PlayerTournamentStats[] = [];
  for (const [playerId, msList] of playerMatchStats) {
    const player = allPlayersMap.get(playerId);
    if (player && msList.length > 0)
      players.push(aggregatePlayerStats(player, msList));
  }

  return {
    players,
    matches: allMatches,
    teamCountry,
    fetchedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Team selection
// ---------------------------------------------------------------------------

export function selectTeam(
  allStats: PlayerTournamentStats[],
  mode: "best" | "worst",
  teamCountry: Record<string, string> = {},
  maxPerTeam = Number.POSITIVE_INFINITY,
): SelectedTeam {
  const positions: Position[] = ["GK", "DEF", "MID", "ATT"];
  const counts: Record<Position, number> = { GK: 1, DEF: 3, MID: 4, ATT: 3 };
  const dir = mode === "best" ? "desc" : "asc";

  // Rank ALL players together, then walk that single list filling position
  // slots top-down. This way the team-rule budget (max N per team) is spent on
  // the globally highest scorers — a top attacker is never blocked because two
  // lower-scoring players from his nation were processed in an earlier position.
  const ranked = [...allStats].sort((a, b) =>
    dir === "desc" ? b.points - a.points : a.points - b.points,
  );

  const teamCount = new Map<string, number>();
  const selectedByPos = new Map<Position, PlayerTournamentStats[]>();
  for (const pos of positions) selectedByPos.set(pos, []);
  const squadSize = positions.reduce((n, pos) => n + counts[pos], 0);
  let picked = 0;

  for (const p of ranked) {
    if (picked >= squadSize) break;
    const pos = p.player.position;
    const slot = selectedByPos.get(pos);
    if (!slot || slot.length >= counts[pos]) continue; // position already full
    const count = teamCount.get(p.player.teamId) ?? 0;
    if (count >= maxPerTeam) continue; // team rule reached
    slot.push(p);
    teamCount.set(p.player.teamId, count + 1);
    picked++;
  }

  const allSelected = [...selectedByPos.values()].flat();

  const captain = allSelected.reduce((best, cur) =>
    mode === "best"
      ? cur.points > best.points
        ? cur
        : best
      : cur.points < best.points
        ? cur
        : best,
  );

  const fmt = (p: PlayerTournamentStats): FormattedPlayer => {
    const isCaptain = p.player.id === captain.player.id;
    const multiplier = isCaptain ? 2 : 1;
    return {
      name: p.player.name,
      team: p.player.teamName,
      countryCode: teamCountry[p.player.teamId] ?? "",
      position: p.player.position,
      points: p.points * multiplier,
      matchesPlayed: p.matchesPlayed,
      breakdown: isCaptain
        ? (Object.fromEntries(
            Object.entries(p.breakdown).map(([k, v]) => [k, (v as number) * 2]),
          ) as PlayerTournamentStats["breakdown"])
        : p.breakdown,
      baseBreakdown: p.breakdown,
      isCaptain,
    };
  };

  const [gk] = selectedByPos.get("GK") ?? [];
  const defenders = selectedByPos.get("DEF") ?? [];
  const midfielders = selectedByPos.get("MID") ?? [];
  const attackers = selectedByPos.get("ATT") ?? [];
  const baseTotal = allSelected.reduce((sum, p) => sum + p.points, 0);

  return {
    goalkeeper: fmt(gk),
    defenders: defenders.map(fmt),
    midfielders: midfielders.map(fmt),
    attackers: attackers.map(fmt),
    captain: fmt(captain),
    totalPoints: baseTotal + captain.points,
  };
}

// ---------------------------------------------------------------------------
// Swedish broadcasts
// ---------------------------------------------------------------------------

export interface BroadcastSource {
  idChannel: string;
  name: string;
  logo: string;
  url: string;
  language: string;
}

export async function fetchSwedishBroadcasts(): Promise<
  Record<string, BroadcastSource[]>
> {
  "use cache";
  cacheTag("fifa-broadcasts");
  cacheLife("hours");

  try {
    // Response is ~9MB — skip fetch-level cache (2MB limit); "use cache" above caches the processed result
    // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
    const data = await fifaFetch<any>(
      `/watch/season/${SEASON_ID}`,
      {},
      { cache: "no-store" },
    );
    // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
    const results: any[] = data.Results ?? [];

    const sweEntry = results.find(
      (r) => r.IdCountryIso3166Alpha2 === "SE" || r.IdCountry === "SWE",
    );
    if (!sweEntry) return {};

    const record: Record<string, BroadcastSource[]> = {};
    // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
    for (const m of sweEntry.Matches ?? ([] as any[])) {
      const matchId = String(m.IdMatch ?? "");
      if (!matchId) continue;
      // biome-ignore lint/suspicious/noExplicitAny: FIFA API returns untyped JSON
      record[matchId] = (m.Sources ?? ([] as any[])).map((s: any) => ({
        idChannel: String(s.IdChannel ?? ""),
        name: String(s.Name ?? ""),
        logo: String(s.Logo ?? ""),
        url: String(s.TvChannelUrl ?? s.Url ?? ""),
        language: String(s.Language ?? ""),
      }));
    }
    return record;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Match event summary (for results page fold-down)
// ---------------------------------------------------------------------------

export interface MatchPlayerPoints {
  playerName: string;
  teamId: string;
  countryCode: string;
  position: Position;
  goalsScored: number;
  ownGoals: number;
  yellowCards: number;
  redCards: number;
  cleanSheet: boolean;
  goalsConceded: number;
  specialPoints: number;
}

export type TimelineEntryKind =
  | "goal"
  | "owngoal"
  | "yellow"
  | "red"
  | "yellowred"
  | "sub";

export interface MatchTimelineEntry {
  minute: number; // sort key (leading minute; half-time ≈ 45)
  minuteLabel: string; // display, e.g. "62'", "90'+7'", "HT"
  side: "home" | "away";
  kind: TimelineEntryKind;
  player: string;
  // For substitutions: the player coming on (`player` is the one going off).
  subIn?: string;
}

export interface MatchEventSummary {
  homeOutcome: "WIN" | "DRAW" | "LOSS";
  awayOutcome: "WIN" | "DRAW" | "LOSS";
  homeCountryCode: string;
  awayCountryCode: string;
  homeResultPoints: number;
  awayResultPoints: number;
  players: MatchPlayerPoints[];
  timeline: MatchTimelineEntry[];
}

export async function getMatchEventSummary(
  match: MatchInfo,
): Promise<MatchEventSummary> {
  const [events, lineup, homeSquad, awaySquad] = await Promise.all([
    fetchTimeline(match.stageId, match.matchId),
    fetchMatchLineup(match.stageId, match.matchId),
    fetchSquad(match.homeTeamId, match.homeTeamName),
    fetchSquad(match.awayTeamId, match.awayTeamName),
  ]);

  const allPlayers = new Map<string, FifaPlayer>();
  for (const p of [...homeSquad, ...awaySquad]) allPlayers.set(p.id, p);

  const squadByTeam = new Map<string, FifaPlayer[]>([
    [match.homeTeamId, homeSquad],
    [match.awayTeamId, awaySquad],
  ]);

  const matchStats = computeMatchStats(
    match,
    events,
    lineup,
    allPlayers,
    squadByTeam,
  );

  const homeWins = match.homeScore > match.awayScore;
  const awayWins = match.awayScore > match.homeScore;
  const homeOutcome: "WIN" | "DRAW" | "LOSS" = homeWins
    ? "WIN"
    : awayWins
      ? "LOSS"
      : "DRAW";
  const awayOutcome: "WIN" | "DRAW" | "LOSS" = awayWins
    ? "WIN"
    : homeWins
      ? "LOSS"
      : "DRAW";

  const players: MatchPlayerPoints[] = matchStats
    .filter(
      (s) =>
        s.goalsScored > 0 ||
        s.ownGoals > 0 ||
        s.yellowCards > 0 ||
        s.redCards > 0 ||
        s.cleanSheet ||
        s.goalsConceded > 0,
    )
    .map((s) => {
      const player = allPlayers.get(s.playerId);
      if (!player) return null;
      const isHome = s.teamId === match.homeTeamId;
      const countryCode = isHome
        ? match.homeCountryCode
        : match.awayCountryCode;

      let pts = 0;
      pts += s.goalsScored * goalPoints(player.position);
      pts += s.ownGoals * POINTS.OWN_GOAL;
      pts += s.yellowCards * POINTS.YELLOW_CARD;
      pts += s.redCards * POINTS.RED_CARD;
      if (s.cleanSheet) pts += POINTS.CLEAN_SHEET_GK;
      pts += s.goalsConceded * POINTS.GOAL_CONCEDED_GK;

      return {
        playerName: player.name,
        teamId: s.teamId,
        countryCode,
        position: player.position,
        goalsScored: s.goalsScored,
        ownGoals: s.ownGoals,
        yellowCards: s.yellowCards,
        redCards: s.redCards,
        cleanSheet: s.cleanSheet,
        goalsConceded: s.goalsConceded,
        specialPoints: pts,
      };
    })
    .filter((p): p is MatchPlayerPoints => p !== null)
    .sort((a, b) => b.specialPoints - a.specialPoints);

  // Raw chronological event feed (goals, cards, subs) for the events view.
  const nameOf = (id: string) => allPlayers.get(id)?.name ?? "Unknown";
  const sideOf = (teamId: string): "home" | "away" =>
    teamId === match.homeTeamId ? "home" : "away";
  const kindByType: Partial<Record<TimelineEvent["type"], TimelineEntryKind>> =
    {
      Goal: "goal",
      OwnGoal: "owngoal",
      YellowCard: "yellow",
      RedCard: "red",
      YellowRedCard: "yellowred",
    };

  // Leading minute for sorting; half-time sits at ~45. Intra-minute and
  // stoppage-time order is preserved by the (stable) sort + chronological feed.
  const minuteKey = (label: string): number =>
    label === "HT" ? 45 : parseInt(label, 10) || 0;

  const timeline: MatchTimelineEntry[] = [];
  for (const e of events) {
    if (e.type === "SubstituteIn") continue; // handled alongside SubstituteOut
    if (e.type === "SubstituteOut") {
      timeline.push({
        minute: minuteKey(e.minuteLabel),
        minuteLabel: e.minuteLabel,
        side: sideOf(e.teamId),
        kind: "sub",
        player: nameOf(e.playerId),
        subIn: e.subInId ? nameOf(e.subInId) : undefined,
      });
      continue;
    }
    const kind = kindByType[e.type];
    if (!kind) continue; // skip Unknown / unmapped
    // Own goals count for the opponent, so show them on the benefiting side
    // (with the scoring defender's name + "(OG)").
    const scorerSide = sideOf(e.teamId);
    const side: "home" | "away" =
      kind === "owngoal"
        ? scorerSide === "home"
          ? "away"
          : "home"
        : scorerSide;
    timeline.push({
      minute: minuteKey(e.minuteLabel),
      minuteLabel: e.minuteLabel,
      side,
      kind,
      player: nameOf(e.playerId),
    });
  }
  timeline.sort((a, b) => a.minute - b.minute);

  return {
    homeOutcome,
    awayOutcome,
    homeCountryCode: match.homeCountryCode,
    awayCountryCode: match.awayCountryCode,
    homeResultPoints: POINTS[homeOutcome],
    awayResultPoints: POINTS[awayOutcome],
    players,
    timeline,
  };
}
