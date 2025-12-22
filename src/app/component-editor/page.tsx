'use client';

import { useState } from 'react';
import { Component } from '@/types';
import { usePanelStore } from '@/lib/store';
import ComponentList from '@/components/ComponentEditor/ComponentList';
import ComponentCreationFlow from '@/components/ComponentEditor/ComponentCreationFlow';
import ComponentPreview from '@/components/ComponentEditor/ComponentPreview';

export default function ComponentEditorPage() {
  const {
    componentLibrary,
    addComponentToLibrary,
    updateComponentInLibrary,
    deleteComponentFromLibrary,
  } = usePanelStore();
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [showFlow, setShowFlow] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);

  const handleSave = (component: Component) => {
    if (componentLibrary.find((c) => c.id === component.id)) {
      updateComponentInLibrary(component.id, component);
    } else {
      addComponentToLibrary(component);
    }
    setSelectedComponent(null);
    setEditingComponent(null);
    setShowFlow(false);
  };

  const handleSelect = (component: Component) => {
    setSelectedComponent(component);
    setEditingComponent({ ...component });
    setShowFlow(false); // Don't show flow when editing
  };

  const handleNew = () => {
    setSelectedComponent(null);
    setEditingComponent(null);
    setShowFlow(true); // Show flow only for new components
  };

  const handleCloseFlow = () => {
    setShowFlow(false);
    setSelectedComponent(null);
    setEditingComponent(null);
  };

  const handleUpdate = (updates: Partial<Component>) => {
    if (editingComponent) {
      setEditingComponent({ ...editingComponent, ...updates });
    }
  };

  const handleSavePreview = () => {
    if (editingComponent) {
      handleSave(editingComponent);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Component Editor</h1>
              <p className="text-sm text-gray-500 mt-1">Manage component library</p>
            </div>
            {!showFlow && (
              <button
                onClick={handleNew}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                + New Component
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
              className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-500"
            >
              Component Editor
            </a>
            <a
              href="/combinator-editor"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Combinator Editor
            </a>
            <a
              href="/projects"
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600"
            >
              Projects
            </a>
          </nav>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
            <div className="w-96 border-r border-gray-200 bg-white">
              <ComponentList
                components={componentLibrary}
                onSelect={handleSelect}
                onDelete={deleteComponentFromLibrary}
              />
            </div>
            <div className="flex-1 bg-gray-50">
          {editingComponent && !showFlow ? (
                <ComponentPreview
                  component={editingComponent}
                  onUpdate={handleUpdate}
                  onSave={handleSavePreview}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <p className="text-lg">Select a component to edit</p>
                    <p className="text-sm mt-2">or create a new one</p>
                  </div>
                </div>
              )}
            </div>
      </div>

      {/* Component Creation Flow Modal - Only for new components */}
      <ComponentCreationFlow
        component={null}
        isOpen={showFlow}
        onSave={handleSave}
        onClose={handleCloseFlow}
      />
    </div>
  );
}

