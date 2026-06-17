"use client";

import { useState } from "react";
import type { FormattedPlayer } from "@/lib/fifa";
import { PlayerBreakdownDialog } from "./PlayerBreakdownDialog";

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
        <span className="text-[11px] font-semibold leading-tight text-white line-clamp-2 w-full">
          {player.name.split(" ").slice(-1)[0]}
        </span>
        {player.countryCode ? (
          <img
            src={`https://api.fifa.com/api/v3/picture/flags-sq-2/${player.countryCode}`}
            alt={player.team}
            width={16}
            height={16}
            className="w-4 h-4 rounded-sm object-cover"
          />
        ) : (
          <div className="w-4 h-4" />
        )}
        <span
          className={`text-sm font-bold ${player.isCaptain ? "text-[color:var(--color-gold)]" : "text-white"}`}
        >
          {player.points}
        </span>
      </button>

      {open && (
        <PlayerBreakdownDialog player={player} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
