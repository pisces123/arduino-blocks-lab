import { describe, expect, it } from "vitest";
import { agentSetupPlatforms, createAgentSetupScript, getAgentSetupSteps } from "./agentSetup";

describe("agent setup guide", () => {
  it("offers setup steps for every supported platform", () => {
    agentSetupPlatforms.forEach((platform) => {
      const steps = getAgentSetupSteps(platform.id);
      const script = createAgentSetupScript(platform.id);

      expect(steps.length).toBeGreaterThanOrEqual(3);
      expect(steps.at(-1)?.command).toBe("npm run agent");
      expect(script).not.toContain("npm install");
    });
  });

  it("creates a macOS setup script with Homebrew and the repo clone", () => {
    const script = createAgentSetupScript("mac");

    expect(script).toContain("brew install arduino-cli");
    expect(script).toContain("git clone https://github.com/rupayon123/arduino-blocks-lab.git");
    expect(script).toContain("npm run agent");
  });

  it("creates Windows and Linux platform-specific Arduino CLI commands", () => {
    expect(createAgentSetupScript("windows")).toContain("winget install ArduinoSA.CLI");
    expect(createAgentSetupScript("linux")).toContain("install.sh | sh");
    expect(createAgentSetupScript("linux")).toContain("sudo usermod -a -G dialout $USER");
  });
});
