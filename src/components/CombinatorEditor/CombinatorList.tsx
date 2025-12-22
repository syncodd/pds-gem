'use client';

import { useState, useEffect } from 'react';
import { Combinator } from '@/types';

interface CombinatorListProps {
  combinators: Combinator[];
  onSelect: (combinator: Combinator) => void;
  onDelete: (id: string) => void;
}

export default function CombinatorList({
  combinators,
  onSelect,
  onDelete,
}: CombinatorListProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="p-4 space-y-2">
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-2">
        {combinators.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">No combinators yet</p>
            <p className="text-xs mt-1">Create a new combinator to get started</p>
          </div>
        ) : (
          combinators.map((combinator) => (
            <div
              key={combinator.id}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer bg-white"
              onClick={() => onSelect(combinator)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{combinator.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">ID: {combinator.id}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-600">
                    <span>
                      {combinator.width} × {combinator.height}mm
                    </span>
                    <span>Depth: {combinator.depth ?? 200}mm</span>
                    <span>{combinator.componentIds.length} components</span>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {combinator.brand && <span>Brand: {combinator.brand}</span>}
                    {combinator.series && <span>Series: {combinator.series}</span>}
                    {combinator.currentA && <span>Current: {combinator.currentA}A</span>}
                    {combinator.pole && <span>Pole: {combinator.pole}</span>}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete combinator "${combinator.name}"?`)) {
                      onDelete(combinator.id);
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

