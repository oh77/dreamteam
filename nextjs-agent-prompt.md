# Next.js FIFA World Cup 2026 App — Agent Prompt

You are implementing a Next.js app that fetches FIFA World Cup 2026 data **directly from the FIFA public API** — there is no separate backend. All data fetching and computation lives in Next.js API routes (or server components / server actions). The boilerplate is already in place.

---

## Part 1: FIFA API Integration

### Constants

```ts
const BASE_URL = "https://api.fifa.com/api/v3";
const COMPETITION_ID = "17";
const SEASON_ID = "285023";
const LANG = "en";
```

### Base fetch helper

All FIFA API calls require these headers and the `language` query param:

```ts
async function fifaFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  url.searchParams.set("language", LANG);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 300 }, // Next.js cache: revalidate every 5 minutes
  });

  if (!res.ok) throw new Error(`FIFA API ${res.status}: ${url}`);
  return res.json();
}
```

### Localized name helper

FIFA returns names as arrays of locale objects. Always extract English:

```ts
function localName(names: Array<{ Locale: string; Description: string }> | string | undefined): string {
  if (!names) return "Unknown";
  if (typeof names === "string") return names;
  return (names.find(n => n.Locale.startsWith("en")) ?? names[0])?.Description ?? "Unknown";
}
```

### Position mapping

FIFA uses both numeric IDs and string labels — handle both:

```ts
type Position = "GK" | "DEF" | "MID" | "ATT";

function mapPosition(pos: number | string | undefined): Position {
  if (pos === 0 || pos === "GKP" || pos === "Goalkeeper") return "GK";
  if (pos === 1 || pos === "DEF" || pos === "Defender") return "DEF";
  if (pos === 2 || pos === "MID" || pos === "Midfielder") return "MID";
  if (pos === 3 || pos === "FWD" || pos === "Forward" || pos === "Attacker") return "ATT";
  return "MID"; // fallback
}
```

### Match status

```ts
function isFinished(status: number): boolean {
  return status === 3 || status === 4 || status === 12 || status === 13;
}
// Status 0 = Upcoming/Scheduled
```

---

### Data Types

```ts
interface MatchInfo {
  matchId: string;
  stageId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
  finished: boolean;
  date: string | null;      // ISO date string from FIFA API "Date" field, e.g. "2026-06-11T20:00:00Z"
  stageName: string | null; // e.g. "Group A", "Round of 16"
}

interface FifaPlayer {
  id: string;
  name: string;
  position: Position;
  teamId: string;
  teamName: string;
  shirtNumber?: number;
}

interface TimelineEvent {
  type: "Goal" | "OwnGoal" | "YellowCard" | "RedCard" | "YellowRedCard" | "SubstituteIn" | "SubstituteOut" | "Unknown";
  playerId: string;
  teamId: string;
  minute: number;
}

interface MatchLineup {
  matchId: string;
  homeTeamPlayerIds: Set<string>;
  awayTeamPlayerIds: Set<string>;
}

interface PlayerMatchStats {
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

interface PlayerTournamentStats {
  player: FifaPlayer;
  points: number;
  breakdown: {
    matchResults: number;
    goals: number;
    cleanSheets: number;
    goalsConceded: number;  // stored as negative value
    ownGoals: number;       // stored as negative value
    yellowCards: number;    // stored as negative value
    redCards: number;       // stored as negative value
  };
  matchesPlayed: number;
}

interface SelectedTeam {
  goalkeeper: PlayerTournamentStats;
  defenders: PlayerTournamentStats[];   // 3 players
  midfielders: PlayerTournamentStats[]; // 4 players
  attackers: PlayerTournamentStats[];   // 3 players
  captain: PlayerTournamentStats;
  totalPoints: number;
}
```

---

### Fetch: All Matches

```
GET /calendar/matches?idSeason=285023&idCompetition=17&count=500&language=en
```

Paginated via `ContinuationToken`. The raw response fields you need:

