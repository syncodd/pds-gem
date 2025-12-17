'use client';

import { Panel } from '@/types';

interface DimensionsStepProps {
  panel: Panel;
  onChange: (updates: Partial<Panel>) => void;
  extractedWidth?: number;
  extractedHeight?: number;
}

export default function DimensionsStep({ 
  panel, 
  onChange, 
  extractedWidth, 
  extractedHeight 
}: DimensionsStepProps) {
  // Use extracted dimensions if available, otherwise use panel dimensions
  const displayWidth = extractedWidth ?? panel.width;
  const displayHeight = extractedHeight ?? panel.height;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Panel Dimensions</h3>
        <p className="text-sm text-gray-600 mb-4">
          {extractedWidth && extractedHeight
            ? 'Dimensions were extracted from your SVG file. You can edit them if needed.'
            : 'Set the dimensions for your panel in millimeters.'}
        </p>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Width (mm) *
            </label>
            <input
              type="number"
              value={panel.width}
              onChange={(e) =>
                onChange({ width: parseFloat(e.target.value) || 0 })
              }
              placeholder={extractedWidth?.toString() || '600'}
              required
              min="100"
              max="2000"
              step="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {extractedWidth && extractedWidth !== panel.width && (
              <p className="text-xs text-gray-500 mt-1">
                Extracted: {extractedWidth}mm
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (mm) *
            </label>
            <input
              type="number"
              value={panel.height}
              onChange={(e) =>
                onChange({ height: parseFloat(e.target.value) || 0 })
              }
              placeholder={extractedHeight?.toString() || '800'}
              required
              min="100"
              max="2000"
              step="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {extractedHeight && extractedHeight !== panel.height && (
              <p className="text-xs text-gray-500 mt-1">
                Extracted: {extractedHeight}mm
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Depth (mm)
            </label>
            <input
              type="number"
              value={panel.depth || 200}
              onChange={(e) =>
                onChange({ depth: parseFloat(e.target.value) || 0 })
              }
              min="50"
              max="500"
              step="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

