import { runPipeline } from "@/lib/fifa";

export async function GET() {
  const { matches } = await runPipeline();
  return Response.json(matches);
}
