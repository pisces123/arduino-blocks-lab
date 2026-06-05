import * as Blockly from "blockly/core";
import type { ComponentInstance, ProgramStep } from "@abl/block-schema";

function value(block: Blockly.Block, name: string): string {
  return block.getFieldValue(name) ?? "";
}

function numberValue(block: Blockly.Block, name: string, fallback: number): number {
  const parsed = Number(value(block, name));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function validComponent(id: string, components: ComponentInstance[]): boolean {
  return id !== "__missing__" && components.some((component) => component.id === id);
}

function blockToSteps(block: Blockly.Block, components: ComponentInstance[]): ProgramStep[] {
  switch (block.type) {
    case "abl_led_write": {
      const componentId = value(block, "COMPONENT");
      return validComponent(componentId, components) ? [{ kind: "digital-write", componentId, value: value(block, "STATE") as "HIGH" | "LOW" }] : [];
    }
    case "abl_delay":
      return [{ kind: "delay", ms: numberValue(block, "MS", 1000) }];
    case "abl_button_led": {
      const buttonId = value(block, "BUTTON");
      const ledId = value(block, "LED");
      return validComponent(buttonId, components) && validComponent(ledId, components) ? [{ kind: "button-controls-led", buttonId, ledId }] : [];
    }
    case "abl_pot_servo": {
      const potentiometerId = value(block, "POT");
      const servoId = value(block, "SERVO");
      return validComponent(potentiometerId, components) && validComponent(servoId, components)
        ? [{ kind: "potentiometer-controls-servo", potentiometerId, servoId }]
        : [];
    }
    case "abl_servo_write": {
      const componentId = value(block, "SERVO");
      return validComponent(componentId, components) ? [{ kind: "servo-write", componentId, angle: numberValue(block, "ANGLE", 90) }] : [];
    }
    case "abl_rgb_color": {
      const componentId = value(block, "RGB");
      return validComponent(componentId, components)
        ? [
            {
              kind: "rgb-write",
              componentId,
              red: numberValue(block, "RED", 255),
              green: numberValue(block, "GREEN", 80),
              blue: numberValue(block, "BLUE", 64)
            }
          ]
        : [];
    }
    case "abl_ultrasonic_serial": {
      const componentId = value(block, "SENSOR");
      return validComponent(componentId, components) ? [{ kind: "ultrasonic-serial", componentId, label: "distance_cm" }] : [];
    }
    case "abl_dht_serial": {
      const componentId = value(block, "SENSOR");
      return validComponent(componentId, components) ? [{ kind: "dht-serial", componentId }] : [];
    }
    case "abl_lcd_print": {
      const componentId = value(block, "DISPLAY");
      return validComponent(componentId, components) ? [{ kind: "lcd-print", componentId, text: value(block, "TEXT"), clear: true }] : [];
    }
    case "abl_oled_print": {
      const componentId = value(block, "DISPLAY");
      return validComponent(componentId, components) ? [{ kind: "oled-print", componentId, text: value(block, "TEXT"), clear: true }] : [];
    }
    case "abl_neopixel_color": {
      const componentId = value(block, "STRIP");
      return validComponent(componentId, components)
        ? [
            {
              kind: "neopixel-fill",
              componentId,
              red: numberValue(block, "RED", 24),
              green: numberValue(block, "GREEN", 160),
              blue: numberValue(block, "BLUE", 120)
            }
          ]
        : [];
    }
    case "abl_buzzer_tone": {
      const componentId = value(block, "BUZZER");
      return validComponent(componentId, components)
        ? [{ kind: "tone", componentId, frequency: numberValue(block, "FREQUENCY", 440), duration: numberValue(block, "DURATION", 250) }]
        : [];
    }
    case "abl_relay_write": {
      const componentId = value(block, "RELAY");
      return validComponent(componentId, components) ? [{ kind: "relay-write", componentId, value: value(block, "STATE") as "HIGH" | "LOW" }] : [];
    }
    case "abl_analog_serial": {
      const componentId = value(block, "SENSOR");
      return validComponent(componentId, components) ? [{ kind: "read-analog-serial", componentId }] : [];
    }
    case "abl_digital_serial": {
      const componentId = value(block, "SENSOR");
      return validComponent(componentId, components) ? [{ kind: "read-digital-serial", componentId }] : [];
    }
    case "abl_ir_serial": {
      const componentId = value(block, "SENSOR");
      return validComponent(componentId, components) ? [{ kind: "ir-read-serial", componentId }] : [];
    }
    default:
      return [];
  }
}

export function workspaceToProgram(workspace: Blockly.WorkspaceSvg, components: ComponentInstance[]): ProgramStep[] {
  const steps: ProgramStep[] = [];
  const topBlocks = workspace.getTopBlocks(true);
  for (const topBlock of topBlocks) {
    let cursor: Blockly.Block | null = topBlock;
    while (cursor) {
      steps.push(...blockToSteps(cursor, components));
      cursor = cursor.getNextBlock();
    }
  }
  return steps;
}
