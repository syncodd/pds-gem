'use client';

import { Panel } from '@/types';

interface SummaryStepProps {
  panel: Panel;
  isEdit: boolean;
}

export default function SummaryStep({ panel, isEdit }: SummaryStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
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
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {isEdit ? 'Panel Updated Successfully!' : 'Panel Created Successfully!'}
        </h3>
        <p className="text-sm text-gray-600">
          {isEdit 
            ? 'Your panel has been updated in the library.'
            : 'Your panel has been added to the library and is ready to use.'}
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-500">Panel Name</p>
            <p className="text-lg text-gray-800 font-semibold">{panel.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Panel ID</p>
            <p className="text-base text-gray-800 font-mono">{panel.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Dimensions</p>
            <p className="text-base text-gray-800">
              {panel.width} × {panel.height} × {panel.depth || 200}mm
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

