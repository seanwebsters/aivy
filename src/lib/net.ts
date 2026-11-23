import "server-only";
import { EnvHttpProxyAgent, fetch as ufetch, type RequestInit as UInit } from "undici";

/** Outbound fetch for trusted APIs (AI, email, extraction). Honours HTTPS_PROXY when set. */
let agent: EnvHttpProxyAgent | undefined;
export function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  if (!(process.env.HTTPS_PROXY || process.env.https_proxy)) return fetch(url, init);
  agent ??= new EnvHttpProxyAgent();
  return ufetch(url, { ...(init as UInit), dispatcher: agent }) as unknown as Promise<Response>;
}
