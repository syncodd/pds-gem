'use client';

import { useState, useMemo } from 'react';
import { Combinator, Component } from '@/types';
import { usePanelStore } from '@/lib/store';
import dynamic from 'next/dynamic';

const CombinatorPreviewCanvas = dynamic(() => import('../CombinatorPreviewCanvas'), {
  ssr: false,
});

interface ComponentSelectionStepProps {
  combinator: Combinator;
  onChange: (updates: Partial<Combinator>) => void;
}

export default function ComponentSelectionStep({
  combinator,
  onChange,
}: ComponentSelectionStepProps) {
  const { componentLibrary } = usePanelStore();
  const [selectedComponentId, setSelectedComponentId] = useState<string>('');

  const availableComponents = useMemo(() => {
    // Filter out components that are already selected
    return componentLibrary.filter((c) => !combinator.componentIds.includes(c.id));
  }, [componentLibrary, combinator.componentIds]);

  const selectedComponents = useMemo(() => {
    return combinator.componentIds
      .map((id) => componentLibrary.find((c) => c.id === id))
      .filter(Boolean);
  }, [combinator.componentIds, componentLibrary]);

  const handleAddComponent = () => {
    if (!selectedComponentId) return;
    if (combinator.componentIds.includes(selectedComponentId)) return;

    onChange({
      componentIds: [...combinator.componentIds, selectedComponentId],
    });
    setSelectedComponentId('');
  };

  const handleRemoveComponent = (componentId: string) => {
    onChange({
      componentIds: combinator.componentIds.filter((id) => id !== componentId),
    });
  };

  const handleReorder = (newOrder: string[]) => {
    onChange({
      componentIds: newOrder,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Select Components</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose components to include in this combinator. You can add multiple components.
        </p>
      </div>

      {/* Component Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Components
        </label>
        <div className="flex gap-2">
          <select
            value={selectedComponentId}
            onChange={(e) => setSelectedComponentId(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a component...</option>
            {availableComponents.map((component) => (
              <option key={component.id} value={component.id}>
                {component.name} ({component.type})
              </option>
            ))}
          </select>
          <button
            onClick={handleAddComponent}
            disabled={!selectedComponentId}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </div>

      {/* Preview Canvas */}
      {selectedComponents.length > 0 && (
        <div className="mt-6">
          <CombinatorPreviewCanvas
            components={selectedComponents as Component[]}
            combinatorWidth={combinator.width}
            combinatorHeight={combinator.height}
            onReorder={handleReorder}
            onRemove={handleRemoveComponent}
          />
        </div>
      )}

      {/* Selected Components List */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Selected Components ({selectedComponents.length})
        </h4>
        {selectedComponents.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-sm text-gray-400">No components selected yet</p>
            <p className="text-xs text-gray-400 mt-1">Add components from the dropdown above</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {selectedComponents.map((component) => (
              <div
                key={component!.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: component!.color }}
                  />
                  <div>
                    <p className="text-xs font-medium text-gray-800">{component!.name}</p>
                    <p className="text-xs text-gray-500">
                      {component!.width} × {component!.height}mm
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveComponent(component!.id)}
                  className="text-red-500 hover:text-red-700 px-2 py-1 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

