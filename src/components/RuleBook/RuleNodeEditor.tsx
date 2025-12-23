'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Rule, Constraint, RuleCondition, Panel, Component } from '@/types';
import { getComponentTypes } from '@/lib/componentUtils';

interface RuleNodeEditorProps {
  node: Node;
  rule?: Rule;
  panels: Panel[];
  components: Component[];
  onSave: (rule?: Rule) => void;
  onDelete: (ruleId: string) => void;
  onClose: () => void;
  onUpdateNode?: (nodeId: string, data: any) => void;
}

export default function RuleNodeEditor({
  node,
  rule: initialRule,
  panels,
  components,
  onSave,
  onDelete,
  onClose,
  onUpdateNode,
}: RuleNodeEditorProps) {
  // Determine node type
  const isPanelNode = !!node.data.panelId || !!node.data.panel;
  const isConstraintNode = !!node.data.constraint;
  const isConditionNode = !!node.data.condition;
  const isLogicalNode = !!node.data.logicalOperator;
  const isRuleNode = !!initialRule;

  // State for different node types
  const [constraint, setConstraint] = useState<Constraint | null>(
    isConstraintNode ? (node.data.constraint as Constraint) : null
  );
  const [condition, setCondition] = useState<RuleCondition | null>(
    isConditionNode ? (node.data.condition as RuleCondition) : null
  );
  const [selectedPanelId, setSelectedPanelId] = useState<string>(
    isPanelNode ? (node.data.panelId || '') : ''
  );

  useEffect(() => {
    if (isConstraintNode) {
      setConstraint(node.data.constraint as Constraint);
    }
    if (isConditionNode) {
      setCondition(node.data.condition as RuleCondition);
    }
    if (isPanelNode) {
      setSelectedPanelId(node.data.panelId || '');
    }
  }, [node, isConstraintNode, isConditionNode, isPanelNode]);

  // Panel Node Editor
  if (isPanelNode) {
    const selectedPanel = panels.find((p) => p.id === selectedPanelId);
    
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Panel Node</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Panel
            </label>
            <select
              value={selectedPanelId}
              onChange={(e) => {
                const newPanelId = e.target.value;
                setSelectedPanelId(newPanelId);
                const selectedPanel = panels.find((p) => p.id === newPanelId);
                const updatedData = {
                  ...node.data,
                  panelId: newPanelId,
                  panel: selectedPanel,
                  label: newPanelId === 'global' ? 'Global Rules' : selectedPanel?.name || 'Panel',
                };
                if (onUpdateNode) {
                  onUpdateNode(node.id, updatedData);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="global">Global Rules</option>
              {panels.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {selectedPanel && (
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-700">Name: </span>
                <span className="text-sm text-gray-600">{selectedPanel.name}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">Dimensions: </span>
                <span className="text-sm text-gray-600">
                  {selectedPanel.width}mm × {selectedPanel.height}mm
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              onDelete(node.id);
            }}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  // Constraint Node Editor
  if (isConstraintNode && constraint) {
    const updateConstraint = (updates: Partial<Constraint>) => {
      let updatedConstraint: Constraint;
      
      // When constraint type changes, reset type-specific fields
      if (updates.type && updates.type !== constraint.type) {
        updatedConstraint = {
          type: updates.type,
          message: constraint.message, // Keep message
          // Clear type-specific fields
          spacing: undefined,
          panelIds: undefined,
          componentType: undefined,
          componentTypes: undefined,
          panelSize: undefined,
          property: undefined,
          min: undefined,
          max: undefined,
          value: undefined,
          requiredComponentIds: undefined,
          targetComponentId: undefined,
        };
      } else {
        updatedConstraint = { ...constraint, ...updates };
      }
      
      setConstraint(updatedConstraint);
      // Immediately update node data
      if (onUpdateNode) {
        onUpdateNode(node.id, { ...node.data, constraint: updatedConstraint });
      }
    };

    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Constraint</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Constraint Type
            </label>
            <select
              value={constraint.type}
              onChange={(e) =>
                updateConstraint({
                  type: e.target.value as Constraint['type'],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="panelSizeMapping">Panel Size Mapping</option>
            </select>
          </div>

          {constraint.type === 'panelSizeMapping' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Component Types (select one or more, or leave empty for all components)
                </label>
                <select
                  multiple
                  value={constraint.componentTypes || (constraint.componentType ? [constraint.componentType] : [])}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                    updateConstraint({
                      componentTypes: selected.length > 0 ? selected : undefined,
                      componentType: undefined, // Clear old single componentType
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  style={{ minHeight: '120px' }}
                  size={Math.min(8, getComponentTypes(components).length + 1)}
                >
                  {getComponentTypes(components).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl/Cmd to select multiple. Leave empty to apply to all component types.
                  {constraint.componentTypes && constraint.componentTypes.length > 0 && (
                    <span className="block mt-1">
                      Selected: {constraint.componentTypes.join(', ')}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Panel Size (cm) <span className="text-red-500">*</span>
                </label>
                <select
                  value={constraint.panelSize || (() => {
                    // Extract unique panel sizes from components and use first as default
                    const panelSizes = new Set<number>();
                    components.forEach((comp) => {
                      if (comp.specs?.panelSize && typeof comp.specs.panelSize === 'number') {
                        panelSizes.add(comp.specs.panelSize);
                      }
                    });
                    return Array.from(panelSizes).sort((a, b) => a - b)[0] || '';
                  })()}
                  onChange={(e) =>
                    updateConstraint({
                      panelSize: Number(e.target.value),
                    })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {(() => {
                    // Extract unique panel sizes from components
                    const panelSizes = new Set<number>();
                    components.forEach((comp) => {
                      if (comp.specs?.panelSize && typeof comp.specs.panelSize === 'number') {
                        panelSizes.add(comp.specs.panelSize);
                      }
                    });
                    return Array.from(panelSizes).sort((a, b) => a - b).map((size) => (
                      <option key={size} value={size}>
                        {size} cm
                      </option>
                    ));
                  })()}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the panel size for this constraint
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <input
              type="text"
              value={constraint.message || ''}
              onChange={(e) => updateConstraint({ message: e.target.value })}
              placeholder="Violation message"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              onDelete(node.id);
            }}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  // Condition Node Editor
  if (isConditionNode && condition) {
    const updateCondition = (updates: Partial<RuleCondition>) => {
      const updatedCondition = { ...condition, ...updates };
      setCondition(updatedCondition);
      // Immediately update node data
      if (onUpdateNode) {
        onUpdateNode(node.id, { ...node.data, condition: updatedCondition });
      }
    };

    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Condition</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field</label>
            <select
              value={condition.field}
              onChange={(e) => updateCondition({ field: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="componentCount">Component Count</option>
              <option value="panelWidth">Panel Width</option>
              <option value="panelHeight">Panel Height</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
            <select
              value={condition.operator}
              onChange={(e) =>
                updateCondition({
                  operator: e.target.value as RuleCondition['operator'],
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="equals">Equals</option>
              <option value="greaterThan">Greater Than</option>
              <option value="lessThan">Less Than</option>
              <option value="notEquals">Not Equals</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            <input
              type="number"
              value={condition.value as number}
              onChange={(e) =>
                updateCondition({ value: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              onDelete(node.id);
            }}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  // Logical Operator Node Editor
  if (isLogicalNode) {
    const [logicalOperator, setLogicalOperator] = useState<'and' | 'or'>(
      node.data.logicalOperator || 'and'
    );

    useEffect(() => {
      if (node.data.logicalOperator) {
        setLogicalOperator(node.data.logicalOperator);
      }
    }, [node]);

    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Logical Operator</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Operator Type
            </label>
            <select
              value={logicalOperator}
              onChange={(e) => {
                const newOperator = e.target.value as 'and' | 'or';
                setLogicalOperator(newOperator);
                const updatedData = {
                  ...node.data,
                  logicalOperator: newOperator,
                  label: newOperator.toUpperCase(),
                };
                if (onUpdateNode) {
                  onUpdateNode(node.id, updatedData);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="and">AND</option>
              <option value="or">OR</option>
            </select>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              onDelete(node.id);
            }}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  // Legacy Rule Node Editor (for backward compatibility)
  if (isRuleNode && initialRule) {
    const [rule, setRule] = useState<Rule>(initialRule);

    useEffect(() => {
      setRule(initialRule);
    }, [initialRule]);

    const updateRule = (updates: Partial<Rule>) => {
      setRule({ ...rule, ...updates });
    };

    // ... (keep the existing rule editor code)
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Edit Rule (Legacy)</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-500">
            This is a legacy rule node. Consider using the new panel-based structure.
          </p>
        </div>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => onDelete(rule.id)}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Edit Node</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
      <p className="text-sm text-gray-500">Unknown node type</p>
    </div>
  );
}
