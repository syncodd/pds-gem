import * as XLSX from 'xlsx-js-style'; // Stil destekli kütüphane
import { Project, Panel, CanvasComponent, Component, Combinator } from '@/types';

// --- YARDIMCI FORMAT FONKSİYONLARI ---
const formatMM = (val?: number) => val ? Math.round(val) : 0;
const formatMeter = (val?: number) => val ? parseFloat((val / 1000).toFixed(2)) : "0.00";
const formatPrice = (val?: number) => val ? val.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) : "0.00";

// --- STİL TANIMLARI ---
const styles = {
  header: {
    fill: { fgColor: { rgb: "2F5597" } }, // Koyu Mavi
    font: { color: { rgb: "FFFFFF" }, bold: true, sz: 12 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  },
  cell: {
    font: { sz: 11 },
    alignment: { vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "CCCCCC" } },
      bottom: { style: "thin", color: { rgb: "CCCCCC" } },
      left: { style: "thin", color: { rgb: "CCCCCC" } },
      right: { style: "thin", color: { rgb: "CCCCCC" } }
    }
  },
  cellCenter: {
    font: { sz: 11 },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "CCCCCC" } },
      bottom: { style: "thin", color: { rgb: "CCCCCC" } },
      left: { style: "thin", color: { rgb: "CCCCCC" } },
      right: { style: "thin", color: { rgb: "CCCCCC" } }
    }
  },
  title: {
    font: { bold: true, sz: 16, color: { rgb: "2F5597" } },
    alignment: { horizontal: "left" }
  }
};

