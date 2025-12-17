'use client';

import { Panel } from '@/types';

interface ConfirmationStepProps {
  panel: Panel;
}

export default function ConfirmationStep({ panel }: ConfirmationStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Review Panel Details</h3>
        <p className="text-sm text-gray-600 mb-6">
          Please review all the information below before creating the panel.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Name</p>
            <p className="text-base text-gray-800 mt-1">{panel.name || '—'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">ID</p>
            <p className="text-base text-gray-800 mt-1">{panel.id || '—'}</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-500 mb-2">Dimensions</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Width</p>
              <p className="text-base text-gray-800">{panel.width}mm</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Height</p>
              <p className="text-base text-gray-800">{panel.height}mm</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Depth</p>
              <p className="text-base text-gray-800">{panel.depth || 200}mm</p>
            </div>
          </div>
        </div>

        {(panel.type || panel.category) && (
          <div className="border-t border-gray-200 pt-4">
            <p className="text-sm font-medium text-gray-500 mb-2">Properties</p>
            <div className="grid grid-cols-2 gap-4">
              {panel.type && (
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="text-base text-gray-800">{panel.type}</p>
                </div>
              )}
              {panel.category && (
                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="text-base text-gray-800">{panel.category}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm font-medium text-gray-500 mb-2">Models</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">2D Model (SVG)</p>
              <p className="text-base text-gray-800 break-all">
                {panel.model2D ? (
                  <span className="text-green-600">✓ {panel.model2D}</span>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">3D Model</p>
              <p className="text-base text-gray-800 break-all">
                {panel.model3D ? (
                  <span className="text-green-600">✓ {panel.model3D}</span>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

