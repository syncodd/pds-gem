'use client';

import { Component } from '@/types';
import ComponentSpecsEditor from '../ComponentSpecsEditor';

interface SpecsStepProps {
  component: Component;
  onChange: (updates: Partial<Component>) => void;
}

export default function SpecsStep({ component, onChange }: SpecsStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Specifications</h3>
        <p className="text-sm text-gray-600 mb-4">
          Add specifications for your component. These can include voltage, current, rating, and other technical details.
        </p>
        <ComponentSpecsEditor
          specs={component.specs || {}}
          onChange={(specs) => onChange({ specs })}
        />
      </div>
    </div>
  );
}
