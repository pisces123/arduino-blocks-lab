import { describe, expect, it } from "vitest";
import { coreFromFqbn } from "./arduinoCore";

describe("coreFromFqbn", () => {
  it("extracts the Arduino AVR core from an Uno target", () => {
    expect(coreFromFqbn("arduino:avr:uno")?.core).toBe("arduino:avr");
  });

  it("extracts third-party cores even when the FQBN has board options", () => {
    expect(coreFromFqbn("esp32:esp32:esp32:UploadSpeed=921600")?.core).toBe("esp32:esp32");
  });

  it("trims user-pasted whitespace", () => {
    expect(coreFromFqbn("  arduino : avr : nano  ")?.core).toBe("arduino:avr");
  });

  it("returns null for incomplete targets", () => {
    expect(coreFromFqbn("uno")).toBeNull();
    expect(coreFromFqbn("")).toBeNull();
  });
});
