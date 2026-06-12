"use client";

import React, { useMemo, useState } from "react";
import type { PlayerTournamentStats, Position } from "@/lib/fifa";

type SortKey =
  | "points"
  | "matchesPlayed"
  | "goals"
  | "cleanSheets"
  | "yellowCards"
  | "redCards";
type SortDir = "asc" | "desc";

const posFilter: Array<{ label: string; value: Position | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "GK", value: "GK" },
  { label: "DEF", value: "DEF" },
  { label: "MID", value: "MID" },
  { label: "ATT", value: "ATT" },
];

const posColor: Record<string, string> = {
  GK: "bg-amber-400/20 text-amber-300",
  DEF: "bg-blue-500/20 text-blue-300",
  MID: "bg-emerald-500/20 text-emerald-300",
  ATT: "bg-red-500/20 text-red-300",
};

const medalClass = [
  "text-[color:var(--color-gold)]",
  "text-[color:var(--color-silver)]",
  "text-[color:var(--color-bronze)]",
];
const medalBg = [
  "bg-yellow-900/30 ring-1 ring-yellow-500/30",
  "bg-zinc-800/60 ring-1 ring-zinc-500/30",
  "bg-orange-900/20 ring-1 ring-orange-700/30",
];

export function PlayerTable({ players }: { players: PlayerTournamentStats[] }) {
  const [positionFilter, setPositionFilter] = useState<Position | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = players;
    if (positionFilter !== "ALL")
      list = list.filter((p) => p.player.position === positionFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.player.name.toLowerCase().includes(q) ||
          p.player.teamName.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      let av = 0;
      let bv = 0;
      if (sortKey === "points") {
        av = a.points;
        bv = b.points;
      } else if (sortKey === "matchesPlayed") {
        av = a.matchesPlayed;
        bv = b.matchesPlayed;
      } else if (sortKey === "goals") {
        av = a.breakdown.goals;
        bv = b.breakdown.goals;
      } else if (sortKey === "cleanSheets") {
        av = a.breakdown.cleanSheets;
        bv = b.breakdown.cleanSheets;
      } else if (sortKey === "yellowCards") {
        av = a.breakdown.yellowCards;
        bv = b.breakdown.yellowCards;
      } else if (sortKey === "redCards") {
        av = a.breakdown.redCards;
        bv = b.breakdown.redCards;
      }
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [players, positionFilter, search, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (col !== sortKey) return <span className="text-white/20 ml-1">↕</span>;
    return (
      <span className="text-[color:var(--color-gold)] ml-1">
        {sortDir === "desc" ? "↓" : "↑"}
      </span>
    );
  }

  const allSorted = useMemo(
    () => [...players].sort((a, b) => b.points - a.points),
    [players],
  );
  const topThreeIds = new Set(allSorted.slice(0, 3).map((p) => p.player.id));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1">
          {posFilter.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => setPositionFilter(value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                positionFilter === value
                  ? "bg-[color:var(--color-gold)] text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search player or team…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-white/30 focus:outline-none sm:w-64"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl ring-1 ring-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-white/50 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-8">#</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-left hidden sm:table-cell">Team</th>
              <th className="px-3 py-3 text-center">Pos</th>
              <th
                className="px-3 py-3 text-right cursor-pointer hover:text-white"
                onClick={() => handleSort("points")}
              >
                Pts <SortIcon col="points" />
              </th>
              <th
                className="px-3 py-3 text-right cursor-pointer hover:text-white hidden md:table-cell"
                onClick={() => handleSort("matchesPlayed")}
              >
                P <SortIcon col="matchesPlayed" />
              </th>
              <th
                className="px-3 py-3 text-right cursor-pointer hover:text-white hidden lg:table-cell"
                onClick={() => handleSort("goals")}
              >
                Goal pts <SortIcon col="goals" />
              </th>
              <th
                className="px-3 py-3 text-right cursor-pointer hover:text-white hidden lg:table-cell"
                onClick={() => handleSort("cleanSheets")}
              >
                CS pts <SortIcon col="cleanSheets" />
              </th>
              <th
                className="px-3 py-3 text-right cursor-pointer hover:text-white hidden xl:table-cell"
                onClick={() => handleSort("yellowCards")}
              >
                YC pts <SortIcon col="yellowCards" />
              </th>
              <th
                className="px-3 py-3 text-right cursor-pointer hover:text-white hidden xl:table-cell"
                onClick={() => handleSort("redCards")}
              >
                RC pts <SortIcon col="redCards" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-white/30">
                  No players found
                </td>
              </tr>
            )}
            {filtered.map((p, idx) => {
              const globalRank = allSorted.findIndex(
                (x) => x.player.id === p.player.id,
              );
              const isTop = topThreeIds.has(p.player.id);
              const expanded = expandedId === p.player.id;
              return (
                <React.Fragment key={p.player.id}>
                  <tr
                    onClick={() => setExpandedId(expanded ? null : p.player.id)}
                    className={`cursor-pointer transition-colors hover:bg-white/5 ${isTop ? medalBg[globalRank] : ""}`}
                  >
                    <td className="px-4 py-3 text-white/40 w-8">
                      {isTop ? (
                        <span className={`font-bold ${medalClass[globalRank]}`}>
                          {globalRank + 1}
                        </span>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-medium ${isTop && globalRank === 0 ? "text-[color:var(--color-gold)]" : "text-white"}`}
                      >
                        {p.player.name}
                      </span>
                      <span className="block text-xs text-white/40 sm:hidden">
                        {p.player.teamName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60 hidden sm:table-cell">
                      {p.player.teamName}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${posColor[p.player.position]}`}
                      >
                        {p.player.position}
                      </span>
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-bold ${isTop && globalRank === 0 ? "text-[color:var(--color-gold)]" : "text-white"}`}
                    >
                      {p.points}
                    </td>
                    <td className="px-3 py-3 text-right text-white/60 hidden md:table-cell">
                      {p.matchesPlayed}
                    </td>
                    <td className="px-3 py-3 text-right text-white/60 hidden lg:table-cell">
                      {p.breakdown.goals > 0
                        ? `+${p.breakdown.goals}`
                        : p.breakdown.goals}
                    </td>
                    <td className="px-3 py-3 text-right text-white/60 hidden lg:table-cell">
                      {p.breakdown.cleanSheets > 0
                        ? `+${p.breakdown.cleanSheets}`
                        : p.breakdown.cleanSheets}
                    </td>
                    <td className="px-3 py-3 text-right hidden xl:table-cell">
                      <span
                        className={
                          p.breakdown.yellowCards < 0
                            ? "text-amber-400"
                            : "text-white/60"
                        }
                      >
                        {p.breakdown.yellowCards}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right hidden xl:table-cell">
                      <span
                        className={
                          p.breakdown.redCards < 0
                            ? "text-red-400"
                            : "text-white/60"
                        }
                      >
                        {p.breakdown.redCards}
                      </span>
                    </td>
                  </tr>
                  {expanded && (
                    <tr
                      key={`${p.player.id}-expand`}
                      className="bg-white/[0.03]"
                    >
                      <td colSpan={10} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                          {Object.entries(p.breakdown).map(([key, val]) => {
                            const v = val as number;
                            const labels: Record<string, string> = {
                              matchResults: "Match pts",
                              goals: "Goal pts",
                              cleanSheets: "Clean sheets",
                              goalsConceded: "Goals conceded",
                              ownGoals: "Own goals",
                              yellowCards: "Yellow cards",
                              redCards: "Red cards",
                            };
                            return (
                              <div
                                key={key}
                                className="rounded-xl bg-white/5 px-3 py-2 text-center"
                              >
                                <div
                                  className={`text-lg font-bold ${v > 0 ? "text-emerald-400" : v < 0 ? "text-red-400" : "text-white/30"}`}
                                >
                                  {v > 0 ? "+" : ""}
                                  {v}
                                </div>
                                <div className="text-[10px] text-white/40 leading-tight mt-0.5">
                                  {labels[key] ?? key}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-white/30 text-center">
        {filtered.length} player{filtered.length !== 1 ? "s" : ""} · Click any
        row to expand breakdown
      </p>
    </div>
  );
}
