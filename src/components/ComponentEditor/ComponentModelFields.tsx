'use client';

import { useState, useRef } from 'react';
import { Component } from '@/types';

interface ComponentModelFieldsProps {
  component: Component;
  onChange: (updates: Partial<Component>) => void;
}

export default function ComponentModelFields({
  component,
  onChange,
}: ComponentModelFieldsProps) {
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
      const fileName = `component-${component.id}-${Date.now()}.${extension}`;
      
      // For client-side only, we'll use the blob URL
      // In production, upload to server and use the server URL
      onChange({ model3D: fileUrl });
      
      // Note: In production, you'd want to:
      // 1. Upload file to server/storage
      // 2. Get the server URL
      // 3. Save that URL to the component
      
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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          2D Model
        </label>
        <input
          type="text"
          value={component.model2D || ''}
          onChange={(e) => onChange({ model2D: e.target.value })}
          placeholder="URL or file path for 2D model"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter a URL or file path for the 2D model (DWG, SVG, etc.)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          3D Model
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={component.model3D || ''}
            onChange={(e) => onChange({ model3D: e.target.value })}
            placeholder="URL or file path for 3D model"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading3D ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: GLTF, GLB, OBJ, STL, FBX, BABYLON
        </p>
        <p className="text-xs text-amber-600 mt-1">
          Note: 3DM and STP/STEP files need to be converted to GLTF/GLB first
        </p>
      </div>

      {component.model2D && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600 mb-2">2D Model Preview:</p>
          <div className="w-full h-32 bg-white border border-gray-200 rounded flex items-center justify-center">
            <p className="text-xs text-gray-400">
              {component.model2D.startsWith('http')
                ? 'Loading preview...'
                : 'File: ' + component.model2D}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

