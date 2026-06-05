import { describe, expect, it } from "vitest";
import { appendSerialLineEnding, normalizeBaudRate } from "./serialConsole";

describe("serial console helpers", () => {
  it("appends the selected serial line ending", () => {
    expect(appendSerialLineEnding("ping", "none")).toBe("ping");
    expect(appendSerialLineEnding("ping", "newline")).toBe("ping\n");
    expect(appendSerialLineEnding("ping", "carriage-return")).toBe("ping\r");
    expect(appendSerialLineEnding("ping", "both")).toBe("ping\r\n");
  });

  it("normalizes positive integer baud rates", () => {
    expect(normalizeBaudRate("115200")).toBe(115200);
    expect(normalizeBaudRate(74880)).toBe(74880);
    expect(normalizeBaudRate("nope", 57600)).toBe(57600);
    expect(normalizeBaudRate("-1", 9600)).toBe(9600);
  });
});
