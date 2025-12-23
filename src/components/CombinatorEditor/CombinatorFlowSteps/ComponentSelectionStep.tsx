'use client';

import { useState, useMemo } from 'react';
import { Combinator, Component } from '@/types';
import { usePanelStore } from '@/lib/store';
import { calculateCombinatorDimensions } from '@/lib/componentUtils';
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
  const [showLabels, setShowLabels] = useState(true);

  const availableComponents = useMemo(() => {
    // Filter out components that are already selected
    return componentLibrary.filter((c) => !combinator.componentIds.includes(c.id));
  }, [componentLibrary, combinator.componentIds]);

  const selectedComponents = useMemo(() => {
    return combinator.componentIds
      .map((id) => componentLibrary.find((c) => c.id === id))
      .filter((c): c is Component => c !== undefined);
  }, [combinator.componentIds, componentLibrary]);

  // Calculate dimensions from components
  const calculatedDimensions = useMemo(() => {
    if (selectedComponents.length === 0) {
      return { width: 0, height: 0 };
    }
    const gaps = combinator.gaps || new Array(selectedComponents.length + 1).fill(0);
    return calculateCombinatorDimensions(selectedComponents, gaps);
  }, [selectedComponents, combinator.gaps]);

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
    // When reordering, keep gaps array but ensure it has correct length
    const currentGaps = combinator.gaps || [];
    const requiredGapsCount = newOrder.length + 1;
    const newGaps = new Array(requiredGapsCount).fill(0);
    
    // Preserve existing gaps as much as possible
    for (let i = 0; i < Math.min(currentGaps.length, newGaps.length); i++) {
      newGaps[i] = currentGaps[i];
    }
    
    onChange({
      componentIds: newOrder,
      gaps: newGaps,
    });
  };

  const handleGapChange = (index: number, value: number) => {
    const currentGaps = combinator.gaps || new Array(selectedComponents.length + 1).fill(0);
    const newGaps = [...currentGaps];
    newGaps[index] = Math.max(0, value);
    onChange({ gaps: newGaps });
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

      {/* Calculated Dimensions Display */}
      {selectedComponents.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Calculated Dimensions</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Width:</span>
              <span className="ml-2 font-medium text-blue-900">{calculatedDimensions.width}mm</span>
            </div>
            <div>
              <span className="text-blue-700">Height:</span>
              <span className="ml-2 font-medium text-blue-900">{calculatedDimensions.height}mm</span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Dimensions are calculated from component sizes. You can adjust them in the Dimensions step.
          </p>
        </div>
      )}

      {/* Preview Canvas */}
      {selectedComponents.length > 0 && (
        <div className="mt-6">
          <CombinatorPreviewCanvas
            components={selectedComponents}
            combinatorWidth={calculatedDimensions.width}
            combinatorHeight={calculatedDimensions.height}
            gaps={combinator.gaps}
            onReorder={handleReorder}
            onRemove={handleRemoveComponent}
            onGapChange={handleGapChange}
            showLabels={showLabels}
          />
        </div>
      )}

      {/* Selected Components List with Gap Inputs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700">
          Selected Components ({selectedComponents.length})
        </h4>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span>Show Labels</span>
          </label>
        </div>
        {selectedComponents.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-sm text-gray-400">No components selected yet</p>
            <p className="text-xs text-gray-400 mt-1">Add components from the dropdown above</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Top Gap */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-400 border border-yellow-600" />
                  <span className="text-sm font-medium text-gray-800">Top Gap</span>
                </div>
                <input
                  type="number"
                  value={combinator.gaps?.[0] || 0}
                  onChange={(e) => handleGapChange(0, parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.1"
                  className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
                <span className="text-xs text-gray-500 ml-1">mm</span>
              </div>
            </div>

            {/* Components with gaps */}
            {selectedComponents.map((component, index) => {
              const gapIndex = index + 1;
              const gap = combinator.gaps?.[gapIndex] || 0;
              const isLast = index === selectedComponents.length - 1;
              
              return (
                <div key={component.id} className="space-y-2">
                  {/* Component */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded"
                        style={{ backgroundColor: component.color }}
                  />
                  <div>
                        <p className="text-xs font-medium text-gray-800">{component.name}</p>
                    <p className="text-xs text-gray-500">
                          {component.width} × {component.height}mm
                    </p>
                  </div>
                </div>
                <button
                      onClick={() => handleRemoveComponent(component.id)}
                  className="text-red-500 hover:text-red-700 px-2 py-1 text-xs"
                >
                  Remove
                </button>
              </div>
                  
                  {/* Gap after component */}
                  {!isLast && (
                    <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-yellow-400 border border-yellow-600" />
                          <span className="text-xs font-medium text-gray-800">
                            Gap after {component.name}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={gap}
                          onChange={(e) => handleGapChange(gapIndex, parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.1"
                          className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                        <span className="text-xs text-gray-500 ml-1">mm</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Bottom gap for last component */}
                  {isLast && (
                    <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-yellow-400 border border-yellow-600" />
                          <span className="text-xs font-medium text-gray-800">Bottom Gap</span>
                        </div>
                        <input
                          type="number"
                          value={combinator.gaps?.[combinator.gaps.length - 1] || 0}
                          onChange={(e) => handleGapChange(combinator.gaps?.length ? combinator.gaps.length - 1 : 0, parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.1"
                          className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                        <span className="text-xs text-gray-500 ml-1">mm</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

