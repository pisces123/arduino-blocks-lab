import { describe, expect, it } from "vitest";
import { catalog, starterProjects } from "@abl/catalog";
import { createIconBlockActions, createIconBlockCards } from "./iconBlocks";

describe("icon blocks", () => {
  it("creates a beginner icon palette from project hardware", () => {
    const actions = createIconBlockActions(starterProjects.blink, catalog.components);

    expect(actions.map((action) => action.id)).toContain("led-on");
    expect(actions.map((action) => action.id)).toContain("led-off");
    expect(actions.map((action) => action.id)).toContain("wait");
  });

  it("summarizes program steps as icon block cards", () => {
    const cards = createIconBlockCards(starterProjects.blink.program, starterProjects.blink.components);

    expect(cards.map((card) => card.title)).toEqual(["LED on", "Wait", "LED off", "Wait"]);
    expect(cards[0]?.tone).toBe("output");
  });

  it("adds combined action tiles when matching parts are present", () => {
    const actions = createIconBlockActions(starterProjects.servoKnob, catalog.components);

    expect(actions.map((action) => action.id)).toContain("knob-servo");
    expect(actions.map((action) => action.id)).toContain("servo-middle");
  });
});
