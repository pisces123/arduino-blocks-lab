import { useEffect, useRef } from "react";
import * as Blockly from "blockly/core";
import type { ComponentDefinition, ComponentInstance, ProgramStep } from "@abl/block-schema";
import { registerArduinoBlocks, setBlocklyComponentDefinitionProvider, setBlocklyComponentProvider, toolbox } from "./blocklyBlocks";
import { workspaceToProgram } from "./workspaceToProgram";
import type { ThemePreference } from "./theme";

type Props = {
  components: ComponentInstance[];
  componentDefinitions: ComponentDefinition[];
  xml: string;
  reloadKey: string;
  themePreference: ThemePreference;
  onChange: (program: ProgramStep[], blocksXml: string) => void;
};

const toolboxChrome: Record<string, { shortLabel: string; color: string }> = {
  "Input/Output": { shortLabel: "I/O", color: "#ef3e7a" },
  Sensors: { shortLabel: "S", color: "#12a988" },
  Motion: { shortLabel: "M", color: "#4f86f7" },
  Displays: { shortLabel: "LCD", color: "#8f5cf7" },
  Timing: { shortLabel: "ms", color: "#78a841" },
  Output: { shortLabel: "O", color: "#ef3e7a" },
  Input: { shortLabel: "I", color: "#12a988" },
  Display: { shortLabel: "D", color: "#8f5cf7" }
};

function polishToolbox(container: HTMLDivElement | null) {
  const toolboxDiv = container?.querySelector(".blocklyToolbox, .blocklyToolboxDiv");
  if (!toolboxDiv) return;

  const modernRows = toolboxDiv.querySelectorAll<HTMLElement>(".blocklyToolboxCategory");
  modernRows.forEach((row) => {
    const label = row.querySelector<HTMLElement>(".blocklyToolboxCategoryLabel")?.textContent?.trim();
    if (!label) return;
    const chrome = toolboxChrome[label] ?? { shortLabel: label.slice(0, 2).toUpperCase(), color: "#14a8e0" };
    row.dataset.ablCategory = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    row.style.setProperty("--abl-category-color", chrome.color);
    const icon = row.querySelector<HTMLElement>(".blocklyToolboxCategoryIcon");
    if (!icon) return;
    icon.classList.add("abl-toolbox-icon");
    icon.textContent = chrome.shortLabel;
    icon.style.setProperty("--abl-category-color", chrome.color);
    icon.setAttribute("aria-hidden", "true");
  });

  toolboxDiv.querySelectorAll<HTMLElement>(".blocklyTreeRow").forEach((row) => {
    const label = row.querySelector<HTMLElement>(".blocklyTreeLabel")?.textContent?.trim();
    if (!label || row.querySelector(".abl-toolbox-icon")) return;
    const chrome = toolboxChrome[label] ?? { shortLabel: label.slice(0, 2).toUpperCase(), color: "#14a8e0" };
    row.dataset.ablCategory = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    row.style.setProperty("--abl-category-color", chrome.color);
    const icon = document.createElement("span");
    icon.className = "abl-toolbox-icon";
    icon.textContent = chrome.shortLabel;
    icon.setAttribute("aria-hidden", "true");
    row.insertBefore(icon, row.firstChild);
  });
}

const lightBlocklyTheme = Blockly.Theme.defineTheme("ablLight", {
  name: "ablLight",
  base: Blockly.Themes.Zelos,
  componentStyles: {
    workspaceBackgroundColour: "#fbfdff",
    toolboxBackgroundColour: "#fffefd",
    toolboxForegroundColour: "#193142",
    flyoutBackgroundColour: "#fffefd",
    flyoutForegroundColour: "#193142",
    scrollbarColour: "#8ad9ff",
    insertionMarkerColour: "#14a8e0",
    insertionMarkerOpacity: 0.36,
    cursorColour: "#1179ba",
    selectedGlowColour: "#14a8e0"
  }
});

const darkBlocklyTheme = Blockly.Theme.defineTheme("ablDark", {
  name: "ablDark",
  base: Blockly.Themes.Zelos,
  componentStyles: {
    workspaceBackgroundColour: "#0c1c2b",
    toolboxBackgroundColour: "#102133",
    toolboxForegroundColour: "#eef9ff",
    flyoutBackgroundColour: "#14283b",
    flyoutForegroundColour: "#eef9ff",
    flyoutOpacity: 1,
    scrollbarColour: "#46c7f4",
    insertionMarkerColour: "#8ad9ff",
    insertionMarkerOpacity: 0.42,
    cursorColour: "#ffd56b",
    selectedGlowColour: "#8ad9ff"
  }
});

function blocklyThemeFor(themePreference: ThemePreference) {
  return themePreference === "dark" ? darkBlocklyTheme : lightBlocklyTheme;
}

export default function BlocklyWorkspace({ components, componentDefinitions, xml, reloadKey, themePreference, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const loadingRef = useRef(false);
  const componentsRef = useRef(components);
  const componentDefinitionsRef = useRef(componentDefinitions);
  componentsRef.current = components;
  componentDefinitionsRef.current = componentDefinitions;

  useEffect(() => {
    setBlocklyComponentProvider(() => componentsRef.current);
    setBlocklyComponentDefinitionProvider(() => componentDefinitionsRef.current);
    registerArduinoBlocks();
    if (!containerRef.current) return;
    const compactWorkspace = window.matchMedia("(max-width: 620px)").matches;
    const workspace = Blockly.inject(containerRef.current, {
      toolbox,
      trashcan: true,
      scrollbars: true,
      theme: blocklyThemeFor(themePreference),
      grid: {
        spacing: 24,
        length: 2,
        colour: themePreference === "dark" ? "#335875" : "#cddfe9",
        snap: false
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: compactWorkspace ? 0.6 : 0.92,
        maxScale: 1.6,
        minScale: 0.45
      },
      renderer: "zelos"
    });
    workspaceRef.current = workspace;
    window.requestAnimationFrame(() => polishToolbox(containerRef.current));
    const listener = (event: Blockly.Events.Abstract) => {
      if (loadingRef.current || event.isUiEvent) return;
      const dom = Blockly.Xml.workspaceToDom(workspace);
      const blocksXml = Blockly.Xml.domToText(dom);
      onChange(workspaceToProgram(workspace, componentsRef.current), blocksXml);
    };
    workspace.addChangeListener(listener);
    return () => {
      workspace.removeChangeListener(listener);
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, [onChange]);

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    loadingRef.current = true;
    workspace.clear();
    try {
      const dom = Blockly.utils.xml.textToDom(xml);
      Blockly.Xml.domToWorkspace(dom, workspace);
      onChange(workspaceToProgram(workspace, componentsRef.current), Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace)));
    } finally {
      loadingRef.current = false;
    }
  }, [reloadKey, xml, onChange]);

  useEffect(() => {
    workspaceRef.current?.refreshToolboxSelection();
    window.requestAnimationFrame(() => polishToolbox(containerRef.current));
  }, [components, componentDefinitions]);

  useEffect(() => {
    workspaceRef.current?.setTheme(blocklyThemeFor(themePreference));
  }, [themePreference]);

  return (
    <div className="block-studio">
      <div className="block-studio-header">
        <div>
          <span>Word Blocks</span>
          <strong>Arduino canvas</strong>
        </div>
        <div className="block-studio-pills" aria-label="Block editor status">
          <span>{components.length} part{components.length === 1 ? "" : "s"}</span>
          <span>{componentDefinitions.length} catalog items</span>
        </div>
      </div>
      <div className="block-studio-canvas">
        <div className="blockly-host" ref={containerRef} />
      </div>
    </div>
  );
}
