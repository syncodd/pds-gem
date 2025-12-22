'use client';

import { Combinator } from '@/types';

interface SummaryStepProps {
  combinator: Combinator;
  isEdit: boolean;
}

export default function SummaryStep({ combinator, isEdit }: SummaryStepProps) {
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
          {isEdit ? 'Combinator Updated!' : 'Combinator Created!'}
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          {isEdit
            ? 'Your combinator has been successfully updated in the library.'
            : 'Your combinator has been successfully added to the library.'}
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-gray-800">{combinator.name}</h4>
          <p className="text-sm text-gray-500">ID: {combinator.id}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Dimensions:</span>
            <span className="ml-2 font-medium text-gray-800">
              {combinator.width} × {combinator.height} × {combinator.depth || 200}mm
            </span>
          </div>
          <div>
            <span className="text-gray-600">Components:</span>
            <span className="ml-2 font-medium text-gray-800">
              {combinator.componentIds.length} selected
            </span>
          </div>
          {combinator.brand && (
            <div>
              <span className="text-gray-600">Brand:</span>
              <span className="ml-2 font-medium text-gray-800">{combinator.brand}</span>
            </div>
          )}
          {combinator.series && (
            <div>
              <span className="text-gray-600">Series:</span>
              <span className="ml-2 font-medium text-gray-800">{combinator.series}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

