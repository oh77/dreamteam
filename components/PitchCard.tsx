"use client";

import { useState } from "react";
import type { FormattedPlayer } from "@/lib/fifa";

const posColor: Record<string, string> = {
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

export function PitchCard({ player }: { player: FormattedPlayer }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-center transition-all hover:scale-105 hover:z-10 w-20 sm:w-24 ${
          player.isCaptain
            ? "ring-2 ring-[color:var(--color-gold)] shadow-lg shadow-yellow-900/40"
            : "ring-1 ring-white/20"
        } glass cursor-pointer`}
      >
        {player.isCaptain && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--color-gold)] text-[10px] font-black text-black shadow">
            C
          </span>
        )}
        <span
          className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${posColor[player.position]}`}
        >
          {player.position}
        </span>
        <span className="text-[11px] font-semibold leading-tight text-white line-clamp-2 w-full">
          {player.name.split(" ").slice(-1)[0]}
        </span>
        <span className="text-[9px] text-white/50 leading-none line-clamp-1 w-full">
          {player.team}
        </span>
        <span
          className={`text-sm font-bold ${player.isCaptain ? "text-[color:var(--color-gold)]" : "text-white"}`}
        >
          {player.points}
        </span>
      </button>

      {open && (
        <dialog
          open
          aria-modal="true"
          aria-label={`${player.name} stats`}
          className="fixed inset-0 z-50 m-0 flex h-full w-full items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
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
                  <h2 className="text-lg font-bold text-white">
                    {player.name}
                  </h2>
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
              {Object.entries(player.breakdown).map(([key, value]) => {
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
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-xl bg-white/10 py-2 text-sm text-white/70 hover:bg-white/20 transition-colors"
            >
              Close
            </button>
          </form>
        </dialog>
      )}
    </>
  );
}
