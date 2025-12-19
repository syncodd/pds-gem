'use client';

import { Component } from '@/types';

interface DimensionsStepProps {
  component: Component;
  onChange: (updates: Partial<Component>) => void;
  extractedWidth?: number;
  extractedHeight?: number;
}

export default function DimensionsStep({
  component,
  onChange,
  extractedWidth,
  extractedHeight,
}: DimensionsStepProps) {
  // Use extracted dimensions if available, otherwise use component dimensions
  const displayWidth = extractedWidth ?? component.width;
  const displayHeight = extractedHeight ?? component.height;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Component Dimensions</h3>
        <p className="text-sm text-gray-600 mb-4">
          {extractedWidth && extractedHeight
            ? 'Dimensions were extracted from your SVG file. You can edit them if needed.'
            : 'Set the dimensions for your component in millimeters.'}
        </p>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Width (mm) *
            </label>
            <input
              type="number"
              value={component.width}
              onChange={(e) =>
                onChange({ width: parseFloat(e.target.value) || 0 })
              }
              placeholder={extractedWidth?.toString() || '60'}
              required
              min="1"
              max="2000"
              step="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {extractedWidth && extractedWidth !== component.width && (
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
              value={component.height}
              onChange={(e) =>
                onChange({ height: parseFloat(e.target.value) || 0 })
              }
              placeholder={extractedHeight?.toString() || '90'}
              required
              min="1"
              max="2000"
              step="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {extractedHeight && extractedHeight !== component.height && (
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
              value={component.depth || 45}
              onChange={(e) =>
                onChange({ depth: parseFloat(e.target.value) || 0 })
              }
              min="1"
              max="500"
              step="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Color</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose a color for your component visualization.
        </p>
        <div className="flex gap-2">
          <input
            type="color"
            value={component.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="w-20 h-12 border border-gray-300 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            value={component.color}
            onChange={(e) => onChange({ color: e.target.value })}
            placeholder="#4a90e2"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
