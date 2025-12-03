import { PanelDesign, Rule, Panel, Component } from '@/types';

const STORAGE_KEY = 'konva-panel-designs';
const CURRENT_DESIGN_KEY = 'konva-current-design';
const RULES_KEY = 'konva-rules';
const PANELS_LIBRARY_KEY = 'konva-panels-library';
const COMPONENTS_LIBRARY_KEY = 'konva-components-library';

export const storage = {
  // Save current design
  saveCurrentDesign: (design: PanelDesign): void => {
    try {
      localStorage.setItem(CURRENT_DESIGN_KEY, JSON.stringify(design));
    } catch (error) {
      console.error('Failed to save current design:', error);
    }
  },

  // Load current design
  loadCurrentDesign: (): PanelDesign | null => {
    try {
      const data = localStorage.getItem(CURRENT_DESIGN_KEY);
      if (!data) return null;
      return JSON.parse(data) as PanelDesign;
    } catch (error) {
      console.error('Failed to load current design:', error);
      return null;
    }
  },

  // Save design with a name
  saveDesign: (name: string, design: PanelDesign): void => {
    try {
      const designs = storage.getAllDesigns();
      const designWithName = { ...design, panel: { ...design.panel, name } };
      designs[name] = designWithName;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
    } catch (error) {
      console.error('Failed to save design:', error);
    }
  },

  // Load a specific design by name
  loadDesign: (name: string): PanelDesign | null => {
    try {
      const designs = storage.getAllDesigns();
      return designs[name] || null;
    } catch (error) {
      console.error('Failed to load design:', error);
      return null;
    }
  },

  // Get all saved designs
  getAllDesigns: (): Record<string, PanelDesign> => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return {};
      return JSON.parse(data) as Record<string, PanelDesign>;
    } catch (error) {
      console.error('Failed to load designs:', error);
      return {};
    }
  },

  // Delete a design
  deleteDesign: (name: string): void => {
    try {
      const designs = storage.getAllDesigns();
      delete designs[name];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
    } catch (error) {
      console.error('Failed to delete design:', error);
    }
  },

  // Export design as JSON
  exportDesign: (design: PanelDesign): string => {
    return JSON.stringify(design, null, 2);
  },

  // Import design from JSON
  importDesign: (json: string): PanelDesign | null => {
    try {
      return JSON.parse(json) as PanelDesign;
    } catch (error) {
      console.error('Failed to import design:', error);
      return null;
    }
  },

  // Rules storage
  saveRules: (rules: Rule[]): void => {
    try {
      localStorage.setItem(RULES_KEY, JSON.stringify(rules));
    } catch (error) {
      console.error('Failed to save rules:', error);
    }
  },

  loadRules: (): Rule[] => {
    try {
      const data = localStorage.getItem(RULES_KEY);
      if (!data) return [];
      return JSON.parse(data) as Rule[];
    } catch (error) {
      console.error('Failed to load rules:', error);
      return [];
    }
  },

  // Panels library storage
  savePanelsLibrary: (panels: Panel[]): void => {
    try {
      localStorage.setItem(PANELS_LIBRARY_KEY, JSON.stringify(panels));
    } catch (error) {
      console.error('Failed to save panels library:', error);
    }
  },

  loadPanelsLibrary: (): Panel[] => {
    try {
      const data = localStorage.getItem(PANELS_LIBRARY_KEY);
      if (!data) return [];
      return JSON.parse(data) as Panel[];
    } catch (error) {
      console.error('Failed to load panels library:', error);
      return [];
    }
  },

  // Components library storage
  saveComponentsLibrary: (components: Component[]): void => {
    try {
      localStorage.setItem(COMPONENTS_LIBRARY_KEY, JSON.stringify(components));
    } catch (error) {
      console.error('Failed to save components library:', error);
    }
  },

  loadComponentsLibrary: (): Component[] | null => {
    try {
      const data = localStorage.getItem(COMPONENTS_LIBRARY_KEY);
      if (!data) return null; // Return null to use default if not set
      return JSON.parse(data) as Component[];
    } catch (error) {
      console.error('Failed to load components library:', error);
      return null;
    }
  },
};

