import { Component } from '@/types';

/**
 * Determines which dropdowns (A/V/P) should be shown based on component type
 */
export function getDropdownsForType(type: string): {
  showA: boolean;
  showV: boolean;
  showP: boolean;
} {
  const typeLower = type.toLowerCase();
  
  // Switches, Breakers, Fuses show A (Amperage)
  if (typeLower === 'switch' || typeLower === 'breaker' || typeLower === 'fuse') {
    return { showA: true, showV: false, showP: false };
  }
  
  // Meters, Relays show V (Voltage)
  if (typeLower === 'meter' || typeLower === 'relay') {
    return { showA: false, showV: true, showP: false };
  }
  
  // Power-related components show P (Power)
  if (typeLower === 'power' || typeLower === 'transformer') {
    return { showA: false, showV: false, showP: true };
  }
  
  // Default: show none
  return { showA: false, showV: false, showP: false };
}

/**
 * Extracts A (Amperage) values from component library specs
 */
export function extractAValues(components: Component[]): string[] {
  const values = new Set<string>();
  
  components.forEach((comp) => {
    // Look for current or rating in specs
    if (comp.specs.current) {
      values.add(String(comp.specs.current));
    }
    if (comp.specs.rating) {
      values.add(String(comp.specs.rating));
    }
  });
  
  return Array.from(values).sort((a, b) => {
    // Sort numerically if possible
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
}

/**
 * Extracts V (Voltage) values from component library specs
 */
export function extractVValues(components: Component[]): string[] {
  const values = new Set<string>();
  
  components.forEach((comp) => {
    if (comp.specs.voltage) {
      values.add(String(comp.specs.voltage));
    }
  });
  
  return Array.from(values).sort((a, b) => {
    // Sort numerically if possible
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
}

/**
 * Extracts P (Power) values from component library specs
 */
export function extractPValues(components: Component[]): string[] {
  const values = new Set<string>();
  
  components.forEach((comp) => {
    if (comp.specs.power) {
      values.add(String(comp.specs.power));
    }
  });
  
  return Array.from(values).sort((a, b) => {
    // Sort numerically if possible
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    return a.localeCompare(b);
  });
}

/**
 * Gets unique component types from component library
 */
export function getComponentTypes(components: Component[]): string[] {
  const types = new Set<string>();
  components.forEach((comp) => {
    if (comp.type) {
      types.add(comp.type);
    }
  });
  return Array.from(types).sort();
}

/**
 * Finds a component from library by type
 */
export function findComponentByType(components: Component[], type: string): Component | null {
  return components.find((c) => c.type === type) || null;
}

/**
 * Gets the panel size in cm from panel width in mm
 * 600mm → 60, 500mm → 50, etc.
 */
export function getPanelSizeFromWidth(panelWidth: number): number {
  return Math.round(panelWidth / 10);
}

/**
 * Gets components that match a specific panel size
 */
export function getComponentsByPanelSize(components: Component[], panelSize: number): Component[] {
  return components.filter((comp) => {
    const compPanelSize = comp.specs.panelSize;
    return compPanelSize !== undefined && Number(compPanelSize) === panelSize;
  });
}

/**
 * Gets components of a specific type that match panel size
 */
export function getComponentsByTypeAndPanelSize(
  components: Component[],
  componentType: string,
  panelSize: number
): Component[] {
  return components.filter((comp) => {
    return comp.type === componentType && comp.specs.panelSize === panelSize;
  });
}

/**
 * Gets all variants of a component type (all panel sizes)
 */
export function getComponentVariantsByType(components: Component[], componentType: string): Component[] {
  return components.filter((comp) => comp.type === componentType);
}

/**
 * Filters components to show only those matching the panel width
 * If a component type is selected, shows only matching size variants of that type
 */
export function filterComponentsByPanelWidth(
  components: Component[],
  panelWidth: number,
  selectedComponentType?: string | null
): Component[] {
  const panelSize = getPanelSizeFromWidth(panelWidth);
  
  if (selectedComponentType) {
    // Filter by both type and panel size
    return getComponentsByTypeAndPanelSize(components, selectedComponentType, panelSize);
  }
  
  // Filter by panel size only
  return getComponentsByPanelSize(components, panelSize);
}
