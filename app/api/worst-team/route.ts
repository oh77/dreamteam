import { runPipeline, selectTeam } from "@/lib/fifa";

export async function GET() {
  const { players } = await runPipeline();
  const team = selectTeam(players, "worst");
  return Response.json(team);
}
