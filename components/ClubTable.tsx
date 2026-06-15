"use client";

import { useState } from "react";
import type { ClubTeam, Position } from "@/lib/fifa";

const POSITIONS: Position[] = ["GK", "DEF", "MID", "ATT"];

const posColor: Record<Position, string> = {
  GK: "bg-amber-400/20 text-amber-300",
  DEF: "bg-blue-500/20 text-blue-300",
  MID: "bg-emerald-500/20 text-emerald-300",
  ATT: "bg-red-500/20 text-red-300",
};

function lastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : name;
}

function flag(countryCode: string) {
  if (!countryCode) return null;
  return (
    <img
      src={`https://api.fifa.com/api/v3/picture/flags-sq-2/${countryCode}`}
      alt=""
      width={16}
      height={16}
      className="h-4 w-4 shrink-0 rounded-sm object-cover"
    />
  );
}

function ClubRow({ club, rank }: { club: ClubTeam; rank: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
      >
        <span className="w-5 shrink-0 text-center text-xs font-black tabular-nums text-white/30">
          {rank}
        </span>
        {flag(club.country)}
        <span className="min-w-0 flex-1 truncate font-semibold text-white">
          {club.name}
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-white/30">
          {club.filledCount}/11
        </span>
        <span className="w-10 shrink-0 text-right text-lg font-black tabular-nums text-[color:var(--color-gold)]">
          {club.totalPoints}
        </span>
        <span
          className={`shrink-0 text-xs text-white/30 transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="space-y-2 border-t border-white/10 px-4 py-3">
          {POSITIONS.map((pos) => (
            <div key={pos} className="flex items-start gap-2">
              <span
                className={`mt-0.5 w-9 shrink-0 rounded px-1 py-0.5 text-center text-[10px] font-bold uppercase ${posColor[pos]}`}
              >
                {pos}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {club.lineup[pos].map((p, i) =>
                  p ? (
                    <span
                      key={`${pos}-${p.name}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-xs"
                    >
                      {flag(p.countryCode)}
                      <span className="text-white/80">{lastName(p.name)}</span>
                      <span
                        className={`font-bold tabular-nums ${p.points > 0 ? "text-emerald-400" : p.points < 0 ? "text-red-400" : "text-white/30"}`}
                      >
                        {p.points}
                      </span>
                    </span>
                  ) : (
                    <span
                      // biome-ignore lint/suspicious/noArrayIndexKey: empty slots are static, position-fixed placeholders
                      key={`${pos}-empty-${i}`}
                      className="rounded-lg border border-dashed border-white/15 px-2 py-1 text-xs text-white/25"
                    >
                      empty
                    </span>
                  ),
                )}
              </div>
            </div>
          ))}

          {club.bench.length > 0 && (
            <div className="border-t border-white/5 pt-2">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">
                Not selected
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-white/30">
                {club.bench.map((p, i) => (
                  <span
                    key={`bench-${p.name}`}
                    className="inline-flex items-center gap-1"
                  >
                    {lastName(p.name)}
                    <span className="text-white/20">({p.position})</span>
                    {i < club.bench.length - 1 && (
                      <span className="text-white/15">·</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ClubTable({ clubs }: { clubs: ClubTeam[] }) {
  if (clubs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-white/30">No clubs yet</p>
    );
  }
  return (
    <div className="space-y-2">
      {clubs.map((club, i) => (
        <ClubRow key={club.name} club={club} rank={i + 1} />
      ))}
    </div>
  );
}
