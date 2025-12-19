'use client';

import { useState, useRef } from 'react';
import { Component } from '@/types';
import { extractSVGDimensions } from '@/lib/svgUtils';

interface ModelStepProps {
  component: Component;
  onChange: (updates: Partial<Component>) => void;
  onDimensionsExtracted?: (width: number, height: number) => void;
}

export default function ModelStep({ component, onChange, onDimensionsExtracted }: ModelStepProps) {
  const [uploading2D, setUploading2D] = useState(false);
  const [uploading3D, setUploading3D] = useState(false);
  const [error2D, setError2D] = useState<string | null>(null);
  const [error3D, setError3D] = useState<string | null>(null);
  const fileInput2DRef = useRef<HTMLInputElement>(null);
  const fileInput3DRef = useRef<HTMLInputElement>(null);

  const handle2DFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const supportedFormats = ['svg', 'png', 'jpg', 'jpeg'];
    
    if (!extension || !supportedFormats.includes(extension)) {
      setError2D(`Unsupported file format. Supported formats: ${supportedFormats.join(', ').toUpperCase()}`);
      return;
    }

    setUploading2D(true);
    setError2D(null);

    try {
      // Extract dimensions first if it's an SVG file
      if (extension === 'svg' && onDimensionsExtracted) {
        try {
          const { width, height } = await extractSVGDimensions(file);
          onDimensionsExtracted(width, height);
        } catch (dimError) {
          console.warn('Failed to extract SVG dimensions:', dimError);
          // Continue with upload even if dimension extraction fails
        }
      }

      // Upload file to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('componentId', component.id);
      formData.append('modelType', '2d');

      const response = await fetch('/api/components/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Update component with file path
      onChange({ model2D: data.path });
    } catch (err) {
      setError2D(err instanceof Error ? err.message : 'Failed to upload 2D model');
      console.error('Upload error:', err);
    } finally {
      setUploading2D(false);
      if (fileInput2DRef.current) {
        fileInput2DRef.current.value = '';
      }
    }
  };

  const handle3DFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    const supportedFormats = ['gltf', 'glb', 'obj', 'stl', 'fbx', 'babylon'];
    
    if (!extension || !supportedFormats.includes(extension)) {
      setError3D(
        `Unsupported file format. Supported formats: ${supportedFormats.join(', ').toUpperCase()}\n\n` +
        `Note: 3DM and STP/STEP files need to be converted to one of these formats first.`
      );
      return;
    }

    setUploading3D(true);
    setError3D(null);

    try {
      // Upload file to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('componentId', component.id);
      formData.append('modelType', '3d');

      const response = await fetch('/api/components/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Update component with file path
      onChange({ model3D: data.path });
    } catch (err) {
      setError3D(err instanceof Error ? err.message : 'Failed to upload 3D model');
      console.error('Upload error:', err);
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
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload 2D Model (SVG)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload an SVG file for your component. Dimensions will be automatically extracted from the SVG file. This step is optional, but recommended.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          2D Model (Optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={component.model2D || ''}
            onChange={(e) => onChange({ model2D: e.target.value })}
            placeholder="URL or file path for 2D model"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            ref={fileInput2DRef}
            type="file"
            accept=".svg,.png,.jpg,.jpeg"
            onChange={handle2DFileUpload}
            className="hidden"
            disabled={uploading2D}
          />
          <button
            type="button"
            onClick={() => fileInput2DRef.current?.click()}
            disabled={uploading2D}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {uploading2D ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Supported formats: SVG, PNG, JPG, JPEG
        </p>
        {error2D && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error2D}</p>
          </div>
        )}
        {component.model2D && !error2D && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-600">✓ 2D model uploaded successfully</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          3D Model (Optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={component.model3D || ''}
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
            disabled={uploading3D}
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
        {error3D && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error3D}</p>
          </div>
        )}
        {component.model3D && !error3D && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-600">✓ 3D model uploaded successfully</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags (Optional)
        </label>
        <input
          type="text"
          value={component.tags?.join(', ') || ''}
          onChange={(e) =>
            onChange({
              tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
            })
          }
          placeholder="e.g., electrical, control, protection"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-2">
          Enter tags separated by commas
        </p>
      </div>
    </div>
  );
}