```ts
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

    const data = await fifaFetch<any>("/calendar/matches", params);
    const results: any[] = data.Results ?? data.results ?? [];

    for (const m of results) {
      matches.push({
        matchId: String(m.IdMatch ?? m.MatchId ?? ""),
        stageId: String(m.IdStage ?? m.StageId ?? ""),
        homeTeamId: String(m.Home?.IdTeam ?? m.HomeTeamId ?? ""),
        homeTeamName: localName(m.Home?.TeamName),
        awayTeamId: String(m.Away?.IdTeam ?? m.AwayTeamId ?? ""),
        awayTeamName: localName(m.Away?.TeamName),
        homeScore: Number(m.Home?.Score ?? m.HomeTeamScore ?? 0) || 0,
        awayScore: Number(m.Away?.Score ?? m.AwayTeamScore ?? 0) || 0,
        finished: isFinished(m.MatchStatus ?? m.Status ?? 0),
        date: m.Date ?? m.LocalDate ?? null,
        stageName: localName(m.StageName) || null,
      });
    }

    token = data.ContinuationToken ?? data.continuationToken;
  } while (token);

  return matches;
}
```

### Fetch: Squad

```
GET /teams/{teamId}/squad?idCompetition=17&idSeason=285023&language=en
```

```ts
async function fetchSquad(teamId: string, teamName: string): Promise<FifaPlayer[]> {
  try {
    const data = await fifaFetch<any>(`/teams/${teamId}/squad`, {
      idCompetition: COMPETITION_ID,
      idSeason: SEASON_ID,
    });
    const squad: any[] = data.Players ?? data.Squad ?? data.players ?? [];
    return squad
      .map(p => ({
        id: String(p.IdPlayer ?? p.PlayerId ?? ""),
        name: localName(p.Name ?? p.PlayerName),
        position: mapPosition(p.Position ?? p.PositionId),
        teamId,
        teamName,
        shirtNumber: p.ShirtNumber ?? p.Number,
      }))
      .filter(p => p.id);
  } catch {
    return [];
  }
}
```

### Fetch: Match Timeline

```
GET /timelines/17/285023/{stageId}/{matchId}?language=en
```

Timeline events must be **deduplicated by EventId** — the live API can emit the same event multiple times:

```ts
async function fetchTimeline(stageId: string, matchId: string): Promise<TimelineEvent[]> {
  if (!stageId || !matchId) return [];
  try {
    const data = await fifaFetch<any>(`/timelines/${COMPETITION_ID}/${SEASON_ID}/${stageId}/${matchId}`);
    const raw: any[] = data.Event ?? data.Events ?? data.events ?? [];

    const seen = new Set<string>();
    const events = raw.filter(e => {
      const id = String(e.EventId ?? "");
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return events.flatMap(e => parseEvent(e));
  } catch {
    return [];
  }
}

function parseEvent(e: any): TimelineEvent[] {
  const typeId = e.Type;
  const playerId = String(e.IdPlayer ?? "");
  const teamId = String(e.IdTeam ?? "");
  const minute = parseInt(String(e.MatchMinute ?? e.Minute ?? "0").replace(/\D/g, ""), 10) || 0;

  if (!playerId || !teamId) return [];

  const base = { playerId, teamId, minute };

  // TypeLocalized is an array of { Locale, Description } — more reliable than numeric type IDs
  const desc: string = (
    (e.TypeLocalized as any[] | undefined)?.find(l => l.Locale === "en-GB")?.Description ?? ""
  ).toLowerCase();

  // Type 0 = Goal (confirmed from FIFA API). Must match exactly — "Attempt at Goal" (Type 12) also contains "goal"
  if (typeId === 0 || desc === "goal!") {
    if (desc.startsWith("own goal")) return [{ ...base, type: "OwnGoal" }];
    return [{ ...base, type: "Goal" }];
  }
  if (typeId === 2 || desc.includes("yellow card")) return [{ ...base, type: "YellowCard" }];
  if (desc.includes("red card")) return [{ ...base, type: "RedCard" }];
  if (desc.includes("yellow-red") || desc.includes("second yellow")) return [{ ...base, type: "YellowRedCard" }];
  if (desc.includes("substitut")) {
    const subInId = String(e.IdSubPlayer ?? "");
    const out: TimelineEvent[] = [{ ...base, type: "SubstituteOut" }];
    if (subInId) out.push({ playerId: subInId, teamId, minute, type: "SubstituteIn" });
    return out;
  }

  return [{ ...base, type: "Unknown" }];
}
```

