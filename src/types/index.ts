// src/types/index.ts
export interface Component {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  depth: number;
  model2D?: string;
  model3D?: string;
  metadata?: {
    sku?: string;
    price?: number;
    brand?: string;
    description?: string;
  };
  panelId?: string;
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
}

export interface Panel {
  id: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  model2D?: string;
  model3D?: string;
}

export interface CanvasComponent {
  id: string;
  componentId: string;
  panelId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export interface Project {
  id: string;
  name: string;
  updatedAt: number;
  thumbnail?: string;
  description?: string;
}

export interface PanelDesign {
  panel: Panel;
  components: CanvasComponent[];
  activePanelId: string | null;
}

export interface MultiPanelDesign {
  panels: Panel[];
  components: CanvasComponent[];
  activePanelId: string | null;
  panelSpacing: number;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  condition?: string;
  target?: string;
}

export interface RuleViolation {
  ruleId: string;
  componentId: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface Combinator {
  id: string;
  name: string;
  type: string;
}