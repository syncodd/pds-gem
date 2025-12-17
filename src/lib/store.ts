import { create } from 'zustand';
import {
  Panel,
  Component,
  CanvasComponent,
  PanelDesign,
  MultiPanelDesign,
  Rule,
  RuleViolation,
} from '@/types';
import { defaultComponents } from '@/data/components';
import { storage } from './storage';

interface PanelStore {
  // Panel design state (multi-panel support)
  panels: Panel[];
  components: CanvasComponent[];
  activePanelId: string | null;
  panelSpacing: number; // spacing between panels in mm
  
  // Legacy single panel support (for backward compatibility)
  panel: Panel;
  
  // Component library
  componentLibrary: Component[];
  
  // Panels library
  panelsLibrary: Panel[];
  
  // Rules
  rules: Rule[];
  
  // Rule violations
  violations: RuleViolation[];
  
  // Selection state
  selectedComponentType: string | null; // Component ID from library
  selectedCanvasComponent: string | null; // CanvasComponent ID
  
  // Drag state
  draggingComponent: string | null; // Component ID being dragged
  dragPosition: { x: number; y: number } | null; // Current drag position in mm
  dragPanelId: string | null; // Panel ID where component is being dragged
  
  // Actions - Panel Design
  setPanel: (panel: Partial<Panel>) => void; // Legacy - updates first panel or creates one
  addPanel: (panel: Panel) => void; // Add a panel to the design
  removePanel: (panelId: string) => void; // Remove a panel from the design
  setActivePanel: (panelId: string | null) => void; // Set the active panel
  addComponent: (panelId: string, componentId: string, x: number, y: number) => void;
  updateComponent: (id: string, updates: Partial<CanvasComponent>) => void;
  deleteComponent: (id: string) => void;
  selectComponentType: (componentId: string | null) => void;
  selectCanvasComponent: (id: string | null) => void;
  setDesign: (design: PanelDesign | MultiPanelDesign) => void; // Support both formats
  clearDesign: () => void;
  
  // Drag actions
  setDraggingComponent: (componentId: string | null) => void;
  setDragPosition: (position: { x: number; y: number } | null, panelId?: string | null) => void;
  
  // Actions - Components Library
  addComponentToLibrary: (component: Component) => void;
  updateComponentInLibrary: (id: string, updates: Partial<Component>) => void;
  deleteComponentFromLibrary: (id: string) => void;
  
  // Actions - Panels Library
  addPanelToLibrary: (panel: Panel) => void;
  updatePanelInLibrary: (id: string, updates: Partial<Panel>) => void;
  deletePanelFromLibrary: (id: string) => void;
  loadPanelFromLibrary: (id: string) => void;
  
  // Actions - Rules
  setRules: (rules: Rule[]) => void;
  addRule: (rule: Rule) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  
  // Actions - Violations
  setViolations: (violations: RuleViolation[]) => void;
  clearViolations: () => void;
}

const defaultPanel: Panel = {
  id: 'panel-1',
  name: 'New Panel',
  width: 600,
  height: 800,
  depth: 200,
  model2D: '/models/panel-sample-2d.svg',
  model3D: '/models/panel-sample-3d.glb', // Placeholder - replace with actual 3D model file
};

// Load initial state from localStorage (safe for SSR)
const loadInitialState = () => {
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    return {
      rules: [],
      panelsLibrary: [defaultPanel],
      componentLibrary: defaultComponents,
    };
  }
  
  const savedRules = storage.loadRules();
  const savedPanels = storage.loadPanelsLibrary();
  const savedComponents = storage.loadComponentsLibrary();
  
  return {
    rules: savedRules,
    panelsLibrary: savedPanels.length > 0 ? savedPanels : [defaultPanel],
    componentLibrary: savedComponents || defaultComponents,
  };
};

const initialState = loadInitialState();

