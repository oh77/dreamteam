"use client";

import { createPortal } from "react-dom";
import type { PlayerTournamentStats, Position } from "@/lib/fifa";

const posColor: Record<Position, string> = {
  GK: "bg-amber-400 text-black",
  DEF: "bg-blue-500 text-white",
  MID: "bg-emerald-500 text-white",
  ATT: "bg-red-500 text-white",
};

const breakdownLabels: Record<string, string> = {
  matchResults: "Match Results",
  goals: "Goals",
  cleanSheets: "Clean Sheets",
  goalsConceded: "Goals Conceded",
  ownGoals: "Own Goals",
  yellowCards: "Yellow Cards",
  redCards: "Red Cards",
};

export interface BreakdownPlayer {
  name: string;
  team: string;
  position: Position;
  points: number;
  matchesPlayed: number;
  baseBreakdown: PlayerTournamentStats["breakdown"];
  isCaptain?: boolean;
}

export function PlayerBreakdownDialog({
  player,
  onClose,
}: {
  player: BreakdownPlayer;
  onClose: () => void;
}) {
  // Render into document.body so the fixed-position overlay escapes any
  // ancestor that establishes a containing block for fixed elements (the club
  // card's `glass` backdrop-filter does this in Safari, trapping the modal
  // inside the card). SSR has no document, so render nothing until mounted.
  if (typeof document === "undefined") return null;

  return createPortal(
    <dialog
      open
      aria-modal="true"
      aria-label={`${player.name} stats`}
      className="fixed inset-0 z-50 m-0 flex h-full w-full items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <form
        method="dialog"
        className="glass w-full max-w-sm rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">{player.name}</h2>
              {player.isCaptain && (
                <span className="rounded bg-[color:var(--color-gold)] px-1.5 py-0.5 text-xs font-black text-black">
                  Captain
                </span>
              )}
            </div>
            <p className="text-sm text-white/60">{player.team}</p>
          </div>
          <div className="text-right">
            <div
              className={`text-2xl font-black ${player.isCaptain ? "text-[color:var(--color-gold)]" : "text-white"}`}
            >
              {player.points}
            </div>
            <div className="text-xs text-white/50">points</div>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold ${posColor[player.position]}`}
          >
            {player.position}
          </span>
          <span className="text-xs text-white/50">
            {player.matchesPlayed} matches played
          </span>
        </div>

        <div className="space-y-2">
          {Object.entries(player.baseBreakdown).map(([key, value]) => {
            const v = value as number;
            if (v === 0) return null;
            return (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5"
              >
                <span className="text-sm text-white/70">
                  {breakdownLabels[key] ?? key}
                </span>
                <span
                  className={`text-sm font-semibold ${v > 0 ? "text-emerald-400" : "text-red-400"}`}
                >
                  {v > 0 ? "+" : ""}
                  {v}
                </span>
              </div>
            );
          })}
          {player.isCaptain &&
            (() => {
              const base = Object.values(player.baseBreakdown).reduce(
                (s, v) => s + (v as number),
                0,
              );
              return base !== 0 ? (
                <div className="flex items-center justify-between rounded-lg bg-[color:var(--color-gold)]/10 px-3 py-1.5 ring-1 ring-[color:var(--color-gold)]/20">
                  <span className="text-sm text-[color:var(--color-gold)]/80">
                    Captain ×2
                  </span>
                  <span className="text-sm font-semibold text-[color:var(--color-gold)]">
                    {base > 0 ? "+" : ""}
                    {base}
                  </span>
                </div>
              ) : null;
            })()}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-white/10 py-2 text-sm text-white/70 hover:bg-white/20 transition-colors"
        >
          Close
        </button>
      </form>
    </dialog>,
    document.body,
  );
}
