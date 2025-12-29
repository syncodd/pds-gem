'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Panel, CanvasComponent, Combinator } from '@/types';
import { usePanelStore } from '@/lib/store';
import {
  getPanelSizeFromWidth,
  extractBrandValues,
  extractSeriesValues,
  extractCurrentAValues,
  extractPoleValues,
} from '@/lib/componentUtils';

interface CombinatorPropertiesPanelProps {
  isOpen: boolean;
  selectedCombinator: { canvasComp: CanvasComponent; combinatorDef: Combinator } | null;
  selectedPanel: Panel | null;
  onUpdateCombinator?: (componentId: string, newCombinatorId: string) => void;
  onClose: () => void;
}

export default function CombinatorPropertiesPanel({
  isOpen,
  selectedCombinator,
  selectedPanel,
  onUpdateCombinator,
  onClose,
}: CombinatorPropertiesPanelProps) {
  const { combinatorsLibrary, rules, panelsLibrary } = usePanelStore();
  
  // State for editing selected combinator properties
  const [editingBrand, setEditingBrand] = useState<string>('');
  const [editingSeries, setEditingSeries] = useState<string>('');
  const [editingCurrentA, setEditingCurrentA] = useState<string>('');
  const [editingPole, setEditingPole] = useState<string>('');
  
  // Initialize editing state when combinator is selected
  useEffect(() => {
    if (selectedCombinator) {
      setEditingBrand(selectedCombinator.combinatorDef.brand || '');
      setEditingSeries(selectedCombinator.combinatorDef.series || '');
      setEditingCurrentA(selectedCombinator.combinatorDef.currentA || '');
      setEditingPole(selectedCombinator.combinatorDef.pole || '');
    }
  }, [selectedCombinator]);

  // Get applicable combinator panel size mapping rules for this panel
  const applicableCombinatorRules = useMemo(() => {
    if (!selectedPanel || !rules || rules.length === 0) return [];
    
    return rules
      .filter((rule) => {
        if (rule.enabled === false) return false;
        const hasCombinatorPanelSizeMapping = rule.constraints.some(
          (constraint) => constraint.type === 'combinatorPanelSizeMapping'
        );
        if (!hasCombinatorPanelSizeMapping) return false;
        
        if (rule.type === 'global') return true;
        if (rule.type === 'panel') {
          if (rule.panelId === selectedPanel.id) return true;
          if (rule.panelId && panelsLibrary) {
            const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
            if (libraryPanel && libraryPanel.width === selectedPanel.width) return true;
          }
          return false;
        }
        return false;
      })
      .flatMap((rule) => 
        rule.constraints
          .filter((c) => c.type === 'combinatorPanelSizeMapping')
          .map((constraint) => ({ rule, constraint }))
      );
  }, [rules, selectedPanel, panelsLibrary]);

  // Filter combinator library based on applicable rules
  const filteredCombinatorsLibrary = useMemo(() => {
    if (!selectedPanel) return combinatorsLibrary;
    if (applicableCombinatorRules.length === 0) return [];
    
    const firstRule = applicableCombinatorRules[0];
    const constraint = firstRule.constraint;
    const panelSize = constraint.panelSize !== undefined 
      ? constraint.panelSize 
      : getPanelSizeFromWidth(selectedPanel.width);
    
    const allowedCombinatorTypes = constraint.combinatorTypes || [];
    
    return combinatorsLibrary.filter((comb) => {
      if (comb.panelSize === undefined || Number(comb.panelSize) !== panelSize) {
        return false;
      }
      if (allowedCombinatorTypes.length > 0) {
        return allowedCombinatorTypes.includes(comb.name);
      }
      return true;
    });
  }, [combinatorsLibrary, selectedPanel, applicableCombinatorRules]);

  // Get applicable property mapping rules
  const applicablePropertyMappingRules = useMemo(() => {
    if (!selectedPanel || !rules || rules.length === 0) return [];
    
    return rules
      .filter((rule) => {
        if (rule.enabled === false) return false;
        const hasPropertyMapping = rule.constraints.some(
          (constraint) => 
            constraint.type === 'combinatorPanelBrandMapping' ||
            constraint.type === 'combinatorPanelSeriesMapping' ||
            constraint.type === 'combinatorPanelCurrentMapping' ||
            constraint.type === 'combinatorPanelPoleMapping'
        );
        if (!hasPropertyMapping) return false;
        
        if (rule.type === 'global') return true;
        if (rule.type === 'panel') {
          if (rule.panelId === selectedPanel.id) return true;
          if (rule.panelId && panelsLibrary) {
            const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
            if (libraryPanel && libraryPanel.width === selectedPanel.width) return true;
          }
          return false;
        }
        return false;
      })
      .flatMap((rule) => 
        rule.constraints
          .filter((c) => 
            c.type === 'combinatorPanelBrandMapping' ||
            c.type === 'combinatorPanelSeriesMapping' ||
            c.type === 'combinatorPanelCurrentMapping' ||
            c.type === 'combinatorPanelPoleMapping'
          )
          .map((constraint) => ({ rule, constraint }))
      );
  }, [rules, selectedPanel, panelsLibrary]);

  // Get allowed values from rules
  const allowedBrandValues = useMemo(() => {
    const brandConstraint = applicablePropertyMappingRules.find(
      (r) => r.constraint.type === 'combinatorPanelBrandMapping'
    );
    return brandConstraint?.constraint.propertyValues || [];
  }, [applicablePropertyMappingRules]);

  const allowedSeriesValues = useMemo(() => {
    const seriesConstraint = applicablePropertyMappingRules.find(
      (r) => r.constraint.type === 'combinatorPanelSeriesMapping'
    );
    return seriesConstraint?.constraint.propertyValues || [];
  }, [applicablePropertyMappingRules]);

  const allowedCurrentAValues = useMemo(() => {
    const currentConstraint = applicablePropertyMappingRules.find(
      (r) => r.constraint.type === 'combinatorPanelCurrentMapping'
    );
    return currentConstraint?.constraint.propertyValues || [];
  }, [applicablePropertyMappingRules]);

  const allowedPoleValues = useMemo(() => {
    const poleConstraint = applicablePropertyMappingRules.find(
      (r) => r.constraint.type === 'combinatorPanelPoleMapping'
    );
    return poleConstraint?.constraint.propertyValues || [];
  }, [applicablePropertyMappingRules]);

  // Get available values for editing
  const editingBrandValues = useMemo(() => {
    if (!selectedCombinator || allowedBrandValues.length === 0) return [];
    const allBrands = extractBrandValues(filteredCombinatorsLibrary);
    return allBrands.filter((brand) => allowedBrandValues.includes(brand));
  }, [selectedCombinator, filteredCombinatorsLibrary, allowedBrandValues]);
  
  const editingSeriesValues = useMemo(() => {
    if (!selectedCombinator || allowedSeriesValues.length === 0) return [];
    let filtered = filteredCombinatorsLibrary;
    if (editingBrand) {
      filtered = filtered.filter((c) => c.brand === editingBrand);
    }
    const allSeries = extractSeriesValues(filtered);
    return allSeries.filter((series) => allowedSeriesValues.includes(series));
  }, [selectedCombinator, filteredCombinatorsLibrary, editingBrand, allowedSeriesValues]);
  
  const editingCurrentAValues = useMemo(() => {
    if (!selectedCombinator || allowedCurrentAValues.length === 0) return [];
    let filtered = filteredCombinatorsLibrary;
    if (editingBrand) {
      filtered = filtered.filter((c) => c.brand === editingBrand);
    }
    if (editingSeries) {
      filtered = filtered.filter((c) => c.series === editingSeries);
    }
    const allCurrentA = extractCurrentAValues(filtered);
    return allCurrentA.filter((currentA) => allowedCurrentAValues.includes(currentA));
  }, [selectedCombinator, filteredCombinatorsLibrary, editingBrand, editingSeries, allowedCurrentAValues]);
  
  const editingPoleValues = useMemo(() => {
    if (!selectedCombinator || allowedPoleValues.length === 0) return [];
    let filtered = filteredCombinatorsLibrary;
    if (editingBrand) {
      filtered = filtered.filter((c) => c.brand === editingBrand);
    }
    if (editingSeries) {
      filtered = filtered.filter((c) => c.series === editingSeries);
    }
    if (editingCurrentA) {
      filtered = filtered.filter((c) => c.currentA === editingCurrentA);
    }
    const allPoles = extractPoleValues(filtered);
    return allPoles.filter((pole) => allowedPoleValues.includes(pole));
  }, [selectedCombinator, filteredCombinatorsLibrary, editingBrand, editingSeries, editingCurrentA, allowedPoleValues]);
  
  // Find matching combinator when properties change
  const findMatchingCombinator = useCallback((brand: string, series: string, currentA: string, pole: string) => {
    return filteredCombinatorsLibrary.find((c) => {
      const brandMatch = !brand || c.brand === brand;
      const seriesMatch = !series || c.series === series;
      const currentAMatch = !currentA || c.currentA === currentA;
      const poleMatch = !pole || c.pole === pole;
      return brandMatch && seriesMatch && currentAMatch && poleMatch;
    });
  }, [filteredCombinatorsLibrary]);
  
  // Handle property change
  const handlePropertyChange = useCallback((property: 'brand' | 'series' | 'currentA' | 'pole', value: string) => {
    let newBrand = editingBrand;
    let newSeries = editingSeries;
    let newCurrentA = editingCurrentA;
    let newPole = editingPole;
    
    if (property === 'brand') {
      newBrand = value;
      newSeries = '';
      newCurrentA = '';
      newPole = '';
      setEditingBrand(value);
      setEditingSeries('');
      setEditingCurrentA('');
      setEditingPole('');
    } else if (property === 'series') {
      newSeries = value;
      newCurrentA = '';
      newPole = '';
      setEditingSeries(value);
      setEditingCurrentA('');
      setEditingPole('');
    } else if (property === 'currentA') {
      newCurrentA = value;
      newPole = '';
      setEditingCurrentA(value);
      setEditingPole('');
    } else if (property === 'pole') {
      newPole = value;
      setEditingPole(value);
    }
    
    // Find matching combinator and update immediately
    const matchingCombinator = findMatchingCombinator(newBrand, newSeries, newCurrentA, newPole);
    if (matchingCombinator && onUpdateCombinator && selectedCombinator) {
      onUpdateCombinator(selectedCombinator.canvasComp.id, matchingCombinator.id);
    }
  }, [editingBrand, editingSeries, editingCurrentA, editingPole, findMatchingCombinator, onUpdateCombinator, selectedCombinator]);

  if (!isOpen || !selectedCombinator) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none">
      <div
        className={`pointer-events-auto w-96 h-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-orange-50">
          <h2 className="text-lg font-semibold text-gray-800">Edit Combinator: {selectedCombinator.combinatorDef.name}</h2>
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

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {allowedBrandValues.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <select
                  value={editingBrand}
                  onChange={(e) => handlePropertyChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {editingBrandValues.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {allowedSeriesValues.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Series</label>
                <select
                  value={editingSeries}
                  onChange={(e) => handlePropertyChange('series', e.target.value)}
                  disabled={!editingBrand}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {editingSeriesValues.map((series) => (
                    <option key={series} value={series}>
                      {series}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {allowedCurrentAValues.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current (A)</label>
                <select
                  value={editingCurrentA}
                  onChange={(e) => handlePropertyChange('currentA', e.target.value)}
                  disabled={!editingBrand || !editingSeries}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {editingCurrentAValues.map((currentA) => (
                    <option key={currentA} value={currentA}>
                      {currentA}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {allowedPoleValues.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pole</label>
                <select
                  value={editingPole}
                  onChange={(e) => handlePropertyChange('pole', e.target.value)}
                  disabled={!editingBrand || !editingSeries || !editingCurrentA}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {editingPoleValues.map((pole) => (
                    <option key={pole} value={pole}>
                      {pole}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {allowedBrandValues.length === 0 && allowedSeriesValues.length === 0 && allowedCurrentAValues.length === 0 && allowedPoleValues.length === 0 && (
              <div className="text-sm text-gray-500 italic">
                No property mapping rules defined for this panel. Properties cannot be edited.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

