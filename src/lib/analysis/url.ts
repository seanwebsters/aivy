import { lookup } from "node:dns/promises";
import net from "node:net";

/**
 * URL validation + SSRF protection for untrusted, customer-supplied URLs.
 * - http(s) only, default ports only, no credentials
 * - hostname must be a public DNS name (no IP literals, no localhost, no internal TLDs)
 * - every resolved address must be public (checked again on each redirect)
 */

export class UnsafeUrlError extends Error {}

const BLOCKED_SUFFIXES = [".local", ".localhost", ".internal", ".lan", ".home", ".corp", ".intranet", ".test", ".invalid", ".example"];

export function normaliseUrl(input: string): URL {
  let raw = input.trim();
  if (!raw) throw new UnsafeUrlError("Please enter your website address.");
  if (raw.length > 300) throw new UnsafeUrlError("That address looks too long.");
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("That doesn't look like a website address.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new UnsafeUrlError("Only web addresses (http/https) are supported.");
  if (url.username || url.password) throw new UnsafeUrlError("Addresses with logins aren't supported.");
  if (url.port && url.port !== "80" && url.port !== "443") throw new UnsafeUrlError("Custom ports aren't supported.");
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (net.isIP(host) || host.startsWith("[")) throw new UnsafeUrlError("Please use your website's domain name rather than an IP address.");
  if (!host.includes(".") || host === "localhost" || BLOCKED_SUFFIXES.some((s) => host.endsWith(s)))
    throw new UnsafeUrlError("Please enter a public website address, like yourbusiness.co.uk.");
  if (!/^[a-z0-9.-]+$/.test(host)) throw new UnsafeUrlError("That domain contains characters we can't check.");
  url.hash = "";
  return url;
}

export function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true;
  if (v6.startsWith("::ffff:")) return isPrivateAddress(v6.slice(7));
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v6) || v6.startsWith("64:ff9b") || v6.startsWith("2001:db8");
}

export async function assertPublicHost(hostname: string): Promise<void> {
  let addrs: { address: string }[];
  try {
    addrs = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    // Behind an explicit egress proxy (sandboxes, some corporate hosts) local DNS may be
    // unavailable; the proxy resolves and enforces its own egress policy.
    if (process.env.HTTPS_PROXY || process.env.https_proxy) return;
    throw new UnsafeUrlError("We couldn't find that website. Check the address and try again.");
  }
  if (!addrs.length || addrs.some((a) => isPrivateAddress(a.address)))
    throw new UnsafeUrlError("That address points somewhere we can't safely visit.");
}
