'use client';

import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Rule, Constraint, RuleCondition, Panel, Component } from '@/types';

interface RuleNodeEditorProps {
  node: Node;
  rule: Rule;
  panels: Panel[];
  components: Component[];
  onSave: (rule: Rule) => void;
  onDelete: (ruleId: string) => void;
  onClose: () => void;
}

export default function RuleNodeEditor({
  rule: initialRule,
  panels,
  components,
  onSave,
  onDelete,
  onClose,
}: RuleNodeEditorProps) {
  const [rule, setRule] = useState<Rule>(initialRule);
  const [editingConstraint, setEditingConstraint] = useState<Constraint | null>(null);
  const [editingCondition, setEditingCondition] = useState<RuleCondition | null>(null);

  useEffect(() => {
    setRule(initialRule);
  }, [initialRule]);

  const updateRule = (updates: Partial<Rule>) => {
    setRule({ ...rule, ...updates });
  };

  const addConstraint = () => {
    const newConstraint: Constraint = {
      type: 'overlap',
      message: '',
    };
    setRule({
      ...rule,
      constraints: [...rule.constraints, newConstraint],
    });
    setEditingConstraint(newConstraint);
  };

  const updateConstraint = (index: number, updates: Partial<Constraint>) => {
    const updated = rule.constraints.map((c, i) =>
      i === index ? { ...c, ...updates } : c
    );
    setRule({ ...rule, constraints: updated });
  };

  const deleteConstraint = (index: number) => {
    setRule({
      ...rule,
      constraints: rule.constraints.filter((_, i) => i !== index),
    });
  };

  const addCondition = () => {
    const newCondition: RuleCondition = {
      field: 'componentCount',
      operator: 'greaterThan',
      value: 0,
    };
    setRule({
      ...rule,
      conditions: [...rule.conditions, newCondition],
    });
    setEditingCondition(newCondition);
  };

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    const updated = rule.conditions.map((c, i) =>
      i === index ? { ...c, ...updates } : c
    );
    setRule({ ...rule, conditions: updated });
  };

  const deleteCondition = (index: number) => {
    setRule({
      ...rule,
      conditions: rule.conditions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Rule</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={rule.name}
              onChange={(e) => updateRule({ name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={rule.type}
              onChange={(e) =>
                updateRule({ type: e.target.value as 'global' | 'panel' | 'component' })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="global">Global</option>
              <option value="panel">Panel</option>
              <option value="component">Component</option>
            </select>
          </div>

          {rule.type === 'panel' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Panel
              </label>
              <select
                value={rule.panelId || ''}
                onChange={(e) => updateRule({ panelId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Panels</option>
                {panels.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {rule.type === 'component' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Component
              </label>
              <select
                value={rule.componentId || ''}
                onChange={(e) =>
                  updateRule({ componentId: e.target.value || undefined })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Components</option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={rule.enabled !== false}
              onChange={(e) => updateRule({ enabled: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Enabled</label>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Constraints */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Constraints</h3>
            <button
              onClick={addConstraint}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {rule.constraints.map((constraint, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-md bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <select
                    value={constraint.type}
                    onChange={(e) =>
                      updateConstraint(index, {
                        type: e.target.value as Constraint['type'],
                      })
                    }
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="overlap">No Overlaps</option>
                    <option value="bounds">Within Bounds</option>
                    <option value="spacing">Minimum Spacing</option>
                    <option value="count">Component Count</option>
                    <option value="dimension">Dimension</option>
                    <option value="co-usage">Co-usage</option>
                  </select>
                  <button
                    onClick={() => deleteConstraint(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>

                {constraint.type === 'spacing' && (
                  <div className="mt-2">
                    <label className="block text-xs text-gray-600 mb-1">
                      Minimum Spacing (mm)
                    </label>
                    <input
                      type="number"
                      value={constraint.spacing || 0}
                      onChange={(e) =>
                        updateConstraint(index, {
                          spacing: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                )}

                {constraint.type === 'co-usage' && (
                  <div className="mt-2 space-y-2">
                    {rule.type === 'component' && rule.componentId && (
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        <strong>
                          {components.find((c) => c.id === rule.componentId)?.name ||
                            rule.componentId}
                        </strong>{' '}
                        requires the following components:
                      </div>
                    )}
                    {rule.type === 'panel' && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Required Components for this Panel
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                          Select components that must be present when using this panel
                        </p>
                      </div>
                    )}
                    {rule.type === 'component' && !rule.componentId && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                        Please select a component in the rule settings above first
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Required Components (must be used together)
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                        {components.map((comp) => {
                          const isSelected =
                            constraint.requiredComponentIds?.includes(comp.id) || false;
                          return (
                            <label
                              key={comp.id}
                              className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const currentIds =
                                    constraint.requiredComponentIds || [];
                                  if (e.target.checked) {
                                    updateConstraint(index, {
                                      requiredComponentIds: [...currentIds, comp.id],
                                    });
                                  } else {
                                    updateConstraint(index, {
                                      requiredComponentIds: currentIds.filter(
                                        (id) => id !== comp.id
                                      ),
                                    });
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: comp.color }}
                                />
                                {comp.name}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      {constraint.requiredComponentIds &&
                        constraint.requiredComponentIds.length === 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            Select at least one required component
                          </p>
                        )}
                    </div>
                  </div>
                )}

                {(constraint.type === 'count' || constraint.type === 'dimension') && (
                  <>
                    {constraint.type === 'dimension' && (
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600 mb-1">
                          Property
                        </label>
                        <select
                          value={constraint.property || 'width'}
                          onChange={(e) =>
                            updateConstraint(index, { property: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="width">Width</option>
                          <option value="height">Height</option>
                        </select>
                      </div>
                    )}
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Min</label>
                        <input
                          type="number"
                          value={constraint.min || ''}
                          onChange={(e) =>
                            updateConstraint(index, {
                              min: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Max</label>
                        <input
                          type="number"
                          value={constraint.max || ''}
                          onChange={(e) =>
                            updateConstraint(index, {
                              max: e.target.value ? parseFloat(e.target.value) : undefined,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-2">
                  <label className="block text-xs text-gray-600 mb-1">Message</label>
                  <input
                    type="text"
                    value={constraint.message || ''}
                    onChange={(e) =>
                      updateConstraint(index, { message: e.target.value })
                    }
                    placeholder="Violation message"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Conditions</h3>
            <button
              onClick={addCondition}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {rule.conditions.map((condition, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-md bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2 flex-1">
                    <select
                      value={condition.field}
                      onChange={(e) =>
                        updateCondition(index, { field: e.target.value })
                      }
                      className="text-sm border border-gray-300 rounded px-2 py-1 flex-1"
                    >
                      <option value="componentCount">Component Count</option>
                      <option value="panelWidth">Panel Width</option>
                      <option value="panelHeight">Panel Height</option>
                    </select>
                    <select
                      value={condition.operator}
                      onChange={(e) =>
                        updateCondition(index, {
                          operator: e.target.value as RuleCondition['operator'],
                        })
                      }
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="equals">Equals</option>
                      <option value="greaterThan">Greater Than</option>
                      <option value="lessThan">Less Than</option>
                      <option value="notEquals">Not Equals</option>
                    </select>
                  </div>
                  <button
                    onClick={() => deleteCondition(index)}
                    className="text-red-500 hover:text-red-700 text-sm ml-2"
                  >
                    Delete
                  </button>
                </div>
                <input
                  type="number"
                  value={condition.value as number}
                  onChange={(e) =>
                    updateCondition(index, { value: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-2"
                />
              </div>
            ))}
          </div>
        </div>
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

