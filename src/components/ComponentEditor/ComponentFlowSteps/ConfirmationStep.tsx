'use client';

import { Component } from '@/types';

interface ConfirmationStepProps {
  component: Component;
}

export default function ConfirmationStep({ component }: ConfirmationStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Review Component</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please review your component details before creating.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Basic Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium text-gray-800">{component.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-medium text-gray-800">{component.id || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium text-gray-800">{component.type || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium text-gray-800">{component.category || '—'}</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Dimensions</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Width:</span>
              <span className="font-medium text-gray-800">{component.width}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Height:</span>
              <span className="font-medium text-gray-800">{component.height}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Depth:</span>
              <span className="font-medium text-gray-800">{component.depth || 45}mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Color:</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{ backgroundColor: component.color }}
                />
                <span className="font-medium text-gray-800">{component.color}</span>
              </div>
            </div>
          </div>
        </div>

        {Object.keys(component.specs || {}).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Specifications</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(component.specs || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-gray-600">{key}:</span>
                  <span className="font-medium text-gray-800">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(component.model2D || component.model3D) && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Models</h4>
            <div className="space-y-2 text-sm">
              {component.model2D && (
                <div className="flex justify-between">
                  <span className="text-gray-600">2D Model:</span>
                  <span className="font-medium text-gray-800 text-xs truncate max-w-xs">
                    {component.model2D}
                  </span>
                </div>
              )}
              {component.model3D && (
                <div className="flex justify-between">
                  <span className="text-gray-600">3D Model:</span>
                  <span className="font-medium text-gray-800 text-xs truncate max-w-xs">
                    {component.model3D}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {component.tags && component.tags.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {component.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
