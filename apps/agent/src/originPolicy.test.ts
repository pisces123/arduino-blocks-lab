import { describe, expect, it } from "vitest";
import { allowedOriginList, isAllowedOrigin } from "./originPolicy";

describe("agent origin policy", () => {
  it("allows the public app and local development origins", () => {
    expect(isAllowedOrigin("https://rupayon123.github.io")).toBe(true);
    expect(isAllowedOrigin("https://rupayon123.github.io/arduino-blocks-lab/")).toBe(true);
    expect(isAllowedOrigin("http://localhost:5173")).toBe(true);
    expect(isAllowedOrigin("http://127.0.0.1:4173")).toBe(true);
  });

  it("allows local non-browser tooling on localhost", () => {
    expect(isAllowedOrigin(undefined, "127.0.0.1:47631")).toBe(true);
    expect(isAllowedOrigin(undefined, "localhost:47631")).toBe(true);
  });

  it("blocks non-browser tools from remote hosts", () => {
    expect(isAllowedOrigin(undefined, "198.51.100.17:47631")).toBe(false);
  });

  it("blocks unrelated browser origins from driving the local agent", () => {
    expect(isAllowedOrigin("https://example.com")).toBe(false);
    expect(isAllowedOrigin("http://evil.localhost:5173")).toBe(false);
  });

  it("has a visible default allowlist for the agent landing page and docs", () => {
    expect(allowedOriginList()).toContain("https://rupayon123.github.io");
  });
});
