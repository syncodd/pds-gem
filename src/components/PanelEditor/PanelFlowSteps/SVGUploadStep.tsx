'use client';

import { useState, useRef, useEffect } from 'react';
import { Panel } from '@/types';
import { extractSVGDimensions } from '@/lib/svgUtils';

interface SVGUploadStepProps {
  panel: Panel;
  onChange: (updates: Partial<Panel>) => void;
  onDimensionsExtracted: (width: number, height: number) => void;
}

export default function SVGUploadStep({ panel, onChange, onDimensionsExtracted }: SVGUploadStepProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  
  // Use existing model2D if available and it's a blob URL or public path
  const existingPreview = panel.model2D && (panel.model2D.startsWith('/') || panel.model2D.startsWith('http'));

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.svg')) {
      setError('Please select an SVG file');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Extract dimensions first
      const { width, height } = await extractSVGDimensions(file);
      onDimensionsExtracted(width, height);

      // Upload file to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('panelId', panel.id);

      const response = await fetch('/api/panels/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Update panel with SVG path
      onChange({ model2D: data.path });
      
      // Cleanup previous blob URL if exists
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      setPreviewUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload SVG file');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Upload 2D Design (SVG)</h3>
        <p className="text-sm text-gray-600 mb-4">
          Upload an SVG file for the 2D design of your panel. Dimensions will be automatically extracted.
        </p>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".svg"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          
          {!previewUrl && !uploading && (
            <div>
              <svg
                className="w-16 h-16 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-gray-600 mb-2">Click to upload SVG file</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Choose File
              </button>
            </div>
          )}


          {uploading && (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600">Uploading and processing...</p>
            </div>
          )}

          {(previewUrl || existingPreview) && !uploading && (
            <div>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <img
                  src={previewUrl || panel.model2D || ''}
                  alt="SVG Preview"
                  className="max-w-full max-h-64 mx-auto"
                  onError={() => {
                    // If image fails to load, show file info instead
                    setPreviewUrl(null);
                  }}
                />
              </div>
              <p className="text-sm text-green-600 mb-2">
                {previewUrl ? '✓ SVG uploaded successfully' : '✓ SVG already uploaded'}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
              >
                Replace File
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

