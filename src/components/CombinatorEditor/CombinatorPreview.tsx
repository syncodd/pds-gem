'use client';

import { useState, useEffect } from 'react';
import { Combinator, Component } from '@/types';
import { usePanelStore } from '@/lib/store';
import { calculateCombinatorDimensions } from '@/lib/componentUtils';
import dynamic from 'next/dynamic';

const CombinatorPreviewCanvas = dynamic(() => import('./CombinatorPreviewCanvas'), {
  ssr: false,
});

interface CombinatorPreviewProps {
  combinator: Combinator;
  onUpdate: (updates: Partial<Combinator>) => void;
  onSave: () => void;
}

export default function CombinatorPreview({ combinator, onUpdate, onSave }: CombinatorPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Combinator>(combinator);
  const [showLabels, setShowLabels] = useState(true);
  const { componentLibrary } = usePanelStore();

  useEffect(() => {
    setFormData(combinator);
  }, [combinator]);

  const handleUpdate = (updates: Partial<Combinator>) => {
    setFormData({ ...formData, ...updates });
    onUpdate(updates);
  };

  const handleReorder = (newOrder: string[]) => {
    // When reordering, keep gaps array but ensure it has correct length
    const currentGaps = formData.gaps || [];
    const requiredGapsCount = newOrder.length + 1;
    const newGaps = new Array(requiredGapsCount).fill(0);
    
    // Preserve existing gaps as much as possible
    for (let i = 0; i < Math.min(currentGaps.length, newGaps.length); i++) {
      newGaps[i] = currentGaps[i];
    }
    
    handleUpdate({ 
      componentIds: newOrder,
      gaps: newGaps,
    });
  };

  const handleRemoveComponent = (componentId: string) => {
    handleUpdate({
      componentIds: formData.componentIds.filter((id) => id !== componentId),
    });
  };

  const handleGapChange = (index: number, value: number) => {
    const currentGaps = formData.gaps || new Array(formData.componentIds.length + 1).fill(0);
    const newGaps = [...currentGaps];
    newGaps[index] = Math.max(0, value);
    handleUpdate({ gaps: newGaps });
  };

  const handleAddComponent = (componentId: string) => {
    if (formData.componentIds.includes(componentId)) return;
    handleUpdate({
      componentIds: [...formData.componentIds, componentId],
    });
  };

  const handleReplaceComponent = (oldComponentId: string, newComponentId: string) => {
    if (newComponentId === oldComponentId) return;
    
    // Replace the old component with the new one (swap if new is already in list)
    if (formData.componentIds.includes(newComponentId)) {
      // Swap positions: replace old with new, and remove duplicate new
      const newComponentIds = formData.componentIds.map((id) => {
        if (id === oldComponentId) return newComponentId;
        if (id === newComponentId) return oldComponentId; // Swap
        return id;
      });
      handleUpdate({
        componentIds: newComponentIds,
      });
    } else {
      // Simple replacement
      const newComponentIds = formData.componentIds.map((id) =>
        id === oldComponentId ? newComponentId : id
      );
      handleUpdate({
        componentIds: newComponentIds,
      });
    }
  };

  const handleSave = () => {
    onSave();
    setIsEditing(false);
  };

  // Get component details for display
  const componentDetails = formData.componentIds
    .map((id) => componentLibrary.find((c) => c.id === id))
    .filter((c): c is Component => c !== undefined);

  // Calculate dimensions
  const calculatedDimensions = componentDetails.length > 0
    ? calculateCombinatorDimensions(componentDetails, formData.gaps || [])
    : { width: 0, height: 0 };

  // Initialize gaps if needed
  useEffect(() => {
    if (formData.componentIds.length > 0) {
      const requiredGapsCount = formData.componentIds.length + 1;
      const currentGaps = formData.gaps || [];
      
      if (currentGaps.length !== requiredGapsCount) {
        const newGaps = new Array(requiredGapsCount).fill(0);
        for (let i = 0; i < Math.min(currentGaps.length, newGaps.length); i++) {
          newGaps[i] = currentGaps[i];
        }
        handleUpdate({ gaps: newGaps });
      }
    } else {
      if (formData.gaps && formData.gaps.length > 0) {
        handleUpdate({ gaps: [] });
      }
    }
  }, [formData.componentIds.length]);

  // Get available components (not already in combinator)
  const availableComponents = componentLibrary.filter(
    (c) => !formData.componentIds.includes(c.id)
  );

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleUpdate({ name: e.target.value })}
                  placeholder="Combinator Name"
                  className="text-xl font-bold text-gray-800 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => handleUpdate({ id: e.target.value })}
                  placeholder="Combinator ID"
                  className="text-sm text-gray-500 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800">{combinator.name || 'Unnamed Combinator'}</h2>
                <p className="text-sm text-gray-500 mt-1">ID: {combinator.id}</p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setFormData(combinator);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Width:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.width}
                  onChange={(e) =>
                    handleUpdate({ width: parseFloat(e.target.value) || 0 })
                  }
                  className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : (
                <span className="ml-2 font-medium">{formData.width}mm</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Height:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) =>
                    handleUpdate({ height: parseFloat(e.target.value) || 0 })
                  }
                  className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : (
                <span className="ml-2 font-medium">{formData.height}mm</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Depth:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.depth || 200}
                  onChange={(e) =>
                    handleUpdate({ depth: parseFloat(e.target.value) || 0 })
                  }
                  className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : (
                <span className="ml-2 font-medium">{formData.depth || 200}mm</span>
              )}
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Properties</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Brand:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleUpdate({ brand: e.target.value })}
                  className="ml-2 flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : (
                <span className="ml-2 font-medium">{formData.brand || '—'}</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Series:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.series}
                  onChange={(e) => handleUpdate({ series: e.target.value })}
                  className="ml-2 flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : (
                <span className="ml-2 font-medium">{formData.series || '—'}</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Current (A):</span>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.currentA}
                  onChange={(e) => handleUpdate({ currentA: e.target.value })}
                  className="ml-2 flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : (
                <span className="ml-2 font-medium">{formData.currentA || '—'}</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Pole:</span>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.pole}
                  onChange={(e) => handleUpdate({ pole: e.target.value })}
                  className="ml-2 flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : (
                <span className="ml-2 font-medium">{formData.pole || '—'}</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Panel Size (cm):</span>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.panelSize || ''}
                  onChange={(e) => handleUpdate({ panelSize: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="e.g., 60"
                  min="0"
                  step="1"
                  className="ml-2 flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : (
                <span className="ml-2 font-medium">{formData.panelSize ? `${formData.panelSize} cm` : '—'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Calculated Dimensions */}
        {componentDetails.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Calculated Dimensions</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-500">Width:</span>
                <span className="ml-2 font-medium">{calculatedDimensions.width}mm</span>
              </div>
              <div>
                <span className="text-gray-500">Height:</span>
                <span className="ml-2 font-medium">{calculatedDimensions.height}mm</span>
              </div>
            </div>
          </div>
        )}

        {/* Components */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
            Components ({formData.componentIds.length})
          </h3>
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
          
          {/* Add Component UI (only when editing) */}
          {isEditing && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Component
              </label>
              <div className="flex gap-2">
                <select
                  id="add-component-select"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddComponent(e.target.value);
                      e.target.value = ''; // Reset selection
                    }
                  }}
                  defaultValue=""
                >
                  <option value="">Select a component to add...</option>
                  {availableComponents.map((component) => (
                    <option key={component.id} value={component.id}>
                      {component.name} ({component.type}) - {component.width} × {component.height}mm
                    </option>
                  ))}
                </select>
              </div>
              {availableComponents.length === 0 && (
                <p className="text-xs text-gray-400 mt-1 italic">All available components are already added</p>
              )}
            </div>
          )}

          {componentDetails.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-400">No components added</p>
              {isEditing && (
                <p className="text-xs text-gray-400 mt-1">Use the dropdown above to add components</p>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4">
                <CombinatorPreviewCanvas
                  components={componentDetails}
                  combinatorWidth={formData.width}
                  combinatorHeight={formData.height}
                  gaps={formData.gaps}
                  onReorder={handleReorder}
                  onRemove={isEditing ? handleRemoveComponent : undefined}
                  onGapChange={isEditing ? handleGapChange : undefined}
                  showLabels={showLabels}
                />
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {/* Top Gap */}
                {isEditing && (
                  <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-yellow-400 border border-yellow-600" />
                        <span className="text-xs font-medium text-gray-800">Top Gap</span>
                      </div>
                      <input
                        type="number"
                        value={formData.gaps?.[0] || 0}
                        onChange={(e) => handleGapChange(0, parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                        className="w-24 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                      <span className="text-xs text-gray-500 ml-1">mm</span>
                    </div>
                  </div>
                )}

                {/* Components with gaps */}
                {componentDetails.map((comp, index) => {
                  const gapIndex = index + 1;
                  const gap = formData.gaps?.[gapIndex] || 0;
                  const isLast = index === componentDetails.length - 1;
                  
                  return (
                    <div key={comp.id} className="space-y-2">
                      {/* Component */}
                      <div className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="flex items-center gap-2 flex-1">
                      <div
                        className="w-3 h-3 rounded"
                            style={{ backgroundColor: comp.color }}
                      />
                      <div>
                            <span className="font-medium">{comp.name}</span>
                            <span className="text-gray-500 ml-2">({comp.type})</span>
                        <span className="text-gray-500 ml-2 text-xs">
                              {comp.width} × {comp.height}mm
                        </span>
                      </div>
                    </div>
                    {isEditing && (
                      <div className="flex gap-2">
                        <select
                          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          onChange={(e) => {
                            if (e.target.value) {
                                  handleReplaceComponent(comp.id, e.target.value);
                              e.target.value = ''; // Reset selection
                            }
                          }}
                          defaultValue=""
                        >
                          <option value="">Replace...</option>
                          {componentLibrary
                                .filter((c) => c.id !== comp.id) // Exclude current component
                            .map((component) => (
                              <option key={component.id} value={component.id}>
                                {component.name}
                                {formData.componentIds.includes(component.id) && ' (swap)'}
                              </option>
                            ))}
                        </select>
                        <button
                              onClick={() => handleRemoveComponent(comp.id)}
                          className="text-red-500 hover:text-red-700 px-2 py-1 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                      
                      {/* Gap after component */}
                      {isEditing && !isLast && (
                        <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded bg-yellow-400 border border-yellow-600" />
                              <span className="text-xs font-medium text-gray-800">
                                Gap after {comp.name}
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
                      {isEditing && isLast && (
                        <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded bg-yellow-400 border border-yellow-600" />
                              <span className="text-xs font-medium text-gray-800">Bottom Gap</span>
                            </div>
                            <input
                              type="number"
                              value={formData.gaps?.[formData.gaps?.length ? formData.gaps.length - 1 : 0] || 0}
                              onChange={(e) => handleGapChange(formData.gaps?.length ? formData.gaps.length - 1 : 0, parseFloat(e.target.value) || 0)}
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
            </>
          )}
        </div>

      </div>
    </div>
  );
}

