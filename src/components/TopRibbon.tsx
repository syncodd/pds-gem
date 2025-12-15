'use client';

import { usePanelStore } from '@/lib/store';
import { storage } from '@/lib/storage';

interface TopRibbonProps {
  viewMode: '2d' | '3d';
  onViewModeChange: (mode: '2d' | '3d') => void;
  onSave: () => void;
  onExport: () => void;
  onPriceCalculation?: () => void;
}

export default function TopRibbon({
  viewMode,
  onViewModeChange,
  onSave,
  onExport,
  onPriceCalculation,
}: TopRibbonProps) {
  const { panel, components } = usePanelStore();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-2 shadow-sm">
      <div className="flex items-center gap-4">
        {/* View Toggle */}
        <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
          <button
            onClick={() => onViewModeChange('2d')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === '2d'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            2D View
          </button>
          <button
            onClick={() => onViewModeChange('3d')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === '3d'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            3D View
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            className="px-4 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            Save
          </button>

          <button
            onClick={onExport}
            className="px-4 py-1.5 text-sm font-medium bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export
          </button>

          {onPriceCalculation && (
            <button
              onClick={onPriceCalculation}
              className="px-4 py-1.5 text-sm font-medium bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Price
            </button>
          )}
        </div>

        {/* View Options */}
        <div className="flex items-center gap-2 ml-auto border-l border-gray-200 pl-4">
          <span className="text-xs text-gray-500">
            {components.length} component{components.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

