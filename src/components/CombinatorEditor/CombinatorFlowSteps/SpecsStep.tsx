'use client';

import { useState } from 'react';
import { Combinator } from '@/types';

interface SpecsStepProps {
  combinator: Combinator;
  onChange: (updates: Partial<Combinator>) => void;
}

export default function SpecsStep({ combinator, onChange }: SpecsStepProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newValueType, setNewValueType] = useState<'string' | 'number'>('string');
  const specs = combinator.specs || {};

  const handleAddSpec = () => {
    if (!newKey.trim()) return;

    const value = newValueType === 'number' ? parseFloat(newValue) || 0 : newValue;
    onChange({
      specs: {
        ...specs,
        [newKey.trim()]: value,
      },
    });
    setNewKey('');
    setNewValue('');
    setNewValueType('string');
  };

  const handleUpdateSpec = (key: string, value: string | number) => {
    const updated = { ...specs };
    updated[key] = value;
    onChange({ specs: updated });
  };

  const handleRemoveSpec = (key: string) => {
    const updated = { ...specs };
    delete updated[key];
    onChange({ specs: updated });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSpec();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Combinator Specifications</h3>
        <p className="text-sm text-gray-600 mb-4">
          Define key-value specifications for this combinator. These can be used in rule mappings.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specifications
        </label>
        <div className="space-y-2">
          {Object.entries(specs).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={key}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-600"
                />
                <input
                  type={typeof value === 'number' ? 'number' : 'text'}
                  value={value}
                  onChange={(e) => {
                    const newValue =
                      typeof value === 'number'
                        ? parseFloat(e.target.value) || 0
                        : e.target.value;
                    handleUpdateSpec(key, newValue);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSpec(key)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm font-medium transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
          {Object.keys(specs).length === 0 && (
            <p className="text-sm text-gray-500 italic">No specifications defined yet.</p>
          )}
        </div>
      </div>

      {/* Add new spec */}
      <div className="border-t border-gray-200 pt-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Add New Specification</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Key (e.g., voltage, current)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newValueType}
            onChange={(e) => setNewValueType(e.target.value as 'string' | 'number')}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
          </select>
          <input
            type={newValueType === 'number' ? 'number' : 'text'}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Value"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddSpec}
            disabled={!newKey.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