### Fetch: Match Lineup

```
GET /live/football/17/285023/{stageId}/{matchId}?language=en
```

Returns which players appeared in the match (starting XI + bench):

```ts
async function fetchMatchLineup(stageId: string, matchId: string): Promise<MatchLineup | null> {
  try {
    const data = await fifaFetch<any>(`/live/football/${COMPETITION_ID}/${SEASON_ID}/${stageId}/${matchId}`);
    const home: any = data.Home ?? data.HomeTeam ?? {};
    const away: any = data.Away ?? data.AwayTeam ?? {};

    const extractIds = (team: any): Set<string> => {
      const players = [...(team.Players ?? team.StartingEleven ?? []), ...(team.Substitutes ?? team.Bench ?? [])];
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
```

---

### Scoring Logic

Point values:

```ts
const POINTS = {
  WIN: 3, DRAW: 1, LOSS: 0,
  GOAL_GK: 10, GOAL_DEF: 7, GOAL_MID: 5, GOAL_ATT: 3,
  CLEAN_SHEET_GK: 5,
  GOAL_CONCEDED_GK: -2,
  OWN_GOAL: -2,
  RED_CARD: -3,
  YELLOW_CARD: -1,
};

function goalPoints(position: Position): number {
  return { GK: 10, DEF: 7, MID: 5, ATT: 3 }[position];
}
```

**Per-match stats computation** — this is the most complex part. Key rules:

1. **Participants**: use lineup data if available; otherwise fall back to players who appear in timeline events.
2. **Outcome**: compare team score vs opponent score → WIN / DRAW / LOSS.
3. **GK clean sheet**: the GK must play the full match (from=0, to=90) AND their team conceded 0 goals.
4. **GK goals conceded**: if a GK is substituted, split goals-conceded responsibility by minute — the departing GK is responsible for goals scored before the sub minute, the incoming GK for goals after.
5. **OwnGoal**: benefits the opposing team, so `scoringTeamId = opponent`.

