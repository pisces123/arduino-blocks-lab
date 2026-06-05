export type AgentSetupPlatform = "mac" | "windows" | "linux";

export type AgentSetupStep = {
  id: string;
  title: string;
  detail: string;
  command?: string;
};

const repoUrl = "https://github.com/pisces123/arduino-blocks-lab.git";
const launcherCommand = "npm run agent";

export const agentSetupDocsUrl = "https://github.com/pisces123/arduino-blocks-lab/blob/main/docs/agent-setup.md";

export const agentSetupPlatforms: Array<{ id: AgentSetupPlatform; label: string }> = [
  { id: "mac", label: "macOS" },
  { id: "windows", label: "Windows" },
  { id: "linux", label: "Linux" }
];

const platformSteps: Record<AgentSetupPlatform, AgentSetupStep[]> = {
  mac: [
    {
      id: "cli",
      title: "Install Arduino CLI",
      detail: "Install Node.js 20.19 or newer first. Homebrew is the quickest Arduino CLI path on macOS.",
      command: "brew install arduino-cli"
    },
    {
      id: "repo",
      title: "Get Arduino Blocks Lab",
      detail: "Clone the open-source repo and enter the folder.",
      command: `git clone ${repoUrl}\ncd arduino-blocks-lab`
    },
    {
      id: "launcher",
      title: "Start with the launcher",
      detail: "The launcher installs missing packages, checks Arduino CLI, and starts the helper.",
      command: launcherCommand
    }
  ],
  windows: [
    {
      id: "cli",
      title: "Install Arduino CLI",
      detail: "Install Node.js 20.19 or newer first, then install Arduino CLI.",
      command: "winget install ArduinoSA.CLI"
    },
    {
      id: "repo",
      title: "Get Arduino Blocks Lab",
      detail: "Clone the open-source repo and enter the folder.",
      command: `git clone ${repoUrl}\ncd arduino-blocks-lab`
    },
    {
      id: "launcher",
      title: "Start with the launcher",
      detail: "The launcher installs missing packages, checks Arduino CLI, and starts the helper.",
      command: launcherCommand
    }
  ],
  linux: [
    {
      id: "cli",
      title: "Install Arduino CLI",
      detail: "Use Arduino's install script or your distro package manager.",
      command: "curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh"
    },
    {
      id: "repo",
      title: "Get Arduino Blocks Lab",
      detail: "Clone the open-source repo and enter the folder.",
      command: `git clone ${repoUrl}\ncd arduino-blocks-lab`
    },
    {
      id: "permissions",
      title: "Allow serial access",
      detail: "Many Linux boards need dialout access. Log out and back in after this.",
      command: "sudo usermod -a -G dialout $USER"
    },
    {
      id: "launcher",
      title: "Start with the launcher",
      detail: "The launcher installs missing packages, checks Arduino CLI, and starts the helper.",
      command: launcherCommand
    }
  ]
};

export function getAgentSetupSteps(platform: AgentSetupPlatform) {
  return platformSteps[platform];
}

export function createAgentSetupScript(platform: AgentSetupPlatform) {
  return getAgentSetupSteps(platform)
    .map((step) => step.command)
    .filter((command): command is string => Boolean(command))
    .join("\n\n");
}
