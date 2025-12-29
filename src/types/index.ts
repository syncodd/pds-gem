// Mevcut dosyanın üzerine bu değişikliği yap veya Component interface'ini güncelle:

export interface Panel {
  id: string;
  name: string;
  width: number; // in mm
  height: number; // in mm
  depth?: number; // in mm
  type?: string;
  category?: string;
  model2D?: string;
  model3D?: string;
  constraints?: Constraint[];
}

export interface Component {
  id: string;
  name: string;
  type: string;
  category: string;
  width: number;
  height: number;
  depth?: number;
  color: string;
  specs: Record<string, string | number>;
  icon?: string;
  model2D?: string;
  model3D?: string;
  tags?: string[];
  requiredComponents?: string[];
  // --- YENİ EKLENEN TİCARİ ALANLAR ---
  sku?: string;          // Stok Kodu (Örn: TK-100-20)
  price?: number;        // Birim Fiyat
  currency?: 'TRY' | 'USD' | 'EUR'; // Para Birimi
  weight?: number;       // Ağırlık
}

// ... Dosyanın geri kalanı (Combinator, CanvasComponent, PanelDesign vb.) aynı kalacak ...
// Buradaki diğer interface'leri silmene gerek yok, sadece Component'i güncellemen yeterli.
// Diğer tüm interface'ler (Project, Rule, vs.) olduğu gibi kalmalı.
export interface Combinator {
  id: string;
  name: string;
  width: number;
  height: number;
  depth?: number;
  componentIds: string[];
  gaps?: number[];
  brand: string;
  series: string;
  currentA: string;
  pole: string;
  panelSize?: number;
}

export interface CanvasComponent {
  id: string;
  componentId: string;
  panelId: string;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  properties?: Record<string, any>;
}

export interface PanelDesign {
  panel: Panel;
  components: CanvasComponent[];
}

export interface MultiPanelDesign {
  panels: Panel[];
  components: CanvasComponent[];
  activePanelId: string | null;
  panelSpacing: number;
}

// Rule System Types
export interface Constraint {
  type: 'dimension' | 'count' | 'spacing' | 'co-usage' | 'overlap' | 'bounds' | 'noIntersectWithPanelBounds' | 'panelSizeMapping' | 'combinatorPanelSizeMapping' | 'gap' | 'maxComponentHeight';
  property?: string;
  min?: number;
  max?: number;
  value?: number;
  message?: string;
  spacing?: number;
  requiredComponentIds?: string[];
  targetComponentId?: string;
  panelIds?: string[];
  componentType?: string;
  componentTypes?: string[];
  combinatorTypes?: string[];
  panelSize?: number;
  placement?: 'top' | 'bottom';
  size?: number;
  automatic?: boolean;
  height?: number;
}

export interface Rule {
  id: string;
  name: string;
  type: 'global' | 'panel' | 'component' | 'combinator';
  panelId?: string;
  componentId?: string;
  combinatorId?: string;
  conditions: RuleCondition[];
  constraints: Constraint[];
  dependencies?: string[];
  enabled?: boolean;
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
    panelId?: string;
    combinatorId?: string;
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
  componentIds?: string[];
  timestamp: number;
  missingComponentId?: string;
  requiredComponentId?: string;
}

export interface Project {
  id: string;
  name: string;
  panelName: string;
  customer: string;
  editor: string;
  comment: string;
  earthing: string;
  peNCrossSection: string;
  nominalCurrent: string;
  shortCircuitCurrent: string;
  forming: string;
  panels: Panel[];
  components: CanvasComponent[];
  createdAt: number;
  updatedAt: number;
}