```ts
function computeMatchStats(
  match: MatchInfo,
  events: TimelineEvent[],
  lineup: MatchLineup | null,
  allPlayers: Map<string, FifaPlayer>,
  squadByTeam: Map<string, FifaPlayer[]>,
): PlayerMatchStats[] {
  // Resolve participants
  let participants: Set<string>;
  if (lineup) {
    participants = new Set([...lineup.homeTeamPlayerIds, ...lineup.awayTeamPlayerIds]);
  } else {
    participants = new Set(events.filter(e => allPlayers.has(e.playerId)).map(e => e.playerId));
  }

  // Goal minutes for GK responsibility splitting
  const goalMinutes = events
    .filter(e => e.type === "Goal" || e.type === "OwnGoal")
    .map(e => ({
      minute: e.minute,
      scoringTeamId: e.type === "OwnGoal"
        ? (e.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId)
        : e.teamId,
    }));

  // Resolve GK periods per team
  function resolveGkPeriods(teamId: string): Map<string, { from: number; to: number }> {
    const teamGks = (squadByTeam.get(teamId) ?? []).filter(p => p.position === "GK");
    const gkIds = new Set(teamGks.map(p => p.id));
    const periods = new Map<string, { from: number; to: number }>();

    const gkSubOut = events.find(e => e.type === "SubstituteOut" && e.teamId === teamId && gkIds.has(e.playerId));
    const gkSubIn  = events.find(e => e.type === "SubstituteIn"  && e.teamId === teamId && gkIds.has(e.playerId));

    if (gkSubOut && gkSubIn) {
      periods.set(gkSubOut.playerId, { from: 0, to: gkSubOut.minute });
      periods.set(gkSubIn.playerId,  { from: gkSubOut.minute, to: 90 });
      return periods;
    }

    if (lineup) {
      const lineupIds = new Set([...lineup.homeTeamPlayerIds, ...lineup.awayTeamPlayerIds]);
      const startingGk = teamGks.find(p => lineupIds.has(p.id));
      if (startingGk) { periods.set(startingGk.id, { from: 0, to: 90 }); return periods; }
    }

    if (teamGks.length === 1) periods.set(teamGks[0].id, { from: 0, to: 90 });
    return periods;
  }

  const homeGkPeriods = resolveGkPeriods(match.homeTeamId);
  const awayGkPeriods = resolveGkPeriods(match.awayTeamId);

  function gkGoalsConceded(gkTeamId: string, from: number, to: number): number {
    return goalMinutes.filter(g => g.scoringTeamId !== gkTeamId && g.minute >= from && g.minute <= to).length;
  }

  const stats: PlayerMatchStats[] = [];

  for (const playerId of participants) {
    const player = allPlayers.get(playerId);
    if (!player) continue;

    const teamId = player.teamId;
    const isHome = match.homeTeamId === teamId;
    const teamScore = isHome ? match.homeScore : match.awayScore;
    const oppScore  = isHome ? match.awayScore : match.homeScore;
    const outcomeVal: "WIN" | "DRAW" | "LOSS" = teamScore > oppScore ? "WIN" : teamScore === oppScore ? "DRAW" : "LOSS";

    const playerEvents = events.filter(e => e.playerId === playerId);
    const goalsScored = playerEvents.filter(e => e.type === "Goal").length;
    const ownGoals    = playerEvents.filter(e => e.type === "OwnGoal").length;
    const yellowCards = playerEvents.filter(e => e.type === "YellowCard" || e.type === "YellowRedCard").length;
    const redCards    = playerEvents.filter(e => e.type === "RedCard"    || e.type === "YellowRedCard").length;

    let cleanSheet = false;
    let goalsConceded = 0;

    if (player.position === "GK") {
      const gkPeriods = isHome ? homeGkPeriods : awayGkPeriods;
      const period = gkPeriods.get(playerId);
      if (period) {
        goalsConceded = gkGoalsConceded(teamId, period.from, period.to);
        const concededByTeam = isHome ? match.awayScore : match.homeScore;
        cleanSheet = period.from === 0 && period.to === 90 && concededByTeam === 0;
      }
    }

    stats.push({ playerId, matchId: match.matchId, teamId, outcome: outcomeVal, goalsScored, ownGoals, yellowCards, redCards, cleanSheet, goalsConceded });
  }

  return stats;
}
```

**Aggregate per-player across all matches:**

```ts
function aggregatePlayerStats(player: FifaPlayer, matchStats: PlayerMatchStats[]): PlayerTournamentStats {
  const breakdown = { matchResults: 0, goals: 0, cleanSheets: 0, goalsConceded: 0, ownGoals: 0, yellowCards: 0, redCards: 0 };
  const pts = POINTS;

  for (const ms of matchStats) {
    breakdown.matchResults  += ms.outcome === "WIN" ? pts.WIN : ms.outcome === "DRAW" ? pts.DRAW : pts.LOSS;
    breakdown.goals         += ms.goalsScored * goalPoints(player.position);
    breakdown.cleanSheets   += ms.cleanSheet ? pts.CLEAN_SHEET_GK : 0;
    breakdown.goalsConceded += ms.goalsConceded * pts.GOAL_CONCEDED_GK;  // negative
    breakdown.ownGoals      += ms.ownGoals    * pts.OWN_GOAL;            // negative
    breakdown.yellowCards   += ms.yellowCards * pts.YELLOW_CARD;         // negative
    breakdown.redCards      += ms.redCards    * pts.RED_CARD;            // negative
  }

  return {
    player,
    points: Object.values(breakdown).reduce((a, b) => a + b, 0),
    breakdown,
    matchesPlayed: matchStats.length,
  };
}
```

---

### Full Data Pipeline

Run once and cache the result (in-memory or via Next.js `unstable_cache`). This involves multiple async calls to the FIFA API:

