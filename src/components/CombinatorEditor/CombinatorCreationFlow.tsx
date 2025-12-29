'use client';

import { useState, useEffect } from 'react';
import { Combinator, Component } from '@/types';
import { usePanelStore } from '@/lib/store';
import { calculateCombinatorDimensions } from '@/lib/componentUtils';
import NameStep from './CombinatorFlowSteps/NameStep';
import ComponentSelectionStep from './CombinatorFlowSteps/ComponentSelectionStep';
import DimensionsStep from './CombinatorFlowSteps/DimensionsStep';
import PropertiesStep from './CombinatorFlowSteps/PropertiesStep';
import SpecsStep from './CombinatorFlowSteps/SpecsStep';
import ConfirmationStep from './CombinatorFlowSteps/ConfirmationStep';
import SummaryStep from './CombinatorFlowSteps/SummaryStep';

interface CombinatorCreationFlowProps {
  combinator: Combinator | null;
  isOpen: boolean;
  onSave: (combinator: Combinator) => void;
  onClose: () => void;
}

type Step = 'name' | 'components' | 'dimensions' | 'properties' | 'specs' | 'confirmation' | 'summary';

const STEPS: { id: Step; label: string }[] = [
  { id: 'name', label: 'Name & ID' },
  { id: 'components', label: 'Select Components' },
  { id: 'dimensions', label: 'Dimensions' },
  { id: 'properties', label: 'Properties' },
  { id: 'specs', label: 'Specifications' },
  { id: 'confirmation', label: 'Review' },
  { id: 'summary', label: 'Summary' },
];

export default function CombinatorCreationFlow({
  combinator,
  isOpen,
  onSave,
  onClose,
}: CombinatorCreationFlowProps) {
  const { componentLibrary } = usePanelStore();
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [formData, setFormData] = useState<Combinator>({
    id: '',
    name: '',
    width: 200,
    height: 300,
    depth: 200,
    componentIds: [],
    gaps: [],
    brand: '',
    series: '',
    currentA: '',
    pole: '',
    panelSize: undefined,
    specs: {},
  });

  const isEdit = !!combinator;

  // Initialize gaps array when componentIds change
  useEffect(() => {
    if (formData.componentIds.length > 0) {
      const requiredGapsCount = formData.componentIds.length + 1;
      const currentGaps = formData.gaps || [];
      
      // If gaps array doesn't match required length, initialize/update it
      if (currentGaps.length !== requiredGapsCount) {
        const newGaps = new Array(requiredGapsCount).fill(0);
        // Preserve existing gaps if possible
        for (let i = 0; i < Math.min(currentGaps.length, newGaps.length); i++) {
          newGaps[i] = currentGaps[i];
        }
        setFormData({ ...formData, gaps: newGaps });
      }
    } else {
      // No components, clear gaps
      if (formData.gaps && formData.gaps.length > 0) {
        setFormData({ ...formData, gaps: [] });
      }
    }
  }, [formData.componentIds.length]);

  // Calculate dimensions when components or gaps change
  useEffect(() => {
    if (formData.componentIds.length > 0 && formData.gaps && formData.gaps.length === formData.componentIds.length + 1) {
      const selectedComponents = formData.componentIds
        .map((id) => componentLibrary.find((c) => c.id === id))
        .filter((c): c is Component => c !== undefined);
      
      if (selectedComponents.length > 0) {
        const calculated = calculateCombinatorDimensions(selectedComponents, formData.gaps);
        setFormData((prev) => ({
          ...prev,
          width: calculated.width,
          height: calculated.height,
        }));
      }
    }
  }, [formData.componentIds, formData.gaps, componentLibrary]);

  useEffect(() => {
    if (isOpen) {
      if (combinator) {
        // Ensure gaps array exists and has correct length
        const componentCount = combinator.componentIds.length;
        const requiredGapsCount = componentCount > 0 ? componentCount + 1 : 0;
        const gaps = combinator.gaps || [];
        const normalizedGaps = gaps.length === requiredGapsCount 
          ? gaps 
          : new Array(requiredGapsCount).fill(0);
        
        setFormData({ ...combinator, gaps: normalizedGaps, specs: combinator.specs || {} });
        setCurrentStep('name');
      } else {
        setFormData({
          id: '',
          name: '',
          width: 200,
          height: 300,
          depth: 200,
          componentIds: [],
          gaps: [],
          brand: '',
          series: '',
          currentA: '',
          pole: '',
          panelSize: undefined,
          specs: {},
        });
        setCurrentStep('name');
      }
    }
  }, [isOpen, combinator]);

  const handleChange = (updates: Partial<Combinator>) => {
    setFormData({ ...formData, ...updates });
  };

  const getCurrentStepIndex = () => {
    return STEPS.findIndex((s) => s.id === currentStep);
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 'name':
        return formData.name.trim() !== '' && formData.id.trim() !== '';
      case 'components':
        return formData.componentIds.length > 0;
      case 'dimensions':
        return formData.width > 0 && formData.height > 0;
      case 'properties':
        return true; // All optional
      case 'specs':
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
        // Save the combinator
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
                {isEdit ? 'Edit Combinator' : 'Create New Combinator'}
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
              <NameStep combinator={formData} onChange={handleChange} />
            )}
            {currentStep === 'components' && (
              <ComponentSelectionStep combinator={formData} onChange={handleChange} />
            )}
            {currentStep === 'dimensions' && (
              <DimensionsStep combinator={formData} onChange={handleChange} />
            )}
            {currentStep === 'properties' && (
              <PropertiesStep combinator={formData} onChange={handleChange} />
            )}
            {currentStep === 'specs' && (
              <SpecsStep combinator={formData} onChange={handleChange} />
            )}
            {currentStep === 'confirmation' && (
              <ConfirmationStep combinator={formData} />
            )}
            {currentStep === 'summary' && (
              <SummaryStep combinator={formData} isEdit={isEdit} />
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
                {currentStep === 'confirmation' ? 'Create Combinator' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

