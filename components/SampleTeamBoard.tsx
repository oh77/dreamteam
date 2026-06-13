import { PitchCard } from "@/components/PitchCard";
import type { FormattedPlayer, SampleTeam } from "@/lib/fifa";

const accent: Record<
  SampleTeam["accent"],
  { ring: string; bg: string; text: string; total: string; cap: string }
> = {
  gpt: {
    ring: "ring-emerald-400/30",
    bg: "bg-emerald-400/10",
    text: "text-emerald-300",
    total: "text-emerald-400",
    cap: "bg-emerald-400 text-black",
  },
  claude: {
    ring: "ring-orange-400/30",
    bg: "bg-orange-400/10",
    text: "text-orange-300",
    total: "text-orange-400",
    cap: "bg-orange-400 text-black",
  },
};

function PitchRow({ players }: { players: FormattedPlayer[] }) {
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-3 w-full">
      {players.map((p) => (
        <PitchCard key={`${p.name}-${p.position}`} player={p} />
      ))}
    </div>
  );
}

export function SampleTeamBoard({ sample }: { sample: SampleTeam }) {
  const a = accent[sample.accent];
  const { team } = sample;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black text-white">{sample.name}</h2>
          <p className="text-xs text-white/40">{sample.subtitle}</p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 ring-1 ${a.bg} ${a.ring}`}
        >
          <span className={`font-black text-xl ${a.total}`}>
            {team.totalPoints}
          </span>
          <span className={`text-sm ${a.text}`}>pts</span>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm text-white/60">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${a.cap}`}
        >
          C
        </span>
        <span>
          Captain <strong className={a.text}>{team.captain.name}</strong> —
          points doubled
        </span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl pitch-stripes shadow-2xl"
        style={{ minHeight: "520px" }}
      >
        <div className="pointer-events-none absolute inset-3 rounded border border-white/25">
          <div className="absolute top-1/2 inset-x-0 h-px bg-white/25" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-full border border-white/25" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-16 w-44 border-b border-l border-r border-white/25" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-16 w-44 border-t border-l border-r border-white/25" />
        </div>

        <div className="relative z-10 flex flex-col-reverse items-center gap-6 px-4 py-8 sm:gap-8">
          <PitchRow players={[team.goalkeeper]} />
          <PitchRow players={team.defenders} />
          <PitchRow players={team.midfielders} />
          <PitchRow players={team.attackers} />
        </div>
      </div>
    </div>
  );
}
