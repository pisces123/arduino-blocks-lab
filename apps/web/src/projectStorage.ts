import type {
  BoardDefinition,
  PinAssignment,
  PinMap,
  PinValue,
  ProjectDocument,
  ComponentPlacement,
  CircuitConnection,
  SimulationState
} from "@abl/block-schema";
import { boards } from "@abl/catalog";

type UnknownRecord = Record<string, unknown>;

const schemaVersionSupported = ["1.0.0", "1.1.0"] as const;

function record(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isPinValue(value: unknown): value is PinValue {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function isPinMap(value: unknown): value is PinMap {
  if (!record(value)) return false;
  for (const entry of Object.values(value)) {
    if (!isPinValue(entry)) return false;
  }
  return true;
}

function isComponentInstance(value: unknown): value is ProjectDocument["components"][number] {
  if (!record(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.componentId === "string" &&
    typeof value.label === "string" &&
    isPinMap(value.pins)
  );
}

function isProgramStep(value: unknown): value is ProjectDocument["program"][number] {
  return record(value) && typeof value.kind === "string";
}

function isStringArray(value: unknown): value is string[] {
  if (value === undefined) return true;
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isPinAssignment(value: unknown): value is PinAssignment {
  if (!record(value)) return false;
  return (
    typeof value.id === "string" &&
    typeof value.componentId === "string" &&
    typeof value.pin === "string" &&
    typeof value.boardPin === "string"
  );
}

function isPinAssignments(value: unknown): value is PinAssignment[] {
  return Array.isArray(value) && value.every(isPinAssignment);
}

function isComponentPlacement(value: unknown): value is ComponentPlacement {
  if (!record(value)) return false;
  const hasValidPosition = typeof value.x === "number" && Number.isFinite(value.x) && typeof value.y === "number" && Number.isFinite(value.y);
  const hasValidComponent = typeof value.componentId === "string";
  const hasValidLayer = value.layer === undefined || value.layer === "board" || value.layer === "breadboard" || value.layer === "three-d";
  const hasValidRotation = value.rotation === undefined || typeof value.rotation === "number";

  return hasValidPosition && hasValidComponent && hasValidRotation && hasValidLayer;
}

function isComponentPlacements(value: unknown): value is ComponentPlacement[] {
  return Array.isArray(value) && value.every(isComponentPlacement);
}

function isCircuitConnection(value: unknown): value is CircuitConnection {
  if (!record(value)) return false;
  return typeof value.id === "string" && typeof value.componentId === "string" && typeof value.pin === "string" && typeof value.boardPin === "string";
}

function isCircuitConnections(value: unknown): value is CircuitConnection[] {
  return Array.isArray(value) && value.every(isCircuitConnection);
}

function isSimulationState(value: unknown): value is SimulationState {
  if (!record(value)) return false;
  if (value.pinValues !== undefined && !record(value.pinValues)) return false;
  if (value.componentState !== undefined && !record(value.componentState)) return false;
  if (value.serialLog !== undefined && !Array.isArray(value.serialLog)) return false;
  if (value.running !== undefined && typeof value.running !== "boolean") return false;
  if (value.stepIndex !== undefined && typeof value.stepIndex !== "number") return false;
  if (value.delayRemainingMs !== undefined && typeof value.delayRemainingMs !== "number") return false;

  if (value.serialLog !== undefined) {
    if (!value.serialLog.every((entry) => typeof entry === "string")) return false;
  }

  return true;
}

const ignoredPinKeys = new Set(["ground", "power", "type", "address", "count", "columns", "rows", "width", "height"]);

function toPinAssignmentsFromComponentPins(
  componentId: string,
  pins: PinMap,
  makeId: (name: string) => string
): PinAssignment[] {
  return Object.entries(pins)
    .filter(([pinName, pinValue]) => {
      if (ignoredPinKeys.has(pinName)) return false;
      return isPinValue(pinValue) && typeof pinValue !== "boolean";
    })
    .map(([pinName, pinValue]) => ({
      id: makeId(pinName),
      componentId,
      pin: pinName,
      boardPin: String(pinValue)
    }))
    .filter((assignment) => assignment.boardPin.trim().length > 0);
}

function dedupeAssignments(assignments: PinAssignment[]) {
  const seen = new Set<string>();
  return assignments.filter((assignment) => {
    const key = `${assignment.componentId}:${assignment.pin}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sanitizeBoardPin(value: string) {
  return value.trim();
}

function isSupportedSchemaVersion(value: unknown): value is (typeof schemaVersionSupported)[number] {
  return value === "1.0.0" || value === "1.1.0";
}

function normalizeBoardPin(board: BoardDefinition | undefined, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const boardMatch = /^D?(\d+)$/.exec(trimmed);
  if (boardMatch?.[1]) {
    return boardMatch[1];
  }

  const upper = trimmed.toUpperCase();
  if (board && (board.digitalPins.includes(upper) || board.analogPins.includes(upper))) {
    return upper;
  }

  return upper;
}

function createComponentPlacementDefaults(components: ProjectDocument["components"]) {
  return components.map((component, index) => ({
    componentId: component.id,
    x: 16 + (index % 4) * 18,
    y: 20 + Math.floor(index / 4) * 20,
    rotation: 0,
    layer: "board" as const
  }));
}

function connectionsFromAssignments(assignments: PinAssignment[] | undefined): CircuitConnection[] {
  return dedupeAssignments(assignments ?? [])
    .map((assignment) => ({
      id: assignment.id || `${assignment.componentId}-${assignment.pin}`,
      componentId: assignment.componentId,
      pin: assignment.pin,
      boardPin: sanitizeBoardPin(assignment.boardPin)
    }))
    .filter((assignment) => assignment.componentId && assignment.pin);
}

function normalizeConnectionAssignments(project: ProjectDocument): CircuitConnection[] {
  const board = boards.find((candidate) => candidate.id === project.boardId);
  const boardAssignments = project.pinAssignments ? dedupeAssignments(project.pinAssignments) : undefined;
  const assignments = boardAssignments ?? project.connections;

  if (!assignments || assignments.length === 0) {
    return [];
  }

  return dedupeAssignments(assignments)
    .map((assignment, index) => ({
      ...assignment,
      id: assignment.id || `${project.boardId}-${assignment.componentId}-${assignment.pin}-${index}`,
      boardPin: sanitizeBoardPin(normalizeBoardPin(board, assignment.boardPin))
    }))
    .filter((assignment) => assignment.componentId && assignment.pin);
}

function projectComponentAssignments(project: ProjectDocument) {
  return project.components.map((component) => ({
    ...component,
    pins: { ...component.pins }
  }));
}

function applyOverridesFromConnections(value: ProjectDocument, useConnectionAssignments = true): ProjectDocument {
  if (!useConnectionAssignments) return value;

  if (!value.connections || value.connections.length === 0) return value;

  const componentIds = new Set(value.components.map((component) => component.id));
  const overridesByComponent = new Map<string, Record<string, string>>();
  for (const connection of value.connections) {
    if (!componentIds.has(connection.componentId)) continue;

    const current = overridesByComponent.get(connection.componentId) ?? {};
    current[connection.pin] = connection.boardPin;
    overridesByComponent.set(connection.componentId, current);
  }

  const components = value.components.map((component) => {
    const patch = overridesByComponent.get(component.id);
    if (!patch || Object.keys(patch).length === 0) return component;

    const nextPins: PinMap = { ...component.pins };
    for (const [pinName, pinValue] of Object.entries(patch)) {
      if (!pinName) continue;
      nextPins[pinName] = pinValue;
    }

    return {
      ...component,
      pins: nextPins
    };
  });

  return {
    ...value,
    components
  };
}

function migrateToVersion(parsed: ProjectDocument): ProjectDocument {
  const board = boards.find((candidate) => candidate.id === parsed.boardId);

  const assignments = normalizeConnectionAssignments(parsed);
  const baseComponentPlacements =
    parsed.componentPlacement && parsed.componentPlacement.length > 0
      ? parsed.componentPlacement
      : parsed.components.length > 0
        ? createComponentPlacementDefaults(parsed.components)
        : [];

  const connections = assignments.length > 0
    ? assignments.map((assignment, index) => ({
      ...assignment,
      id: assignment.id || `${parsed.boardId}-assign-${index}`
    }))
    : parsed.components
      .flatMap((component, componentIndex) =>
        toPinAssignmentsFromComponentPins(component.id, component.pins, (pinName) => `${component.id}-${pinName}-${componentIndex}`)
      )
      .map((assignment, assignmentIndex) => ({
        id: assignment.id || `${parsed.boardId}-legacy-${assignmentIndex}`,
        componentId: assignment.componentId,
        pin: assignment.pin,
        boardPin: sanitizeBoardPin(normalizeBoardPin(board, assignment.boardPin))
      }));

  const pinAssignments = assignments.length > 0 ? assignments : dedupeAssignments(connections).map((connection) => ({ ...connection }));
  const componentPlacement = parsed.componentPlacement?.length ? parsed.componentPlacement : createComponentPlacementDefaults(parsed.components);
  const simulationState: SimulationState = {
    pinValues: parsed.simulationState?.pinValues ?? {},
    componentState: parsed.simulationState?.componentState ?? {},
    serialLog: parsed.simulationState?.serialLog ?? [],
    running: parsed.simulationState?.running ?? false,
    stepIndex: parsed.simulationState?.stepIndex ?? 0,
    delayRemainingMs: parsed.simulationState?.delayRemainingMs ?? 0
  };

  const components = projectComponentAssignments(parsed);

  return {
    ...parsed,
    schemaVersion: "1.1.0",
    components,
    pinAssignments,
    componentPlacement,
    connections,
    simulationState
  } as ProjectDocument;
}

export function isProjectDocument(value: unknown): value is ProjectDocument {
  if (!record(value)) return false;
  if (!isSupportedSchemaVersion(value.schemaVersion)) return false;
  if (typeof value.name !== "string") return false;
  if (typeof value.boardId !== "string") return false;
  if (!Array.isArray(value.components) || !value.components.every(isComponentInstance)) return false;
  if (!Array.isArray(value.program) || !value.program.every(isProgramStep)) return false;
  if (value.blocksXml !== undefined && typeof value.blocksXml !== "string") return false;
  if (value.generatedSketch !== undefined && typeof value.generatedSketch !== "string") return false;
  if (value.lessonId !== undefined && typeof value.lessonId !== "string") return false;
  if (!isStringArray(value.dependencies)) return false;
  if (value.pinAssignments !== undefined && !isPinAssignments(value.pinAssignments)) return false;
  if (value.componentPlacement !== undefined && !isComponentPlacements(value.componentPlacement)) return false;
  if (value.connections !== undefined && !isCircuitConnections(value.connections)) return false;
  if (value.simulationState !== undefined && !isSimulationState(value.simulationState)) return false;

  return true;
}

export function parseStoredProject(raw: string | null): ProjectDocument | undefined {
  if (typeof raw !== "string") return undefined;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isProjectDocument(parsed)) return undefined;
    const hasExplicitWiringAssignments =
      Boolean(parsed.pinAssignments?.length) || Boolean(parsed.connections?.length);

    const migrated = migrateToVersion(parsed);
    return applyOverridesFromConnections(migrated, hasExplicitWiringAssignments);
  } catch {
    return undefined;
  }
}

export function serializeProject(project: ProjectDocument): string {
  const normalized = applyOverridesFromConnections(project);
  const schemaVersion = "1.1.0" as const;

  const withDefaults: ProjectDocument = {
    ...normalized,
    schemaVersion,
    pinAssignments: normalized.pinAssignments ?? normalized.connections ?? [],
    componentPlacement: normalized.componentPlacement ?? createComponentPlacementDefaults(normalized.components),
    connections: normalized.connections ?? connectionsFromAssignments(normalized.pinAssignments),
    simulationState: {
      pinValues: normalized.simulationState?.pinValues ?? {},
      componentState: normalized.simulationState?.componentState ?? {},
      serialLog: normalized.simulationState?.serialLog ?? [],
      running: normalized.simulationState?.running ?? false,
      stepIndex: normalized.simulationState?.stepIndex ?? 0,
      delayRemainingMs: normalized.simulationState?.delayRemainingMs ?? 0
    }
  };

  return JSON.stringify(withDefaults);
}
