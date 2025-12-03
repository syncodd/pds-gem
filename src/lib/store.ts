import { create } from 'zustand';
import {
  Panel,
  Component,
  CanvasComponent,
  PanelDesign,
  Rule,
  RuleViolation,
} from '@/types';
import { defaultComponents } from '@/data/components';
import { storage } from './storage';

interface PanelStore {
  // Panel design state
  panel: Panel;
  components: CanvasComponent[];
  
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
  
  // Actions - Panel Design
  setPanel: (panel: Partial<Panel>) => void;
  addComponent: (componentId: string, x: number, y: number) => void;
  updateComponent: (id: string, updates: Partial<CanvasComponent>) => void;
  deleteComponent: (id: string) => void;
  selectComponentType: (componentId: string | null) => void;
  selectCanvasComponent: (id: string | null) => void;
  setDesign: (design: PanelDesign) => void;
  clearDesign: () => void;
  
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

// Load initial state from localStorage
const loadInitialState = () => {
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
  panel: defaultPanel,
  components: [],
  componentLibrary: initialState.componentLibrary,
  panelsLibrary: initialState.panelsLibrary,
  rules: initialState.rules,
  violations: [],
  selectedComponentType: null,
  selectedCanvasComponent: null,

  // Panel Design Actions
  setPanel: (updates) =>
    set((state) => ({
      panel: { ...state.panel, ...updates },
    })),

  addComponent: (componentId, x, y) =>
    set((state) => {
      const component = state.componentLibrary.find((c) => c.id === componentId);
      if (!component) return state;

      const newComponent: CanvasComponent = {
        id: `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        componentId,
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
    set({
      panel: design.panel,
      components: design.components,
    }),

  clearDesign: () =>
    set({
      panel: defaultPanel,
      components: [],
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
}));

