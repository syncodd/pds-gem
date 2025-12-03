'use client';

import { useState, useEffect } from 'react';
import { Panel } from '@/types';
import { usePanelStore } from '@/lib/store';

interface PanelSelectorProps {
  onSelect: (panel: Panel) => void;
  onCancel?: () => void;
}

export default function PanelSelector({ onSelect, onCancel }: PanelSelectorProps) {
  const { panelsLibrary, setPanel } = usePanelStore();
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);

  const handleSelect = () => {
    if (selectedPanelId) {
      const panel = panelsLibrary.find((p) => p.id === selectedPanelId);
      if (panel) {
        setPanel(panel);
        onSelect(panel);
      }
    }
  };

  const handleCreateNew = () => {
    const newPanel: Panel = {
      id: `panel-${Date.now()}`,
      name: 'New Panel',
      width: 600,
      height: 800,
      depth: 200,
    };
    setPanel(newPanel);
    onSelect(newPanel);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Select a Panel</h2>
          <p className="text-sm text-gray-500 mt-1">Choose a panel to start designing</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {panelsLibrary.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No panels available</p>
              <p className="text-sm text-gray-400">Create a panel in the Panel Editor first</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <h3 className="font-semibold text-gray-800">{panel.name}</h3>
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
                    <p>
                      {panel.width} × {panel.height}mm
                    </p>
                    <p>Depth: {panel.depth ?? 200}mm</p>
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

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={handleSelect}
            disabled={!selectedPanelId}
            className={`flex-1 px-4 py-2 rounded-md font-medium ${
              selectedPanelId
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Select Panel
          </button>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
          >
            Create New
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

