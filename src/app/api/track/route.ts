import { json } from "@/lib/http";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { recordVisit } from "@/lib/store";

export async function POST() {
  const ip = await clientIp();
  if (rateLimit(`visit:${ip}`, 1, 30 * 60 * 1000).ok) await recordVisit();
  return json({ ok: true });
}
