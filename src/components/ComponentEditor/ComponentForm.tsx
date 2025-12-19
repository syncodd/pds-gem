'use client';

import { useState, useEffect } from 'react';
import { Component } from '@/types';
import ComponentModelFields from './ComponentModelFields';
import ComponentSpecsEditor from './ComponentSpecsEditor';

interface ComponentFormProps {
  component: Component | null;
  onSave: (component: Component) => void;
  onCancel: () => void;
}

export default function ComponentForm({
  component,
  onSave,
  onCancel,
}: ComponentFormProps) {
  const [formData, setFormData] = useState<Component>({
    id: '',
    name: '',
    type: '',
    category: '',
    width: 20,
    height: 30,
    depth: 15,
    color: '#4a90e2',
    specs: {},
  });

  useEffect(() => {
    if (component) {
      setFormData(component);
    } else {
      setFormData({
        id: `component-${Date.now()}`,
        name: '',
        type: '',
        category: '',
        width: 20,
        height: 30,
        depth: 15,
        color: '#4a90e2',
        specs: {},
      });
    }
  }, [component]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Component Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Component ID *
          </label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <input
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              placeholder="e.g., switch, fuse, relay"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              placeholder="e.g., switches, protection"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width (mm) *
            </label>
            <input
              type="number"
              value={formData.width}
              onChange={(e) =>
                setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })
              }
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height (mm) *
            </label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) =>
                setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })
              }
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Depth (mm)
            </label>
            <input
              type="number"
              value={formData.depth || 15}
              onChange={(e) =>
                setFormData({ ...formData, depth: parseFloat(e.target.value) || 0 })
              }
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Color *
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="#4a90e2"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={formData.tags?.join(', ') || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
              })
            }
            placeholder="e.g., electrical, control, protection"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <ComponentSpecsEditor
          specs={formData.specs || {}}
          onChange={(specs) => setFormData({ ...formData, specs })}
        />

        <ComponentModelFields
          component={formData}
          onChange={(updates) => setFormData({ ...formData, ...updates })}
        />
      </div>

      <div className="p-4 border-t border-gray-200 flex gap-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {component ? 'Update' : 'Create'} Component
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

