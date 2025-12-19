'use client';

import { useState, useEffect, useMemo } from 'react';
import { Component, Panel, CanvasComponent } from '@/types';
import { usePanelStore } from '@/lib/store';
import {
  getDropdownsForType,
  extractAValues,
  extractVValues,
  extractPValues,
  getComponentTypes,
  findComponentByType,
} from '@/lib/componentUtils';

interface ProjectComponentPropertiesProps {
  isOpen: boolean;
  selectedPanelId: string | null;
  selectedPanel: Panel | null;
  panelComponents: CanvasComponent[];
  onAddComponent: (componentId: string, aValue?: string, vValue?: string, pValue?: string) => void;
  onAddGap: (height: number) => void;
  onDeleteComponent: (componentId: string) => void;
  onUpdateGap: (gapId: string, height: number) => void;
  onClose: () => void;
}

export default function ProjectComponentProperties({
  isOpen,
  selectedPanelId,
  selectedPanel,
  panelComponents,
  onAddComponent,
  onAddGap,
  onDeleteComponent,
  onUpdateGap,
  onClose,
}: ProjectComponentPropertiesProps) {
  const { componentLibrary } = usePanelStore();
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedAValue, setSelectedAValue] = useState<string>('');
  const [selectedVValue, setSelectedVValue] = useState<string>('');
  const [selectedPValue, setSelectedPValue] = useState<string>('');
  const [gapHeight, setGapHeight] = useState<string>('10');
  const [showGapInput, setShowGapInput] = useState(false);
  const [editingGapId, setEditingGapId] = useState<string | null>(null);
  const [editingGapHeight, setEditingGapHeight] = useState<string>('');

  // Sort components by order
  const sortedComponents = useMemo(() => {
    return [...panelComponents].sort((a, b) => {
      const orderA = a.properties?.order ?? 0;
      const orderB = b.properties?.order ?? 0;
      return orderA - orderB;
    });
  }, [panelComponents]);

  // Get component types from library
  const componentTypes = useMemo(() => getComponentTypes(componentLibrary), [componentLibrary]);

  // Get dropdown visibility based on selected type
  const dropdowns = useMemo(() => {
    if (!selectedType) return { showA: false, showV: false, showP: false };
    return getDropdownsForType(selectedType);
  }, [selectedType]);

  // Get A values for selected type
  const aValues = useMemo(() => {
    if (!dropdowns.showA) return [];
    const typeComponents = componentLibrary.filter((c) => c.type === selectedType);
    return extractAValues(typeComponents);
  }, [componentLibrary, selectedType, dropdowns.showA]);

  // Get V values for selected type
  const vValues = useMemo(() => {
    if (!dropdowns.showV) return [];
    const typeComponents = componentLibrary.filter((c) => c.type === selectedType);
    return extractVValues(typeComponents);
  }, [componentLibrary, selectedType, dropdowns.showV]);

  // Get P values for selected type
  const pValues = useMemo(() => {
    if (!dropdowns.showP) return [];
    const typeComponents = componentLibrary.filter((c) => c.type === selectedType);
    return extractPValues(typeComponents);
  }, [componentLibrary, selectedType, dropdowns.showP]);

  // Reset form when panel changes or closes
  useEffect(() => {
    if (!isOpen || !selectedPanelId) {
      setSelectedType('');
      setSelectedAValue('');
      setSelectedVValue('');
      setSelectedPValue('');
    }
  }, [isOpen, selectedPanelId]);

  // Reset dependent dropdowns when type changes
  useEffect(() => {
    setSelectedAValue('');
    setSelectedVValue('');
    setSelectedPValue('');
  }, [selectedType]);

  const handleAdd = () => {
    if (!selectedType || !selectedPanelId) return;

    // Find a component of the selected type
    const component = findComponentByType(componentLibrary, selectedType);
    if (!component) {
      alert('No component found for selected type');
      return;
    }

    // Validate required dropdowns
    if (dropdowns.showA && !selectedAValue) {
      alert('Please select an A (Amperage) value');
      return;
    }
    if (dropdowns.showV && !selectedVValue) {
      alert('Please select a V (Voltage) value');
      return;
    }
    if (dropdowns.showP && !selectedPValue) {
      alert('Please select a P (Power) value');
      return;
    }

    // Add component with selected values
    onAddComponent(
      component.id,
      dropdowns.showA ? selectedAValue : undefined,
      dropdowns.showV ? selectedVValue : undefined,
      dropdowns.showP ? selectedPValue : undefined
    );

    // Reset form after adding
    setSelectedType('');
    setSelectedAValue('');
    setSelectedVValue('');
    setSelectedPValue('');
  };

  const handleAddGap = () => {
    const height = parseFloat(gapHeight);
    if (isNaN(height) || height <= 0) {
      alert('Please enter a valid height value');
      return;
    }
    onAddGap(height);
    setGapHeight('10');
    setShowGapInput(false);
  };

  const handleEditGap = (gapId: string, currentHeight: number) => {
    setEditingGapId(gapId);
    setEditingGapHeight(currentHeight.toString());
  };

  const handleSaveGap = (gapId: string) => {
    const height = parseFloat(editingGapHeight);
    if (isNaN(height) || height <= 0) {
      alert('Please enter a valid height value');
      return;
    }
    onUpdateGap(gapId, height);
    setEditingGapId(null);
    setEditingGapHeight('');
  };

  const handleCancelEditGap = () => {
    setEditingGapId(null);
    setEditingGapHeight('');
  };

  if (!isOpen || !selectedPanelId || !selectedPanel) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none">
      <div
        className={`pointer-events-auto w-96 h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">{selectedPanel.name}</h2>
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

        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Component List */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Components ({sortedComponents.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {sortedComponents.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No components added yet</p>
              ) : (
                sortedComponents.map((canvasComp) => {
                  const compDef = componentLibrary.find((c) => c.id === canvasComp.componentId);
                  const props = canvasComp.properties || {};
                  const isGap = canvasComp.componentId === 'gap';
                  const isEditing = editingGapId === canvasComp.id;
                  
                  return (
                    <div
                      key={canvasComp.id}
                      className="text-xs p-2 bg-gray-50 rounded border border-gray-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1">
                        {isGap ? (
                          isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={editingGapHeight}
                                onChange={(e) => setEditingGapHeight(e.target.value)}
                                placeholder="Height (mm)"
                                min="1"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveGap(canvasComp.id)}
                                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEditGap}
                                className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">Gap ({props.gapHeight || 0}mm)</span>
                              <button
                                onClick={() => handleEditGap(canvasComp.id, props.gapHeight || 10)}
                                className="px-2 py-0.5 text-blue-600 hover:bg-blue-50 rounded text-xs"
                                title="Edit gap height"
                              >
                                Edit
                              </button>
                            </div>
                          )
                        ) : (
                          <div>
                            <span className="font-medium">{compDef?.name || 'Unknown'}</span>
                            {(props.aValue || props.vValue || props.pValue) && (
                              <span className="text-gray-500 ml-2">
                                ({[props.aValue && `A: ${props.aValue}`, props.vValue && `V: ${props.vValue}`, props.pValue && `P: ${props.pValue}`].filter(Boolean).join(', ')})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!isEditing && (
                        <button
                          onClick={() => onDeleteComponent(canvasComp.id)}
                          className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs transition-colors"
                          title="Delete"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Add Gap Button */}
            <div className="mt-3">
              {!showGapInput ? (
                <button
                  onClick={() => setShowGapInput(true)}
                  className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border border-gray-300"
                >
                  + Add Gap
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={gapHeight}
                    onChange={(e) => setGapHeight(e.target.value)}
                    placeholder="Height (mm)"
                    min="1"
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddGap}
                    className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowGapInput(false);
                      setGapHeight('10');
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Component Adding Form */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Component</h3>
            <div className="space-y-4">
            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select component type</option>
                {componentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* A (Amperage) Dropdown */}
            {dropdowns.showA && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  A (Amperage) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAValue}
                  onChange={(e) => setSelectedAValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select amperage</option>
                  {aValues.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* V (Voltage) Dropdown */}
            {dropdowns.showV && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  V (Voltage) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedVValue}
                  onChange={(e) => setSelectedVValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select voltage</option>
                  {vValues.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* P (Power) Dropdown */}
            {dropdowns.showP && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  P (Power) <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPValue}
                  onChange={(e) => setSelectedPValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select power</option>
                  {pValues.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleAdd}
            disabled={!selectedType || (dropdowns.showA && !selectedAValue) || (dropdowns.showV && !selectedVValue) || (dropdowns.showP && !selectedPValue)}
            className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
              selectedType && (!dropdowns.showA || selectedAValue) && (!dropdowns.showV || selectedVValue) && (!dropdowns.showP || selectedPValue)
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Add Component
          </button>
        </div>
      </div>
    </div>
  );
}
