'use client';

import { useEffect, useRef } from 'react';
import { Panel } from '@/types';
import { generatePanelId } from '@/lib/svgUtils';

interface NameStepProps {
  panel: Panel;
  onChange: (updates: Partial<Panel>) => void;
}

export default function NameStep({ panel, onChange }: NameStepProps) {
  const lastGeneratedNameRef = useRef<string>('');
  const isIdManuallyEditedRef = useRef(false);

  useEffect(() => {
    // Auto-generate ID when name changes (only if ID hasn't been manually edited)
    if (panel.name && panel.name.trim() !== '' && !isIdManuallyEditedRef.current) {
      // Only auto-generate if name actually changed
      if (panel.name !== lastGeneratedNameRef.current) {
        const autoId = generatePanelId(panel.name);
        // Only update if current ID is empty or matches default pattern
        if (!panel.id || (panel.id.startsWith('panel-') && panel.id.length < 20)) {
          onChange({ id: autoId });
          lastGeneratedNameRef.current = panel.name;
        }
      }
    }
  }, [panel.name, panel.id]);

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isIdManuallyEditedRef.current = true;
    onChange({ id: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Panel Name</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enter a name for your panel. A unique ID will be automatically generated.
        </p>
        <input
          type="text"
          value={panel.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g., Standard Panel 600x800"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Panel ID</h3>
        <p className="text-sm text-gray-600 mb-4">
          Unique identifier for this panel. You can edit this if needed.
        </p>
        <input
          type="text"
          value={panel.id}
          onChange={handleIdChange}
          placeholder="panel-id"
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