export const usePanelStore = create<PanelStore>((set, get) => ({
  // Multi-panel state
  panels: [],
  components: [],
  activePanelId: null,
  panelSpacing: 0, // No spacing between panels (panels are adjacent)
  
  // Legacy single panel (for backward compatibility)
  panel: defaultPanel,
  
  componentLibrary: initialState.componentLibrary,
  panelsLibrary: initialState.panelsLibrary,
  rules: initialState.rules,
  violations: [],
  selectedComponentType: null,
  selectedCanvasComponent: null,
  dragPanelId: null,

  // Panel Design Actions
  setPanel: (updates) =>
    set((state) => {
      // Legacy support: update first panel or create one
      if (state.panels.length === 0) {
        const newPanel = { ...defaultPanel, ...updates };
        return {
          panel: newPanel,
          panels: [newPanel],
          activePanelId: state.activePanelId, // Don't auto-select
        };
      } else {
        const updatedPanel = { ...state.panels[0], ...updates };
        return {
          panel: updatedPanel,
          panels: [updatedPanel, ...state.panels.slice(1)],
        };
      }
    }),

  addPanel: (panel) =>
    set((state) => {
      const newPanel = { ...panel, id: panel.id || `panel-${Date.now()}` };
      const newPanels = [...state.panels, newPanel];
      return {
        panels: newPanels,
        activePanelId: state.activePanelId || newPanel.id,
        // Update legacy panel to first panel
        panel: newPanels[0] || defaultPanel,
      };
    }),

  removePanel: (panelId) =>
    set((state) => {
      const newPanels = state.panels.filter((p) => p.id !== panelId);
      const newComponents = state.components.filter((c) => c.panelId !== panelId);
      return {
        panels: newPanels,
        components: newComponents,
        activePanelId:
          state.activePanelId === panelId
            ? newPanels.length > 0
              ? newPanels[0].id
              : null
            : state.activePanelId,
        panel: newPanels[0] || defaultPanel,
      };
    }),

  setActivePanel: (panelId) => set({ activePanelId: panelId }),

  addComponent: (panelId, componentId, x, y) =>
    set((state) => {
      const component = state.componentLibrary.find((c) => c.id === componentId);
      if (!component) return state;

      const newComponent: CanvasComponent = {
        id: `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        componentId,
        panelId,
        x,
        y,
        rotation: 0,
        scale: 1,
      };

      return {
        components: [...state.components, newComponent],
        selectedComponentType: null, // Clear selection after adding
      };
    }),

  updateComponent: (id, updates) =>
    set((state) => ({
      components: state.components.map((comp) =>
        comp.id === id ? { ...comp, ...updates } : comp
      ),
    })),

  deleteComponent: (id) =>
    set((state) => ({
      components: state.components.filter((comp) => comp.id !== id),
      selectedCanvasComponent:
        state.selectedCanvasComponent === id ? null : state.selectedCanvasComponent,
    })),

  selectComponentType: (componentId) =>
    set({ selectedComponentType: componentId }),

  selectCanvasComponent: (id) =>
    set({ selectedCanvasComponent: id }),

  setDesign: (design) =>
    set((state) => {
      // Support both old PanelDesign and new MultiPanelDesign formats
      if ('panels' in design) {
        // MultiPanelDesign format
        const multiDesign = design as MultiPanelDesign;
        return {
          panels: multiDesign.panels,
          components: multiDesign.components,
          activePanelId: multiDesign.activePanelId,
          panelSpacing: multiDesign.panelSpacing || 0,
          panel: multiDesign.panels[0] || defaultPanel,
        };
      } else {
        // Legacy PanelDesign format
        const legacyDesign = design as PanelDesign;
        return {
          panels: [legacyDesign.panel],
          components: legacyDesign.components.map((c) => ({
            ...c,
            panelId: c.panelId || legacyDesign.panel.id,
          })),
          activePanelId: legacyDesign.panel.id,
          panel: legacyDesign.panel,
        };
      }
    }),

  clearDesign: () =>
    set({
      panels: [],
      components: [],
      activePanelId: null,
      panel: defaultPanel,
      selectedComponentType: null,
      selectedCanvasComponent: null,
    }),

  // Components Library Actions
  addComponentToLibrary: (component) =>
    set((state) => {
      const updated = [...state.componentLibrary, component];
      storage.saveComponentsLibrary(updated);
      return { componentLibrary: updated };
    }),

  updateComponentInLibrary: (id, updates) =>
    set((state) => {
      const updated = state.componentLibrary.map((comp) =>
        comp.id === id ? { ...comp, ...updates } : comp
      );
      storage.saveComponentsLibrary(updated);
      return { componentLibrary: updated };
    }),

  deleteComponentFromLibrary: (id) =>
    set((state) => {
      const updated = state.componentLibrary.filter((comp) => comp.id !== id);
      storage.saveComponentsLibrary(updated);
      return { componentLibrary: updated };
    }),

  // Panels Library Actions
  addPanelToLibrary: (panel) =>
    set((state) => {
      const updated = [...state.panelsLibrary, panel];
      storage.savePanelsLibrary(updated);
      return { panelsLibrary: updated };
    }),

  updatePanelInLibrary: (id, updates) =>
    set((state) => {
      const updated = state.panelsLibrary.map((panel) =>
        panel.id === id ? { ...panel, ...updates } : panel
      );
      storage.savePanelsLibrary(updated);
      return { panelsLibrary: updated };
    }),

  deletePanelFromLibrary: (id) =>
    set((state) => {
      const updated = state.panelsLibrary.filter((panel) => panel.id !== id);
      storage.savePanelsLibrary(updated);
      return { panelsLibrary: updated };
    }),

  loadPanelFromLibrary: (id) =>
    set((state) => {
      const panel = state.panelsLibrary.find((p) => p.id === id);
      if (!panel) return state;
      return {
        panel: { ...panel },
        components: [], // Clear components when loading new panel
      };
    }),

  // Rules Actions
  setRules: (rules) =>
    set(() => {
      storage.saveRules(rules);
      return { rules };
    }),
  addRule: (rule) =>
    set((state) => {
      const updated = [...state.rules, rule];
      storage.saveRules(updated);
      return { rules: updated };
    }),

  updateRule: (id, updates) =>
    set((state) => {
      const updated = state.rules.map((rule) =>
        rule.id === id ? { ...rule, ...updates } : rule
      );
      storage.saveRules(updated);
      return { rules: updated };
    }),

  deleteRule: (id) =>
    set((state) => {
      const updated = state.rules.filter((rule) => rule.id !== id);
      storage.saveRules(updated);
      return { rules: updated };
    }),

  toggleRule: (id) =>
    set((state) => {
      const updated = state.rules.map((rule) =>
        rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
      );
      storage.saveRules(updated);
      return { rules: updated };
    }),

  // Violations Actions
  setViolations: (violations) =>
    set({ violations }),

  clearViolations: () =>
    set({ violations: [] }),

  // Drag actions
  setDraggingComponent: (componentId) =>
    set({ draggingComponent: componentId, dragPosition: null, dragPanelId: null }),
  setDragPosition: (position, panelId) =>
    set({ dragPosition: position, dragPanelId: panelId || null }),
}));

