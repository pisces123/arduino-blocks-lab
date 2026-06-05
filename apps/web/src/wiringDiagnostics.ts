import type { BoardDefinition, ComponentDefinition, ProjectDocument, PinValue } from "@abl/block-schema";
import { components as defaultComponents } from "@abl/catalog";

export type WiringDiagnostic = {
  severity: "error" | "warning" | "tip";
  title: string;
  message: string;
  componentIds?: string[];
};

const ignoredPinKeys = new Set(["power", "ground", "address", "type", "count", "columns", "rows", "width", "height"]);

function normalizeBoardPin(value: PinValue | undefined): string | undefined {
  if (value === undefined || typeof value === "boolean") return undefined;
  if (typeof value === "number") return String(value);
  const trimmed = value.trim().toUpperCase();
  if (!trimmed || ["5V", "3V3", "3.3V", "GND", "VIN", "VCC"].includes(trimmed)) return undefined;
  const digital = trimmed.match(/^D(\d+)$/);
  if (digital?.[1]) return digital[1];
  if (/^A\d+$/.test(trimmed)) return trimmed;
  if (/^\d+$/.test(trimmed)) return trimmed;
  return undefined;
}

function pinLabel(definition: ComponentDefinition, pinName: string) {
  return definition.pinLabels[pinName]?.toLowerCase() ?? "";
}

function needsPwm(definition: ComponentDefinition, pinName: string) {
  return ["red", "green", "blue", "enable"].includes(pinName) || pinLabel(definition, pinName).includes("pwm");
}

function needsAnalog(definition: ComponentDefinition, pinName: string) {
  return pinLabel(definition, pinName).includes("analog");
}

export function collectWiringDiagnostics(
  project: ProjectDocument,
  board: BoardDefinition | undefined,
  definitions: ComponentDefinition[] = defaultComponents
): WiringDiagnostic[] {
  const diagnostics: WiringDiagnostic[] = [];
  const componentDefinitions = new Map(definitions.map((definition) => [definition.id, definition]));

  if (!board) {
    return [
      {
        severity: "error",
        title: "No board selected",
        message: "Choose a target board before checking pins."
      }
    ];
  }

  if (project.components.length === 0) {
    diagnostics.push({
      severity: "tip",
      title: "No hardware yet",
      message: "Add a component to start wiring a circuit."
    });
  }

  const boardPins = new Set([...board.digitalPins, ...board.analogPins]);
  const pinUsage = new Map<string, Array<{ componentId: string; label: string; pinName: string }>>();

  for (const instance of project.components) {
    const definition = componentDefinitions.get(instance.componentId);
    if (!definition) {
      diagnostics.push({
        severity: "error",
        title: "Unknown component",
        message: `${instance.label} uses missing component definition ${instance.componentId}.`,
        componentIds: [instance.id]
      });
      continue;
    }

    for (const [pinName, pinValue] of Object.entries(instance.pins)) {
      if (ignoredPinKeys.has(pinName)) continue;
      const pin = normalizeBoardPin(pinValue);
      if (!pin) continue;

      if (!boardPins.has(pin)) {
        diagnostics.push({
          severity: "error",
          title: "Pin not on board",
          message: `${instance.label} uses ${pin}, which is not available on ${board.name}.`,
          componentIds: [instance.id]
        });
        continue;
      }

      if (needsPwm(definition, pinName) && !board.pwmPins.includes(pin)) {
        diagnostics.push({
          severity: "warning",
          title: "PWM pin recommended",
          message: `${instance.label} ${pinName} is on ${pin}, but that pin is not PWM on ${board.name}.`,
          componentIds: [instance.id]
        });
      }

      if (needsAnalog(definition, pinName) && !board.analogPins.includes(pin)) {
        diagnostics.push({
          severity: "warning",
          title: "Analog pin expected",
          message: `${instance.label} ${pinName} is on ${pin}, but an analog pin is expected.`,
          componentIds: [instance.id]
        });
      }

      const current = pinUsage.get(pin) ?? [];
      current.push({ componentId: instance.id, label: instance.label, pinName });
      pinUsage.set(pin, current);
    }
  }

  for (const [pin, usages] of pinUsage.entries()) {
    if (usages.length < 2) continue;
    diagnostics.push({
      severity: "warning",
      title: "Shared signal pin",
      message: `${pin} is used by ${usages.map((usage) => `${usage.label} ${usage.pinName}`).join(" and ")}.`,
      componentIds: usages.map((usage) => usage.componentId)
    });
  }

  if (project.components.length > 0 && project.program.length === 0) {
    diagnostics.push({
      severity: "tip",
      title: "No blocks yet",
      message: "Add blocks so the hardware has behavior."
    });
  }

  return diagnostics;
}
