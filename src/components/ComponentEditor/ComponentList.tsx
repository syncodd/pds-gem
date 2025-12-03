'use client';

import { Component } from '@/types';

interface ComponentListProps {
  components: Component[];
  onSelect: (component: Component) => void;
  onDelete: (id: string) => void;
}

export default function ComponentList({
  components,
  onSelect,
  onDelete,
}: ComponentListProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-2">
        {components.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">No components yet</p>
            <p className="text-xs mt-1">Create a new component to get started</p>
          </div>
        ) : (
          components.map((component) => (
            <div
              key={component.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white"
              onClick={() => onSelect(component)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: component.color }}
                    />
                    <h3 className="font-semibold text-gray-800">{component.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500">ID: {component.id}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-600">
                    <span>
                      {component.width} × {component.height}mm
                    </span>
                    <span>Depth: {component.depth ?? 15}mm</span>
                    <span>{component.type}</span>
                    <span className="capitalize">{component.category}</span>
                  </div>
                  {component.tags && component.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {component.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete component "${component.name}"?`)) {
                      onDelete(component.id);
                    }
                  }}
                  className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

