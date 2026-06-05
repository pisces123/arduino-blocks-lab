import { describe, expect, it } from "vitest";
import type { ProjectDocument } from "@abl/block-schema";
import { boards, catalog, components, createComponentInstance, starterProjects } from "@abl/catalog";
import { createWiringCanvasModel } from "./wiringCanvas";

function definition(id: string) {
  const component = components.find((candidate) => candidate.id === id);
  if (!component) throw new Error(id);
  return component;
}

function project(overrides: Partial<ProjectDocument>): ProjectDocument {
  return {
    schemaVersion: "1.0.0",
    name: "Canvas test",
    boardId: "arduino-uno",
    components: [],
    program: [],
    ...overrides
  };
}

describe("createWiringCanvasModel", () => {
  it("maps starter project wiring to board pin targets", () => {
    const model = createWiringCanvasModel(starterProjects.servoKnob, boards[0], catalog.components);

    expect(model.boardName).toBe("Arduino Uno");
    expect(model.connections.map((connection) => connection.boardPinLabel)).toEqual(expect.arrayContaining(["A0", "D9", "5V", "GND"]));
    expect(model.summary.total).toBeGreaterThan(0);
    expect(model.summary.error).toBe(0);
  });

  it("resolves I2C board SDA and SCL labels from the selected board", () => {
    const lcd = createComponentInstance(definition("lcd-1602-i2c"));
    const model = createWiringCanvasModel(project({ components: [lcd] }), boards[0], components);

    expect(model.connections.map((connection) => connection.boardPinLabel)).toEqual(expect.arrayContaining(["SDA A4", "SCL A5"]));
  });

  it("does not warn when I2C bus and power rails are shared", () => {
    const lcdOne = { ...createComponentInstance(definition("lcd-1602-i2c")), id: "lcd_1", label: "LCD One" };
    const lcdTwo = { ...createComponentInstance(definition("oled-ssd1306")), id: "oled_1", label: "OLED One" };

    const model = createWiringCanvasModel(project({ components: [lcdOne, lcdTwo] }), boards[0], components);
    const sharedBusAndPower = model.connections.filter((connection) => ["SDA A4", "SCL A5", "5V", "GND"].includes(connection.boardPinLabel));

    expect(sharedBusAndPower.length).toBeGreaterThan(4);
    expect(sharedBusAndPower.every((connection) => connection.status === "ok")).toBe(true);
  });

  it("marks duplicate signal board pins as warnings", () => {
    const led = createComponentInstance(definition("led"));
    const button = createComponentInstance(definition("button"));
    led.pins.signal = 13;
    button.pins.signal = 13;

    const model = createWiringCanvasModel(project({ components: [led, button] }), boards[0], components);
    const sharedD13 = model.connections.filter((connection) => connection.boardPinLabel === "D13");

    expect(sharedD13).toHaveLength(2);
    expect(sharedD13.every((connection) => connection.status === "warning")).toBe(true);
  });

  it("marks board pins that do not exist as errors", () => {
    const led = createComponentInstance(definition("led"));
    led.pins.signal = 99;

    const model = createWiringCanvasModel(project({ components: [led] }), boards[0], components);
    const invalid = model.connections.find((connection) => connection.boardPinLabel === "D99");

    expect(invalid?.status).toBe("error");
    expect(model.summary.error).toBe(1);
  });
});
