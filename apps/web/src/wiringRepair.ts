import type { BoardDefinition, ComponentDefinition, ProjectDocument } from "@abl/block-schema";
import { autoAssignProjectPins } from "./pinPlanner";
import { collectWiringDiagnostics, type WiringDiagnostic } from "./wiringDiagnostics";

export type WiringRepairTone = "ready" | "fix" | "check" | "info";

export type WiringRepairItem = {
  id: string;
  tone: WiringRepairTone;
  title: string;
  detail: string;
};

export type WiringRepairPlan = {
  title: string;
  detail: string;
  autoFixAvailable: boolean;
  autoFixCount: number;
  items: WiringRepairItem[];
};

function componentLabels(project: ProjectDocument, componentIds: string[] | undefined) {
  if (!componentIds || componentIds.length === 0) return "";
  const labels = componentIds
    .map((id) => project.components.find((component) => component.id === id)?.label)
    .filter((label): label is string => Boolean(label));
  return labels.length > 0 ? ` Check ${labels.join(", ")}.` : "";
}

function repairForDiagnostic(project: ProjectDocument, board: BoardDefinition | undefined, diagnostic: WiringDiagnostic, index: number): WiringRepairItem {
  const suffix = componentLabels(project, diagnostic.componentIds);
  const boardName = board?.name ?? "the selected board";

  if (diagnostic.title === "No board selected") {
    return {
      id: `no-board-${index}`,
      tone: "fix",
      title: "Choose an Arduino board first",
      detail: `${diagnostic.message} The assistant needs the board pin map before it can repair wiring.`
    };
  }

  if (diagnostic.title === "No hardware yet") {
    return {
      id: `no-hardware-${index}`,
      tone: "info",
      title: "Add a starter part",
      detail: `${diagnostic.message} Once hardware is added, this panel will check pins and suggest repairs.`
    };
  }

  if (diagnostic.title === "Pin not on board") {
    return {
      id: `pin-not-on-board-${index}`,
      tone: "fix",
      title: "Move the signal to a valid board pin",
      detail: `${diagnostic.message} Use Auto pins or choose a pin that exists on ${boardName}.${suffix}`
    };
  }

  if (diagnostic.title === "Shared signal pin") {
    return {
      id: `shared-signal-${index}`,
      tone: "fix",
      title: "Give each signal its own pin",
      detail: `${diagnostic.message} Shared signal pins can make readings flicker or outputs fight each other.${suffix}`
    };
  }

  if (diagnostic.title === "PWM pin recommended") {
    return {
      id: `pwm-${index}`,
      tone: "check",
      title: "Use a PWM-capable pin",
      detail: `${diagnostic.message} PWM pins on ${boardName}: ${board?.pwmPins.join(", ") || "check the board reference"}.${suffix}`
    };
  }

  if (diagnostic.title === "Analog pin expected") {
    return {
      id: `analog-${index}`,
      tone: "check",
      title: "Move the sensor to an analog pin",
      detail: `${diagnostic.message} Analog pins on ${boardName}: ${board?.analogPins.join(", ") || "check the board reference"}.${suffix}`
    };
  }

  if (diagnostic.title === "Unknown component") {
    return {
      id: `unknown-component-${index}`,
      tone: "fix",
      title: "Install or restore the missing hardware pack",
      detail: `${diagnostic.message} Open Packs and import the pack that defines this component.${suffix}`
    };
  }

  if (diagnostic.title === "No blocks yet") {
    return {
      id: `no-blocks-${index}`,
      tone: "info",
      title: "Add behavior blocks",
      detail: `${diagnostic.message} The circuit can be wired correctly but still needs code before upload.`
    };
  }

  return {
    id: `diagnostic-${index}`,
    tone: diagnostic.severity === "tip" ? "info" : diagnostic.severity === "warning" ? "check" : "fix",
    title: diagnostic.title,
    detail: `${diagnostic.message}${suffix}`
  };
}

export function collectWiringRepairPlan(
  project: ProjectDocument,
  board: BoardDefinition | undefined,
  definitions: ComponentDefinition[]
): WiringRepairPlan {
  const diagnostics = collectWiringDiagnostics(project, board, definitions);
  const pinPlan = autoAssignProjectPins(project, board, definitions);
  const criticalDiagnostics = diagnostics.filter((diagnostic) => diagnostic.severity !== "tip");
  const autoFixAvailable = pinPlan.changes.length > 0;
  const items: WiringRepairItem[] = [];

  if (autoFixAvailable) {
    const preview = pinPlan.changes
      .slice(0, 3)
      .map((change) => `${change.componentLabel} ${change.pinName}: ${String(change.from)} -> ${String(change.to)}`)
      .join("; ");
    items.push({
      id: "auto-pins",
      tone: "fix",
      title: `Auto pins can repair ${pinPlan.changes.length} connection${pinPlan.changes.length === 1 ? "" : "s"}`,
      detail: preview
    });
  }

  if (pinPlan.skipped.length > 0) {
    items.push({
      id: "auto-pins-skipped",
      tone: "check",
      title: autoFixAvailable ? "Some pins still need a human check" : "No automatic pin move is safe yet",
      detail: pinPlan.skipped
        .slice(0, 2)
        .map((item) => `${item.componentLabel} ${item.pinName}: ${item.reason}`)
        .join("; ")
    });
  }

  items.push(...diagnostics.slice(0, 5).map((diagnostic, index) => repairForDiagnostic(project, board, diagnostic, index)));

  if (project.components.length > 0 && criticalDiagnostics.length === 0) {
    items.unshift({
      id: "ready",
      tone: "ready",
      title: "Wiring checks look ready",
      detail: "Review the wire view, then compile before uploading to catch library or board-target issues."
    });
  }

  if (items.length === 0) {
    items.push({
      id: "add-hardware",
      tone: "info",
      title: "Add a part to start wiring",
      detail: "Choose a starter project or add hardware from the left panel to get wiring checks."
    });
  }

  return {
    title:
      !board
        ? "Choose a board"
        : project.components.length === 0
        ? "No circuit yet"
        : autoFixAvailable
          ? "Repair available"
          : criticalDiagnostics.length > 0
            ? "Manual repair needed"
            : "Wiring ready",
    detail:
      !board
        ? "Pick Uno, Nano, Mega, or an imported board before checking wires."
        : project.components.length === 0
        ? "Add hardware and this assistant will explain the wiring."
        : autoFixAvailable
          ? "A safe pin repair is available for this board."
          : criticalDiagnostics.length > 0
            ? "Follow the repair steps before uploading."
            : "The circuit has no blocking wiring notes.",
    autoFixAvailable,
    autoFixCount: pinPlan.changes.length,
    items
  };
}
