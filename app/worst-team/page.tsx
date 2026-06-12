import { PitchCard } from "@/components/PitchCard";
import type { FormattedPlayer } from "@/lib/fifa";
import { runPipeline, selectTeam } from "@/lib/fifa";

function PitchRow({ players }: { players: FormattedPlayer[] }) {
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3 w-full">
      {players.map((p) => (
        <PitchCard key={p.name} player={p} />
      ))}
    </div>
  );
}

export default async function WorstTeamPage() {
  const { players } = await runPipeline();
  const team = selectTeam(players, "worst");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-white sm:text-4xl">
          Fantasy Nightmare XI
        </h1>
        <p className="mt-1 text-sm text-red-400/80">
          Hall of Shame · The worst of the worst
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-900/30 px-4 py-1.5 ring-1 ring-red-700/40">
          <span className="font-black text-xl text-red-400">
            {team.totalPoints}
          </span>
          <span className="text-sm text-red-300/70">total points</span>
        </div>
      </div>

      {/* Captain callout */}
      <div className="mb-4 flex items-center justify-center gap-2 text-sm text-white/60">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white">
          C
        </span>
        <span>
          Captain <strong className="text-red-400">{team.captain.name}</strong>{" "}
          — making things even worse
        </span>
      </div>

      {/* Pitch */}
      <div
        className="relative overflow-hidden rounded-2xl shadow-2xl"
        style={{
          minHeight: "520px",
          backgroundImage:
            "repeating-linear-gradient(180deg, #2a1010 0px, #2a1010 40px, #331515 40px, #331515 80px)",
        }}
      >
        {/* Pitch lines */}
        <div className="pointer-events-none absolute inset-3 rounded border border-white/15">
          <div className="absolute top-1/2 inset-x-0 h-px bg-white/15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full border border-white/15" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-16 w-44 border-b border-l border-r border-white/15" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-16 w-44 border-t border-l border-r border-white/15" />
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
    </div>
  );
}
