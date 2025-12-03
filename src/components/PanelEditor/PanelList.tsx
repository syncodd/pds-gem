'use client';

import { Panel } from '@/types';

interface PanelListProps {
  panels: Panel[];
  onSelect: (panel: Panel) => void;
  onDelete: (id: string) => void;
}

export default function PanelList({ panels, onSelect, onDelete }: PanelListProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-2">
        {panels.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">No panels yet</p>
            <p className="text-xs mt-1">Create a new panel to get started</p>
          </div>
        ) : (
          panels.map((panel) => (
            <div
              key={panel.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white"
              onClick={() => onSelect(panel)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{panel.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">ID: {panel.id}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-600">
                    <span>
                      {panel.width} × {panel.height}mm
                    </span>
                    <span>Depth: {typeof panel.depth === 'number' ? panel.depth : 200}mm</span>
                    {panel.type && <span>Type: {panel.type}</span>}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete panel "${panel.name}"?`)) {
                      onDelete(panel.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

