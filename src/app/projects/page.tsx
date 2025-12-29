'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePanelStore } from '@/lib/store';
import { Project } from '@/types';
import ProjectList from '@/components/Projects/ProjectList';
import ProjectCreationFlow from '@/components/Projects/ProjectCreationFlow';
import DesignSetupStep from '@/components/Projects/ProjectFlowSteps/DesignSetupStep';

export default function ProjectsPage() {
  const router = useRouter();
  const { loadProjects } = usePanelStore();
  const [showFlow, setShowFlow] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'setup'>('list');
  const [setupFormData, setSetupFormData] = useState<Partial<Project> | null>(null);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleNewProject = () => {
    setShowFlow(true);
  };

  const handleCloseFlow = () => {
    setShowFlow(false);
  };

  const handleStep2Ready = (formData: Partial<Project>) => {
    setSetupFormData(formData);
    setViewMode('setup');
    setShowFlow(false);
  };

  const handleProjectCreated = (project: Project) => {
    loadProjects();
    router.push(`/projects/${project.id}`);
  };

  const handleSetupCancel = () => {
    setSetupFormData(null);
    setViewMode('list');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your panel projects</p>
            </div>
            {viewMode === 'list' && (
              <button
                onClick={handleNewProject}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                + New Project
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'list' ? (
          <ProjectList />
        ) : viewMode === 'setup' && setupFormData ? (
          <DesignSetupStep
            formData={setupFormData}
            onProjectCreated={handleProjectCreated}
            onCancel={handleSetupCancel}
          />
        ) : null}
      </div>

      <ProjectCreationFlow isOpen={showFlow} onClose={handleCloseFlow} onStep2Ready={handleStep2Ready} />
    </div>
  );
}