```ts
async function runPipeline(): Promise<{
  players: PlayerTournamentStats[];
  matches: MatchInfo[];
  fetchedAt: string;
}> {
  const allMatches = await fetchAllMatches();
  const finishedMatches = allMatches.filter(m => m.finished);

  // Deduplicate finished matches by matchId (API pagination can repeat them)
  const seen = new Set<string>();
  const uniqueFinished = finishedMatches.filter(m => !seen.has(m.matchId) && seen.add(m.matchId));

  // Collect unique teams from ALL matches (not just finished)
  const teamMeta = new Map<string, string>();
  for (const m of allMatches) {
    if (m.homeTeamId && m.homeTeamName !== "Unknown") teamMeta.set(m.homeTeamId, m.homeTeamName);
    if (m.awayTeamId && m.awayTeamName !== "Unknown") teamMeta.set(m.awayTeamId, m.awayTeamName);
  }

  // Fetch all squads in parallel
  const squadByTeam = new Map<string, FifaPlayer[]>();
  const allPlayersMap = new Map<string, FifaPlayer>();
  await Promise.all(
    [...teamMeta.entries()].map(async ([teamId, teamName]) => {
      const squad = await fetchSquad(teamId, teamName);
      squadByTeam.set(teamId, squad);
      for (const p of squad) allPlayersMap.set(p.id, p);
    })
  );

  // Process each finished match
  const playerMatchStats = new Map<string, PlayerMatchStats[]>();

  for (const match of uniqueFinished) {
    const [events, lineup] = await Promise.all([
      fetchTimeline(match.stageId, match.matchId),
      fetchMatchLineup(match.stageId, match.matchId),
    ]);

    const matchStats = computeMatchStats(match, events, lineup, allPlayersMap, squadByTeam);

    for (const ms of matchStats) {
      if (!playerMatchStats.has(ms.playerId)) playerMatchStats.set(ms.playerId, []);
      const existing = playerMatchStats.get(ms.playerId)!;
      // Guard: skip if already recorded for this match
      if (!existing.some(e => e.matchId === ms.matchId)) existing.push(ms);
    }
  }

  // Aggregate — only players with at least one match played
  const players: PlayerTournamentStats[] = [];
  for (const [playerId, msList] of playerMatchStats) {
    const player = allPlayersMap.get(playerId);
    if (player && msList.length > 0) players.push(aggregatePlayerStats(player, msList));
  }

  return { players, matches: allMatches, fetchedAt: new Date().toISOString() };
}
```

**Important:** Cache this result. The full pipeline makes hundreds of HTTP calls. Use `unstable_cache` from `next/cache` with a long revalidation window (e.g. 5 minutes), or a module-level singleton. Expose a `POST /api/refresh` route that clears the cache.

---

### Team Selection (Optimizer)

Squad shape: 1 GK · 3 DEF · 4 MID · 3 ATT. Formation: 1-3-4-3.

Captain rule: the captain's points are doubled (including negative points). The net effect is that doubling adds their base points to the team total once more.

```ts
function selectTeam(allStats: PlayerTournamentStats[], mode: "best" | "worst"): SelectedTeam {
  const positions: Position[] = ["GK", "DEF", "MID", "ATT"];
  const counts: Record<Position, number> = { GK: 1, DEF: 3, MID: 4, ATT: 3 };
  const dir = mode === "best" ? "desc" : "asc";

  const selectedByPos = new Map<Position, PlayerTournamentStats[]>();
  for (const pos of positions) {
    const pool = allStats
      .filter(s => s.player.position === pos)
      .sort((a, b) => dir === "desc" ? b.points - a.points : a.points - b.points);
    selectedByPos.set(pos, pool.slice(0, counts[pos]));
  }

  const allSelected = [...selectedByPos.values()].flat();

  // Captain: the player whose doubling gives the biggest benefit
  const captain = allSelected.reduce((best, cur) =>
    mode === "best" ? (cur.points > best.points ? cur : best)
                    : (cur.points < best.points ? cur : best)
  );

  const applyCapture = (p: PlayerTournamentStats): PlayerTournamentStats =>
    p.player.id === captain.player.id
      ? {
          ...p,
          points: p.points * 2,
          breakdown: Object.fromEntries(Object.entries(p.breakdown).map(([k, v]) => [k, (v as number) * 2])) as any,
        }
      : p;

  const [gk] = selectedByPos.get("GK")!;
  const defenders   = selectedByPos.get("DEF")!;
  const midfielders = selectedByPos.get("MID")!;
  const attackers   = selectedByPos.get("ATT")!;
  const baseTotal   = allSelected.reduce((sum, p) => sum + p.points, 0);

  return {
    goalkeeper:  applyCapture(gk),
    defenders:   defenders.map(applyCapture),
    midfielders: midfielders.map(applyCapture),
    attackers:   attackers.map(applyCapture),
    captain,
    totalPoints: baseTotal + captain.points, // doubling adds captain's points once more
  };
}
```

