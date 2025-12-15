'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Rule, Constraint, RuleCondition, Panel, Component } from '@/types';

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
              onChange={(e) => setSelectedPanelId(e.target.value)}
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
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={() => {
              const updatedData = {
                ...node.data,
                panelId: selectedPanelId,
                panel: selectedPanel,
                label: selectedPanelId === 'global' ? 'Global Rules' : selectedPanel?.name || 'Panel',
              };
              if (onUpdateNode) {
                onUpdateNode(node.id, updatedData);
              }
              onSave();
            }}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={() => {
              onDelete(node.id);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
      setConstraint({ ...constraint, ...updates });
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
              <option value="overlap">No Overlaps</option>
              <option value="bounds">Within Bounds</option>
              <option value="spacing">Minimum Spacing</option>
              <option value="count">Component Count</option>
              <option value="dimension">Dimension</option>
              <option value="co-usage">Co-usage</option>
              <option value="noIntersectWithPanelBounds">Not Intersect with Panel Bounds</option>
            </select>
          </div>

          {constraint.type === 'spacing' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Spacing (mm)
              </label>
              <input
                type="number"
                value={constraint.spacing || 0}
                onChange={(e) =>
                  updateConstraint({
                    spacing: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          )}

          {constraint.type === 'noIntersectWithPanelBounds' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Panels (at least 2 required)
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                {panels.map((panel) => {
                  const isSelected = constraint.panelIds?.includes(panel.id) || false;
                  return (
                    <label
                      key={panel.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const currentIds = constraint.panelIds || [];
                          if (e.target.checked) {
                            updateConstraint({
                              panelIds: [...currentIds, panel.id],
                            });
                          } else {
                            updateConstraint({
                              panelIds: currentIds.filter((id) => id !== panel.id),
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span>{panel.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {(constraint.type === 'count' || constraint.type === 'dimension') && (
            <>
              {constraint.type === 'dimension' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property
                  </label>
                  <select
                    value={constraint.property || 'width'}
                    onChange={(e) => updateConstraint({ property: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="width">Width</option>
                    <option value="height">Height</option>
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min</label>
                  <input
                    type="number"
                    value={constraint.min || ''}
                    onChange={(e) =>
                      updateConstraint({
                        min: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max</label>
                  <input
                    type="number"
                    value={constraint.max || ''}
                    onChange={(e) =>
                      updateConstraint({
                        max: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
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
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={() => {
              const updatedData = { ...node.data, constraint };
              if (onUpdateNode) {
                onUpdateNode(node.id, updatedData);
              }
              onSave();
            }}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={() => {
              onDelete(node.id);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
      setCondition({ ...condition, ...updates });
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
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={() => {
              const updatedData = { ...node.data, condition };
              if (onUpdateNode) {
                onUpdateNode(node.id, updatedData);
              }
              onSave();
            }}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={() => {
              onDelete(node.id);
            }}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={() => onSave(rule)}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Save
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
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
