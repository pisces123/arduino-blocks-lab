import { describe, expect, it } from "vitest";
import { catalog, lessons, starterProjects } from "@abl/catalog";
import { createLessonGuide, lessonActionLabel, lessonLevelLabel } from "./lessonGuide";

describe("lesson guide", () => {
  it("uses rich built-in lesson steps and metadata", () => {
    const firstLesson = lessons[0];
    expect(firstLesson).toBeDefined();
    const guide = createLessonGuide(firstLesson!, catalog);

    expect(guide.minutes).toBe(15);
    expect(guide.concepts).toContain("digital output");
    expect(guide.materials).toContain("Arduino Uno, Nano, or Mega");
    expect(guide.steps[0]?.title).toBe("Pick the board");
    expect(guide.success[0]).toContain("built-in LED");
  });

  it("infers a classroom guide for minimal extension lessons", () => {
    const guide = createLessonGuide(
      {
        id: "minimal",
        title: "Minimal",
        level: "word",
        goal: "Measure distance.",
        starterProject: starterProjects.ultrasonicDistance
      },
      catalog
    );

    expect(guide.boardName).toBe("Arduino Uno");
    expect(guide.materials).toContain("Ultrasonic HC-SR04");
    expect(guide.wiringCount).toBeGreaterThan(0);
    expect(guide.steps.map((step) => step.action)).toEqual(["build", "wire", "code", "test"]);
  });

  it("labels lesson levels and actions for the UI", () => {
    expect(lessonLevelLabel("icon")).toBe("Icon blocks");
    expect(lessonLevelLabel("word")).toBe("Blocks");
    expect(lessonLevelLabel("text")).toBe("Arduino C++");
    expect(lessonActionLabel("upload")).toBe("Upload");
    expect(lessonActionLabel(undefined)).toBe("Step");
  });
});
