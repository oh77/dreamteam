"use client";

import { useState } from "react";
import { PitchCard } from "@/components/PitchCard";
import type { FormattedPlayer, SelectedTeam } from "@/lib/fifa";

function PitchRow({ players }: { players: FormattedPlayer[] }) {
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3 w-full">
      {players.map((p) => (
        <PitchCard key={p.name} player={p} />
      ))}
    </div>
  );
}

interface Props {
  teamStrict: SelectedTeam | null;
  teamOpen: SelectedTeam | null;
  altTeamStrict: SelectedTeam | null;
  altTeamOpen: SelectedTeam | null;
  primaryLabel: string;
  altLabel: string;
  mode: "best" | "worst";
}

export function TeamPitchView({
  teamStrict,
  teamOpen,
  altTeamStrict,
  altTeamOpen,
  primaryLabel,
  altLabel,
  mode,
}: Props) {
  const [pool, setPool] = useState<"primary" | "alt">("primary");
  const [strict, setStrict] = useState(true);
  const isBest = mode === "best";
  const team =
    pool === "primary"
      ? strict
        ? teamStrict
        : teamOpen
      : strict
        ? altTeamStrict
        : altTeamOpen;

  return (
    <>
      {/* Pool toggle */}
      <div className="mb-4 flex justify-center gap-1">
        {(
          [
            { key: "primary", label: primaryLabel },
            { key: "alt", label: altLabel },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setPool(key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              pool === key
                ? isBest
                  ? "bg-[color:var(--color-gold)] text-black"
                  : "bg-red-600 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {team ? (
        <TeamPitch
          team={team}
          mode={mode}
          strict={strict}
          setStrict={setStrict}
        />
      ) : (
        <p className="py-16 text-center text-sm text-white/40">
          Not enough players yet — no team has advanced from the group stage.
        </p>
      )}
    </>
  );
}

function TeamPitch({
  team,
  mode,
  strict,
  setStrict,
}: {
  team: SelectedTeam;
  mode: "best" | "worst";
  strict: boolean;
  setStrict: (fn: (s: boolean) => boolean) => void;
}) {
  const isBest = mode === "best";

  return (
    <>
      {/* Points + captain */}
      <div className="mb-4 flex flex-col items-center gap-3">
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 ring-1 ${
            isBest
              ? "bg-[color:var(--color-gold)]/10 ring-[color:var(--color-gold)]/30"
              : "bg-red-900/30 ring-red-700/40"
          }`}
        >
          <span
            className={`font-black text-xl ${isBest ? "text-[color:var(--color-gold)]" : "text-red-400"}`}
          >
            {team.totalPoints}
          </span>
          <span
            className={`text-sm ${isBest ? "text-[color:var(--color-gold-light)]" : "text-red-300/70"}`}
          >
            total points
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm text-white/60">
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
              isBest
                ? "bg-[color:var(--color-gold)] text-black"
                : "bg-red-600 text-white"
            }`}
          >
            C
          </span>
          <span>
            Captain{" "}
            <strong
              className={
                isBest ? "text-[color:var(--color-gold)]" : "text-red-400"
              }
            >
              {team.captain.name}
            </strong>{" "}
            — {isBest ? "points doubled" : "making things even worse"}
          </span>
        </div>
      </div>

      {/* Team rule toggle */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <span className="text-xs text-white/40">Respect team rule</span>
        <button
          type="button"
          role="switch"
          aria-checked={strict}
          onClick={() => setStrict((s) => !s)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
            strict ? "bg-[color:var(--color-gold)]" : "bg-white/20"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${
              strict ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-xs text-white/25">max 2 per nation</span>
      </div>

      {/* Pitch */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-2xl"
        style={{
          minHeight: "520px",
          ...(isBest
            ? {}
            : {
                backgroundImage:
                  "repeating-linear-gradient(180deg, #2a1010 0px, #2a1010 40px, #331515 40px, #331515 80px)",
              }),
        }}
      >
        {isBest && <div className="absolute inset-0 pitch-stripes" />}

        <div
          className={`pointer-events-none absolute inset-3 rounded border ${isBest ? "border-white/25" : "border-white/15"}`}
        >
          <div
            className={`absolute top-1/2 inset-x-0 h-px ${isBest ? "bg-white/25" : "bg-white/15"}`}
          />
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full border ${isBest ? "border-white/25" : "border-white/15"}`}
          />
          <div
            className={`absolute top-0 left-1/2 -translate-x-1/2 h-16 w-44 border-b border-l border-r ${isBest ? "border-white/25" : "border-white/15"}`}
          />
          <div
            className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-16 w-44 border-t border-l border-r ${isBest ? "border-white/25" : "border-white/15"}`}
          />
        </div>

        <div className="relative z-10 flex flex-col-reverse items-center gap-6 px-4 py-8 sm:gap-8">
          <PitchRow players={[team.goalkeeper]} />
          <PitchRow players={team.defenders} />
          <PitchRow players={team.midfielders} />
          <PitchRow players={team.attackers} />
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-white/30">
        Tap any player card to see full breakdown
      </p>
    </>
  );
}
