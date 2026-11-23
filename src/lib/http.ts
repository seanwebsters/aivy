import { NextResponse } from "next/server";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
export const fail = (message: string, status = 400) => json({ error: message }, status);

export async function body<T = Record<string, unknown>>(req: Request, maxBytes = 20_000): Promise<T | null> {
  const text = await req.text();
  if (text.length > maxBytes) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
