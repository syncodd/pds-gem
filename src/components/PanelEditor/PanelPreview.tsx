'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Panel } from '@/types';
import PanelModelFields from './PanelModelFields';

// Dynamically import 3D view with SSR disabled
const Panel3DView = dynamic(() => import('./Panel3DView'), {
  ssr: false,
});

interface PanelPreviewProps {
  panel: Panel;
  onUpdate: (updates: Partial<Panel>) => void;
  onSave: () => void;
}

export default function PanelPreview({ panel, onUpdate, onSave }: PanelPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Panel>(panel);

  useEffect(() => {
    setFormData(panel);
  }, [panel]);

  const handleUpdate = (updates: Partial<Panel>) => {
    setFormData({ ...formData, ...updates });
    onUpdate(updates);
  };

  const handleSave = () => {
    onSave();
    setIsEditing(false);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleUpdate({ name: e.target.value })}
                  placeholder="Panel Name"
                  className="text-xl font-bold text-gray-800 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => handleUpdate({ id: e.target.value })}
                  placeholder="Panel ID"
                  className="text-sm text-gray-500 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-gray-800">{panel.name || 'Unnamed Panel'}</h2>
                <p className="text-sm text-gray-500 mt-1">ID: {panel.id}</p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setFormData(panel);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Width:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.width}
                  onChange={(e) =>
                    handleUpdate({ width: parseFloat(e.target.value) || 0 })
                  }
                  className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : (
                <span className="ml-2 font-medium">{formData.width}mm</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Height:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) =>
                    handleUpdate({ height: parseFloat(e.target.value) || 0 })
                  }
                  className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : (
                <span className="ml-2 font-medium">{formData.height}mm</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Depth:</span>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.depth || 200}
                  onChange={(e) =>
                    handleUpdate({ depth: parseFloat(e.target.value) || 0 })
                  }
                  className="ml-2 w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : (
                <span className="ml-2 font-medium">{formData.depth || 200}mm</span>
              )}
            </div>
          </div>
          {(formData.type || formData.category || isEditing) && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Type:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.type || ''}
                    onChange={(e) => handleUpdate({ type: e.target.value })}
                    placeholder="e.g., Standard"
                    className="ml-2 flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  <span className="ml-2 font-medium">{formData.type || '—'}</span>
                )}
              </div>
              <div>
                <span className="text-gray-500">Category:</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => handleUpdate({ category: e.target.value })}
                    placeholder="e.g., Industrial"
                    className="ml-2 flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                ) : (
                  <span className="ml-2 font-medium">{formData.category || '—'}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2D and 3D Views */}
      <div className="flex-1 flex overflow-hidden">
        {/* 2D View */}
        <div className="flex-1 border-r border-gray-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0 relative">
            <div className="flex items-center gap-2">
              {!formData.model2D && (
                <svg
                  className="w-5 h-5 text-amber-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  title="Placeholder view"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
              {formData.model2D && (
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  title="Actual model loaded"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <h3 className="text-sm font-semibold text-gray-700">2D View</h3>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            {isEditing && (
              <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0 overflow-y-auto max-h-[200px]">
                <PanelModelFields
                  panel={formData}
                  onChange={(updates) => {
                    const updated = { ...formData, ...updates };
                    setFormData(updated);
                    handleUpdate(updates);
                  }}
                />
              </div>
            )}
            <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 m-4 overflow-hidden p-4">
              {formData.model2D ? (
                <div className="text-center w-full h-full flex items-center justify-center p-2">
                  {(formData.model2D.startsWith('http') || formData.model2D.startsWith('/')) ? (
                    <img
                      src={formData.model2D}
                      alt="2D Model"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const errorDiv = (e.target as HTMLImageElement).parentElement?.querySelector('.error-placeholder');
                        if (errorDiv) errorDiv.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <div className="p-4">
                      <svg
                        className="w-16 h-16 mx-auto text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-xs text-gray-500">File: {formData.model2D}</p>
                    </div>
                  )}
                  <div className="hidden error-placeholder text-center">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-400 mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-xs text-gray-500">Failed to load 2D model</p>
                  </div>
                </div>
              ) : (
                <div className="text-center w-full h-full flex flex-col items-center justify-center">
                  {/* Visual representation of panel - scaled to fit container */}
                  <div className="flex-1 flex items-center justify-center w-full max-w-full">
                    {(() => {
                      // Calculate available space (accounting for padding and margins)
                      const maxWidth = 320;
                      const maxHeight = 320;
                      const aspectRatio = formData.height / formData.width;
                      
                      let displayWidth = maxWidth;
                      let displayHeight = displayWidth * aspectRatio;
                      
                      // Scale down if too tall
                      if (displayHeight > maxHeight) {
                        displayHeight = maxHeight;
                        displayWidth = displayHeight / aspectRatio;
                      }
                      
                      return (
                        <div className="relative">
                          <div
                            className="bg-white border-2 border-red-500 shadow-lg"
                            style={{
                              width: `${displayWidth}px`,
                              height: `${displayHeight}px`,
                              minHeight: '80px',
                              minWidth: '80px',
                            }}
                          >
                            <div className="absolute inset-0 border border-red-300"></div>
                          </div>
                          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap font-medium">
                            {formData.width} × {formData.height}mm
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3D View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0 relative">
            <div className="flex items-center gap-2">
              {!formData.model3D && (
                <svg
                  className="w-5 h-5 text-amber-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  title="Placeholder view"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
              {formData.model3D && (
                <svg
                  className="w-5 h-5 text-green-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  title="Actual model loaded"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <h3 className="text-sm font-semibold text-gray-700">
                3D View <span className="text-gray-400 text-xs font-normal">(Preview)</span>
              </h3>
            </div>
          </div>
          <div className="flex-1 m-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden relative">
            {formData.model3D && (
              <div className="absolute top-2 left-2 z-10 bg-white px-2 py-1 rounded text-xs text-gray-600 shadow-sm">
                3D Model: {formData.model3D}
              </div>
            )}
            <Panel3DView panel={formData} />
          </div>
        </div>
      </div>
    </div>
  );
}

