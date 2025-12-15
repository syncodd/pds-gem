'use client';

import { Component } from '@/types';
import { usePanelStore } from '@/lib/store';

interface ComponentCardProps {
  component: Component;
  isSelected: boolean;
  onClick: () => void;
}

export default function ComponentCard({ component, isSelected, onClick }: ComponentCardProps) {
  const { setDraggingComponent } = usePanelStore();
  const has2DModel = component.model2D && (component.model2D.startsWith('http') || component.model2D.startsWith('/'));

  const handleDragStart = (e: React.DragEvent) => {
    setDraggingComponent(component.id);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('componentId', component.id);
    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.5';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, e.clientX - e.currentTarget.getBoundingClientRect().left, e.clientY - e.currentTarget.getBoundingClientRect().top);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragEnd = () => {
    setDraggingComponent(null);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={`
        p-3 border-2 rounded-lg cursor-move transition-all
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
      `}
    >
      <div
        className="w-full h-16 rounded mb-2 flex items-center justify-center overflow-hidden relative"
        style={{ 
          backgroundColor: has2DModel ? 'transparent' : component.color, 
          opacity: has2DModel ? 1 : 0.3 
        }}
      >
        {has2DModel ? (
          <img
            src={component.model2D}
            alt={component.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              // Fallback to colored box if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.fallback-preview');
              if (fallback) {
                (fallback as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className={`text-xs font-semibold text-center px-2 fallback-preview ${
            has2DModel ? 'hidden' : 'flex'
          }`}
          style={{ color: component.color }}
        >
          {component.name}
        </div>
      </div>
      <div className="text-xs text-gray-600 font-medium">{component.name}</div>
      <div className="text-xs text-gray-500 mt-1">
        {component.width} × {component.height}mm
      </div>
      {has2DModel && (
        <div className="mt-1 flex items-center gap-1">
          <svg
            className="w-3 h-3 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            title="2D Model Available"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs text-gray-400">2D Model</span>
        </div>
      )}
    </div>
  );
}

