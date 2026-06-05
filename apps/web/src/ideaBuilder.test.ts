import { describe, expect, it } from "vitest";
import { catalog, starterProjects } from "@abl/catalog";
import { createProjectIdeaMatches, type ProjectIdea } from "./ideaBuilder";

const ideas: ProjectIdea[] = [
  {
    id: "blink",
    title: "Blink",
    tag: "First upload",
    prompt: "Make an LED blink.",
    outcome: "Built-in LED turns on and off.",
    keywords: ["led", "light", "first"],
    project: starterProjects.blink
  },
  {
    id: "distance",
    title: "Distance Meter",
    tag: "Sensor",
    prompt: "Measure how far away an object is.",
    outcome: "Ultrasonic sensor prints centimeters.",
    keywords: ["ultrasonic", "distance", "sensor"],
    project: starterProjects.ultrasonicDistance
  },
  {
    id: "weather",
    title: "Weather LCD",
    tag: "Display",
    prompt: "Show temperature and humidity.",
    outcome: "DHT sensor prints weather and writes display text.",
    keywords: ["temperature", "humidity", "weather", "display"],
    project: starterProjects.dhtDisplay
  }
];

describe("idea builder", () => {
  it("defaults to a beginner first upload when the query is blank", () => {
    const matches = createProjectIdeaMatches(ideas, "", catalog.components);

    expect(matches[0]?.id).toBe("blink");
  });

  it("matches distance intent to ultrasonic project", () => {
    const matches = createProjectIdeaMatches(ideas, "measure distance", catalog.components);

    expect(matches[0]?.id).toBe("distance");
    expect(matches[0]?.partNames).toContain("Ultrasonic HC-SR04");
    expect(matches[0]?.wiringCount).toBeGreaterThan(0);
  });

  it("matches weather intent to DHT display project", () => {
    const matches = createProjectIdeaMatches(ideas, "temperature humidity screen", catalog.components);

    expect(matches[0]?.id).toBe("weather");
    expect(matches[0]?.blockCount).toBe(3);
  });
});
