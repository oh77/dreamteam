import { cacheLife, cacheTag } from "next/cache";
import { PlayerTable } from "@/components/PlayerTable";
import { runPipeline } from "@/lib/fifa";

export default async function PlayersPage() {
  "use cache";
  cacheLife("minutes");
  cacheTag("fifa-pipeline");
  const { players } = await runPipeline();
  const sorted = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-white">Player Stats</h1>
        <p className="mt-1 text-white/50 text-sm">
          {players.length} players · all tournament data
        </p>
      </div>
      <PlayerTable players={sorted} />
    </div>
  );
}
