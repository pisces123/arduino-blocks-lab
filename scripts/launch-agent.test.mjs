import { describe, expect, it } from "vitest";
import {
  nodeMeetsMinimum,
  normalizePort,
  npmExecutable,
  parseLauncherArgs,
  parseNodeVersion,
  shouldInstallDependencies
} from "./launch-agent.mjs";

describe("launch-agent helpers", () => {
  it("parses Node versions and enforces the supported minimum", () => {
    expect(parseNodeVersion("v20.19.1")).toEqual({ major: 20, minor: 19, patch: 1 });
    expect(nodeMeetsMinimum("v20.18.9")).toBe(false);
    expect(nodeMeetsMinimum("v20.19.0")).toBe(true);
    expect(nodeMeetsMinimum("v22.0.0")).toBe(true);
  });

  it("parses launcher flags", () => {
    expect(parseLauncherArgs(["--install", "--port", "47632"])).toEqual({
      help: false,
      install: true,
      skipInstall: false,
      port: 47632
    });
    expect(parseLauncherArgs(["--skip-install", "--port=49152"]).port).toBe(49152);
  });

  it("rejects unsafe ports and conflicting install flags", () => {
    expect(() => normalizePort("80")).toThrow("1024");
    expect(() => normalizePort("70000")).toThrow("65535");
    expect(() => parseLauncherArgs(["--install", "--skip-install"])).toThrow("either");
  });

  it("only installs dependencies when needed or forced", () => {
    expect(shouldInstallDependencies({ install: false, skipInstall: false, installed: false })).toBe(true);
    expect(shouldInstallDependencies({ install: false, skipInstall: false, installed: true })).toBe(false);
    expect(shouldInstallDependencies({ install: true, skipInstall: false, installed: true })).toBe(true);
    expect(shouldInstallDependencies({ install: false, skipInstall: true, installed: false })).toBe(false);
  });

  it("uses npm.cmd on Windows", () => {
    expect(npmExecutable("win32")).toBe("npm.cmd");
    expect(npmExecutable("darwin")).toBe("npm");
  });
});
