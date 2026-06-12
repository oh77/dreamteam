import { PitchCard } from "@/components/PitchCard";
import type { FormattedPlayer } from "@/lib/fifa";
import { runPipeline, selectTeam } from "@/lib/fifa";

function PitchRow({
  players,
  label,
}: {
  players: FormattedPlayer[];
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 w-full">
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
          {label}
        </span>
      )}
      <div className="flex items-end justify-center gap-2 sm:gap-3 w-full">
        {players.map((p) => (
          <PitchCard key={p.name} player={p} />
        ))}
      </div>
    </div>
  );
}

export default async function BestTeamPage() {
  const { players } = await runPipeline();
  const team = selectTeam(players, "best");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          Best Fantasy XI
        </h1>
        <p className="mt-1 text-white/50 text-sm">
          Optimal 1-3-4-3 formation by points scored
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-gold)]/10 px-4 py-1.5 ring-1 ring-[color:var(--color-gold)]/30">
          <span className="text-[color:var(--color-gold)] font-black text-xl">
            {team.totalPoints}
          </span>
          <span className="text-[color:var(--color-gold-light)] text-sm">
            total points
          </span>
        </div>
      </div>

      {/* Captain callout */}
      <div className="mb-4 flex items-center justify-center gap-2 text-sm text-white/60">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--color-gold)] text-[10px] font-black text-black">
          C
        </span>
        <span>
          Captain{" "}
          <strong className="text-[color:var(--color-gold)]">
            {team.captain.name}
          </strong>{" "}
          — points doubled
        </span>
      </div>

      {/* Pitch */}
      <div
        className="relative overflow-hidden rounded-2xl pitch-stripes shadow-2xl"
        style={{ minHeight: "520px" }}
      >
        {/* Pitch lines */}
        <div className="pointer-events-none absolute inset-3 rounded border border-white/25">
          {/* Center line */}
          <div className="absolute top-1/2 inset-x-0 h-px bg-white/25" />
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full border border-white/25" />
          {/* Top penalty area */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-16 w-44 border-b border-l border-r border-white/25" />
          {/* Bottom penalty area */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-16 w-44 border-t border-l border-r border-white/25" />
        </div>

        {/* Formation (top = ATT, bottom = GK) */}
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
    </div>
  );
}
