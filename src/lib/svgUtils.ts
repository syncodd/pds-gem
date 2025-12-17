/**
 * Utility functions for SVG processing and panel ID generation
 */

/**
 * Sanitizes a panel name for use in IDs
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters (keeps only alphanumeric and hyphens)
 */
export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generates a short hash from a string
 * Uses djb2 hash algorithm
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  // Convert to positive number and get last 6 digits
  const hashNum = Math.abs(hash);
  return hashNum.toString().slice(-6).padStart(6, '0');
}

/**
 * Generates a panel ID based on the name
 * Format: {sanitized-name}-{short-hash}
 */
export function generatePanelId(name: string): string {
  if (!name || name.trim() === '') {
    return `panel-${Date.now()}`;
  }
  
  const sanitized = sanitizeName(name);
  if (sanitized === '') {
    return `panel-${Date.now()}`;
  }
  
  const hash = hashString(name);
  return `${sanitized}-${hash}`;
}

/**
 * Extracts width and height from an SVG file
 * Checks viewBox first, then width/height attributes
 * Returns dimensions in pixels (user should convert to mm if needed)
 */
export async function extractSVGDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const svgContent = e.target?.result as string;
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;
        
        // Check for parsing errors
        const parserError = svgDoc.querySelector('parsererror');
        if (parserError) {
          reject(new Error('Invalid SVG file'));
          return;
        }
        
        let width: number | null = null;
        let height: number | null = null;
        
        // Try to get from viewBox attribute (most reliable)
        const viewBox = svgElement.getAttribute('viewBox');
        if (viewBox) {
          const parts = viewBox.split(/\s+/);
          if (parts.length >= 4) {
            width = parseFloat(parts[2]);
            height = parseFloat(parts[3]);
          }
        }
        
        // If viewBox didn't work, try width and height attributes
        if (!width || !height || isNaN(width) || isNaN(height)) {
          const widthAttr = svgElement.getAttribute('width');
          const heightAttr = svgElement.getAttribute('height');
          
          if (widthAttr) {
            width = parseFloat(widthAttr.replace(/[^\d.]/g, ''));
          }
          if (heightAttr) {
            height = parseFloat(heightAttr.replace(/[^\d.]/g, ''));
          }
        }
        
        // Fallback to default values if still not found
        if (!width || isNaN(width)) width = 600;
        if (!height || isNaN(height)) height = 800;
        
        resolve({ width, height });
      } catch (error) {
        reject(new Error(`Failed to parse SVG: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read SVG file'));
    };
    
    reader.readAsText(file);
  });
}

