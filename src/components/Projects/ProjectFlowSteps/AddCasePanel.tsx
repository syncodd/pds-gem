'use client';

import { useState, useMemo } from 'react';
import { Panel } from '@/types';
import { usePanelStore } from '@/lib/store';

interface AddCasePanelProps {
  onAdd: (panel: Panel) => void;
  onClose: () => void;
  existingPanels: Panel[];
}

// Placeholder options for read-only fields
const POSITION_OPTIONS = ['Position 1', 'Position 2', 'Position 3'];
const BUSBAR_OPTIONS = ['Busbar A', 'Busbar B', 'Busbar C'];

export default function AddCasePanel({ onAdd, onClose, existingPanels }: AddCasePanelProps) {
  const { panelsLibrary } = usePanelStore();
  const [cabinet, setCabinet] = useState('');
  const [position, setPosition] = useState('');
  const [width, setWidth] = useState('');
  const [busbar, setBusbar] = useState('');

  // Get unique width values from panels library
  const widthOptions = useMemo(() => {
    const widths = new Set<number>();
    panelsLibrary.forEach((panel) => {
      widths.add(panel.width);
    });
    return Array.from(widths).sort((a, b) => a - b);
  }, [panelsLibrary]);

  const handleAddCase = () => {
    if (!width) {
      alert('Please select a width');
      return;
    }

    // Find a panel from library with the selected width, or create a new one
    const templatePanel = panelsLibrary.find((p) => p.width === Number(width));
    const newPanel: Panel = templatePanel
      ? {
          ...templatePanel,
          id: `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `Panel ${existingPanels.length + 1}`,
        }
      : {
          id: `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `Panel ${existingPanels.length + 1}`,
          width: Number(width),
          height: 800, // Default height
          depth: 200,
        };

    onAdd(newPanel);
    // Reset form but keep panel open for adding more
    setCabinet('');
    setPosition('');
    setWidth('');
    setBusbar('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white border-t border-gray-200 rounded-t-lg shadow-2xl w-full max-w-2xl max-h-[60vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Add Case</h3>
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cabinet</label>
              <textarea
                value={cabinet}
                onChange={(e) => setCabinet(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                placeholder="Enter cabinet information"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Read-only for now</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                disabled
              >
                <option value="">Select position</option>
                {POSITION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Read-only for now</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width <span className="text-red-500">*</span>
              </label>
              <select
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select width</option>
                {widthOptions.map((w) => (
                  <option key={w} value={w}>
                    {w}mm
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Available widths from panel library
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Busbar</label>
              <select
                value={busbar}
                onChange={(e) => setBusbar(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                disabled
              >
                <option value="">Select busbar</option>
                {BUSBAR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Read-only for now</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleAddCase}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Add Case
            </button>
            <button
              onClick={() => {
                handleAddCase();
                onClose();
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Add & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
