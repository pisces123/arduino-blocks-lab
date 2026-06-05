import { describe, expect, it } from "vitest";
import type { ProjectDocument } from "@abl/block-schema";
import { boards, components, createComponentInstance, starterProjects } from "@abl/catalog";
import { collectWiringRepairPlan } from "./wiringRepair";

function definition(id: string) {
  const component = components.find((candidate) => candidate.id === id);
  if (!component) throw new Error(id);
  return component;
}

function project(overrides: Partial<ProjectDocument>): ProjectDocument {
  return {
    schemaVersion: "1.0.0",
    name: "Repair test",
    boardId: "arduino-uno",
    components: [],
    program: [],
    ...overrides
  };
}

function cloneProject(source: ProjectDocument): ProjectDocument {
  return JSON.parse(JSON.stringify(source)) as ProjectDocument;
}

describe("collectWiringRepairPlan", () => {
  it("marks a valid starter circuit ready", () => {
    const plan = collectWiringRepairPlan(cloneProject(starterProjects.ultrasonicDistance), boards[0], components);

    expect(plan.title).toBe("Wiring ready");
    expect(plan.autoFixAvailable).toBe(false);
    expect(plan.items[0]).toMatchObject({
      id: "ready",
      tone: "ready"
    });
  });

  it("offers auto repair for shared signal pins", () => {
    const led = createComponentInstance(definition("led"));
    const button = createComponentInstance(definition("button"));
    led.pins.signal = 13;
    button.pins.signal = 13;

    const plan = collectWiringRepairPlan(project({ components: [led, button] }), boards[0], components);

    expect(plan.title).toBe("Repair available");
    expect(plan.autoFixAvailable).toBe(true);
    expect(plan.autoFixCount).toBe(1);
    expect(plan.items.some((item) => item.title.includes("Auto pins can repair"))).toBe(true);
    expect(plan.items.some((item) => item.title === "Give each signal its own pin")).toBe(true);
  });

  it("explains invalid board pins as concrete repair steps", () => {
    const led = createComponentInstance(definition("led"));
    led.pins.signal = 99;

    const plan = collectWiringRepairPlan(project({ components: [led] }), boards[0], components);

    expect(plan.autoFixAvailable).toBe(true);
    expect(plan.items.some((item) => item.title === "Move the signal to a valid board pin")).toBe(true);
    expect(plan.items.map((item) => item.detail).join(" ")).toContain("Arduino Uno");
  });

  it("asks for a board before repairing pins", () => {
    const led = createComponentInstance(definition("led"));

    const plan = collectWiringRepairPlan(project({ components: [led] }), undefined, components);

    expect(plan.title).toBe("Choose a board");
    expect(plan.autoFixAvailable).toBe(false);
    expect(plan.items.some((item) => item.title === "Choose an Arduino board first")).toBe(true);
  });
});
