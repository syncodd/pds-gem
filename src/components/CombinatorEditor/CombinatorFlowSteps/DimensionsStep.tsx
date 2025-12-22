'use client';

import { Combinator } from '@/types';

interface DimensionsStepProps {
  combinator: Combinator;
  onChange: (updates: Partial<Combinator>) => void;
}

export default function DimensionsStep({ combinator, onChange }: DimensionsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Combinator Dimensions</h3>
        <p className="text-sm text-gray-600 mb-4">
          Set the dimensions for your combinator in millimeters.
        </p>

        <div className="grid grid-cols-3 gap-4">
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
    </div>
  );
}

