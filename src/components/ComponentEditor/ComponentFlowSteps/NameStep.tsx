'use client';

import { useEffect, useRef } from 'react';
import { Component } from '@/types';

interface NameStepProps {
  component: Component;
  onChange: (updates: Partial<Component>) => void;
}

function generateComponentId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `component-${Date.now()}`;
}

export default function NameStep({ component, onChange }: NameStepProps) {
  const lastGeneratedNameRef = useRef<string>('');
  const isIdManuallyEditedRef = useRef(false);

  useEffect(() => {
    // Auto-generate ID when name changes (only if ID hasn't been manually edited)
    if (component.name && component.name.trim() !== '' && !isIdManuallyEditedRef.current) {
      // Only auto-generate if name actually changed
      if (component.name !== lastGeneratedNameRef.current) {
        const autoId = generateComponentId(component.name);
        // Only update if current ID is empty or matches default pattern
        if (!component.id || (component.id.startsWith('component-') && component.id.length < 20)) {
          onChange({ id: autoId });
          lastGeneratedNameRef.current = component.name;
        }
      }
    }
  }, [component.name, component.id]);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isIdManuallyEditedRef.current = true;
    onChange({ id: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Component Name</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter a name for your component. A unique ID will be automatically generated.
        </p>
        <input
          type="text"
          value={component.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g., Switch 16A"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Component ID</h3>
        <p className="text-sm text-gray-600 mb-4">
          Unique identifier for this component. You can edit this if needed.
        </p>
        <input
          type="text"
          value={component.id}
          onChange={handleIdChange}
          placeholder="component-id"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Type</h3>
          <p className="text-sm text-gray-600 mb-4">
            Component type (e.g., switch, breaker, fuse, relay)
          </p>
          <input
            type="text"
            value={component.type}
            onChange={(e) => onChange({ type: e.target.value })}
            placeholder="e.g., switch"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Category</h3>
          <p className="text-sm text-gray-600 mb-4">
            Component category (e.g., switches, protection, control)
          </p>
          <input
            type="text"
            value={component.category}
            onChange={(e) => onChange({ category: e.target.value })}
            placeholder="e.g., switches"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
