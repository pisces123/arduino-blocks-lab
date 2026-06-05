import { describe, expect, it } from "vitest";
import type { ProjectDocument } from "@abl/block-schema";
import { boards, components, createComponentInstance } from "@abl/catalog";
import { collectWiringDiagnostics } from "./wiringDiagnostics";

function definition(id: string) {
  const component = components.find((candidate) => candidate.id === id);
  if (!component) throw new Error(id);
  return component;
}

function project(overrides: Partial<ProjectDocument>): ProjectDocument {
  return {
    schemaVersion: "1.0.0",
    name: "Diagnostics test",
    boardId: "arduino-uno",
    components: [],
    program: [],
    ...overrides
  };
}

describe("collectWiringDiagnostics", () => {
  it("reports unavailable board pins", () => {
    const led = createComponentInstance(definition("led"));
    led.pins.signal = 99;

    const diagnostics = collectWiringDiagnostics(project({ components: [led] }), boards[0]);

    expect(diagnostics.some((diagnostic) => diagnostic.title === "Pin not on board")).toBe(true);
  });

  it("reports shared signal pins", () => {
    const led = createComponentInstance(definition("led"));
    const button = createComponentInstance(definition("button"));
    led.pins.signal = 13;
    button.pins.signal = 13;

    const diagnostics = collectWiringDiagnostics(project({ components: [led, button] }), boards[0]);

    expect(diagnostics.some((diagnostic) => diagnostic.title === "Shared signal pin")).toBe(true);
  });

  it("reports PWM pin recommendations", () => {
    const rgb = createComponentInstance(definition("rgb-led"));
    rgb.pins.red = 2;

    const diagnostics = collectWiringDiagnostics(project({ components: [rgb] }), boards[0]);

    expect(diagnostics.some((diagnostic) => diagnostic.title === "PWM pin recommended")).toBe(true);
  });
});
