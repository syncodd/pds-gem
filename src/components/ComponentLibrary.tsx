'use client';

import { useState } from 'react';
import { usePanelStore } from '@/lib/store';
import { componentCategories } from '@/data/components';
import ComponentCard from './ComponentCard';
import { Component } from '@/types';

// Icon component for categories
const CategoryIcon = ({ category }: { category: string }) => {
  const iconMap: Record<string, JSX.Element> = {
    switches: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    breakers: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    fuses: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    relays: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    terminals: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    meters: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  };

  return iconMap[category] || (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
};

interface AccordionSectionProps {
  category: string;
  components: Component[];
  isOpen: boolean;
  onToggle: () => void;
  selectedComponentType: string | null;
  onSelectComponent: (componentId: string) => void;
}

const AccordionSection = ({
  category,
  components,
  isOpen,
  onToggle,
  selectedComponentType,
  onSelectComponent,
}: AccordionSectionProps) => {
  if (components.length === 0) return null;

  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <CategoryIcon category={category} />
          <span className="text-sm font-semibold text-gray-700 capitalize">
            {category}
          </span>
          <span className="text-xs text-gray-500">({components.length})</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            {components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                isSelected={selectedComponentType === component.id}
                onClick={() => {
                  onSelectComponent(component.id);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ComponentLibrary() {
  const { componentLibrary, selectedComponentType, selectComponentType } = usePanelStore();
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    new Set(componentCategories) // All categories open by default
  );

  const componentsByCategory = componentCategories.map((category) => ({
    category,
    components: componentLibrary.filter((c) => c.category === category),
  }));

  const toggleCategory = (category: string) => {
    const newOpen = new Set(openCategories);
    if (newOpen.has(category)) {
      newOpen.delete(category);
    } else {
      newOpen.add(category);
    }
    setOpenCategories(newOpen);
  };

  const handleSelectComponent = (componentId: string) => {
    selectComponentType(
      selectedComponentType === componentId ? null : componentId
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Component Library</h2>
        <p className="text-xs text-gray-500 mt-1">
          Drag or click a component to add it to the panel
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {componentsByCategory.map(({ category, components }) => (
          <AccordionSection
            key={category}
            category={category}
            components={components}
            isOpen={openCategories.has(category)}
            onToggle={() => toggleCategory(category)}
            selectedComponentType={selectedComponentType}
            onSelectComponent={handleSelectComponent}
          />
        ))}
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

