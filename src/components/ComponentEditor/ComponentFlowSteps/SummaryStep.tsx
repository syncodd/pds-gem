'use client';

import { Component } from '@/types';

interface SummaryStepProps {
  component: Component;
  isEdit: boolean;
}

export default function SummaryStep({ component, isEdit }: SummaryStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {isEdit ? 'Component Updated!' : 'Component Created!'}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {isEdit
            ? 'Your component has been successfully updated in the library.'
            : 'Your component has been successfully added to the library.'}
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-12 h-12 rounded border-2 border-gray-300"
            style={{ backgroundColor: component.color }}
          />
          <div>
            <h4 className="text-lg font-semibold text-gray-800">{component.name}</h4>
            <p className="text-sm text-gray-500">ID: {component.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Type:</span>
            <span className="ml-2 font-medium text-gray-800">{component.type}</span>
          </div>
          <div>
            <span className="text-gray-600">Category:</span>
            <span className="ml-2 font-medium text-gray-800">{component.category}</span>
          </div>
          <div>
            <span className="text-gray-600">Dimensions:</span>
            <span className="ml-2 font-medium text-gray-800">
              {component.width} × {component.height} × {component.depth || 45}mm
            </span>
          </div>
          <div>
            <span className="text-gray-600">Specifications:</span>
            <span className="ml-2 font-medium text-gray-800">
              {Object.keys(component.specs || {}).length} defined
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
