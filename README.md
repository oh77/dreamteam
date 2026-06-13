# Dream Team — FIFA World Cup 2026 Fantasy Stats

A Next.js app that builds a fantasy-football "Dream Team" from **live FIFA World Cup 2026 data**. It pulls match results, squads and event timelines straight from FIFA's public API, scores every player with a fantasy points system, and renders the best (and worst) possible XI on a pitch — plus results, upcoming fixtures and full player stats.

No database, no auth, no manual data entry: everything is derived on the fly from the FIFA API and cached.

## Pages

| Route             | What it shows                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `/best-team`      | The optimal **1-3-4-3** XI by fantasy points, on a pitch. (Default landing page.)               |
| `/worst-team`     | The "Nightmare XI" — the lowest-scoring XI.                                                      |
| `/players`        | Sortable table of every player's points and breakdown.                                          |
| `/results`        | Finished matches (newest first). Tap a match to expand per-player point contributions.          |
| `/upcoming-games` | Scheduled fixtures, grouped by day, with **Swedish TV broadcasters** per match where available. |

`/` redirects to `/best-team`.

**Live matches** (in play right now) appear on **both** `/results` and `/upcoming-games`, pinned to the top, with a pulsing "Live" tag and the current match minute (e.g. `90'+7'`). They are intentionally **excluded from scoring** until full-time, so an in-progress game never skews the Dream Team.

## Scoring

Each player accumulates points across all **finished** matches they appeared in:

| Event                        | Points                                   |
| ---------------------------- | ---------------------------------------- |
| Match win / draw / loss      | `+3` / `+1` / `0`                        |
| Goal scored                  | `+10` GK, `+7` DEF, `+5` MID, `+3` ATT   |
| Clean sheet (GK, full match) | `+5`                                     |
| Goal conceded (GK)           | `−2` each                                |
| Own goal                     | `−2`                                     |
| Yellow card                  | `−1`                                     |
| Red card                     | `−3`                                     |

Notes:
- Goal value is **position-weighted** — a goalkeeper scoring is worth far more than a striker.
- **Goalkeeper** clean-sheet / goals-conceded logic accounts for substitutions: if the keeper is subbed, points are split by the minutes each keeper was on the pitch.
- The **captain** (highest scorer in the selected XI; for the Nightmare XI, the lowest) has their points **doubled**. The player detail card shows the base breakdown plus a separate "Captain ×2" row.

### Team rule (max 2 per nation)

Both XI pages have a **"Respect team rule"** toggle (on by default) that caps the XI at **2 players per nation**.

Selection ranks **all** players into a single list first, then fills the formation slots top-down — so a high-scoring attacker is never blocked just because two lower-scoring players from his nation were considered in an earlier position. With the rule off, results are identical to a plain per-position top-N.

## Data source & caching

All data comes from the public FIFA API (`https://api.fifa.com/api/v3`) for **competition `17`, season `285023`** (World Cup 2026). Relevant endpoints: `/calendar/matches`, `/teams/{id}/squad`, `/timelines/...`, `/live/football/...`, and `/watch/season/{id}` (broadcasters).

Caching uses Next.js **Cache Components** (`cacheComponents: true`) with two layers:

1. **Raw FIFA fetches** — each HTTP call is cached for **5 minutes** (`revalidate: 300`).
2. **Computed pipeline & pages** — `cacheLife("minutes")`: revalidates ~every **60s**, serves stale up to 5 min, hard-expires at 1 hr. Broadcaster data uses `cacheLife("hours")`.

Net effect: pages re-render about once a minute, but fresh match data lands roughly every **~5 minutes** (worst case). Revalidation is lazy (stale-while-revalidate), so an idle page updates on the next request, not on a timer. This is why live minutes are near-real-time, not exact.

> The `/watch/season` broadcasts endpoint returns ~9 MB — too large for Next's 2 MB fetch cache — so it's fetched with `cache: "no-store"` and only the small filtered (Swedish) result is cached at the function level.

To force a refresh, `POST /api/refresh` revalidates the `fifa-pipeline` cache tag.

## Project structure

```
app/
  best-team/        Best XI page
  worst-team/       Nightmare XI page
  players/          Player stats table
  results/          Finished + live matches
  upcoming-games/   Fixtures + Swedish broadcasters + live
  api/              JSON endpoints (matches, players, stats, match-events, refresh, …)
components/
  TeamPitchView     Client wrapper: team-rule toggle + pitch
  PitchCard         Player card on the pitch (flag, points, detail modal)
  MatchResultCard   Expandable result row with per-player points
  PlayerTable, Nav
lib/
  fifa.ts           The whole data pipeline: fetching, scoring, team selection
```

`lib/fifa.ts` is the heart of the app — fetching, point calculation, GK substitution handling, team selection and the cached `runPipeline()`.

## Getting started

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `yarn dev`     | Start the dev server (Turbopack).    |
| `yarn build`   | Production build.                    |
| `yarn start`   | Serve the production build.          |
| `yarn lint`    | Lint with Biome.                     |
| `yarn format`  | Format with Biome.                   |

## Tech stack

- **Next.js 16** (App Router, Cache Components / PPR, React Compiler) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Biome** for lint/format

> ⚠️ This project runs a recent, breaking-change build of Next.js. Conventions may differ from older Next.js — the bundled docs in `node_modules/next/dist/docs/` are the source of truth. See `AGENTS.md`.
