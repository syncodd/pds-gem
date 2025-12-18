'use client';

import { useState, useEffect } from 'react';
import { Project } from '@/types';
import { usePanelStore } from '@/lib/store';
import MetadataStep from './ProjectFlowSteps/MetadataStep';
import TechnicalSpecsStep from './ProjectFlowSteps/TechnicalSpecsStep';
import DesignSetupStep from './ProjectFlowSteps/DesignSetupStep';

interface ProjectCreationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onStep2Ready?: (formData: Partial<Project>) => void; // Callback when step 2 is ready
}

type Step = 0 | 1 | 2;

export default function ProjectCreationFlow({ isOpen, onClose, onStep2Ready }: ProjectCreationFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    panelName: '',
    customer: '',
    editor: '',
    comment: '',
    earthing: '',
    peNCrossSection: '',
    nominalCurrent: '',
    shortCircuitCurrent: '',
    forming: '',
    panels: [],
    components: [],
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setFormData({
        name: '',
        panelName: '',
        customer: '',
        editor: '',
        comment: '',
        earthing: '',
        peNCrossSection: '',
        nominalCurrent: '',
        shortCircuitCurrent: '',
        forming: '',
        panels: [],
        components: [],
      });
    }
  }, [isOpen]);

  const handleStep0Next = (data: {
    name: string;
    panelName: string;
    customer: string;
    editor: string;
    comment: string;
  }) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep(1);
  };

  const handleStep1Next = (data: {
    earthing: string;
    peNCrossSection: string;
    nominalCurrent: string;
    shortCircuitCurrent: string;
    forming: string;
  }) => {
    const updatedFormData = { ...formData, ...data };
    setFormData(updatedFormData);
    setCurrentStep(2);
    // Close modal for step 2 - it will render as full page
    onClose();
    // Notify parent that step 2 is ready
    if (onStep2Ready) {
      onStep2Ready(updatedFormData);
    }
  };


  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  // Step 2 should not render in modal - it's handled by parent
  if (currentStep === 2) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {currentStep === 0 && (
          <MetadataStep
            initialData={{
              name: formData.name || '',
              panelName: formData.panelName || '',
              customer: formData.customer || '',
              editor: formData.editor || '',
              comment: formData.comment || '',
            }}
            onNext={handleStep0Next}
            onCancel={handleCancel}
          />
        )}
        {currentStep === 1 && (
          <TechnicalSpecsStep
            initialData={{
              earthing: formData.earthing || '',
              peNCrossSection: formData.peNCrossSection || '',
              nominalCurrent: formData.nominalCurrent || '',
              shortCircuitCurrent: formData.shortCircuitCurrent || '',
              forming: formData.forming || '',
            }}
            onNext={handleStep1Next}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}
