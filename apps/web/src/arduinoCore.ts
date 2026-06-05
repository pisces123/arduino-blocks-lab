export type ArduinoCoreTarget = {
  core: string;
  vendor: string;
  architecture: string;
};

export function coreFromFqbn(fqbn: string): ArduinoCoreTarget | null {
  const [vendor, architecture] = fqbn
    .trim()
    .split(":")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!vendor || !architecture) return null;

  return {
    core: `${vendor}:${architecture}`,
    vendor,
    architecture
  };
}
