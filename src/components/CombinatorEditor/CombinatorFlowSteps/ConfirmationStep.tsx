'use client';

import { Combinator } from '@/types';
import { usePanelStore } from '@/lib/store';

interface ConfirmationStepProps {
  combinator: Combinator;
}

export default function ConfirmationStep({ combinator }: ConfirmationStepProps) {
  const { componentLibrary } = usePanelStore();

  const componentDetails = combinator.componentIds
    .map((id) => componentLibrary.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Review Combinator</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please review your combinator details before creating.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Basic Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-800">{combinator.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-medium text-gray-800">{combinator.id || '—'}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Dimensions</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Width:</span>
              <span className="font-medium text-gray-800">{combinator.width}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Height:</span>
              <span className="font-medium text-gray-800">{combinator.height}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Depth:</span>
              <span className="font-medium text-gray-800">{combinator.depth || 200}mm</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Properties</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Brand:</span>
              <span className="font-medium text-gray-800">{combinator.brand || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Series:</span>
              <span className="font-medium text-gray-800">{combinator.series || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current (A):</span>
              <span className="font-medium text-gray-800">{combinator.currentA || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pole:</span>
              <span className="font-medium text-gray-800">{combinator.pole || '—'}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Components ({componentDetails.length})
          </h4>
          {componentDetails.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No components selected</p>
          ) : (
            <div className="space-y-1 text-sm">
              {componentDetails.map((comp) => (
                <div key={comp!.id} className="flex justify-between">
                  <span className="text-gray-600">{comp!.name}:</span>
                  <span className="font-medium text-gray-800">{comp!.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

