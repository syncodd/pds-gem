'use client';

import { Combinator } from '@/types';

interface PropertiesStepProps {
  combinator: Combinator;
  onChange: (updates: Partial<Combinator>) => void;
}

export default function PropertiesStep({ combinator, onChange }: PropertiesStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Combinator Properties</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter additional properties for this combinator.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand
          </label>
          <input
            type="text"
            value={combinator.brand}
            onChange={(e) => onChange({ brand: e.target.value })}
            placeholder="e.g., Schneider"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Series
          </label>
          <input
            type="text"
            value={combinator.series}
            onChange={(e) => onChange({ series: e.target.value })}
            placeholder="e.g., Acti9"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current (A)
          </label>
          <input
            type="text"
            value={combinator.currentA}
            onChange={(e) => onChange({ currentA: e.target.value })}
            placeholder="e.g., 16"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pole
          </label>
          <input
            type="text"
            value={combinator.pole}
            onChange={(e) => onChange({ pole: e.target.value })}
            placeholder="e.g., 1P, 2P, 3P"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

