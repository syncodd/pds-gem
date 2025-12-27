'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import ComponentLibrary from '@/components/ComponentLibrary';
import SlideOutProperties from '@/components/SlideOutProperties';
import DRCPanel from '@/components/RuleBook/DRCPanel';
import PanelSelectionPanel from '@/components/PanelSelectionPanel';
import TopRibbon from '@/components/TopRibbon';
import { usePanelStore } from '@/lib/store';
import { storage } from '@/lib/storage';
import { evaluateRules } from '@/lib/ruleEngine';

// Konva ve Three.js browser-only olduğu için SSR'ı kapatıyoruz
const PanelCanvas = dynamic(() => import('@/components/PanelCanvas'), {
  ssr: false,
});

const Designer3DView = dynamic(() => import('@/components/Designer3DView'), {
  ssr: false,
});

export default function Home() {
  // --- 1. Hydration Hatası Çözümü (Sayfa Yüklenme Kontrolü) ---
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // --- 2. Store Verileri ---
  const {
    setDesign,
    panels,
    components,
    componentLibrary,
    combinatorsLibrary, 
    rules,
    setViolations,
    violations,
    activePanelId, 
    panelSpacing,
    selectedCanvasComponent,
  } = usePanelStore();

  // --- 3. Yerel State'ler ---
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [showProperties, setShowProperties] = useState(true);
  const [showDRC, setShowDRC] = useState(false);
  const [showPanelSelection, setShowPanelSelection] = useState(false);

  // Dosya Yükleme Referansı
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 4. Effectler (Başlangıç Yüklemeleri) ---
  
  // LocalStorage'dan tasarımı çek
  useEffect(() => {
    const savedDesign = storage.loadCurrentDesign();
    if (savedDesign) {
      setDesign(savedDesign);
    } else {
      setShowPanelSelection(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Kural Motorunu Çalıştır
  useEffect(() => {
    if (rules.length > 0 && panels.length > 0) {
      const violations = evaluateRules(rules, panels, components, componentLibrary, combinatorsLibrary);
      setViolations(violations);
    } else {
      setViolations([]);
    }
  }, [rules, panels, components, componentLibrary, combinatorsLibrary, setViolations]);

  // Seçim yapınca özellikleri aç
  useEffect(() => {
    if (selectedCanvasComponent) {
      setShowProperties(true);
    }
  }, [selectedCanvasComponent]);

  // --- 5. Aksiyonlar (Handler Functions) ---

  const handleSave = () => {
    if (panels.length === 0) {
      alert('Kaydedilecek bir pano tasarımı yok.');
      return; // Sadece çıkış yap, HTML döndürme!
    }

    // Store'daki verileri kaydet
    storage.saveCurrentDesign({ 
      panels, 
      components, 
      activePanelId, 
      panelSpacing 
    });
    alert('Tasarım başarıyla tarayıcıya kaydedildi!');
  };

  const handleExport = () => {
    if (panels.length === 0) {
      alert("Çıktı almak için en az bir pano eklemelisiniz.");
      return;
    }

    const choice = confirm("Tamam: Excel Malzeme Listesi (BOM)\nİptal: Proje Yedek Dosyası (JSON)");

    if (choice) {
      storage.exportAsBOM(components, componentLibrary, panels);
    } else {
      const design = { panels, components, activePanelId, panelSpacing };
      storage.downloadJson(design);
    }
  };

  // Dosya Yükleme İşlemi
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const loadedDesign = await storage.importFromJSON(file);
      setDesign(loadedDesign);
      alert("Proje başarıyla yüklendi!");
    } catch (error) {
      console.error(error);
      alert("Dosya yüklenirken hata oluştu veya format geçersiz.");
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // --- 6. Render Öncesi Kontrol ---
  // Sayfa tarayıcıda tam yüklenmediyse içeriği gösterme (Hydration hatasını engeller)
  if (!isMounted) {
    return null;
  }

  // --- 7. Ana Render (Görünüm) ---
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      
      {/* GİZLİ INPUT */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Yavuz Pano Designer</h1>
              <p className="text-sm text-gray-500 mt-1">Endüstriyel Pano Tasarım Aracı</p>
            </div>
            
            <div className="flex gap-2">
              {panels.length > 0 && (
                <button
                  onClick={() => setShowPanelSelection(true)}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 border border-blue-200"
                >
                  + Pano Ekle
                </button>
              )}
              
              <button
                onClick={handleImportClick}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300 flex items-center gap-1"
              >
                <span>📂</span> Proje Aç
              </button>
            </div>
          </div>
          
          <nav className="flex items-center gap-4">
            <a href="/" className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Designer</a>
            <a href="/rule-book" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Rule Book</a>
            <a href="/panel-editor" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Panel Editor</a>
            <a href="/component-editor" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Part Editor</a>
          </nav>
        </div>
      </header>

      {/* TOP RIBBON */}
      <TopRibbon
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSave={handleSave}
        onExport={handleExport}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT SIDEBAR */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-hidden">
          {showPanelSelection ? (
            <PanelSelectionPanel />
          ) : (
            <ComponentLibrary />
          )}
        </div>

        {/* CENTER CANVAS */}
        <div className="flex-1 overflow-hidden bg-gray-100 relative">
          
          {/* Properties Toggle Button */}
          <button
            onClick={() => setShowProperties(!showProperties)}
            className={`absolute top-1/2 -translate-y-1/2 px-4 py-3 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-50 flex items-center gap-2 z-40 border border-gray-200 transition-all duration-300 ${
              showProperties ? 'right-[28rem]' : 'right-4'
            }`}
          >
             <span className="text-sm font-medium whitespace-nowrap">{showProperties ? 'Gizle' : 'Özellikler'}</span>
          </button>

          {panels.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-lg">Tasarımda pano yok</p>
                <p className="text-sm mt-2">Kütüphaneden veya "Pano Ekle" butonundan başlayın.</p>
              </div>
            </div>
          ) : (
            viewMode === '2d' ? <PanelCanvas /> : <Designer3DView />
          )}
        </div>

        {/* Panel/Component Toggle Button */}
        {panels.length > 0 && (
          <button
            onClick={() => setShowPanelSelection(!showPanelSelection)}
            className="fixed top-32 left-4 px-3 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-50 flex items-center gap-2 z-30 border border-gray-200"
          >
            {showPanelSelection ? 'Malzemeler' : 'Panolar'}
          </button>
        )}

        {/* DRC Button */}
        {violations.length > 0 && (
          <button
            onClick={() => setShowDRC(true)}
            className="fixed bottom-4 right-4 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 flex items-center gap-2 z-30"
          >
            Hatalar ({violations.length})
          </button>
        )}

        {/* RIGHT SIDEBAR (PROPERTIES) */}
        <SlideOutProperties
          isOpen={showProperties}
          onClose={() => setShowProperties(false)}
        />

        {/* RIGHT SIDEBAR (DRC) */}
        {showDRC && (
          <div className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none">
            <div className="pointer-events-auto w-96 h-full bg-white shadow-2xl flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">DRC Hataları</h2>
                <button onClick={() => setShowDRC(false)} className="p-1 hover:bg-gray-100 rounded-md">
                   X
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <DRCPanel />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}