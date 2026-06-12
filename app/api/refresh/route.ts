import { revalidateTag } from "next/cache";

export async function POST() {
  revalidateTag("fifa-pipeline", "max");
  return Response.json({ ok: true });
}
