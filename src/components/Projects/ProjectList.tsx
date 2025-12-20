'use client';

import Link from 'next/link';
import { usePanelStore } from '@/lib/store';
import { Project } from '@/types';

interface ProjectListProps {
  onProjectSelect: () => void;
}

export default function ProjectList({ onProjectSelect }: ProjectListProps) {
  const { projects, deleteProject, loadProjects } = usePanelStore();

  const handleDelete = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(projectId);
      loadProjects();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (projects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">No projects yet</p>
          <p className="text-sm">Create a new project to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer block"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-500">{project.panelName}</p>
              </div>
              <button
                onClick={(e) => handleDelete(e, project.id)}
                className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete project"
              >
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium">Customer:</span>
                <span>{project.customer || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Editor:</span>
                <span>{project.editor || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Panels:</span>
                <span>{project.panels.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Created:</span>
                <span>{formatDate(project.createdAt)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
