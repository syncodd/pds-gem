'use client';

import { usePanelStore } from '@/lib/store';
import { RuleViolation } from '@/types';

export default function DRCPanel() {
  const {
    violations,
    selectCanvasComponent,
    componentLibrary,
    selectedComponentType,
    selectComponentType,
    panel,
  } = usePanelStore();

  const errors = violations.filter((v) => v.severity === 'error');
  const warnings = violations.filter((v) => v.severity === 'warning');

  const handleViolationClick = (violation: RuleViolation) => {
    if (violation.componentId) {
      selectCanvasComponent(violation.componentId);
    } else if (violation.componentIds && violation.componentIds.length > 0) {
      selectCanvasComponent(violation.componentIds[0]);
    }
  };

  const handleAddRequiredComponent = (
    e: React.MouseEvent,
    missingComponentId: string
  ) => {
    e.stopPropagation();
    // Select the missing component type so user can place it
    selectComponentType(missingComponentId);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-800">Design Rule Check</h2>
          <div className="flex gap-2">
            {errors.length > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                {errors.length} Error{errors.length !== 1 ? 's' : ''}
              </span>
            )}
            {warnings.length > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                {warnings.length} Warning{warnings.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {violations.length === 0 && (
          <p className="text-sm text-gray-500">No violations found</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {errors.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-2">Errors</h3>
            <div className="space-y-2">
              {errors.map((violation) => (
                <div
                  key={violation.id}
                  onClick={() => handleViolationClick(violation)}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-semibold text-red-800">
                      {violation.ruleName}
                    </span>
                    <span className="text-xs text-red-600 bg-red-200 px-2 py-0.5 rounded">
                      Error
                    </span>
                  </div>
                  <p className="text-xs text-red-700">{violation.message}</p>
                  {violation.componentId && (
                    <p className="text-xs text-red-600 mt-1">
                      Component: {violation.componentId}
                    </p>
                  )}
                  {violation.missingComponentId && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={(e) =>
                          handleAddRequiredComponent(e, violation.missingComponentId!)
                        }
                        className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                        title="Add required component to design"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add{' '}
                        {componentLibrary.find((c) => c.id === violation.missingComponentId)
                          ?.name || 'Component'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {warnings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-yellow-700 mb-2">Warnings</h3>
            <div className="space-y-2">
              {warnings.map((violation) => (
                <div
                  key={violation.id}
                  onClick={() => handleViolationClick(violation)}
                  className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm font-semibold text-yellow-800">
                      {violation.ruleName}
                    </span>
                    <span className="text-xs text-yellow-600 bg-yellow-200 px-2 py-0.5 rounded">
                      Warning
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700">{violation.message}</p>
                  {violation.componentId && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Component: {violation.componentId}
                    </p>
                  )}
                  {violation.missingComponentId && (
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={(e) =>
                          handleAddRequiredComponent(e, violation.missingComponentId!)
                        }
                        className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                        title="Add required component to design"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Add{' '}
                        {componentLibrary.find((c) => c.id === violation.missingComponentId)
                          ?.name || 'Component'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {violations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">All rules passed</p>
          </div>
        )}
      </div>
    </div>
  );
}

