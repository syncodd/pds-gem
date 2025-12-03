'use client';

import { usePanelStore } from '@/lib/store';
import { storage } from '@/lib/storage';
import { useEffect, useState } from 'react';

export default function PanelProperties() {
  const {
    panel,
    components,
    componentLibrary,
    selectedCanvasComponent,
    setPanel,
    deleteComponent,
    setDesign,
  } = usePanelStore();

  const [savedDesigns, setSavedDesigns] = useState<Record<string, any>>({});
  const [saveName, setSaveName] = useState('');

  const selectedComponent = components.find((c) => c.id === selectedCanvasComponent);
  const selectedComponentDef = selectedComponent
    ? componentLibrary.find((c) => c.id === selectedComponent.componentId)
    : null;

  useEffect(() => {
    setSavedDesigns(storage.getAllDesigns());
  }, []);

  const handleSave = () => {
    if (!saveName.trim()) {
      alert('Please enter a name for the design');
      return;
    }

    storage.saveDesign(saveName, {
      panel,
      components,
    });

    storage.saveCurrentDesign({
      panel,
      components,
    });

    setSavedDesigns(storage.getAllDesigns());
    setSaveName('');
    alert('Design saved successfully!');
  };

  const handleLoad = (name: string) => {
    const design = storage.loadDesign(name);
    if (design) {
      setDesign(design);
      alert('Design loaded successfully!');
    }
  };

  const handleDelete = (name: string) => {
    if (confirm(`Delete design "${name}"?`)) {
      storage.deleteDesign(name);
      setSavedDesigns(storage.getAllDesigns());
    }
  };

  const handleExport = () => {
    const json = storage.exportDesign({ panel, components });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${panel.name || 'panel'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const json = event.target?.result as string;
          const design = storage.importDesign(json);
          if (design) {
            setDesign(design);
            alert('Design imported successfully!');
          } else {
            alert('Failed to import design. Invalid file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Panel Properties</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Panel Settings */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Panel Settings</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={panel.name}
                onChange={(e) => setPanel({ name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Dimensions: {panel.width} × {panel.height}mm</p>
              {panel.depth && <p>Depth: {panel.depth}mm</p>}
              <p className="text-gray-400 italic">Edit panel dimensions in Panel Editor</p>
            </div>
          </div>
        </div>

        {/* Selected Component */}
        {selectedComponent && selectedComponentDef && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Selected Component</h3>
            <div className="space-y-2 p-3 bg-gray-50 rounded-md">
              <div className="text-sm font-medium">{selectedComponentDef.name}</div>
              <div className="text-xs text-gray-600">
                Position: {Math.round(selectedComponent.x)}, {Math.round(selectedComponent.y)}mm
              </div>
              <div className="text-xs text-gray-600">
                Size: {selectedComponentDef.width} × {selectedComponentDef.height}mm
              </div>
              <button
                onClick={() => deleteComponent(selectedComponent.id)}
                className="mt-2 w-full px-3 py-1.5 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                Delete Component
              </button>
            </div>
          </div>
        )}

        {/* Components List */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Components ({components.length})
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {components.length === 0 ? (
              <p className="text-xs text-gray-500">No components added yet</p>
            ) : (
              components.map((comp) => {
                const compDef = componentLibrary.find((c) => c.id === comp.componentId);
                return (
                  <div
                    key={comp.id}
                    className="text-xs p-2 bg-gray-50 rounded border border-gray-200"
                  >
                    {compDef?.name || 'Unknown'} at ({Math.round(comp.x)}, {Math.round(comp.y)})
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Save/Load */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Save/Load</h3>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Design name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                Export
              </button>
              <button
                onClick={handleImport}
                className="flex-1 px-3 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
              >
                Import
              </button>
            </div>
          </div>
        </div>

        {/* Saved Designs */}
        {Object.keys(savedDesigns).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Saved Designs</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {Object.keys(savedDesigns).map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                >
                  <span className="text-xs text-gray-700">{name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleLoad(name)}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDelete(name)}
                      className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

