import { cacheLife, cacheTag } from "next/cache";
import { SampleTeamBoard } from "@/components/SampleTeamBoard";
import { getSampleTeams, runPipeline } from "@/lib/fifa";

export default async function PredictionsPage() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fifa-pipeline");

  const { players, teamCountry } = await runPipeline();
  const teams = getSampleTeams(players, teamCountry);
  const leader = teams.reduce((best, t) =>
    t.team.totalPoints > best.team.totalPoints ? t : best,
  );
  const tied = teams.every(
    (t) => t.team.totalPoints === leader.team.totalPoints,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-black text-white">AI Predictions</h1>
        <p className="mx-auto mt-1 max-w-xl text-sm text-white/50">
          Two fantasy XIs picked by ChatGPT and Claude before a ball was kicked,
          scored live with the same rules as the Dream Team.
        </p>
      </div>

      {/* Head-to-head scoreboard */}
      <div className="mb-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {teams.slice(0, 2).flatMap((t, i) => {
          const isLeader = !tied && t.id === leader.id;
          const card = (
            <div key={t.id} className={i === 0 ? "text-right" : "text-left"}>
              <div className="text-xs font-bold uppercase tracking-widest text-white/40">
                {t.name}
              </div>
              <div
                className={`text-4xl font-black tabular-nums ${
                  isLeader ? "text-[color:var(--color-gold)]" : "text-white"
                }`}
              >
                {t.team.totalPoints}
              </div>
              {isLeader && (
                <div className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-gold)]">
                  Leading
                </div>
              )}
            </div>
          );
          return i === 0
            ? [
                card,
                <div
                  key="vs"
                  className="text-center text-sm font-bold text-white/30"
                >
                  vs
                </div>,
              ]
            : [card];
        })}
      </div>

      <div className="space-y-10">
        {teams.map((t) => (
          <SampleTeamBoard key={t.id} sample={t} />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-white/30">
        Tap any player card to see their points breakdown
      </p>
    </div>
  );
}
