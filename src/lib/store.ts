import { create } from 'zustand';
import {
  Panel,
  Component,
  Combinator,
  CanvasComponent,
  PanelDesign,
  MultiPanelDesign,
  Rule,
  RuleViolation,
  Project,
} from '@/types';
import { defaultComponents } from '@/data/components';
import { defaultPanels } from '@/data/panels';
import { storage } from '@/lib/storage';

interface PanelStore {
  // --- STATE (DURUM) DEĞİŞKENLERİ ---
  
  // Çoklu Pano Desteği
  panels: Panel[];
  components: CanvasComponent[];
  activePanelId: string | null;
  panelSpacing: number; // Panolar arası boşluk (mm)
  
  // Legacy (Eski kod uyumluluğu için tekil panel)
  panel: Panel;
  
  // Kütüphaneler (Veritabanı gibi davranır)
  componentLibrary: Component[];
  panelsLibrary: Panel[];
  combinatorsLibrary: Combinator[]; // EKLENDİ: Eksik olan parça buydu
  
  // Kurallar ve İhlaller
  rules: Rule[];
  violations: RuleViolation[];
  
  // Arayüz Durumları
  selectedComponentType: string | null; 
  selectedCanvasComponent: string | null; 
  
  // Sürükle-Bırak Durumları
  draggingComponent: string | null; 
  dragPosition: { x: number; y: number } | null; 
  dragPanelId: string | null; 
  
  // Projeler
  projects: Project[];
  currentProject: Project | null;
  
  // --- AKSİYONLAR (FONKSİYONLAR) ---

  // Pano Yönetimi
  setPanel: (panel: Partial<Panel>) => void;
  addPanel: (panel: Panel) => void;
  removePanel: (panelId: string) => void;
  setActivePanel: (panelId: string | null) => void;
  
  // Bileşen Yönetimi
  addComponent: (panelId: string, componentId: string, x: number, y: number) => void;
  updateComponent: (id: string, updates: Partial<CanvasComponent>) => void;
  deleteComponent: (id: string) => void;
  
  // Seçim İşlemleri
  selectComponentType: (componentId: string | null) => void;
  selectCanvasComponent: (id: string | null) => void;
  
  // Tasarım Yönetimi (Load/Save/Clear)
  setDesign: (design: PanelDesign | MultiPanelDesign) => void;
  clearDesign: () => void;
  
  // Sürükle-Bırak Aksiyonları
  setDraggingComponent: (componentId: string | null) => void;
  setDragPosition: (position: { x: number; y: number } | null, panelId?: string | null) => void;
  
  // Kütüphane Yönetimi
  addComponentToLibrary: (component: Component) => void;
  updateComponentInLibrary: (id: string, updates: Partial<Component>) => void;
  deleteComponentFromLibrary: (id: string) => void;
  
  addPanelToLibrary: (panel: Panel) => void;
  updatePanelInLibrary: (id: string, updates: Partial<Panel>) => void;
  deletePanelFromLibrary: (id: string) => void;
  loadPanelFromLibrary: (id: string) => void;
  
  addCombinatorToLibrary: (combinator: Combinator) => void;
  updateCombinatorInLibrary: (id: string, updates: Partial<Combinator>) => void;
  deleteCombinatorFromLibrary: (id: string) => void;
  
  // Kural Yönetimi
  setRules: (rules: Rule[]) => void;
  addRule: (rule: Rule) => void;
  updateRule: (id: string, updates: Partial<Rule>) => void;
  deleteRule: (id: string) => void;
  toggleRule: (id: string) => void;
  
  // İhlal Yönetimi
  setViolations: (violations: RuleViolation[]) => void;
  clearViolations: () => void;
  
  // Proje Yönetimi
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (project: Project | null) => void;
  loadProjects: () => void;
}

// Varsayılan Pano (Fallback)
const defaultPanel: Panel = defaultPanels[0] || {
  id: 'panel-1',
  name: 'Standart Pano',
  width: 600,
  height: 800,
  depth: 200,
  model2D: '/models/panel-sample-2d.svg',
  model3D: '/models/panel-sample-3d.glb',
};

// Başlangıç Durumunu Yükle (SSR Güvenli)
const loadInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      rules: [],
      panelsLibrary: defaultPanels || [],
      componentLibrary: defaultComponents || [],
      combinatorsLibrary: [],
      projects: [],
    };
  }
  
  // LocalStorage'dan verileri çek, yoksa varsayılanları kullan
  const savedRules = storage.loadRules() || [];
  const savedPanels = storage.loadPanelsLibrary();
  const savedComponents = storage.loadComponentsLibrary();
  const savedCombinators = storage.loadCombinatorsLibrary();
  const savedProjects = storage.getAllProjects();
  
  return {
    rules: savedRules,
    panelsLibrary: savedPanels.length > 0 ? savedPanels : (defaultPanels || []),
    componentLibrary: savedComponents || (defaultComponents || []),
    combinatorsLibrary: savedCombinators || [], // Burası kritikti, artık boş array dönüyor
    projects: savedProjects ? Object.values(savedProjects) : [],
  };
};

