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
    // Project is already saved in DesignSetupStep, redirect to project page
    loadProjects();
    router.push(`/projects/${project.id}`);
  };

  const handleSetupCancel = () => {
    setSetupFormData(null);
    setViewMode('list');
  };

  const handleProjectSelect = () => {
    // Navigation is now handled by Link in ProjectList
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
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                + New Project
              </button>
            )}
          </div>
          <nav className="flex items-center gap-4">
            <a
              href="/"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Designer
            </a>
            <a
              href="/rule-book"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Rule Book
            </a>
            <a
              href="/panel-editor"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Panel Editor
            </a>
            <a
              href="/component-editor"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Component Editor
            </a>
            <a
              href="/projects"
              className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-500"
            >
              Projects
            </a>
          </nav>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'list' ? (
          <ProjectList onProjectSelect={handleProjectSelect} />
        ) : viewMode === 'setup' && setupFormData ? (
          <DesignSetupStep
            formData={setupFormData}
            onProjectCreated={handleProjectCreated}
            onCancel={handleSetupCancel}
          />
        ) : null}
      </div>

      {/* Project Creation Flow Modal - Only for steps 0 and 1 */}
      <ProjectCreationFlow isOpen={showFlow} onClose={handleCloseFlow} onStep2Ready={handleStep2Ready} />
    </div>
  );
}
