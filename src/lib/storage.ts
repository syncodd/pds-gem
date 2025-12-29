import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { 
  Panel, 
  Component, 
  Combinator, 
  Rule, 
  Project, 
  MultiPanelDesign,
  CanvasComponent 
} from '@/types'; 

// LocalStorage Anahtarları
const KEYS = {
  RULES: 'yavuzpano_rules',
  PANELS_LIB: 'yavuzpano_panels_lib',
  COMPONENTS_LIB: 'yavuzpano_components_lib',
  COMBINATORS_LIB: 'yavuzpano_combinators_lib',
  PROJECTS: 'yavuzpano_projects',
  CURRENT_DESIGN: 'yavuzpano_current_design'
};

export const storage = {
  
  // --- RULES (Kurallar) ---
  loadRules: (): Rule[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.RULES);
    return data ? JSON.parse(data) : [];
  },
  saveRules: (rules: Rule[]) => {
    localStorage.setItem(KEYS.RULES, JSON.stringify(rules));
  },

  // --- COMPONENT LIBRARY (Malzeme Kütüphanesi) ---
  loadComponentsLibrary: (): Component[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.COMPONENTS_LIB);
    return data ? JSON.parse(data) : [];
  },
  saveComponentsLibrary: (library: Component[]) => {
    localStorage.setItem(KEYS.COMPONENTS_LIB, JSON.stringify(library));
  },

  // --- PANEL LIBRARY (Pano Kütüphanesi) ---
  loadPanelsLibrary: (): Panel[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.PANELS_LIB);
    return data ? JSON.parse(data) : [];
  },
  savePanelsLibrary: (library: Panel[]) => {
    localStorage.setItem(KEYS.PANELS_LIB, JSON.stringify(library));
  },

  // --- COMBINATORS LIBRARY ---
  loadCombinatorsLibrary: (): Combinator[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.COMBINATORS_LIB);
    return data ? JSON.parse(data) : [];
  },
  saveCombinatorsLibrary: (library: Combinator[]) => {
    localStorage.setItem(KEYS.COMBINATORS_LIB, JSON.stringify(library));
  },

  // --- PROJECTS (Projeler) ---
  getAllProjects: (): Record<string, Project> => {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(KEYS.PROJECTS);
    return data ? JSON.parse(data) : {};
  },
  
  // 🔥 EKLENEN KISIM: HATA ÇÖZÜMÜ İÇİN ALIAS 🔥
  // Eski kodlar "getAllDesigns" arıyor olabilir, onları "Projects"e yönlendiriyoruz.
  getAllDesigns: (): Project[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.PROJECTS);
    const projectsMap = data ? JSON.parse(data) : {};
    return Object.values(projectsMap);
  },
  // ------------------------------------------------

  saveProject: (project: Project) => {
    const projects = storage.getAllProjects();
    projects[project.id] = project;
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
  },
  deleteProject: (id: string) => {
    const projects = storage.getAllProjects();
    delete projects[id];
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
  },

  // --- CURRENT DESIGN (Anlık Tasarım - Save/Load) ---
  saveCurrentDesign: (design: MultiPanelDesign) => {
    localStorage.setItem(KEYS.CURRENT_DESIGN, JSON.stringify(design));
  },
  loadCurrentDesign: (): MultiPanelDesign | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(KEYS.CURRENT_DESIGN);
    return data ? JSON.parse(data) : null;
  },

  // --- EXPORT: JSON (Yedekleme) ---
  exportDesign: (design: MultiPanelDesign): string => {
    return JSON.stringify(design, null, 2);
  },
  
  downloadJson: (design: MultiPanelDesign, filename: string = 'yavuz-pano-design.json') => {
    const jsonStr = storage.exportDesign(design);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    saveAs(blob, filename);
  },

  // --- IMPORT: JSON ---
  importFromJSON: (file: File): Promise<MultiPanelDesign> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          const data = JSON.parse(result);
          if (data.panels && Array.isArray(data.panels)) {
             resolve(data as MultiPanelDesign);
          } else {
             reject(new Error("Geçersiz proje dosyası"));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  // --- EXPORT: EXCEL BOM (Malzeme Listesi) ---
  exportAsBOM: (
    canvasComponents: CanvasComponent[], 
    library: Component[], 
    panels: Panel[]
  ) => {
    const bomMap = new Map();

    // 1. Panoları Listeye Ekle
    panels.forEach(p => {
      const key = `PANEL-${p.id}`; 
      if (!bomMap.has(key)) {
        bomMap.set(key, {
          'Kategori': 'Pano Karkas',
          'Parça Adı': p.name,
          'Kod (SKU)': 'PNL-STD', 
          'Adet': 0,
          'Birim Fiyat': 0, 
          'Toplam': 0
        });
      }
      const item = bomMap.get(key);
      item['Adet'] += 1;
    });

    // 2. İç Malzemeleri Listeye Ekle
    canvasComponents.forEach(cc => {
      const definition = library.find(libItem => libItem.id === cc.componentId);
      
      if (definition) {
        const key = definition.id; 
        if (!bomMap.has(key)) {
          bomMap.set(key, {
            'Kategori': definition.type || 'Genel',
            'Parça Adı': definition.name,
            'Kod (SKU)': definition.metadata?.sku || 'N/A', 
            'Adet': 0,
            'Birim Fiyat': definition.metadata?.price || 0,
            'Toplam': 0
          });
        }
        const item = bomMap.get(key);
        item['Adet'] += 1;
        item['Toplam'] = item['Adet'] * item['Birim Fiyat'];
      }
    });

    const data = Array.from(bomMap.values());
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Malzeme Listesi");
    
    worksheet['!cols'] = [{wch:15}, {wch:30}, {wch:15}, {wch:10}, {wch:15}, {wch:15}];

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Pano-Maliyet-${new Date().toISOString().slice(0,10)}.xlsx`);
  }
};