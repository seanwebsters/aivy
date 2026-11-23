import "server-only";
import { apiFetch } from "../net";
import { lookup as dnsLookup } from "node:dns";
import { Agent, EnvHttpProxyAgent, fetch as ufetch, type Dispatcher } from "undici";
import type { SiteSnapshot } from "../types";
import { assertPublicHost, isPrivateAddress, normaliseUrl, UnsafeUrlError } from "./url";

const MAX_BYTES = 1_500_000;
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 4;
const UA = "AivyBot/0.1 (+https://aivy.ai/bot; business analysis on request of site owner)";

/**
 * Direct connections validate the IP at connect time (defeats DNS rebinding).
 * When an outbound proxy is configured (e.g. in a sandbox), the proxy makes the
 * connection; we still pre-validate DNS for every hop.
 */
let dispatcher: Dispatcher | undefined;
function getDispatcher(): Dispatcher {
  if (dispatcher) return dispatcher;
  if (process.env.HTTPS_PROXY || process.env.https_proxy) {
    dispatcher = new EnvHttpProxyAgent();
  } else {
    dispatcher = new Agent({
      connect: {
        lookup(hostname, options, cb) {
          dnsLookup(hostname, { ...options, all: true }, (err, addrs) => {
            if (err) return cb(err, "", 4);
            const list = addrs as unknown as { address: string; family: number }[];
            const bad = list.find((a) => isPrivateAddress(a.address));
            if (bad || !list.length) return cb(new Error("Blocked private address"), "", 4);
            if ((options as { all?: boolean }).all) return (cb as unknown as (e: null, a: typeof list) => void)(null, list);
            cb(null, list[0].address, list[0].family);
          });
        },
      },
      headersTimeout: TIMEOUT_MS,
      bodyTimeout: TIMEOUT_MS,
    });
  }
  return dispatcher;
}

async function fetchHtml(start: URL): Promise<{ html: string; finalUrl: string }> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(url.hostname);
    const res = await ufetch(url, {
      redirect: "manual",
      dispatcher: getDispatcher(),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "user-agent": UA, accept: "text/html,application/xhtml+xml" },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new UnsafeUrlError("The website redirected without a destination.");
      url = normaliseUrl(new URL(loc, url).toString());
      continue;
    }
    if (!res.ok) throw new UnsafeUrlError(`The website responded with an error (${res.status}).`);
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("html")) throw new UnsafeUrlError("That address isn't a web page we can read.");
    const reader = res.body?.getReader();
    if (!reader) throw new UnsafeUrlError("The website returned an empty page.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    return { html: new TextDecoder("utf-8", { fatal: false }).decode(Buffer.concat(chunks)), finalUrl: url.toString() };
  }
  throw new UnsafeUrlError("The website redirected too many times.");
}

async function fetchViaFirecrawl(url: URL): Promise<{ html: string; finalUrl: string } | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;
  const res = await apiFetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ url: url.toString(), formats: ["html"], onlyMainContent: false, timeout: 15000 }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { data?: { html?: string; metadata?: { sourceURL?: string } } };
  if (!data.data?.html) return null;
  return { html: data.data.html.slice(0, MAX_BYTES), finalUrl: data.data.metadata?.sourceURL ?? url.toString() };
}

/* ------------------------------------------------------------------ */
/*  Extraction — treats page content strictly as untrusted data        */
/* ------------------------------------------------------------------ */

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n) % 65536));

const clean = (s: string) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

const SIGNAL_PATTERNS: [string, RegExp][] = [
  ["booking system", /opentable|resdiary|fresha|calendly|booksy|simplybook|treatwell|mindbody|acuityscheduling|setmore|square\.site\/book|sevenrooms|designmynight|tablein|book now|book a table|book online/i],
  ["online shop", /add to (cart|basket)|shopify|woocommerce|\/cart|checkout|bigcommerce/i],
  ["menu", /(food|drinks?|brunch|lunch|dinner|breakfast|tasting|set|sample|à la carte|our) menu|view (the |our )?menu|menu\.pdf/i],
  ["contact form", /<form[\s\S]{0,2000}?(email|message)/i],
  ["faq page", /\bfaq|frequently asked/i],
  ["reviews", /trustpilot|tripadvisor|google reviews|testimonial|reviews/i],
  ["newsletter", /newsletter|subscribe|mailchimp|klaviyo/i],
  ["instagram", /instagram\.com\//i],
  ["facebook", /facebook\.com\//i],
  ["tiktok", /tiktok\.com\//i],
  ["linkedin", /linkedin\.com\//i],
  ["blog", /\/blog|\/news\b/i],
  ["live chat", /intercom|tidio|crisp\.chat|drift\.com|livechat|tawk\.to|zendesk/i],
  ["quote request", /get a quote|free quote|request a quote|free estimate/i],
];

export function extractSnapshot(html: string, url: string, finalUrl: string, via: SiteSnapshot["fetchedVia"]): SiteSnapshot {
  const signals = SIGNAL_PATTERNS.filter(([, re]) => re.test(html)).map(([n]) => n);
  const meta = (name: string) =>
    html.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["']`, "i"))?.[1] ??
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${name}["']`, "i"))?.[1];
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
  const title = clean(meta("og:site_name") ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").slice(0, 140);
  const description = clean(meta("description") ?? meta("og:description") ?? "").slice(0, 400);
  const headings = Array.from(body.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi))
    .map((m) => clean(m[1]))
    .filter((h) => h.length > 2 && h.length < 120)
    .slice(0, 40);
  const links = Array.from(body.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi))
    .map((m) => clean(m[1]))
    .filter((t) => t.length > 2 && t.length < 40)
    .slice(0, 60);
  const text = clean(body).slice(0, 12_000);
  return { url, finalUrl, title, description, headings: dedupe(headings), links: dedupe(links), text, signals, fetchedVia: via };
}

const dedupe = (a: string[]) => Array.from(new Set(a));

export async function fetchSite(input: string): Promise<SiteSnapshot> {
  const url = normaliseUrl(input);
  await assertPublicHost(url.hostname);
  let result: { html: string; finalUrl: string } | null = null;
  try {
    result = await fetchViaFirecrawl(url);
  } catch {
    result = null;
  }
  const via = result ? "firecrawl" : "direct";
  if (!result) {
    try {
      result = await fetchHtml(url);
    } catch (e) {
      if (e instanceof UnsafeUrlError) throw e;
      throw new UnsafeUrlError("We couldn't reach that website. It may be offline or blocking visitors.");
    }
  }
  const snap = extractSnapshot(result.html, url.toString(), result.finalUrl, via);
  if (snap.text.length < 80) throw new UnsafeUrlError("We couldn't read enough content from that website. It may rely on JavaScript we can't run yet.");
  return snap;
}
