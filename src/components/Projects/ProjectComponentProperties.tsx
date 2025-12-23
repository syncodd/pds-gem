'use client';

import { useState, useEffect, useMemo } from 'react';
import { Component, Panel, CanvasComponent } from '@/types';
import { usePanelStore } from '@/lib/store';
import { validateComponentHeight, calculateAvailableHeight } from '@/lib/ruleEngine';
import {
  getDropdownsForType,
  extractAValues,
  extractVValues,
  extractPValues,
  getComponentTypes,
  findComponentByType,
  getPanelSizeFromWidth,
  filterComponentsByPanelWidth,
  getComponentsByTypeAndPanelSize,
} from '@/lib/componentUtils';

interface ProjectComponentPropertiesProps {
  isOpen: boolean;
  selectedPanelId: string | null;
  selectedPanel: Panel | null;
  panelComponents: CanvasComponent[];
  onAddComponent: (componentId: string, aValue?: string, vValue?: string, pValue?: string) => void;
  onAddCombinator?: (combinatorId: string) => void;
  onDeleteComponent: (componentId: string) => void;
  onClose: () => void;
}

export default function ProjectComponentProperties({
  isOpen,
  selectedPanelId,
  selectedPanel,
  panelComponents,
  onAddComponent,
  onAddCombinator,
  onDeleteComponent,
  onClose,
}: ProjectComponentPropertiesProps) {
  const { componentLibrary, combinatorsLibrary, rules, panelsLibrary } = usePanelStore();
  const [addMode, setAddMode] = useState<'component' | 'combinator'>('component');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedCombinatorId, setSelectedCombinatorId] = useState<string>('');
  const [selectedAValue, setSelectedAValue] = useState<string>('');
  const [selectedVValue, setSelectedVValue] = useState<string>('');
  const [selectedPValue, setSelectedPValue] = useState<string>('');

  // Sort components by order
  const sortedComponents = useMemo(() => {
    return [...panelComponents].sort((a, b) => {
      const orderA = a.properties?.order ?? 0;
      const orderB = b.properties?.order ?? 0;
      return orderA - orderB;
    });
  }, [panelComponents]);

  // Get applicable panel size mapping rules for this panel
  const applicableRules = useMemo(() => {
    if (!selectedPanel || !rules || rules.length === 0) return [];
    
    return rules
      .filter((rule) => {
        // Rule must be enabled
        if (rule.enabled === false) return false;
        
        // Rule must have panelSizeMapping constraint
        const hasPanelSizeMapping = rule.constraints.some(
          (constraint) => constraint.type === 'panelSizeMapping'
        );
        if (!hasPanelSizeMapping) return false;
        
        // Check if rule applies to this panel:
        // - Global rules apply to all panels
        // - Panel rules apply if:
        //   a) panelId matches (exact match)
        //   b) OR panel width matches the library panel that the rule was created for
        //   c) OR panel name contains similar keywords (e.g., "Bos Panel 60" matches panel with 600mm width)
        if (rule.type === 'global') return true;
        if (rule.type === 'panel') {
          // First try exact ID match
          if (rule.panelId === selectedPanel.id) return true;
          
          // If no exact match, try to find the panel from library by ID and match by width
          // This handles cases where panel was copied from library with new ID
          if (rule.panelId && panelsLibrary) {
            const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
            if (libraryPanel) {
              // Match by width - this is the key matching criteria
              if (libraryPanel.width === selectedPanel.width) {
                return true;
              }
            }
          }
          
          // Also try matching by panel name pattern (e.g., "Bos Panel 60" -> 600mm)
          // Extract width from panel name if it contains a number
          if (rule.panelId && panelsLibrary) {
            const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
            if (libraryPanel) {
              // Check if names are similar (e.g., both contain "60" or "Bos")
              const libraryName = libraryPanel.name.toLowerCase();
              const selectedName = selectedPanel.name.toLowerCase();
              // If names are similar and widths match, it's likely the same panel type
              if (libraryPanel.width === selectedPanel.width) {
                // Check if they share common keywords
                const libraryKeywords = libraryName.split(/\s+/);
                const selectedKeywords = selectedName.split(/\s+/);
                const commonKeywords = libraryKeywords.filter(k => selectedKeywords.includes(k));
                if (commonKeywords.length > 0) {
                  return true;
                }
              }
            }
          }
          
          return false;
        }
        
        return false;
      })
      .flatMap((rule) => 
        rule.constraints
          .filter((c) => c.type === 'panelSizeMapping')
          .map((constraint) => ({ rule, constraint }))
      );
  }, [rules, selectedPanel, panelsLibrary]);

  // Filter component library based on applicable rules
  const filteredComponentLibrary = useMemo(() => {
    // If no panel selected, show all
    if (!selectedPanel) return componentLibrary;
    
    // If no rules defined for this panel, show nothing (empty array)
    if (applicableRules.length === 0) {
      return [];
    }
    
    // Get the first applicable rule's constraint (we'll use the first one)
    const firstRule = applicableRules[0];
    const constraint = firstRule.constraint;
    
    // Determine panel size: use constraint.panelSize if specified, otherwise calculate from panel width
    const panelSize = constraint.panelSize !== undefined 
      ? constraint.panelSize 
      : getPanelSizeFromWidth(selectedPanel.width);
    
    // Get component types from constraint
    const allowedComponentTypes = constraint.componentTypes || 
      (constraint.componentType ? [constraint.componentType] : []);
    
    // Filter components
    let filtered = componentLibrary.filter((comp) => {
      // Must match panel size
      const compPanelSize = comp.specs.panelSize;
      if (compPanelSize === undefined || Number(compPanelSize) !== panelSize) {
        return false;
      }
      
      // If component types are specified, must match one of them
      if (allowedComponentTypes.length > 0) {
        return allowedComponentTypes.includes(comp.type);
      }
      
      // If no component types specified, allow all
      return true;
    });
    
    return filtered;
  }, [componentLibrary, selectedPanel, applicableRules]);

  // Get component types from filtered library (only types that have variants for this panel size)
  const componentTypes = useMemo(() => getComponentTypes(filteredComponentLibrary), [filteredComponentLibrary]);

  // Get dropdown visibility based on selected type
  const dropdowns = useMemo(() => {
    if (!selectedType) return { showA: false, showV: false, showP: false };
    return getDropdownsForType(selectedType);
  }, [selectedType]);

  // Get A values for selected type (from filtered library)
  const aValues = useMemo(() => {
    if (!dropdowns.showA) return [];
    const typeComponents = filteredComponentLibrary.filter((c) => c.type === selectedType);
    return extractAValues(typeComponents);
  }, [filteredComponentLibrary, selectedType, dropdowns.showA]);

  // Get V values for selected type (from filtered library)
  const vValues = useMemo(() => {
    if (!dropdowns.showV) return [];
    const typeComponents = filteredComponentLibrary.filter((c) => c.type === selectedType);
    return extractVValues(typeComponents);
  }, [filteredComponentLibrary, selectedType, dropdowns.showV]);

  // Get P values for selected type (from filtered library)
  const pValues = useMemo(() => {
    if (!dropdowns.showP) return [];
    const typeComponents = filteredComponentLibrary.filter((c) => c.type === selectedType);
    return extractPValues(typeComponents);
  }, [filteredComponentLibrary, selectedType, dropdowns.showP]);

  // Calculate available height (empty area)
  // Filter rules to match panel (by ID or width for panels copied from library)
  const availableHeightInfo = useMemo(() => {
    if (!selectedPanel) return null;
    
    // Filter rules to match this panel (similar to how we filter in ProjectCanvas)
    const matchingRules = rules.filter((rule) => {
      if (rule.enabled === false) return false;
      if (rule.type !== 'panel') return false;
      
      // Exact ID match
      if (rule.panelId === selectedPanel.id) return true;
      
      // Width-based matching (for panels copied from library)
      // This is the key: if rule.panelId points to a library panel with same width, it matches
      if (rule.panelId && panelsLibrary) {
        const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
        if (libraryPanel) {
          // Match by width - this handles panels copied from library
          if (libraryPanel.width === selectedPanel.width) return true;
          
          // Also match by name if widths match (additional safety check)
          if (libraryPanel.width === selectedPanel.width && 
              libraryPanel.name === selectedPanel.name) return true;
        }
      }
      
      // Also check if selectedPanel is from library and matches by ID
      if (panelsLibrary) {
        const selectedPanelInLibrary = panelsLibrary.find((p) => p.id === selectedPanel.id);
        if (selectedPanelInLibrary && rule.panelId === selectedPanelInLibrary.id) return true;
      }
      
      return false;
    });
    
    // If no rules found, try a more lenient match: check if any panel rule has constraints for maxComponentHeight
    // This is a fallback in case the panelId matching isn't working
    if (matchingRules.length === 0 && panelsLibrary) {
      const fallbackRules = rules.filter((rule) => {
        if (rule.enabled === false) return false;
        if (rule.type !== 'panel') return false;
        // Check if this rule has maxComponentHeight constraint
        const hasMaxHeightConstraint = rule.constraints.some(c => c.type === 'maxComponentHeight');
        if (!hasMaxHeightConstraint) return false;
        
        // Try to match by width
        if (rule.panelId) {
          const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
          if (libraryPanel && libraryPanel.width === selectedPanel.width) return true;
        }
        return false;
      });
      
      if (fallbackRules.length > 0) {
        return calculateAvailableHeight(
          selectedPanel,
          panelComponents,
          componentLibrary,
          combinatorsLibrary,
          fallbackRules
        );
      }
    }
    
    return calculateAvailableHeight(
      selectedPanel,
      panelComponents,
      componentLibrary,
      combinatorsLibrary,
      matchingRules
    );
  }, [selectedPanel, panelComponents, componentLibrary, combinatorsLibrary, rules, panelsLibrary]);

  // Check if selected component/combinator fits in available space
  const canAddSelected = useMemo(() => {
    if (!availableHeightInfo) return true; // No constraint, allow addition
    
    if (addMode === 'combinator') {
      if (!selectedCombinatorId) return false;
      const combinator = combinatorsLibrary.find((c) => c.id === selectedCombinatorId);
      if (!combinator) return false;
      
      const spacing = panelComponents.filter((c) => c.componentId !== 'gap').length > 0 ? 10 : 0;
      const requiredHeight = combinator.height + spacing;
      return requiredHeight <= availableHeightInfo.available;
    } else {
      if (!selectedType) return false;
      const component = filteredComponentLibrary.find((c) => c.type === selectedType);
      if (!component) return false;
      
      const spacing = panelComponents.filter((c) => c.componentId !== 'gap').length > 0 ? 10 : 0;
      const requiredHeight = component.height + spacing;
      return requiredHeight <= availableHeightInfo.available;
    }
  }, [addMode, selectedCombinatorId, selectedType, filteredComponentLibrary, combinatorsLibrary, panelComponents, availableHeightInfo]);

  // Reset form when panel changes or closes
  useEffect(() => {
    if (!isOpen || !selectedPanelId) {
      setAddMode('component');
      setSelectedType('');
      setSelectedCombinatorId('');
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
    if (!selectedPanelId || !selectedPanel) return;

    if (addMode === 'combinator') {
      if (!selectedCombinatorId) {
        alert('Please select a combinator');
        return;
      }
      
      const combinator = combinatorsLibrary.find((c) => c.id === selectedCombinatorId);
      if (!combinator) {
        alert('Combinator not found');
        return;
      }

      // Check if combinator fits in available space
      if (!canAddSelected) {
        const spacing = panelComponents.filter((c) => c.componentId !== 'gap').length > 0 ? 10 : 0;
        const required = combinator.height + spacing;
        alert(
          `Cannot add combinator: ${combinator.name} (${combinator.height}mm + ${spacing}mm spacing = ${required.toFixed(1)}mm)\n` +
          (availableHeightInfo 
            ? `Available space: ${availableHeightInfo.available.toFixed(1)}mm\n` +
              `Used: ${availableHeightInfo.used.toFixed(1)}mm / Max: ${availableHeightInfo.maxHeight.toFixed(1)}mm`
            : 'No space available')
        );
        return;
      }

      // Filter rules to match panel (by ID or width for panels copied from library)
      const matchingRules = rules.filter((rule) => {
        if (rule.enabled === false) return false;
        if (rule.type !== 'panel') return false;
        
        // Exact ID match
        if (rule.panelId === selectedPanel.id) return true;
        
        // Width-based matching (for panels copied from library)
        if (rule.panelId && panelsLibrary) {
          const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
          if (libraryPanel && libraryPanel.width === selectedPanel.width) return true;
        }
        
        return false;
      });

      // Validate against maxComponentHeight constraint
      const validationError = validateComponentHeight(
        selectedPanel,
        panelComponents,
        componentLibrary,
        combinatorsLibrary,
        matchingRules,
        combinator.height,
        true
      );

      if (validationError) {
        alert(validationError);
        return;
      }

      if (onAddCombinator) {
        onAddCombinator(selectedCombinatorId);
        setSelectedCombinatorId('');
      }
      return;
    }

    // Component mode
    if (!selectedType) return;

    // Find component from filtered library (already filtered by rules)
    const component = filteredComponentLibrary.find((c) => c.type === selectedType);
    
    if (!component) {
      if (applicableRules.length === 0) {
        alert('No rules defined for this panel. Please define rules first.');
      } else {
        alert(`No component found for ${selectedType} matching the panel rules`);
      }
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

    // Check if component fits in available space
    if (!canAddSelected) {
      const spacing = panelComponents.filter((c) => c.componentId !== 'gap').length > 0 ? 10 : 0;
      const required = component.height + spacing;
      alert(
        `Cannot add component: ${component.name} (${component.height}mm + ${spacing}mm spacing = ${required.toFixed(1)}mm)\n` +
        (availableHeightInfo 
          ? `Available space: ${availableHeightInfo.available.toFixed(1)}mm\n` +
            `Used: ${availableHeightInfo.used.toFixed(1)}mm / Max: ${availableHeightInfo.maxHeight.toFixed(1)}mm`
          : 'No space available')
      );
      return;
    }

    // Validate against maxComponentHeight constraint
    const validationError = validateComponentHeight(
      selectedPanel,
      panelComponents,
      componentLibrary,
      combinatorsLibrary,
      rules,
      component.height,
      false
    );

    if (validationError) {
      alert(validationError);
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
                  const combinatorDef = combinatorsLibrary.find((c) => c.id === canvasComp.componentId);
                  const props = canvasComp.properties || {};
                  const isCombinator = !!combinatorDef;
                  
                  // Skip gap components - they're now handled automatically from rules
                  if (canvasComp.componentId === 'gap') {
                    return null;
                  }
                  
                  return (
                    <div
                      key={canvasComp.id}
                      className="text-xs p-2 bg-gray-50 rounded border border-gray-200 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1">
                        <div>
                          <span className="font-medium">
                            {isCombinator ? combinatorDef?.name : compDef?.name || 'Unknown'}
                          </span>
                          {isCombinator ? (
                            <span className="text-gray-500 ml-2 text-xs">(Combinator)</span>
                          ) : (
                            (props.aValue || props.vValue || props.pValue) && (
                              <span className="text-gray-500 ml-2">
                                ({[props.aValue && `A: ${props.aValue}`, props.vValue && `V: ${props.vValue}`, props.pValue && `P: ${props.pValue}`].filter(Boolean).join(', ')})
                              </span>
                            )
                          )}
                        </div>
                      </div>
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
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Component Adding Form */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Add {addMode === 'component' ? 'Component' : 'Combinator'}</h3>
            
            {/* Max Component Height Info - Always show if constraint exists */}
            {availableHeightInfo ? (
              <div className={`mb-4 p-3 rounded-lg border ${
                availableHeightInfo.available > 0 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="text-xs font-medium mb-2">
                  Max Component Height Constraint
                </div>
                <div className="text-xs text-gray-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Max Component Height:</span>
                    <span className="font-semibold">{availableHeightInfo.maxHeight.toFixed(1)}mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Used Height:</span>
                    <span>{availableHeightInfo.used.toFixed(1)}mm</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-1 mt-1">
                    <span className="font-medium">Remaining:</span>
                    <span className={`font-semibold ${
                      availableHeightInfo.available > 0 ? 'text-blue-700' : 'text-red-700'
                    }`}>
                      {availableHeightInfo.available.toFixed(1)}mm
                    </span>
                  </div>
                  {addMode === 'combinator' && selectedCombinatorId && (
                    (() => {
                      const combinator = combinatorsLibrary.find((c) => c.id === selectedCombinatorId);
                      if (!combinator) return null;
                      const spacing = panelComponents.filter((c) => c.componentId !== 'gap').length > 0 ? 10 : 0;
                      const required = combinator.height + spacing;
                      const fits = required <= availableHeightInfo.available;
                      return (
                        <div className={`mt-2 text-xs ${fits ? 'text-green-700' : 'text-red-700'}`}>
                          Selected combinator: {combinator.height}mm + {spacing}mm spacing = {required.toFixed(1)}mm {fits ? '✓ Fits' : '✗ Too large'}
                        </div>
                      );
                    })()
                  )}
                  {addMode === 'component' && selectedType && (
                    (() => {
                      const component = filteredComponentLibrary.find((c) => c.type === selectedType);
                      if (!component) return null;
                      const spacing = panelComponents.filter((c) => c.componentId !== 'gap').length > 0 ? 10 : 0;
                      const required = component.height + spacing;
                      const fits = required <= availableHeightInfo.available;
                      return (
                        <div className={`mt-2 text-xs ${fits ? 'text-green-700' : 'text-red-700'}`}>
                          Selected component: {component.height}mm + {spacing}mm spacing = {required.toFixed(1)}mm {fits ? '✓ Fits' : '✗ Too large'}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-lg border bg-gray-50 border-gray-200">
                <div className="text-xs font-medium mb-1">No Max Component Height Constraint</div>
                <div className="text-xs text-gray-600">
                  No height limit is set for this panel. You can add components freely.
                </div>
              </div>
            )}
            
            <div className="space-y-4">
            {/* Add Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add Type <span className="text-red-500">*</span>
              </label>
              <select
                value={addMode}
                onChange={(e) => {
                  setAddMode(e.target.value as 'component' | 'combinator');
                  setSelectedType('');
                  setSelectedCombinatorId('');
                  setSelectedAValue('');
                  setSelectedVValue('');
                  setSelectedPValue('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="component">Component</option>
                <option value="combinator">Combinator</option>
              </select>
            </div>

            {addMode === 'combinator' ? (
              /* Combinator Selection */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Combinator <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCombinatorId}
                  onChange={(e) => setSelectedCombinatorId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select combinator</option>
                  {combinatorsLibrary.map((combinator) => (
                    <option key={combinator.id} value={combinator.id}>
                      {combinator.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              /* Component Type Selection */
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="text-red-500">*</span>
                </label>
                {componentTypes.length === 0 ? (
                  <div className="w-full px-3 py-2 border border-yellow-300 rounded-md bg-yellow-50 text-sm text-yellow-800">
                    {applicableRules.length === 0 
                      ? 'No rules defined for this panel. Please define panel size mapping rules in Rule Book first.'
                      : 'No components match the rules for this panel. Check rule settings (panel size and component types).'}
                  </div>
                ) : (
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
                )}
              </div>
            )}

            {/* A (Amperage) Dropdown - Only show for components */}
            {addMode === 'component' && dropdowns.showA && (
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

            {/* V (Voltage) Dropdown - Only show for components */}
            {addMode === 'component' && dropdowns.showV && (
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

            {/* P (Power) Dropdown - Only show for components */}
            {addMode === 'component' && dropdowns.showP && (
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
            disabled={
              !canAddSelected ||
              (addMode === 'combinator'
                ? !selectedCombinatorId
                : !selectedType || (dropdowns.showA && !selectedAValue) || (dropdowns.showV && !selectedVValue) || (dropdowns.showP && !selectedPValue))
            }
            className={`w-full px-4 py-2 rounded-md font-medium transition-colors ${
              canAddSelected &&
              ((addMode === 'combinator' && selectedCombinatorId) ||
              (addMode === 'component' && selectedType && (!dropdowns.showA || selectedAValue) && (!dropdowns.showV || selectedVValue) && (!dropdowns.showP || selectedPValue)))
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
            title={
              !canAddSelected && availableHeightInfo
                ? `Not enough space. Available: ${availableHeightInfo.available.toFixed(1)}mm`
                : undefined
            }
          >
            Add {addMode === 'component' ? 'Component' : 'Combinator'}
            {!canAddSelected && availableHeightInfo && (
              <span className="ml-2 text-xs">(No space)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
