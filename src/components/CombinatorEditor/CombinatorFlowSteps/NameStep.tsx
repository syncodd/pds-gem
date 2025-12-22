'use client';

import { useEffect, useRef } from 'react';
import { Combinator } from '@/types';

interface NameStepProps {
  combinator: Combinator;
  onChange: (updates: Partial<Combinator>) => void;
}

function generateCombinatorId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `combinator-${Date.now()}`;
}

export default function NameStep({ combinator, onChange }: NameStepProps) {
  const lastGeneratedNameRef = useRef<string>('');
  const isIdManuallyEditedRef = useRef(false);

  useEffect(() => {
    // Auto-generate ID when name changes (only if ID hasn't been manually edited)
    if (combinator.name && combinator.name.trim() !== '' && !isIdManuallyEditedRef.current) {
      // Only auto-generate if name actually changed
      if (combinator.name !== lastGeneratedNameRef.current) {
        const autoId = generateCombinatorId(combinator.name);
        // Only update if current ID is empty or matches default pattern
        if (!combinator.id || (combinator.id.startsWith('combinator-') && combinator.id.length < 20)) {
          onChange({ id: autoId });
          lastGeneratedNameRef.current = combinator.name;
        }
      }
    }
  }, [combinator.name, combinator.id, onChange]);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isIdManuallyEditedRef.current = true;
    onChange({ id: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Combinator Name</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter a name for your combinator. A unique ID will be automatically generated.
        </p>
        <input
          type="text"
          value={combinator.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g., MCB Box 16A"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Combinator ID</h3>
        <p className="text-sm text-gray-600 mb-4">
          Unique identifier for this combinator. You can edit this if needed.
        </p>
        <input
          type="text"
          value={combinator.id}
          onChange={handleIdChange}
          placeholder="combinator-id"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

