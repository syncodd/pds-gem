'use client';

import { useState, useEffect } from 'react';
import { Panel } from '@/types';
import NameStep from './PanelFlowSteps/NameStep';
import SVGUploadStep from './PanelFlowSteps/SVGUploadStep';
import DimensionsStep from './PanelFlowSteps/DimensionsStep';
import PropertiesStep from './PanelFlowSteps/PropertiesStep';
import ConfirmationStep from './PanelFlowSteps/ConfirmationStep';
import SummaryStep from './PanelFlowSteps/SummaryStep';

interface PanelCreationFlowProps {
  panel: Panel | null;
  isOpen: boolean;
  onSave: (panel: Panel) => void;
  onClose: () => void;
}

type Step = 'name' | 'upload' | 'dimensions' | 'properties' | 'confirmation' | 'summary';

const STEPS: { id: Step; label: string }[] = [
  { id: 'name', label: 'Name & ID' },
  { id: 'upload', label: 'Upload SVG' },
  { id: 'dimensions', label: 'Dimensions' },
  { id: 'properties', label: 'Properties' },
  { id: 'confirmation', label: 'Review' },
  { id: 'summary', label: 'Summary' },
];

export default function PanelCreationFlow({
  panel,
  isOpen,
  onSave,
  onClose,
}: PanelCreationFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [formData, setFormData] = useState<Panel>({
    id: '',
    name: '',
    width: 600,
    height: 800,
    depth: 200,
  });
  const [extractedWidth, setExtractedWidth] = useState<number | undefined>();
  const [extractedHeight, setExtractedHeight] = useState<number | undefined>();

  const isEdit = !!panel;

  useEffect(() => {
    if (isOpen) {
      if (panel) {
        setFormData(panel);
        setCurrentStep('name');
      } else {
        setFormData({
          id: '',
          name: '',
          width: 600,
          height: 800,
          depth: 200,
        });
        setCurrentStep('name');
      }
      setExtractedWidth(undefined);
      setExtractedHeight(undefined);
    }
  }, [isOpen, panel]);

  const handleChange = (updates: Partial<Panel>) => {
    setFormData({ ...formData, ...updates });
  };

  const handleDimensionsExtracted = (width: number, height: number) => {
    setExtractedWidth(width);
    setExtractedHeight(height);
    // Auto-fill dimensions if not already set
    if (!formData.width || formData.width === 600) {
      handleChange({ width });
    }
    if (!formData.height || formData.height === 800) {
      handleChange({ height });
    }
  };

  const getCurrentStepIndex = () => {
    return STEPS.findIndex((s) => s.id === currentStep);
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'name':
        return formData.name.trim() !== '' && formData.id.trim() !== '';
      case 'upload':
        return !!formData.model2D;
      case 'dimensions':
        return formData.width > 0 && formData.height > 0;
      case 'properties':
        return true; // All optional
      case 'confirmation':
        return true;
      case 'summary':
        return false; // Final step
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canGoNext()) return;

    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS.length - 1) {
      if (currentStep === 'confirmation') {
        // Save the panel
        onSave(formData);
        setCurrentStep('summary');
      } else {
        setCurrentStep(STEPS[currentIndex + 1].id as Step);
      }
    }
  };

  const handleBack = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id as Step);
    }
  };

  const handleClose = () => {
    if (currentStep === 'summary') {
      onClose();
    } else if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const currentStepIndex = getCurrentStepIndex();
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-gradient-to-br from-slate-900/40 via-slate-900/25 to-transparent backdrop-blur-[2px] transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {isEdit ? 'Edit Panel' : 'Create New Panel'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex-1 text-center ${
                    index <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
                      index < currentStepIndex
                        ? 'bg-blue-600 text-white'
                        : index === currentStepIndex
                        ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <svg
                        className="w-5 h-5"
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
                    ) : (
                      index + 1
                    )}
                  </div>
                  <p className="text-xs font-medium">{step.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 'name' && (
              <NameStep panel={formData} onChange={handleChange} />
            )}
            {currentStep === 'upload' && (
              <SVGUploadStep
                panel={formData}
                onChange={handleChange}
                onDimensionsExtracted={handleDimensionsExtracted}
              />
            )}
            {currentStep === 'dimensions' && (
              <DimensionsStep
                panel={formData}
                onChange={handleChange}
                extractedWidth={extractedWidth}
                extractedHeight={extractedHeight}
              />
            )}
            {currentStep === 'properties' && (
              <PropertiesStep panel={formData} onChange={handleChange} />
            )}
            {currentStep === 'confirmation' && (
              <ConfirmationStep panel={formData} />
            )}
            {currentStep === 'summary' && (
              <SummaryStep panel={formData} isEdit={isEdit} />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStepIndex === 0}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Back
            </button>
            {currentStep === 'summary' ? (
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Done
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!canGoNext()}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {currentStep === 'confirmation' ? 'Create Panel' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

