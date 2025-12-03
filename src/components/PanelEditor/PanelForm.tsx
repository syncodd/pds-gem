'use client';

import { useState, useEffect } from 'react';
import { Panel } from '@/types';
import PanelModelFields from './PanelModelFields';

interface PanelFormProps {
  panel: Panel | null;
  onSave: (panel: Panel) => void;
  onCancel: () => void;
}

export default function PanelForm({ panel, onSave, onCancel }: PanelFormProps) {
  const [formData, setFormData] = useState<Panel>({
    id: '',
    name: '',
    width: 600,
    height: 800,
    depth: 200,
    type: '',
    category: '',
  });

  useEffect(() => {
    if (panel) {
      setFormData(panel);
    } else {
      setFormData({
        id: `panel-${Date.now()}`,
        name: '',
        width: 600,
        height: 800,
        depth: 200,
        type: '',
        category: '',
      });
    }
  }, [panel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Panel Name *
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
            Panel ID *
          </label>
          <input
            type="text"
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
              min="100"
              max="2000"
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
              min="100"
              max="2000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Depth (mm)
            </label>
            <input
              type="number"
              value={formData.depth || 200}
              onChange={(e) =>
                setFormData({ ...formData, depth: parseFloat(e.target.value) || 0 })
              }
              min="50"
              max="500"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <input
            type="text"
            value={formData.type || ''}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="e.g., Standard, Custom"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <input
            type="text"
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Industrial, Commercial"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <PanelModelFields panel={formData} onChange={(updates) => setFormData({ ...formData, ...updates })} />
      </div>

      <div className="p-4 border-t border-gray-200 flex gap-2">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          {panel ? 'Update' : 'Create'} Panel
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

