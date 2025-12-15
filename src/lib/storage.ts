import { PanelDesign, MultiPanelDesign, Rule, Panel, Component } from '@/types';

const STORAGE_KEY = 'konva-panel-designs';
const CURRENT_DESIGN_KEY = 'konva-current-design';
const RULES_KEY = 'konva-rules';
const PANELS_LIBRARY_KEY = 'konva-panels-library';
const COMPONENTS_LIBRARY_KEY = 'konva-components-library';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

export const storage = {
  // Save current design (supports both PanelDesign and MultiPanelDesign)
  saveCurrentDesign: (design: PanelDesign | MultiPanelDesign): void => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(CURRENT_DESIGN_KEY, JSON.stringify(design));
    } catch (error) {
      console.error('Failed to save current design:', error);
    }
  },

  // Load current design (supports both formats)
  loadCurrentDesign: (): PanelDesign | MultiPanelDesign | null => {
    if (!isBrowser) return null;
    try {
      const data = localStorage.getItem(CURRENT_DESIGN_KEY);
      if (!data) return null;
      return JSON.parse(data) as PanelDesign | MultiPanelDesign;
    } catch (error) {
      console.error('Failed to load current design:', error);
      return null;
    }
  },

  // Save design with a name (supports both formats)
  saveDesign: (name: string, design: PanelDesign | MultiPanelDesign): void => {
    if (!isBrowser) return;
    try {
      const designs = storage.getAllDesigns();
      // Handle both formats
      if ('panels' in design) {
        // MultiPanelDesign
        designs[name] = design;
      } else {
        // Legacy PanelDesign
        const designWithName = { ...design, panel: { ...design.panel, name } };
        designs[name] = designWithName;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
    } catch (error) {
      console.error('Failed to save design:', error);
    }
  },

  // Load a specific design by name (supports both formats)
  loadDesign: (name: string): PanelDesign | MultiPanelDesign | null => {
    try {
      const designs = storage.getAllDesigns();
      return designs[name] || null;
    } catch (error) {
      console.error('Failed to load design:', error);
      return null;
    }
  },

  // Get all saved designs (supports both formats)
  getAllDesigns: (): Record<string, PanelDesign | MultiPanelDesign> => {
    if (!isBrowser) return {};
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return {};
      return JSON.parse(data) as Record<string, PanelDesign | MultiPanelDesign>;
    } catch (error) {
      console.error('Failed to load designs:', error);
      return {};
    }
  },

  // Delete a design
  deleteDesign: (name: string): void => {
    if (!isBrowser) return;
    try {
      const designs = storage.getAllDesigns();
      delete designs[name];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
    } catch (error) {
      console.error('Failed to delete design:', error);
    }
  },

  // Export design as JSON (supports both formats)
  exportDesign: (design: PanelDesign | MultiPanelDesign): string => {
    return JSON.stringify(design, null, 2);
  },

  // Import design from JSON (supports both formats)
  importDesign: (json: string): PanelDesign | MultiPanelDesign | null => {
    try {
      return JSON.parse(json) as PanelDesign | MultiPanelDesign;
    } catch (error) {
      console.error('Failed to import design:', error);
      return null;
    }
  },

  // Rules storage
  saveRules: (rules: Rule[]): void => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(RULES_KEY, JSON.stringify(rules));
    } catch (error) {
      console.error('Failed to save rules:', error);
    }
  },

  loadRules: (): Rule[] => {
    if (!isBrowser) return [];
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
    if (!isBrowser) return;
    try {
      localStorage.setItem(PANELS_LIBRARY_KEY, JSON.stringify(panels));
    } catch (error) {
      console.error('Failed to save panels library:', error);
    }
  },

  loadPanelsLibrary: (): Panel[] => {
    if (!isBrowser) return [];
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
    if (!isBrowser) return;
    try {
      localStorage.setItem(COMPONENTS_LIBRARY_KEY, JSON.stringify(components));
    } catch (error) {
      console.error('Failed to save components library:', error);
    }
  },

  loadComponentsLibrary: (): Component[] | null => {
    if (!isBrowser) return null;
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

