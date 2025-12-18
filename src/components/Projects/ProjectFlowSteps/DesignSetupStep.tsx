'use client';

import { useState } from 'react';
import { Panel, CanvasComponent, Project } from '@/types';
import { usePanelStore } from '@/lib/store';
import AddCasePanel from './AddCasePanel';

interface DesignSetupStepProps {
  formData: Partial<Project>;
  onProjectCreated: (project: Project) => void;
  onCancel: () => void;
}

export default function DesignSetupStep({
  formData,
  onProjectCreated,
  onCancel,
}: DesignSetupStepProps) {
  const { addProject, updateProject } = usePanelStore();
  const [showStartDesign, setShowStartDesign] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [panels, setPanels] = useState<Panel[]>([]);
  const [components, setComponents] = useState<CanvasComponent[]>([]);
  const [showAddCase, setShowAddCase] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  const handleStartDesign = () => {
    // Create and save the project immediately when START DESIGN is clicked
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: formData.name || '',
      panelName: formData.panelName || '',
      customer: formData.customer || '',
      editor: formData.editor || '',
      comment: formData.comment || '',
      earthing: formData.earthing || '',
      peNCrossSection: formData.peNCrossSection || '',
      nominalCurrent: formData.nominalCurrent || '',
      shortCircuitCurrent: formData.shortCircuitCurrent || '',
      forming: formData.forming || '',
      panels: [],
      components: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addProject(newProject);
    setProjectId(newProject.id);
    setShowStartDesign(true);
    setShowAddCase(true);
    
    // Notify parent that project is created (but stay in setup mode)
    onProjectCreated(newProject);
  };

  const handleAddCase = (panel: Panel) => {
    const updatedPanels = [...panels, panel];
    setPanels(updatedPanels);
    setShowAddCase(false);
    
    // Update the project in store with new panels
    if (projectId) {
      updateProject(projectId, {
        panels: updatedPanels,
        updatedAt: Date.now(),
      });
    }
  };

  const handleAddMorePanels = () => {
    setShowAddCase(true);
  };

  const handleRemovePanel = (panelId: string) => {
    const updatedPanels = panels.filter((p) => p.id !== panelId);
    const updatedComponents = components.filter((c) => c.panelId !== panelId);
    setPanels(updatedPanels);
    setComponents(updatedComponents);
    
    // Update the project in store
    if (projectId) {
      updateProject(projectId, {
        panels: updatedPanels,
        components: updatedComponents,
        updatedAt: Date.now(),
      });
    }
  };

  // Calculate scale factor (1mm = scale pixels) - use larger scale for better visibility
  const mmToPixels = 0.8;
  
  // Calculate panel positions
  const panelPositions = panels.map((panel, index) => {
    const xOffset = panels.slice(0, index).reduce((sum, p) => sum + p.width, 0);
    return {
      panel,
      xOffset,
      widthPx: panel.width * mmToPixels,
      heightPx: panel.height * mmToPixels,
    };
  });

  const totalWidth = panels.reduce((sum, p) => sum + p.width, 0);
  const totalWidthPx = totalWidth * mmToPixels;
  const maxHeight = Math.max(...panels.map((p) => p.height), 800);
  const maxHeightPx = maxHeight * mmToPixels;

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Project name at top center */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
        <h3 className="text-2xl font-bold text-red-600">{(formData.name || '').toUpperCase()}</h3>
      </div>

      {/* Empty canvas area - takes up most of the screen */}
      <div className="flex-1 bg-white relative overflow-auto">
        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="h-full w-full" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #e5e7eb 49px, #e5e7eb 50px)',
          }} />
        </div>

        {/* Start Design button - bottom left, part of main canvas */}
        {!showStartDesign && panels.length === 0 && (
          <div className="absolute bottom-6 left-6 z-20">
            <button
              onClick={handleStartDesign}
              className="px-6 py-3 bg-red-50 border-2 border-red-500 text-black font-semibold rounded-md hover:bg-red-100 transition-colors shadow-lg"
            >
              START DESIGN
            </button>
            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 bg-red-600 text-white px-3 py-2 rounded text-sm whitespace-nowrap">
              Click on START DESIGN to add components.
              <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
            </div>
          </div>
        )}

        {/* Empty state message */}
        {panels.length === 0 && !showStartDesign && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <p className="text-lg mb-2">Ready to start designing</p>
            </div>
          </div>
        )}

        {/* Display panels in canvas */}
        {panels.length > 0 && (
          <div className="p-8 flex items-center justify-center min-h-full">
            <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm" style={{ 
              width: `${Math.max(totalWidthPx, 600)}px`, 
              height: `${Math.max(maxHeightPx, 400)}px`,
            }}>
              {panelPositions.map(({ panel, xOffset, widthPx, heightPx }) => (
                <div
                  key={panel.id}
                  className="absolute border-2 border-gray-300 bg-gray-50 hover:border-blue-500 transition-colors rounded"
                  style={{
                    left: `${xOffset * mmToPixels + 10}px`,
                    top: '10px',
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    minWidth: '200px',
                    minHeight: '300px',
                  }}
                >
                  <div className="p-2 bg-white bg-opacity-90 border-b border-gray-200 rounded-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{panel.name}</span>
                      <button
                        onClick={() => handleRemovePanel(panel.id)}
                        className="text-red-500 hover:text-red-700 text-lg font-bold leading-none"
                        title="Remove panel"
                      >
                        ×
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {panel.width} × {panel.height}mm
                    </div>
                  </div>
                  <div className="p-4 text-xs text-gray-400 text-center">
                    Panel area
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom div with design properties and buttons */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Design Properties Section (Collapsible) */}
          <div className="mb-4">
            <button
              onClick={() => setShowProperties(!showProperties)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showProperties ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              Design Properties
            </button>
            {showProperties && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-600">
                <p>Design properties will be shown here</p>
              </div>
            )}
          </div>

          {/* Add Panel button */}
          <div className="mb-4">
            <button
              onClick={handleAddMorePanels}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 border border-blue-200"
            >
              Add Panel
            </button>
          </div>

          {/* Panel count and info */}
          {panels.length > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              {panels.length} panel{panels.length !== 1 ? 's' : ''} added
            </div>
          )}

          {/* Cancel button */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Add Case Panel (Step 3) - Opens from bottom */}
      {showAddCase && (
        <AddCasePanel
          onAdd={handleAddCase}
          onClose={() => setShowAddCase(false)}
          existingPanels={panels}
        />
      )}
    </div>
  );
}
