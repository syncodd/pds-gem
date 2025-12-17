'use client';

import { useState } from 'react';
import { Panel } from '@/types';
import { usePanelStore } from '@/lib/store';
import PanelList from '@/components/PanelEditor/PanelList';
import PanelCreationFlow from '@/components/PanelEditor/PanelCreationFlow';
import PanelPreview from '@/components/PanelEditor/PanelPreview';

export default function PanelEditorPage() {
  const { panelsLibrary, addPanelToLibrary, updatePanelInLibrary, deletePanelFromLibrary } =
    usePanelStore();
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  const [showFlow, setShowFlow] = useState(false);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);

  const handleSave = (panel: Panel) => {
    if (panelsLibrary.find((p) => p.id === panel.id)) {
      updatePanelInLibrary(panel.id, panel);
    } else {
      addPanelToLibrary(panel);
    }
    setSelectedPanel(null);
    setEditingPanel(null);
    setShowFlow(false);
  };

  const handleSelect = (panel: Panel) => {
    setSelectedPanel(panel);
    setEditingPanel({ ...panel });
    setShowFlow(false); // Don't show flow when editing
  };

  const handleNew = () => {
    setSelectedPanel(null);
    setEditingPanel(null);
    setShowFlow(true); // Show flow only for new panels
  };

  const handleCloseFlow = () => {
    setShowFlow(false);
    setSelectedPanel(null);
    setEditingPanel(null);
  };

  const handleUpdate = (updates: Partial<Panel>) => {
    if (editingPanel) {
      setEditingPanel({ ...editingPanel, ...updates });
    }
  };

  const handleSavePreview = () => {
    if (editingPanel) {
      handleSave(editingPanel);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Panel Editor</h1>
              <p className="text-sm text-gray-500 mt-1">Manage panel library</p>
            </div>
            {!showFlow && (
              <button
                onClick={handleNew}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                + New Panel
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
              className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-500"
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

      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 border-r border-gray-200 bg-white">
          <PanelList
            panels={panelsLibrary}
            onSelect={handleSelect}
            onDelete={deletePanelFromLibrary}
          />
        </div>
        <div className="flex-1 bg-gray-50">
          {editingPanel && !showFlow ? (
            <PanelPreview
              panel={editingPanel}
              onUpdate={handleUpdate}
              onSave={handleSavePreview}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-lg">Select a panel to edit</p>
                <p className="text-sm mt-2">or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel Creation Flow Modal - Only for new panels */}
      <PanelCreationFlow
        panel={null}
        isOpen={showFlow}
        onSave={handleSave}
        onClose={handleCloseFlow}
      />
    </div>
  );
}

