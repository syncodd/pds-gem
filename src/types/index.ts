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
  type: string;
  category: string;
  width: number; // in mm
  height: number; // in mm
  depth?: number; // in mm
  color: string; // hex color
  specs: Record<string, string | number>;
  icon?: string;
  model2D?: string; // URL or file path for 2D model
  model3D?: string; // URL or file path for 3D model (optional)
  tags?: string[];
  requiredComponents?: string[]; // Component IDs that must be used together
}

export interface CanvasComponent {
  id: string;
  componentId: string; // reference to Component.id
  x: number; // position on canvas
  y: number; // position on canvas
  rotation?: number; // rotation in degrees
  scale?: number; // scale factor
  properties?: Record<string, any>; // additional properties
}

export interface PanelDesign {
  panel: Panel;
  components: CanvasComponent[];
}

// Rule System Types
export interface Constraint {
  type: 'dimension' | 'count' | 'spacing' | 'co-usage' | 'overlap' | 'bounds';
  property?: string;
  min?: number;
  max?: number;
  value?: number;
  message?: string;
  spacing?: number; // Minimum spacing in mm
  requiredComponentIds?: string[]; // For co-usage: component IDs that must be used together
  targetComponentId?: string; // For co-usage: the component that requires others
}

export interface Rule {
  id: string;
  name: string;
  type: 'global' | 'panel' | 'component';
  panelId?: string; // For panel-based rules
  componentId?: string; // For component-based rules
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
  type: 'global' | 'panel' | 'component' | 'constraint';
  data: {
    label: string;
    rule?: Rule;
    constraint?: Constraint;
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

