export type SerialLineEnding = "none" | "newline" | "carriage-return" | "both";

export const commonBaudRates = [
  300,
  1200,
  2400,
  4800,
  9600,
  14400,
  19200,
  38400,
  57600,
  74880,
  115200,
  230400,
  250000,
  500000,
  1000000
] as const;

export function normalizeBaudRate(value: string | number, fallback = 9600) {
  const parsed = typeof value === "number" ? value : Number(value.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function appendSerialLineEnding(value: string, lineEnding: SerialLineEnding) {
  switch (lineEnding) {
    case "newline":
      return `${value}\n`;
    case "carriage-return":
      return `${value}\r`;
    case "both":
      return `${value}\r\n`;
    case "none":
    default:
      return value;
  }
}

export function lineEndingLabel(lineEnding: SerialLineEnding) {
  switch (lineEnding) {
    case "newline":
      return "Newline";
    case "carriage-return":
      return "Carriage return";
    case "both":
      return "Both NL + CR";
    case "none":
    default:
      return "No ending";
  }
}
