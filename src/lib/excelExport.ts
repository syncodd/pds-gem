import * as XLSX from 'xlsx-js-style'; // Stil destekli kütüphane
import { Project, Panel, CanvasComponent, Component } from '@/types';

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
  componentLibrary: Component[]
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

  // Veri Satırları
  const bomRows = components.map((cc) => {
    const def = componentLibrary.find((c) => c.id === cc.componentId);
    const parentPanel = panels.find((p) => p.id === cc.panelId);

    if (!def) {
      return ["TANIMSIZ", cc.componentId, "Bilinmeyen Parça", "-", parentPanel?.name || "-", "1", "0", "-", "0"];
    }

    const dims = `${formatMM(def.width)}x${formatMM(def.height)}${def.depth ? `x${formatMM(def.depth)}` : ''}`;
    
    return [
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
    ];
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
        wsBOM[cell_address].s = isNumberCol ? styles.cellCenter : styles.cell;
        
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
  const summaryHeaders = ["Pano Adı", "Genişlik (mm)", "Yükseklik (m)", "Derinlik (mm)", "Parça Sayısı"];
  
  const summaryRows = panels.map(p => [
    p.name,
    formatMM(p.width),
    formatMeter(p.height), // Metre cinsinden
    formatMM(p.depth),
    components.filter(c => c.panelId === p.id).length
  ]);

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
      else if (R > 2) wsSummary[cell_address].s = styles.cellCenter;
    }
  }

  XLSX.utils.book_append_sheet(workbook, wsSummary, "Proje Özeti");

  // DOSYAYI KAYDET
  const safeName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${safeName}_BOM_${dateStr}.xlsx`);
};