const initialState = loadInitialState();

export const usePanelStore = create<PanelStore>((set, get) => ({
  // --- STATE INITIALIZATION (BAŞLANGIÇ DEĞERLERİ) ---
  panels: [],
  components: [],
  activePanelId: null,
  panelSpacing: 0,
  
  // Legacy
  panel: defaultPanel,
  
  // Libraries
  componentLibrary: initialState.componentLibrary,
  panelsLibrary: initialState.panelsLibrary,
  combinatorsLibrary: initialState.combinatorsLibrary, // ARTIK EKSİK DEĞİL
  
  // Rules & Projects
  rules: initialState.rules,
  violations: [],
  projects: initialState.projects,
  currentProject: null,

  // UI States
  selectedComponentType: null,
  selectedCanvasComponent: null,
  dragPanelId: null,
  draggingComponent: null,
  dragPosition: null,

  // --- ACTIONS ---

  // Pano İşlemleri
  setPanel: (updates) =>
    set((state) => {
      if (state.panels.length === 0) {
        const newPanel = { ...defaultPanel, ...updates };
        return {
          panel: newPanel,
          panels: [newPanel],
          activePanelId: state.activePanelId,
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

  // Bileşen İşlemleri
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
        selectedComponentType: null,
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

  // Tasarım (Design) İşlemleri
  setDesign: (design) =>
    set((state) => {
      // Hem eski hem yeni formatı destekle
      if ('panels' in design) {
        const multiDesign = design as MultiPanelDesign;
        return {
          panels: multiDesign.panels || [],
          components: multiDesign.components || [],
          activePanelId: multiDesign.activePanelId || null,
          panelSpacing: multiDesign.panelSpacing || 0,
          panel: multiDesign.panels[0] || defaultPanel,
        };
      } else {
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

  // Kütüphane Yönetimi (Library Actions)
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

  // Pano Kütüphanesi
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
      // Yeni pano yüklenince mevcut bileşenleri temizle (veya isteğe bağlı sorulabilir)
      return {
        panel: { ...panel },
        components: [], 
      };
    }),

  // Combinator Kütüphanesi
  addCombinatorToLibrary: (combinator) =>
    set((state) => {
      const updated = [...state.combinatorsLibrary, combinator];
      storage.saveCombinatorsLibrary(updated);
      return { combinatorsLibrary: updated };
    }),

  updateCombinatorInLibrary: (id, updates) =>
    set((state) => {
      const updated = state.combinatorsLibrary.map((comb) =>
        comb.id === id ? { ...comb, ...updates } : comb
      );
      storage.saveCombinatorsLibrary(updated);
      return { combinatorsLibrary: updated };
    }),

  deleteCombinatorFromLibrary: (id) =>
    set((state) => {
      const updated = state.combinatorsLibrary.filter((comb) => comb.id !== id);
      storage.saveCombinatorsLibrary(updated);
      return { combinatorsLibrary: updated };
    }),

  // Kural (Rule) Yönetimi
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

  // İhlal (Violation) Yönetimi
  setViolations: (violations) => set({ violations }),
  clearViolations: () => set({ violations: [] }),

  // Drag & Drop
  setDraggingComponent: (componentId) =>
    set({ draggingComponent: componentId, dragPosition: null, dragPanelId: null }),
  setDragPosition: (position, panelId) =>
    set({ dragPosition: position, dragPanelId: panelId || null }),

  // Proje Yönetimi
  addProject: (project) =>
    set((state) => {
      const updated = [...state.projects, project];
      storage.saveProject(project);
      return { projects: updated };
    }),

  updateProject: (id, updates) =>
    set((state) => {
      const updated = state.projects.map((project) =>
        project.id === id ? { ...project, ...updates, updatedAt: Date.now() } : project
      );
      const updatedProject = updated.find((p) => p.id === id);
      if (updatedProject) {
        storage.saveProject(updatedProject);
      }
      return { projects: updated };
    }),

  deleteProject: (id) =>
    set((state) => {
      const updated = state.projects.filter((project) => project.id !== id);
      storage.deleteProject(id);
      return {
        projects: updated,
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      };
    }),

  setCurrentProject: (project) => set({ currentProject: project }),

  loadProjects: () =>
    set(() => {
      const savedProjects = storage.getAllProjects();
      return { projects: Object.values(savedProjects) };
    }),
}));