export const exportToExcel = (
  project: Project | null,
  panelsArg: Panel[] | null,
  componentsArg: CanvasComponent[] | null,
  componentLibrary: Component[],
  combinatorsLibrary: Combinator[] = []
) => {
  const panels = project?.panels || panelsArg || [];
  const components = project?.components || componentsArg || [];
  const projectName = project?.name || 'Adsız Proje';
  const customerName = project?.customer || 'Belirtilmemiş';
  const projectDate = project ? new Date(project.createdAt).toLocaleDateString('tr-TR') : '-';

  if (components.length === 0 && panels.length === 0) {
    alert("Dışa aktarılacak veri bulunamadı.");
    return;
  }

  const workbook = XLSX.utils.book_new();

  // ==========================================
  // 1. SAYFA: MALZEME LİSTESİ (BOM)
  // ==========================================
  
  // Başlık Satırı
  const bomHeaders = [
    "Durum", "Stok Kodu", "Parça Adı", "Kategori", 
    "Bulunduğu Pano", "Boyutlar (mm)", "Adet", "Birim Fiyat", "Para Birimi", "Toplam Tutar"
  ];

  // Helper function to check if a CanvasComponent is a combinator
  const isCombinator = (cc: CanvasComponent): boolean => {
    return cc.properties?.isCombinator === true || combinatorsLibrary.some(c => c.id === cc.componentId);
  };

  // Build BOM rows with hierarchy (combinators with nested components)
  const bomRows: any[] = [];
  
  components.forEach((cc) => {
    // Skip gap components - they are not materials
    if (cc.componentId === 'gap') {
      return;
    }
    
    const parentPanel = panels.find((p) => p.id === cc.panelId);
    const combinatorDef = combinatorsLibrary.find((c) => c.id === cc.componentId);
    const isCombinatorItem = isCombinator(cc);
    
    if (isCombinatorItem && combinatorDef) {
      // Add combinator row
      const combDims = `${formatMM(combinatorDef.width)}x${formatMM(combinatorDef.height)}${combinatorDef.depth ? `x${formatMM(combinatorDef.depth)}` : ''}`;
      bomRows.push([
        "OK",
        combinatorDef.id, // Stok Kodu
        combinatorDef.name, // Parça Adı (Combinator name)
        "Kombinatör", // Kategori
        parentPanel ? parentPanel.name : "Genel", // Bulunduğu Pano
        combDims, // Boyutlar
        1, // Adet
        "-", // Birim Fiyat (combinators don't have price)
        "-", // Para Birimi
        "-" // Toplam Tutar
      ]);
      
      // Add nested components inside combinator (indented)
      combinatorDef.componentIds.forEach((compId) => {
        const nestedCompDef = componentLibrary.find((c) => c.id === compId);
        if (nestedCompDef) {
          const nestedDims = `${formatMM(nestedCompDef.width)}x${formatMM(nestedCompDef.height)}${nestedCompDef.depth ? `x${formatMM(nestedCompDef.depth)}` : ''}`;
          bomRows.push([
            "OK",
            nestedCompDef.sku || nestedCompDef.id,
            `  └─ ${nestedCompDef.name}`, // Indented with tree character
            nestedCompDef.category,
            parentPanel ? parentPanel.name : "Genel",
            nestedDims,
            1, // Adet
            nestedCompDef.price || 0,
            nestedCompDef.currency || "TRY",
            nestedCompDef.price || 0
          ]);
        } else {
          // Component not found in library
          bomRows.push([
            "TANIMSIZ",
            compId,
            `  └─ Bilinmeyen Parça`,
            "-",
            parentPanel ? parentPanel.name : "Genel",
            "-",
            1,
            0,
            "-",
            0
          ]);
        }
      });
    } else {
      // Regular component (not a combinator)
      const def = componentLibrary.find((c) => c.id === cc.componentId);
      
      if (!def) {
        bomRows.push([
          "TANIMSIZ",
          cc.componentId,
          "Bilinmeyen Parça",
          "-",
          parentPanel?.name || "-",
          "-",
          1,
          0,
          "-",
          0
        ]);
      } else {
        const dims = `${formatMM(def.width)}x${formatMM(def.height)}${def.depth ? `x${formatMM(def.depth)}` : ''}`;
        bomRows.push([
          "OK",
          def.sku || def.id,
          def.name,
          def.category,
          parentPanel ? parentPanel.name : "Genel",
          dims,
          1, // Adet
          def.price || 0,
          def.currency || "TRY",
          def.price || 0 // Toplam Tutar
        ]);
      }
    }
  });

  // Sayfayı Oluştur (Başlık + Veri)
  const wsBOM = XLSX.utils.aoa_to_sheet([
    [`PROJE: ${projectName} - MALZEME LİSTESİ`], // A1: Başlık
    [`Müşteri: ${customerName} | Tarih: ${projectDate}`], // A2: Alt Başlık
    [], // A3: Boşluk
    bomHeaders, // A4: Tablo Başlıkları
    ...bomRows // A5+: Veriler
  ]);

  // --- STİL UYGULAMA ---
  const range = XLSX.utils.decode_range(wsBOM['!ref'] || "A1:A1");
  
  // Sütun Genişlikleri
  wsBOM['!cols'] = [
    { wch: 10 }, { wch: 20 }, { wch: 35 }, { wch: 20 },
    { wch: 20 }, { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 12 }
  ];

  // Hücreleri Gez ve Stil Ata
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!wsBOM[cell_address]) continue;

      // 1. Proje Başlığı (A1)
      if (R === 0 && C === 0) {
        wsBOM[cell_address].s = styles.title;
        continue;
      }
      // 2. Alt Başlık (A2)
      if (R === 1 && C === 0) {
        wsBOM[cell_address].s = { font: { italic: true, color: { rgb: "666666" } } };
        continue;
      }
      // 3. Tablo Başlıkları (4. Satır -> index 3)
      if (R === 3) {
        wsBOM[cell_address].s = styles.header;
      }
      // 4. Veri Satırları (5. Satır ve sonrası)
      else if (R > 3) {
        // Adet, Fiyat gibi sayısal sütunları ortala, metinleri sola yasla
        const isNumberCol = [6, 7, 9].includes(C); // Adet, Fiyat, Tutar sütunları
        const cellValue = wsBOM[cell_address].v;
        const isIndented = typeof cellValue === 'string' && cellValue.startsWith('  └─');
        
        // Style for indented (nested) components
        if (isIndented && C === 2) { // Parça Adı column
          wsBOM[cell_address].s = {
            ...styles.cell,
            font: { ...styles.cell.font, italic: true, color: { rgb: "666666" } }
          };
        } else {
          wsBOM[cell_address].s = isNumberCol ? styles.cellCenter : styles.cell;
        }
        
        // Fiyat formatlama (Görünüm)
        if (isNumberCol && typeof wsBOM[cell_address].v === 'number') {
           wsBOM[cell_address].z = '#,##0.00';
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, wsBOM, "Malzeme Listesi");


  // ==========================================
  // 2. SAYFA: PANO ÖZETİ
  // ==========================================
  const summaryHeaders = ["Pano Adı", "Genişlik (mm)", "Yükseklik (m)", "Derinlik (mm)", "Kombinatörler"];
  
  // Build summary rows with panels and their combinators
  const summaryRows: any[] = [];
  
  panels.forEach(p => {
    // Add panel row
    const panelComponents = components.filter(c => c.panelId === p.id);
    const panelCombinators = panelComponents.filter(cc => isCombinator(cc));
    
    summaryRows.push([
      p.name,
      formatMM(p.width),
      formatMeter(p.height), // Metre cinsinden
      formatMM(p.depth),
      panelCombinators.length > 0 ? panelCombinators.length : "-"
    ]);
    
    // Add combinator rows under panel (indented)
    panelCombinators.forEach(cc => {
      const combinatorDef = combinatorsLibrary.find((c) => c.id === cc.componentId);
      if (combinatorDef) {
        summaryRows.push([
          `  └─ ${combinatorDef.name}`, // Indented combinator name
          formatMM(combinatorDef.width),
          formatMeter(combinatorDef.height),
          formatMM(combinatorDef.depth),
          `${combinatorDef.componentIds.length} parça` // Number of components inside
        ]);
      }
    });
  });

  const wsSummary = XLSX.utils.aoa_to_sheet([
    [`PROJE ÖZETİ & PANO ÖLÇÜLERİ`],
    [],
    summaryHeaders,
    ...summaryRows
  ]);

  // Özet Sayfası Stilleri
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  const rangeSum = XLSX.utils.decode_range(wsSummary['!ref'] || "A1:A1");

  for (let R = rangeSum.s.r; R <= rangeSum.e.r; ++R) {
    for (let C = rangeSum.s.c; C <= rangeSum.e.c; ++C) {
      const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
      if (!wsSummary[cell_address]) continue;

      if (R === 0) wsSummary[cell_address].s = styles.title;
      else if (R === 2) wsSummary[cell_address].s = styles.header;
      else if (R > 2) {
        const cellValue = wsSummary[cell_address].v;
        const isIndented = typeof cellValue === 'string' && cellValue.startsWith('  └─');
        
        // Style for indented (combinator) rows
        if (isIndented && C === 0) { // Pano Adı column
          wsSummary[cell_address].s = {
            ...styles.cellCenter,
            font: { ...styles.cellCenter.font, italic: true, color: { rgb: "666666" } }
          };
        } else {
          wsSummary[cell_address].s = styles.cellCenter;
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, wsSummary, "Proje Özeti");

  // DOSYAYI KAYDET
  const safeName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${safeName}_BOM_${dateStr}.xlsx`);
};

