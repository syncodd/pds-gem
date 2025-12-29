import * as XLSX from 'xlsx';
import { Project, Panel, CanvasComponent, Component } from '@/types';

/**
 * Proje verilerini (Paneller ve Bileşenler) Excel formatında dışa aktarır.
 * Hem Editör içinden hem de Proje Listesinden çağrılabilir.
 */
export const exportToExcel = (
  project: Project | null, // Proje nesnesi (Project List'ten geliyorsa doludur)
  panelsArg: Panel[] | null, // Editörden geliyorsa manuel paneller
  componentsArg: CanvasComponent[] | null, // Editörden geliyorsa manuel bileşenler
  componentLibrary: Component[] // Kütüphane (Fiyat ve isim bilgisi için şart)
) => {
  // Veri Kaynağını Belirle (Single Source of Truth)
  // Eğer proje nesnesi varsa veriyi oradan al, yoksa argümanlardan al.
  const panels = project?.panels || panelsArg || [];
  const components = project?.components || componentsArg || [];
  const projectName = project?.name || 'Adsız_Proje';

  console.log(`Export İşlemi Başlatıldı: ${projectName}`, {
    PanelSayisi: panels.length,
    BilesenSayisi: components.length,
    KutuphaneBoyutu: componentLibrary.length
  });

  if (components.length === 0 && panels.length === 0) {
    alert("Dışa aktarılacak veri bulunamadı.");
    return;
  }

  const workbook = XLSX.utils.book_new();

  // --- SAYFA 1: Malzeme Listesi (BOM) ---
  const bomData = components.map((cc) => {
    // 1. Parçanın kütüphanedeki tanımını bul (Fiyat, İsim vb.)
    const def = componentLibrary.find((c) => c.id === cc.componentId);
    
    // 2. Parçanın hangi panoya ait olduğunu bul
    const parentPanel = panels.find((p) => p.id === cc.panelId);

    if (!def) {
      // Eğer kütüphanede karşılığı yoksa (Hata durumu)
      return {
        'Durum': 'TANIMSIZ',
        'Stok Kodu': cc.componentId,
        'Parça Adı': 'Bilinmeyen Parça',
        'Kategori': '-',
        'Bulunduğu Pano': parentPanel?.name || 'Atanmamış',
        'Adet': 1,
        'Birim Fiyat': 0,
        'Para Birimi': '-',
        'Tutar': 0
      };
    }

    // Başarılı Veri Satırı
    return {
      'Durum': 'OK',
      'Stok Kodu': def.sku || def.id,
      'Parça Adı': def.name,
      'Kategori': def.category,
      'Bulunduğu Pano': parentPanel?.name || 'Genel',
      'Boyutlar': `${def.width}x${def.height}${def.depth ? `x${def.depth}` : ''}mm`,
      'Adet': 1,
      'Birim Fiyat': def.price || 0,
      'Para Birimi': def.currency || 'TRY',
      'Tutar': def.price || 0
    };
  });

  // Liste boşsa kullanıcıya boş bir satır göster
  const wsBOM = XLSX.utils.json_to_sheet(
    bomData.length > 0 ? bomData : [{ Bilgi: "Bu projede henüz yerleştirilmiş parça yok." }]
  );

  // Sütun genişliklerini ayarla (Estetik görünüm için)
  wsBOM['!cols'] = [
    { wch: 8 },  // Durum
    { wch: 15 }, // Stok Kodu
    { wch: 30 }, // Parça Adı
    { wch: 15 }, // Kategori
    { wch: 20 }, // Pano
    { wch: 15 }, // Boyutlar
    { wch: 8 },  // Adet
    { wch: 10 }, // Fiyat
    { wch: 8 },  // PB
    { wch: 10 }  // Tutar
  ];

  XLSX.utils.book_append_sheet(workbook, wsBOM, "Malzeme Listesi");

  // --- SAYFA 2: Pano ve Proje Özeti ---
  const summaryData = panels.map(p => ({
    'Pano Adı': p.name,
    'Genişlik (mm)': p.width,
    'Yükseklik (mm)': p.height,
    'Derinlik (mm)': p.depth,
    'İçindeki Parça Sayısı': components.filter(c => c.panelId === p.id).length
  }));

  // Proje üst bilgilerini de ekleyelim
  const projectInfo = [
    { 'Pano Adı': '--- PROJE BİLGİLERİ ---' },
    { 'Pano Adı': 'Müşteri:', 'Genişlik (mm)': project?.customer || '-' },
    { 'Pano Adı': 'Oluşturma:', 'Genişlik (mm)': project ? new Date(project.createdAt).toLocaleDateString('tr-TR') : '-' },
    { 'Pano Adı': '', 'Genişlik (mm)': '' } // Boş satır
  ];

  // Tabloları birleştir
  const finalSummary = [...projectInfo, ...summaryData];

  const wsSummary = XLSX.utils.json_to_sheet(finalSummary);
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(workbook, wsSummary, "Proje Özeti");

  // Dosyayı İndir
  const safeName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${safeName}_BOM_${dateStr}.xlsx`);
};