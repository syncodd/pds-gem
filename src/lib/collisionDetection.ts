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
 * Check for overlaps between components (only on the same panel)
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
      // Only check overlaps for components on the same panel
      if (comp1.panelId !== comp2.panelId) continue;
      
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
 * Check if components meet minimum spacing requirement (only on the same panel)
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
      // Only check spacing for components on the same panel
      if (comp1.panelId !== comp2.panelId) continue;
      
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
 * Get all components that are outside their panel bounds
 */
export function getOutOfBoundsComponents(
  components: CanvasComponent[],
  componentLibrary: Component[],
  panels: Panel[]
): string[] {
  const outOfBounds: string[] = [];
  
  // Create a map of panel IDs to panels for quick lookup
  const panelMap = new Map<string, Panel>();
  panels.forEach(panel => panelMap.set(panel.id, panel));

  for (const canvasComp of components) {
    const compDef = componentLibrary.find((c) => c.id === canvasComp.componentId);
    if (!compDef) continue;

    // Find the panel this component belongs to
    const panel = panelMap.get(canvasComp.panelId);
    if (!panel) {
      // Component references a panel that doesn't exist
      outOfBounds.push(canvasComp.id);
      continue;
    }

    if (!isComponentInPanel(canvasComp, compDef, panel)) {
      outOfBounds.push(canvasComp.id);
    }
  }

  return outOfBounds;
}

/**
 * Check if a component intersects with the bounding box of specified panels
 * Returns components that intersect with any of the specified panels
 */
export function checkIntersectsWithPanelBounds(
  components: CanvasComponent[],
  componentLibrary: Component[],
  panels: Panel[],
  targetPanelIds: string[]
): string[] {
  const intersecting: string[] = [];
  
  // Create a map of panel IDs to panels for quick lookup
  const panelMap = new Map<string, Panel>();
  panels.forEach(panel => panelMap.set(panel.id, panel));
  
  // Get target panels
  const targetPanels = targetPanelIds
    .map(id => panelMap.get(id))
    .filter((panel): panel is Panel => panel !== undefined);
  
  if (targetPanels.length === 0) return intersecting;

  for (const canvasComp of components) {
    const compDef = componentLibrary.find((c) => c.id === canvasComp.componentId);
    if (!compDef) continue;

    const compBounds = getComponentBounds(canvasComp, compDef);
    
    // Check if component intersects with any of the target panels
    for (const targetPanel of targetPanels) {
      // Skip if component is on the target panel itself
      if (canvasComp.panelId === targetPanel.id) continue;
      
      // Calculate target panel's position in global coordinates
      // Find the x offset of the target panel
      let targetPanelXOffset = 0;
      for (let i = 0; i < panels.length; i++) {
        if (panels[i].id === targetPanel.id) {
          break;
        }
        targetPanelXOffset += panels[i].width;
      }
      
      // Calculate component's panel x offset
      let compPanelXOffset = 0;
      for (let i = 0; i < panels.length; i++) {
        if (panels[i].id === canvasComp.panelId) {
          break;
        }
        compPanelXOffset += panels[i].width;
      }
      
      // Component's global position
      const compGlobalX = compPanelXOffset + canvasComp.x;
      const compGlobalY = canvasComp.y;
      
      // Target panel bounds in global coordinates
      const targetPanelBounds: Rectangle = {
        x: targetPanelXOffset,
        y: 0,
        width: targetPanel.width,
        height: targetPanel.height,
      };
      
      // Component bounds in global coordinates
      const compGlobalBounds: Rectangle = {
        x: compGlobalX,
        y: compGlobalY,
        width: compDef.width,
        height: compDef.height,
      };
      
      // Check if rectangles intersect
      if (rectanglesOverlap(compGlobalBounds, targetPanelBounds)) {
        intersecting.push(canvasComp.id);
        break; // Only need to report once per component
      }
    }
  }

  return intersecting;
}