---

### Next.js API Routes

Implement these routes in `app/api/`:

| Route | Method | Returns |
|-------|--------|---------|
| `/api/best-team` | GET | `SelectedTeam` formatted (see below) |
| `/api/worst-team` | GET | same |
| `/api/players` | GET | all players, optional `?position=GK\|DEF\|MID\|ATT` |
| `/api/matches` | GET | all matches with date + finished flag |
| `/api/stats` | GET | tournament metadata |
| `/api/refresh` | POST | clears cache, returns `{ ok: true }` |

Formatted team response shape (flatten nested `player` object for the UI):

```ts
const fmt = (p: PlayerTournamentStats, captainId: string) => ({
  name: p.player.name,
  team: p.player.teamName,
  position: p.player.position,
  points: p.points,
  matchesPlayed: p.matchesPlayed,
  breakdown: p.breakdown,
  isCaptain: p.player.id === captainId,
});
```

---

## Part 2: Pages to Build

### Design direction

Dark football aesthetic: deep green pitch background, white/light text, gold accents for captains and top scorers. Think fantasy football dashboard — not a data table dump. Mobile responsive.

Use a loading skeleton pattern for all data fetches. Use `SWR` or `React Query` (or Next.js server components — pick what's already in the boilerplate). Global nav linking all 5 pages.

---

### `/best-team` — Best Fantasy XI

Display the optimal 1-3-4-3 squad on a **football pitch graphic** (SVG or CSS-based green pitch with white lines).

- Arrange players in formation rows: GK at bottom, then DEF, MID, ATT rows
- Each player card: name, team name, position badge, total points
- Captain card gets a gold "C" badge and a note that their points are doubled
- Show total team points prominently
- Hover/click expands a player's full breakdown: goals, match results, clean sheets, cards, own goals

### `/worst-team` — Worst Fantasy XI

Same layout as best team. Add humorous framing ("Fantasy Nightmare XI", "Hall of Shame", etc.). The worst team captain makes things even worse — their negative points are doubled.

### `/upcoming-games` — Upcoming Matches

Fetch `/api/matches`, filter to `finished === false`, group by date.

- Group cards by date header
- Each card: home team vs away team, with flags or team name badges
- If `date` is null for some matches, group them under "Date TBD"
- Show stage name (group stage, knockout, etc.) if available
- If no upcoming matches, show a "Tournament complete" state

### `/results` — Results by Day

Fetch `/api/matches`, filter to `finished === true`, group by date (parse `date` field), sort most-recent first.

- Date headers
- Each result card: home team — score — away team, with a win/draw/loss colour indicator on each side
- If multiple matches on the same day, stack them in the date group

### `/players` — Player Stats

Filterable, sortable table of all players.

- Position filter tabs at top: All | GK | DEF | MID | ATT (hitting `/api/players?position=…`)
- Columns: Rank, Player, Team, Pos, Points, Played, Goals pts, Clean Sheet pts, Cards pts, Own Goal pts
- Default sort: points descending; allow sort on any column header
- Click a row to expand a full breakdown section
- Top 3 rows highlighted: gold / silver / bronze
- Search/filter by player name or team name

---

## Scoring Rules Reference (for UI labels)

| Position | Per Goal | Clean Sheet | Goals Conceded |
|----------|----------|-------------|----------------|
| GK       | +10      | +5          | −2 each        |
| DEF      | +7       | —           | —              |
| MID      | +5       | —           | —              |
| ATT      | +3       | —           | —              |

All positions: Win +3, Draw +1, Loss 0 · Yellow card −1 · Red card −3 · Own goal −2 · Captain: all points ×2
