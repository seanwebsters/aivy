import { describe, expect, it } from "vitest";
import { isPrivateAddress, normaliseUrl, UnsafeUrlError } from "@/lib/analysis/url";

describe("normaliseUrl", () => {
  it("adds https and strips the hash", () => {
    expect(normaliseUrl("riverside-cafe.co.uk/#menu").toString()).toBe("https://riverside-cafe.co.uk/");
  });
  it.each([
    "localhost",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://169.254.169.254/latest/meta-data",
    "http://[::1]/",
    "http://intranet.corp",
    "ftp://example.co.uk",
    "https://user:pass@example.co.uk",
    "https://example.co.uk:8080",
    "printer.local",
    "",
  ])("rejects %s", (u) => {
    expect(() => normaliseUrl(u)).toThrow(UnsafeUrlError);
  });
});

describe("isPrivateAddress", () => {
  it.each(["10.0.0.1", "172.16.5.4", "192.168.1.1", "127.0.0.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"])("%s is private", (ip) =>
    expect(isPrivateAddress(ip)).toBe(true),
  );
  it.each(["8.8.8.8", "151.101.1.140", "2606:4700::6810:84e5"])("%s is public", (ip) => expect(isPrivateAddress(ip)).toBe(false));
});
