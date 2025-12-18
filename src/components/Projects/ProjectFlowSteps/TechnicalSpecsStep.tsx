'use client';

import { useState } from 'react';

interface TechnicalSpecsStepProps {
  initialData: {
    earthing: string;
    peNCrossSection: string;
    nominalCurrent: string;
    shortCircuitCurrent: string;
    forming: string;
  };
  onNext: (data: {
    earthing: string;
    peNCrossSection: string;
    nominalCurrent: string;
    shortCircuitCurrent: string;
    forming: string;
  }) => void;
  onBack: () => void;
  onCancel: () => void;
}

// Placeholder options for dropdowns (read-only for now)
const EARTHING_OPTIONS = ['Option 1', 'Option 2', 'Option 3'];
const PE_N_CROSS_SECTION_OPTIONS = ['Option A', 'Option B', 'Option C'];
const NOMINAL_CURRENT_OPTIONS = ['10A', '16A', '20A', '25A', '32A'];
const SHORT_CIRCUIT_CURRENT_OPTIONS = ['1kA', '2kA', '3kA', '4kA', '5kA'];
const FORMING_OPTIONS = ['Form 1', 'Form 2', 'Form 3', 'Form 4'];

export default function TechnicalSpecsStep({
  initialData,
  onNext,
  onBack,
  onCancel,
}: TechnicalSpecsStepProps) {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = () => {
    onNext(formData);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Technical Specifications</h2>
        <p className="text-sm text-gray-500 mt-1">Configure technical parameters</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4 max-w-2xl mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Earthing</label>
            <select
              value={formData.earthing}
              onChange={(e) => handleChange('earthing', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              disabled
            >
              <option value="">Select earthing</option>
              {EARTHING_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Read-only for now</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PE-N Cross Section
            </label>
            <select
              value={formData.peNCrossSection}
              onChange={(e) => handleChange('peNCrossSection', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              disabled
            >
              <option value="">Select PE-N Cross Section</option>
              {PE_N_CROSS_SECTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Read-only for now</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nominal Current</label>
            <select
              value={formData.nominalCurrent}
              onChange={(e) => handleChange('nominalCurrent', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              disabled
            >
              <option value="">Select nominal current</option>
              {NOMINAL_CURRENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Read-only for now</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Short Circuit Current (lcw)
            </label>
            <select
              value={formData.shortCircuitCurrent}
              onChange={(e) => handleChange('shortCircuitCurrent', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              disabled
            >
              <option value="">Select short circuit current</option>
              {SHORT_CIRCUIT_CURRENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Read-only for now</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Forming</label>
            <select
              value={formData.forming}
              onChange={(e) => handleChange('forming', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              disabled
            >
              <option value="">Select forming</option>
              {FORMING_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Read-only for now</p>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 flex justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
