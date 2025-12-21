'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { usePanelStore } from '@/lib/store';

// Dynamically import ProjectCanvas with SSR disabled since Konva is browser-only
const ProjectCanvas = dynamic(() => import('@/components/Projects/ProjectCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center text-gray-400">
        <p className="text-lg mb-2">Loading project...</p>
      </div>
    </div>
  ),
});

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { projects, loadProjects, setCurrentProject } = usePanelStore();
  const projectId = params?.id as string;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadProjects();
  }, [loadProjects, projectId, projects.length]);

  // Find the project by ID
  const project = projects.find((p) => p.id === projectId);

  // If project not found, redirect to projects list (only after mount and projects loaded)
  useEffect(() => {
    if (mounted && projectId && projects.length > 0 && !project) {
      router.push('/projects');
    }
  }, [projectId, projects, project, router, mounted]);

  const handleBackToList = () => {
    router.push('/projects');
  };

  // Prevent hydration mismatch: show loading/not found only after mount
  if (!mounted) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your panel projects</p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-lg mb-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-screen flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your panel projects</p>
              </div>
              <button
                onClick={handleBackToList}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                ← Back to Projects
              </button>
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
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <p className="text-lg mb-2">Project not found</p>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your panel projects</p>
            </div>
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              ← Back to Projects
            </button>
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
        <ProjectCanvas project={project} />
      </div>
    </div>
  );
}
