import { after } from "next/server";
import { ensureOwnerKey } from "@/lib/access";
import { createAnalysisRecord, runDiscovery } from "@/lib/analysis/pipeline";
import { UnsafeUrlError } from "@/lib/analysis/url";
import { body, fail, json } from "@/lib/http";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { saveAnalysis } from "@/lib/store";

export async function POST(req: Request) {
  const data = await body<{ url?: string }>(req);
  if (!data?.url || typeof data.url !== "string") return fail("Please enter your website address.");
  const ip = await clientIp();
  const limit = rateLimit(`analyse:${ip}`, Number(process.env.AIVY_ANALYSES_PER_HOUR ?? 8), 60 * 60 * 1000);
  if (!limit.ok) return fail(`You've run a lot of analyses — please try again in ${Math.ceil(limit.retryAfter / 60)} minutes.`, 429);
  const owner = await ensureOwnerKey();
  let record;
  try {
    record = createAnalysisRecord(data.url, owner);
  } catch (e) {
    return fail(e instanceof UnsafeUrlError ? e.message : "That doesn't look like a website address.");
  }
  await saveAnalysis(record);
  after(() => runDiscovery(record.id));
  return json({ id: record.id });
}
