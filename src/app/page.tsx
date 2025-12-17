'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ComponentLibrary from '@/components/ComponentLibrary';
import SlideOutProperties from '@/components/SlideOutProperties';
import DRCPanel from '@/components/RuleBook/DRCPanel';
import PanelSelectionPanel from '@/components/PanelSelectionPanel';
import TopRibbon from '@/components/TopRibbon';
import { usePanelStore } from '@/lib/store';
import { storage } from '@/lib/storage';
import { evaluateRules } from '@/lib/ruleEngine';

// Dynamically import PanelCanvas with SSR disabled since Konva is browser-only
const PanelCanvas = dynamic(() => import('@/components/PanelCanvas'), {
  ssr: false,
});

// Dynamically import Designer3DView with SSR disabled
const Designer3DView = dynamic(() => import('@/components/Designer3DView'), {
  ssr: false,
});

export default function Home() {
  const {
    setDesign,
    panels,
    components,
    componentLibrary,
    rules,
    setViolations,
    violations,
    panelsLibrary,
    selectedCanvasComponent,
  } = usePanelStore();
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [showProperties, setShowProperties] = useState(true); // Always start open
  const [showDRC, setShowDRC] = useState(false);
  const [showPanelSelection, setShowPanelSelection] = useState(false);

  // Load saved design on mount only
  useEffect(() => {
    const savedDesign = storage.loadCurrentDesign();
    if (savedDesign) {
      setDesign(savedDesign);
    } else {
      // Show panel selection if no panels in design
      setShowPanelSelection(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Evaluate rules and update violations (evaluate for all panels)
  useEffect(() => {
    if (rules.length > 0 && panels.length > 0) {
      // Evaluate rules for all panels
      const violations = evaluateRules(rules, panels, components, componentLibrary);
      setViolations(violations);
    } else {
      setViolations([]);
    }
  }, [rules, panels, components, componentLibrary, setViolations]);

  // Show properties when component is selected
  useEffect(() => {
    if (selectedCanvasComponent) {
      setShowProperties(true);
    }
  }, [selectedCanvasComponent]);

  const handleSave = () => {
    if (panels.length === 0) {
      alert('Please add at least one panel to the design');
      return;
    }
    storage.saveCurrentDesign({ panels, components, activePanelId: null, panelSpacing: 0 });
    alert('Design saved successfully!');
  };

  const handleExport = () => {
    const json = storage.exportDesign({ panels, components, activePanelId: null, panelSpacing: 0 });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${panel.name || 'panel'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Konva Panel Designer</h1>
              <p className="text-sm text-gray-500 mt-1">Electronic Panel Design Tool</p>
            </div>
            {panels.length > 0 && (
              <button
                onClick={() => setShowPanelSelection(true)}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 border border-blue-200"
              >
                Add Panel
              </button>
            )}
          </div>
          <nav className="flex items-center gap-4">
            <a
              href="/"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Designer
            </a>
            <a
              href="/rule-book"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Rule Book
            </a>
            <a
              href="/panel-editor"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Panel Editor
            </a>
            <a
              href="/component-editor"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Component Editor
            </a>
          </nav>
        </div>
      </header>

      {/* Top Ribbon */}
      <TopRibbon
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSave={handleSave}
        onExport={handleExport}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Component Library or Panel Selection */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-hidden">
          {showPanelSelection ? (
            <PanelSelectionPanel />
          ) : (
            <ComponentLibrary />
          )}
        </div>

        {/* Center Canvas */}
        <div className="flex-1 overflow-hidden bg-gray-100 relative">
          {/* Toggle Properties Button - Center Right (within canvas area) */}
          <button
            onClick={() => setShowProperties(!showProperties)}
            className={`absolute top-1/2 -translate-y-1/2 px-4 py-3 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-50 flex items-center gap-2 z-40 border border-gray-200 transition-all duration-300 ${
              showProperties ? 'right-[28rem]' : 'right-4'
            }`}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${showProperties ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={showProperties ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
            <span className="text-sm font-medium whitespace-nowrap">{showProperties ? 'Hide' : 'Show'} Properties</span>
          </button>

          {panels.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-lg">No panels in design</p>
                <p className="text-sm mt-2">Add a panel from the library to start designing</p>
              </div>
            </div>
          ) : (
            viewMode === '2d' ? <PanelCanvas /> : <Designer3DView />
          )}
        </div>

        {/* Toggle Panel Selection Button */}
        {panels.length > 0 && (
          <button
            onClick={() => setShowPanelSelection(!showPanelSelection)}
            className="fixed top-32 left-4 px-3 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-50 flex items-center gap-2 z-30 border border-gray-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            {showPanelSelection ? 'Components' : 'Panels'}
          </button>
        )}

        {/* DRC Button */}
        {violations.length > 0 && (
          <button
            onClick={() => setShowDRC(true)}
            className="fixed bottom-4 right-4 px-4 py-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 flex items-center gap-2 z-30"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            DRC Violations ({violations.length})
          </button>
        )}

        {/* Slide-out Properties - Always rendered, toggled by button */}
        <SlideOutProperties
          isOpen={showProperties}
          onClose={() => setShowProperties(false)}
        />

        {/* Slide-out DRC */}
        {showDRC && (
          <div className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none">
            <div className="pointer-events-auto w-96 h-full bg-white shadow-2xl flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">DRC Violations</h2>
                <button
                  onClick={() => setShowDRC(false)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
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

