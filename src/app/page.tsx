'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ComponentLibrary from '@/components/ComponentLibrary';
import PanelProperties from '@/components/PanelProperties';
import DRCPanel from '@/components/RuleBook/DRCPanel';
import PanelSelector from '@/components/PanelSelector';
import { usePanelStore } from '@/lib/store';
import { storage } from '@/lib/storage';
import { evaluateRules } from '@/lib/ruleEngine';

// Dynamically import PanelCanvas with SSR disabled since Konva is browser-only
const PanelCanvas = dynamic(() => import('@/components/PanelCanvas'), {
  ssr: false,
});

export default function Home() {
  const {
    setDesign,
    panel,
    components,
    componentLibrary,
    rules,
    setViolations,
    violations,
    panelsLibrary,
  } = usePanelStore();
  const [activeTab, setActiveTab] = useState<'properties' | 'drc'>('properties');
  const [showPanelSelector, setShowPanelSelector] = useState(false);
  const [panelSelected, setPanelSelected] = useState(false);

  // Load saved design on mount
  useEffect(() => {
    const savedDesign = storage.loadCurrentDesign();
    if (savedDesign) {
      setDesign(savedDesign);
      setPanelSelected(true);
    } else if (panelsLibrary.length > 0) {
      // Show selector if no saved design and panels exist
      setShowPanelSelector(true);
    } else {
      // If no panels, allow using default panel
      setPanelSelected(true);
    }
  }, [setDesign, panelsLibrary.length]);

  // Evaluate rules and update violations
  useEffect(() => {
    if (rules.length > 0) {
      const violations = evaluateRules(rules, panel, components, componentLibrary);
      setViolations(violations);
    } else {
      setViolations([]);
    }
  }, [rules, panel, components, componentLibrary, setViolations]);

  const handlePanelSelect = () => {
    setShowPanelSelector(false);
    setPanelSelected(true);
  };

  const handleChangePanel = () => {
    setShowPanelSelector(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {showPanelSelector && (
        <PanelSelector
          onSelect={handlePanelSelect}
          onCancel={() => {
            setShowPanelSelector(false);
            setPanelSelected(true);
          }}
        />
      )}
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Konva Panel Designer</h1>
              <p className="text-sm text-gray-500 mt-1">Electronic Panel Design Tool</p>
            </div>
            {panelSelected && (
              <button
                onClick={handleChangePanel}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 border border-blue-200"
              >
                Change Panel
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

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Component Library */}
        <div className="w-80 border-r border-gray-200 bg-white overflow-hidden">
          <ComponentLibrary />
        </div>

        {/* Center Canvas */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <PanelCanvas />
        </div>

        {/* Right Sidebar - Panel Properties & DRC */}
        <div className="w-80 border-l border-gray-200 bg-white overflow-hidden flex flex-col">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('properties')}
              className={`flex-1 px-4 py-2 text-sm font-medium hover:bg-gray-50 ${
                activeTab === 'properties'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-700'
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab('drc')}
              className={`flex-1 px-4 py-2 text-sm font-medium hover:bg-gray-50 relative ${
                activeTab === 'drc'
                  ? 'text-blue-600 border-b-2 border-blue-500'
                  : 'text-gray-700'
              }`}
            >
              DRC
              {violations.length > 0 && (
                <span className="absolute top-1 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {violations.length}
                </span>
              )}
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            {activeTab === 'properties' ? <PanelProperties /> : <DRCPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

