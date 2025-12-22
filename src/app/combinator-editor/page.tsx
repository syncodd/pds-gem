'use client';

import { useState } from 'react';
import { Combinator } from '@/types';
import { usePanelStore } from '@/lib/store';
import CombinatorList from '@/components/CombinatorEditor/CombinatorList';
import CombinatorCreationFlow from '@/components/CombinatorEditor/CombinatorCreationFlow';
import CombinatorPreview from '@/components/CombinatorEditor/CombinatorPreview';

export default function CombinatorEditorPage() {
  const {
    combinatorsLibrary,
    addCombinatorToLibrary,
    updateCombinatorInLibrary,
    deleteCombinatorFromLibrary,
  } = usePanelStore();
  const [selectedCombinator, setSelectedCombinator] = useState<Combinator | null>(null);
  const [showFlow, setShowFlow] = useState(false);
  const [editingCombinator, setEditingCombinator] = useState<Combinator | null>(null);

  const handleSave = (combinator: Combinator) => {
    if (combinatorsLibrary.find((c) => c.id === combinator.id)) {
      updateCombinatorInLibrary(combinator.id, combinator);
    } else {
      addCombinatorToLibrary(combinator);
    }
    setSelectedCombinator(null);
    setEditingCombinator(null);
    setShowFlow(false);
  };

  const handleSelect = (combinator: Combinator) => {
    setSelectedCombinator(combinator);
    setEditingCombinator({ ...combinator });
    setShowFlow(false); // Don't show flow when editing
  };

  const handleNew = () => {
    setSelectedCombinator(null);
    setEditingCombinator(null);
    setShowFlow(true); // Show flow only for new combinators
  };

  const handleCloseFlow = () => {
    setShowFlow(false);
    setSelectedCombinator(null);
    setEditingCombinator(null);
  };

  const handleUpdate = (updates: Partial<Combinator>) => {
    if (editingCombinator) {
      setEditingCombinator({ ...editingCombinator, ...updates });
    }
  };

  const handleSavePreview = () => {
    if (editingCombinator) {
      handleSave(editingCombinator);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Combinator Editor</h1>
              <p className="text-sm text-gray-500 mt-1">Manage combinator library</p>
            </div>
            {!showFlow && (
              <button
                onClick={handleNew}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                + New Combinator
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
              href="/combinator-editor"
              className="px-3 py-2 text-sm font-medium text-blue-600 border-b-2 border-blue-500"
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
          <CombinatorList
            combinators={combinatorsLibrary}
            onSelect={handleSelect}
            onDelete={deleteCombinatorFromLibrary}
          />
        </div>
        <div className="flex-1 bg-gray-50">
          {editingCombinator && !showFlow ? (
            <CombinatorPreview
              combinator={editingCombinator}
              onUpdate={handleUpdate}
              onSave={handleSavePreview}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <p className="text-lg">Select a combinator to edit</p>
                <p className="text-sm mt-2">or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Combinator Creation Flow Modal - Only for new combinators */}
      <CombinatorCreationFlow
        combinator={null}
        isOpen={showFlow}
        onSave={handleSave}
        onClose={handleCloseFlow}
      />
    </div>
  );
}

