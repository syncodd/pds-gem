export interface Panel {
  id: string;
  name: string;
  width: number; // in mm
  height: number; // in mm
  depth?: number; // in mm
  type?: string;
  category?: string;
  model2D?: string; // URL or file path for 2D model
  model3D?: string; // URL or file path for 3D model (optional)
  constraints?: Constraint[];
}

export interface Component {
  id: string;
  name: string;
  type: string; // Base component type (e.g., 'Pirinç Baralar', 'Bakır Baralar')
  category: string;
  width: number; // in mm
  height: number; // in mm
  depth?: number; // in mm
  color: string; // hex color
  specs: Record<string, string | number>; // Should include panelSize (50, 60, 70, 80, 90) for size variants
  icon?: string;
  model2D?: string; // URL or file path for 2D model
  model3D?: string; // URL or file path for 3D model (optional)
  tags?: string[];
  requiredComponents?: string[]; // Component IDs that must be used together
}

export interface Combinator {
  id: string;
  name: string;
  width: number; // in mm
  height: number; // in mm
  depth?: number; // in mm
  componentIds: string[]; // Array of component IDs contained in this combinator
  brand: string;
  series: string;
  currentA: string; // Current in Amperes
  pole: string;
}

export interface CanvasComponent {
  id: string;
  componentId: string; // reference to Component.id
  panelId: string; // reference to Panel.id - which panel this component belongs to
  x: number; // position on canvas (relative to panel)
  y: number; // position on canvas (relative to panel)
  rotation?: number; // rotation in degrees
  scale?: number; // scale factor
  properties?: Record<string, any>; // additional properties
}

export interface PanelDesign {
  panel: Panel;
  components: CanvasComponent[];
}

export interface MultiPanelDesign {
  panels: Panel[];
  components: CanvasComponent[];
  activePanelId: string | null;
  panelSpacing: number; // spacing between panels in mm
}

// Rule System Types
export interface Constraint {
  type: 'dimension' | 'count' | 'spacing' | 'co-usage' | 'overlap' | 'bounds' | 'noIntersectWithPanelBounds' | 'panelSizeMapping';
  property?: string;
  min?: number;
  max?: number;
  value?: number;
  message?: string;
  spacing?: number; // Minimum spacing in mm
  requiredComponentIds?: string[]; // For co-usage: component IDs that must be used together
  targetComponentId?: string; // For co-usage: the component that requires others
  panelIds?: string[]; // For noIntersectWithPanelBounds: panel IDs to check intersection with
  componentType?: string; // For panelSizeMapping: base component type (e.g., 'Pirinç Baralar') - DEPRECATED, use componentTypes
  componentTypes?: string[]; // For panelSizeMapping: array of component types to apply rule to (empty = all components)
  panelSize?: number; // For panelSizeMapping: panel size in cm (e.g., 60 for 600mm panel) - if specified, overrides panel width calculation
}

export interface Rule {
  id: string;
  name: string;
  type: 'global' | 'panel' | 'component' | 'combinator';
  panelId?: string; // For panel-based rules
  componentId?: string; // For component-based rules
  combinatorId?: string; // For combinator-based rules
  conditions: RuleCondition[];
  constraints: Constraint[];
  dependencies?: string[]; // Rule IDs this rule depends on
  enabled?: boolean; // Whether rule is active
}

export interface RuleCondition {
  field: string;
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains' | 'in' | 'notEquals';
  value: string | number | string[];
}

export interface RuleNode {
  id: string;
  type: 'global' | 'panel' | 'component' | 'combinator' | 'constraint' | 'panelNode' | 'constraintNode' | 'conditionNode' | 'combinatorNode';
  data: {
    label: string;
    rule?: Rule;
    constraint?: Constraint;
    condition?: RuleCondition;
    panelId?: string; // For panelNode
    combinatorId?: string; // For combinatorNode
  };
  position: { x: number; y: number };
}

export interface RuleViolation {
  id: string;
  ruleId: string;
  ruleName: string;
  message: string;
  severity: 'error' | 'warning';
  componentId?: string;
  componentIds?: string[]; // For violations involving multiple components
  timestamp: number;
  missingComponentId?: string; // For co-usage violations: the missing required component ID
  requiredComponentId?: string; // For co-usage violations: the component that requires the missing one
}

export interface Project {
  id: string;
  name: string;
  panelName: string; // Complete panel name
  customer: string;
  editor: string;
  comment: string;
  earthing: string;
  peNCrossSection: string;
  nominalCurrent: string;
  shortCircuitCurrent: string;
  forming: string;
  panels: Panel[]; // Panels in the project
  components: CanvasComponent[]; // Components in the project
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
}

