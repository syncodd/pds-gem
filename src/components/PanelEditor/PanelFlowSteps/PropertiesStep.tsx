'use client';

import { useState, useRef } from 'react';
import { Panel } from '@/types';

interface PropertiesStepProps {
  panel: Panel;
  onChange: (updates: Partial<Panel>) => void;
}

export default function PropertiesStep({ panel, onChange }: PropertiesStepProps) {
  const [uploading3D, setUploading3D] = useState(false);
  const fileInput3DRef = useRef<HTMLInputElement>(null);

  const handle3DFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const supportedFormats = ['gltf', 'glb', 'obj', 'stl', 'fbx', 'babylon'];
    
    if (!extension || !supportedFormats.includes(extension)) {
      alert(
        `Unsupported file format. Supported formats: ${supportedFormats.join(', ').toUpperCase()}\n\n` +
        `Note: 3DM and STP/STEP files need to be converted to one of these formats first.`
      );
      return;
    }

    setUploading3D(true);

    try {
      // Create a local file URL (for now, we'll store the file reference)
      // In production, you'd upload to a server and get a URL
      const fileUrl = URL.createObjectURL(file);
      
      // Store the file name and create a path reference
      const fileName = `panel-${panel.id}-${Date.now()}.${extension}`;
      
      // For client-side only, we'll use the blob URL
      // In production, upload to server and use the server URL
      onChange({ model3D: fileUrl });
      
      alert('3D model uploaded successfully! Note: This is a temporary URL. For production, upload files to a server.');
    } catch (error) {
      console.error('Error uploading 3D model:', error);
      alert('Failed to upload 3D model');
    } finally {
      setUploading3D(false);
      if (fileInput3DRef.current) {
        fileInput3DRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Panel Properties</h3>
        <p className="text-sm text-gray-600 mb-4">
          Set additional properties for your panel. All fields are optional.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type
          </label>
          <input
            type="text"
            value={panel.type || ''}
            onChange={(e) => onChange({ type: e.target.value })}
            placeholder="e.g., Standard, Custom"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <input
            type="text"
            value={panel.category || ''}
            onChange={(e) => onChange({ category: e.target.value })}
            placeholder="e.g., Industrial, Commercial"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          3D Model (Optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={panel.model3D || ''}
            onChange={(e) => onChange({ model3D: e.target.value })}
            placeholder="URL or file path for 3D model"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            ref={fileInput3DRef}
            type="file"
            accept=".gltf,.glb,.obj,.stl,.fbx,.babylon"
            onChange={handle3DFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInput3DRef.current?.click()}
            disabled={uploading3D}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {uploading3D ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Supported formats: GLTF, GLB, OBJ, STL, FBX, BABYLON
        </p>
        <p className="text-xs text-amber-600 mt-1">
          Note: 3DM and STP/STEP files need to be converted to GLTF/GLB first
        </p>
      </div>
    </div>
  );
}

