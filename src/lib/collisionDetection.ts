import { CanvasComponent, Component, Panel } from '@/types';

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get bounding rectangle for a component on the canvas
 */
export function getComponentBounds(
  canvasComp: CanvasComponent,
  component: Component
): Rectangle {
  return {
    x: canvasComp.x,
    y: canvasComp.y,
    width: component.width,
    height: component.height,
  };
}

/**
 * Check if two rectangles overlap
 */
export function rectanglesOverlap(rect1: Rectangle, rect2: Rectangle): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * Check if a rectangle is completely within bounds
 */
export function isWithinBounds(rect: Rectangle, bounds: Rectangle): boolean {
  return (
    rect.x >= bounds.x &&
    rect.y >= bounds.y &&
    rect.x + rect.width <= bounds.x + bounds.width &&
    rect.y + rect.height <= bounds.y + bounds.height
  );
}

/**
 * Check if component is within panel bounds
 */
export function isComponentInPanel(
  canvasComp: CanvasComponent,
  component: Component,
  panel: Panel
): boolean {
  const compBounds = getComponentBounds(canvasComp, component);
  const panelBounds: Rectangle = {
    x: 0,
    y: 0,
    width: panel.width,
    height: panel.height,
  };
  return isWithinBounds(compBounds, panelBounds);
}

/**
 * Check for overlaps between components
 */
export function checkOverlaps(
  components: CanvasComponent[],
  componentLibrary: Component[]
): Array<{ comp1: string; comp2: string }> {
  const overlaps: Array<{ comp1: string; comp2: string }> = [];

  for (let i = 0; i < components.length; i++) {
    const comp1 = components[i];
    const compDef1 = componentLibrary.find((c) => c.id === comp1.componentId);
    if (!compDef1) continue;

    const bounds1 = getComponentBounds(comp1, compDef1);

    for (let j = i + 1; j < components.length; j++) {
      const comp2 = components[j];
      const compDef2 = componentLibrary.find((c) => c.id === comp2.componentId);
      if (!compDef2) continue;

      const bounds2 = getComponentBounds(comp2, compDef2);

      if (rectanglesOverlap(bounds1, bounds2)) {
        overlaps.push({ comp1: comp1.id, comp2: comp2.id });
      }
    }
  }

  return overlaps;
}

/**
 * Calculate minimum distance between two rectangles
 */
export function getMinDistance(rect1: Rectangle, rect2: Rectangle): number {
  // Calculate center points
  const center1 = {
    x: rect1.x + rect1.width / 2,
    y: rect1.y + rect1.height / 2,
  };
  const center2 = {
    x: rect2.x + rect2.width / 2,
    y: rect2.y + rect2.height / 2,
  };

  // Calculate distance between centers
  const dx = center2.x - center1.x;
  const dy = center2.y - center1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Subtract half of both widths/heights to get edge-to-edge distance
  const avgWidth = (rect1.width + rect2.width) / 2;
  const avgHeight = (rect1.height + rect2.height) / 2;
  const edgeDistance = distance - Math.max(avgWidth, avgHeight);

  return Math.max(0, edgeDistance);
}

/**
 * Check if components meet minimum spacing requirement
 */
export function checkSpacing(
  components: CanvasComponent[],
  componentLibrary: Component[],
  minSpacing: number
): Array<{ comp1: string; comp2: string; distance: number }> {
  const violations: Array<{ comp1: string; comp2: string; distance: number }> = [];

  for (let i = 0; i < components.length; i++) {
    const comp1 = components[i];
    const compDef1 = componentLibrary.find((c) => c.id === comp1.componentId);
    if (!compDef1) continue;

    const bounds1 = getComponentBounds(comp1, compDef1);

    for (let j = i + 1; j < components.length; j++) {
      const comp2 = components[j];
      const compDef2 = componentLibrary.find((c) => c.id === comp2.componentId);
      if (!compDef2) continue;

      const bounds2 = getComponentBounds(comp2, compDef2);

      // Skip if overlapping (handled by overlap check)
      if (rectanglesOverlap(bounds1, bounds2)) {
        continue;
      }

      const distance = getMinDistance(bounds1, bounds2);
      if (distance < minSpacing) {
        violations.push({
          comp1: comp1.id,
          comp2: comp2.id,
          distance,
        });
      }
    }
  }

  return violations;
}

/**
 * Get all components that are outside panel bounds
 */
export function getOutOfBoundsComponents(
  components: CanvasComponent[],
  componentLibrary: Component[],
  panel: Panel
): string[] {
  const outOfBounds: string[] = [];

  for (const canvasComp of components) {
    const compDef = componentLibrary.find((c) => c.id === canvasComp.componentId);
    if (!compDef) continue;

    if (!isComponentInPanel(canvasComp, compDef, panel)) {
      outOfBounds.push(canvasComp.id);
    }
  }

  return outOfBounds;
}

