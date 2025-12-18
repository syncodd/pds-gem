'use client';

import { useState } from 'react';
import { Panel } from '@/types';
import { usePanelStore } from '@/lib/store';

interface ProjectPanelSelectorProps {
  onAdd: (panel: Panel) => void;
  onClose: () => void;
  existingPanels: Panel[];
}

export default function ProjectPanelSelector({ onAdd, onClose, existingPanels }: ProjectPanelSelectorProps) {
  const { panelsLibrary } = usePanelStore();
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  const handleAddPanel = () => {
    if (selectedPanelId) {
      const panel = panelsLibrary.find((p) => p.id === selectedPanelId);
      if (panel) {
        // Create a copy with a new ID to allow multiple instances
        const newPanel: Panel = {
          ...panel,
          id: `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `${panel.name} (${existingPanels.length + 1})`,
        };
        onAdd(newPanel);
        setSelectedPanelId(null);
        onClose();
      }
    }
  };

  const handleCreateNew = () => {
    const newPanel: Panel = {
      id: `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `New Panel ${existingPanels.length + 1}`,
      width: 600,
      height: 800,
      depth: 200,
    };
    onAdd(newPanel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white border-t border-gray-200 rounded-t-lg shadow-2xl w-full max-w-2xl max-h-[60vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Select Panel</h3>
          <button
            onClick={onClose}
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

        <div className="flex-1 overflow-y-auto p-4">
          {panelsLibrary.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No panels available</p>
              <p className="text-sm text-gray-400 mb-4">
                Create a panel in the Panel Editor first
              </p>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                Create New Panel
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {panelsLibrary.map((panel) => (
                <div
                  key={panel.id}
                  onClick={() => setSelectedPanelId(panel.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPanelId === panel.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm">{panel.name}</h3>
                    {selectedPanelId === panel.id && (
                      <svg
                        className="w-5 h-5 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mb-2">ID: {panel.id}</p>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p className="font-medium">
                      {panel.width} × {panel.height}mm
                    </p>
                    <p>Depth: {typeof panel.depth === 'number' ? panel.depth : 200}mm</p>
                    {panel.type && <p>Type: {panel.type}</p>}
                    {panel.category && <p>Category: {panel.category}</p>}
                  </div>
                  {panel.model2D && (
                    <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-green-600">
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
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>2D Model Available</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handleAddPanel}
            disabled={!selectedPanelId}
            className={`w-full px-4 py-2 rounded-md font-medium text-sm ${
              selectedPanelId
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Add Panel to Project
          </button>
          <button
            onClick={handleCreateNew}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium text-sm"
          >
            Create New Panel
          </button>
        </div>
      </div>
    </div>
  );
}
