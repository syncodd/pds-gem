'use client';

import { Combinator, Component } from '@/types';
import { usePanelStore } from '@/lib/store';
import { calculateCombinatorDimensions } from '@/lib/componentUtils';

interface DimensionsStepProps {
  combinator: Combinator;
  onChange: (updates: Partial<Combinator>) => void;
}

export default function DimensionsStep({ combinator, onChange }: DimensionsStepProps) {
  const { componentLibrary } = usePanelStore();
  
  const selectedComponents = combinator.componentIds
    .map((id) => componentLibrary.find((c) => c.id === id))
    .filter((c): c is Component => c !== undefined);

  const gaps = combinator.gaps || new Array(selectedComponents.length + 1).fill(0);
  const calculatedDimensions = selectedComponents.length > 0
    ? calculateCombinatorDimensions(selectedComponents, gaps)
    : { width: 0, height: 0 };

  const handleGapChange = (index: number, value: number) => {
    const newGaps = [...gaps];
    newGaps[index] = Math.max(0, value);
    onChange({ gaps: newGaps });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Combinator Dimensions</h3>
        <p className="text-sm text-gray-600 mb-4">
          Dimensions are calculated from components and gaps. You can override them if needed.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Width (mm) *
            </label>
            <input
              type="number"
              value={combinator.width}
              onChange={(e) =>
                onChange({ width: parseFloat(e.target.value) || 0 })
              }
              placeholder="200"
              required
              min="1"
              max="2000"
              step="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedComponents.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Calculated: {calculatedDimensions.width}mm
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Height (mm) *
            </label>
            <input
              type="number"
              value={combinator.height}
              onChange={(e) =>
                onChange({ height: parseFloat(e.target.value) || 0 })
              }
              placeholder="300"
              required
              min="1"
              max="2000"
              step="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedComponents.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Calculated: {calculatedDimensions.height}mm
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Depth (mm)
            </label>
            <input
              type="number"
              value={combinator.depth || 200}
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


      {selectedComponents.length === 0 && (
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            No components selected. Please select components in the previous step to calculate dimensions and configure gaps.
          </p>
        </div>
      )}
    </div>
  );
}

