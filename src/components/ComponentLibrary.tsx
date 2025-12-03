'use client';

import { usePanelStore } from '@/lib/store';
import { componentCategories } from '@/data/components';
import ComponentCard from './ComponentCard';

export default function ComponentLibrary() {
  const { componentLibrary, selectedComponentType, selectComponentType } = usePanelStore();

  const componentsByCategory = componentCategories.map((category) => ({
    category,
    components: componentLibrary.filter((c) => c.category === category),
  }));

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Component Library</h2>
        <p className="text-xs text-gray-500 mt-1">
          Click a component to add it to the panel
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {componentsByCategory.map(({ category, components }) => {
          if (components.length === 0) return null;

          return (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 capitalize">
                {category}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {components.map((component) => (
                  <ComponentCard
                    key={component.id}
                    component={component}
                    isSelected={selectedComponentType === component.id}
                    onClick={() => {
                      selectComponentType(
                        selectedComponentType === component.id ? null : component.id
                      );
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedComponentType && (
        <div className="p-4 border-t border-gray-200 bg-blue-50">
          <div className="text-sm text-blue-700">
            <strong>Selected:</strong>{' '}
            {componentLibrary.find((c) => c.id === selectedComponentType)?.name}
          </div>
          <button
            onClick={() => selectComponentType(null)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Cancel selection
          </button>
        </div>
      )}
    </div>
  );
}

