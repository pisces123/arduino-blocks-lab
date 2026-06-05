import type { ComponentDefinition, ProjectDocument } from "@abl/block-schema";

export type ProjectIdea = {
  id: string;
  title: string;
  tag: string;
  prompt: string;
  outcome: string;
  keywords: string[];
  project: ProjectDocument;
};

export type ProjectIdeaMatch = ProjectIdea & {
  score: number;
  partNames: string[];
  wiringCount: number;
  blockCount: number;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokens(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function componentNames(project: ProjectDocument, definitions: ComponentDefinition[]) {
  const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
  return project.components.map((component) => definitionsById.get(component.componentId)?.name ?? component.label);
}

function wiringCount(project: ProjectDocument, definitions: ComponentDefinition[]) {
  const definitionsById = new Map(definitions.map((definition) => [definition.id, definition]));
  return project.components.reduce((count, component) => count + (definitionsById.get(component.componentId)?.wiring.length ?? 0), 0);
}

function scoreIdea(idea: ProjectIdea, query: string, partNames: string[]) {
  const queryTokens = tokens(query);
  if (queryTokens.length === 0) return idea.id === "blink" ? 4 : 1;
  const haystack = tokens([idea.title, idea.tag, idea.prompt, idea.outcome, ...idea.keywords, ...partNames].join(" "));
  let score = 0;
  for (const queryToken of queryTokens) {
    for (const candidate of haystack) {
      if (candidate === queryToken) score += 4;
      else if (candidate.startsWith(queryToken) || queryToken.startsWith(candidate)) score += 2;
      else if (candidate.includes(queryToken) || queryToken.includes(candidate)) score += 1;
    }
  }
  return score;
}

export function createProjectIdeaMatches(
  ideas: ProjectIdea[],
  query: string,
  definitions: ComponentDefinition[],
  limit = 4
): ProjectIdeaMatch[] {
  return ideas
    .map((idea) => {
      const partNames = componentNames(idea.project, definitions);
      return {
        ...idea,
        partNames,
        wiringCount: wiringCount(idea.project, definitions),
        blockCount: idea.project.program.length,
        score: scoreIdea(idea, query, partNames)
      };
    })
    .filter((idea) => idea.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
