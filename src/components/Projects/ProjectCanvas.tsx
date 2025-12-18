'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Konva from 'konva';
import { Project, Panel, CanvasComponent } from '@/types';
import { usePanelStore } from '@/lib/store';

interface ProjectCanvasProps {
  project: Project;
}

export default function ProjectCanvas({ project }: ProjectCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedWidth, setSelectedWidth] = useState('');
  const [localPanels, setLocalPanels] = useState<Panel[]>(project.panels || []);
  const [localComponents, setLocalComponents] = useState<CanvasComponent[]>(project.components || []);
  const [originalPanels, setOriginalPanels] = useState<Panel[]>(project.panels || []);
  const [originalComponents, setOriginalComponents] = useState<CanvasComponent[]>(project.components || []);
  const [hasChanges, setHasChanges] = useState(false);

  const { componentLibrary, updateProject, setCurrentProject, projects, panelsLibrary, loadProjects } = usePanelStore();

  // Get unique width values from panels library
  const widthOptions = useMemo(() => {
    const widths = new Set<number>();
    panelsLibrary.forEach((panel) => {
      widths.add(panel.width);
    });
    return Array.from(widths).sort((a, b) => a - b);
  }, [panelsLibrary]);

  // Update local state when project prop changes (new project selected)
  useEffect(() => {
    const latestProject = projects.find((p) => p.id === project.id) || project;
    setLocalPanels(latestProject.panels || []);
    setLocalComponents(latestProject.components || []);
    setOriginalPanels(latestProject.panels || []);
    setOriginalComponents(latestProject.components || []);
    setHasChanges(false);
  }, [project.id]); // Only when project ID changes, not when projects array changes

  // Detect changes by comparing local state with original
  useEffect(() => {
    const panelsChanged = JSON.stringify(localPanels) !== JSON.stringify(originalPanels);
    const componentsChanged = JSON.stringify(localComponents) !== JSON.stringify(originalComponents);
    setHasChanges(panelsChanged || componentsChanged);
  }, [localPanels, localComponents, originalPanels, originalComponents]);

  // Use local state for panels and components
  const panels = localPanels;
  const components = localComponents;

  // Calculate scale factor (1mm = scale pixels)
  const mmToPixels = 0.5; // 1mm = 0.5 pixels

  // Calculate panel positions and total width
  const panelPositions = panels.map((panel, index) => {
    const xOffset = panels.slice(0, index).reduce((sum, p) => sum + p.width, 0);
    return {
      panel,
      xOffset,
      widthPx: panel.width * mmToPixels,
      heightPx: panel.height * mmToPixels,
    };
  });

  const totalWidth = panels.reduce((sum, p) => sum + p.width, 0);
  const totalWidthPx = totalWidth * mmToPixels;
  const maxHeight = Math.max(...panels.map((p) => p.height), 800);
  const maxHeightPx = maxHeight * mmToPixels;

  // Calculate grid size
  const avgWidth = panels.length > 0 ? panels.reduce((sum, p) => sum + p.width, 0) / panels.length : 600;
  const gridSize = avgWidth < 500 ? 10 : avgWidth < 1000 ? 20 : 50; // in mm

  // Snap function to align coordinates to grid
  const snapToGrid = (value: number): number => {
    return Math.round(value / gridSize) * gridSize;
  };

  // Handle saving project
  const handleSave = () => {
    if (!hasChanges) return;
    
    const updatedProject = {
      ...project,
      panels: localPanels,
      components: localComponents,
      updatedAt: Date.now(),
    };
    
    updateProject(project.id, {
      panels: localPanels,
      components: localComponents,
      updatedAt: Date.now(),
    });
    setCurrentProject(updatedProject);
    setOriginalPanels([...localPanels]);
    setOriginalComponents([...localComponents]);
    setHasChanges(false);
    loadProjects();
  };

  // Handle adding panel to project
  const handleAddPanel = () => {
    if (!selectedWidth) {
      alert('Please select a width');
      return;
    }

    // Find a panel from library with the selected width, or create a new one
    const templatePanel = panelsLibrary.find((p) => p.width === Number(selectedWidth));
    const newPanel: Panel = templatePanel
      ? {
          ...templatePanel,
          id: `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `Panel ${panels.length + 1}`,
        }
      : {
          id: `panel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: `Panel ${panels.length + 1}`,
          width: Number(selectedWidth),
          height: 800, // Default height
          depth: 200,
        };

    const updatedPanels = [...localPanels, newPanel];
    setLocalPanels(updatedPanels);
    setSelectedWidth('');
    setShowAddPanel(false);
    // Don't auto-save, just update local state - user will click Save
  };

  // Handle removing panel
  const handleRemovePanel = (panelId: string) => {
    const updatedPanels = localPanels.filter((p) => p.id !== panelId);
    const updatedComponents = localComponents.filter((c) => c.panelId !== panelId);
    setLocalPanels(updatedPanels);
    setLocalComponents(updatedComponents);
    setSelectedPanelId(null);
    // Don't auto-save, just update local state - user will click Save
  };

  // Initialize Konva stage
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate scale to fit all panels with padding
    const padding = 40;
    const scaleX = totalWidthPx > 0 ? (containerWidth - padding * 2) / totalWidthPx : 1;
    const scaleY = maxHeightPx > 0 ? (containerHeight - padding * 2) / maxHeightPx : 1;
    const newScale = totalWidthPx > 0 ? Math.min(scaleX, scaleY, 2) : 1; // Max scale of 2

    setScale(newScale);
    setOffset({
      x: totalWidthPx > 0 ? (containerWidth - totalWidthPx * newScale) / 2 : 0,
      y: maxHeightPx > 0 ? (containerHeight - maxHeightPx * newScale) / 2 : 0,
    });

    setCanvasSize({
      width: containerWidth,
      height: containerHeight,
    });

    // Create stage
    const stage = new Konva.Stage({
      container: container,
      width: containerWidth,
      height: containerHeight,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    stageRef.current = stage;
    layerRef.current = layer;

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;

      const newScaleX = totalWidthPx > 0 ? (newWidth - padding * 2) / totalWidthPx : 1;
      const newScaleY = maxHeightPx > 0 ? (newHeight - padding * 2) / maxHeightPx : 1;
      const newScaleValue = totalWidthPx > 0 ? Math.min(newScaleX, newScaleY, 2) : 1;

      setScale(newScaleValue);
      setOffset({
        x: totalWidthPx > 0 ? (newWidth - totalWidthPx * newScaleValue) / 2 : 0,
        y: maxHeightPx > 0 ? (newHeight - maxHeightPx * newScaleValue) / 2 : 0,
      });

      stage.width(newWidth);
      stage.height(newHeight);
      stage.draw();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      stage.destroy();
    };
  }, [totalWidthPx, maxHeightPx, panels.length]);

  // Render panels and components
  useEffect(() => {
    if (!stageRef.current || !layerRef.current) return;

    const stage = stageRef.current;
    const layer = layerRef.current;

    // Clear layer
    layer.destroyChildren();

    // Only render if there are panels
    if (panels.length > 0) {
      // Main canvas group
      const canvasGroup = new Konva.Group({
        x: offset.x,
        y: offset.y,
        scaleX: scale,
        scaleY: scale,
      });

      // Render each panel
      panelPositions.forEach(({ panel, xOffset, widthPx, heightPx }) => {
        const isSelected = selectedPanelId === panel.id;
        const panelGroup = new Konva.Group({
          x: xOffset * mmToPixels,
          y: 0,
        });

        // Panel click handler
        const handlePanelClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
          e.cancelBubble = true;
          setSelectedPanelId(panel.id);
        };

        // Panel background/2D model or outline
        if (panel.model2D && (panel.model2D.startsWith('http') || panel.model2D.startsWith('/'))) {
          // Load and display 2D model image
          const imageObj = new Image();
          imageObj.crossOrigin = 'anonymous';
          imageObj.onload = () => {
            const panelImage = new Konva.Image({
              x: 0,
              y: 0,
              image: imageObj,
              width: widthPx,
              height: heightPx,
              listening: true,
            });

            const svgColor = isSelected ? '#dc2626' : '#9ca3af';
            const colorOverlay = new Konva.Rect({
              x: 0,
              y: 0,
              width: widthPx,
              height: heightPx,
              fill: svgColor,
              opacity: 0.5,
              globalCompositeOperation: 'source-atop',
              listening: false,
            });

            panelGroup.add(panelImage);
            panelGroup.add(colorOverlay);
            panelImage.on('tap click', handlePanelClick);
            panelImage.cursor = 'pointer';
            layer.draw();
          };
          imageObj.onerror = () => {
            const panelRect = new Konva.Rect({
              width: widthPx,
              height: heightPx,
              fill: isSelected ? '#fee2e2' : '#f3f4f6',
              stroke: 'transparent',
              strokeWidth: 0,
              listening: true,
            });
            panelGroup.add(panelRect);
            panelRect.on('tap click', handlePanelClick);
            panelRect.cursor = 'pointer';
            layer.draw();
          };
          imageObj.src = panel.model2D;
        } else {
          // Panel outline (fallback when no 2D model)
          const panelRect = new Konva.Rect({
            width: widthPx,
            height: heightPx,
            fill: isSelected ? '#fee2e2' : '#f3f4f6',
            stroke: 'transparent',
            strokeWidth: 0,
            listening: true,
          });
          panelGroup.add(panelRect);
          panelRect.on('tap click', handlePanelClick);
          panelRect.cursor = 'pointer';
        }

        // Panel name label
        const nameText = new Konva.Text({
          x: 5,
          y: 5,
          text: panel.name,
          fontSize: 12,
          fontStyle: 'bold',
          fill: isSelected ? '#2563eb' : '#666',
          padding: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          cornerRadius: 2,
          listening: false,
        });
        panelGroup.add(nameText);

        // Panel dimensions text
        const dimText = new Konva.Text({
          x: widthPx / 2 - 40,
          y: heightPx + 10,
          text: `${panel.width} × ${panel.height}mm`,
          fontSize: 12,
          fill: '#666',
          width: 80,
          align: 'center',
          listening: false,
        });
        panelGroup.add(dimText);

        canvasGroup.add(panelGroup);
      });

      layer.add(canvasGroup);

      // Render components
      components.forEach((canvasComp) => {
        const compDef = componentLibrary.find((c) => c.id === canvasComp.componentId);
        if (!compDef) return;

        // Find the panel this component belongs to
        const panelPos = panelPositions.find((p) => p.panel.id === canvasComp.panelId);
        if (!panelPos) return;

        const compX = offset.x + (panelPos.xOffset + canvasComp.x) * mmToPixels * scale;
        const compY = offset.y + canvasComp.y * mmToPixels * scale;
        const compWidth = compDef.width * mmToPixels;
        const compHeight = compDef.height * mmToPixels;

        const compGroup = new Konva.Group({
          x: compX,
          y: compY,
          rotation: canvasComp.rotation || 0,
          scaleX: scale * (canvasComp.scale || 1),
          scaleY: scale * (canvasComp.scale || 1),
          draggable: true,
          dragBoundFunc: (pos) => {
            // Convert stage position to canvas coordinates (mm)
            const canvasX = (pos.x - offset.x) / scale / mmToPixels;
            const canvasY = (pos.y - offset.y) / scale / mmToPixels;

            // Find which panel this position is in
            let currentX = 0;
            for (const panel of panels) {
              if (canvasX >= currentX && canvasX < currentX + panel.width && canvasY >= 0 && canvasY < panel.height) {
                const localX = canvasX - currentX;
                const snappedX = snapToGrid(localX);
                const snappedY = snapToGrid(canvasY);

                const clampedX = Math.max(0, Math.min(snappedX, panel.width));
                const clampedY = Math.max(0, Math.min(snappedY, panel.height));

                const panelPos = panelPositions.find((p) => p.panel.id === panel.id);
                if (panelPos) {
                  return {
                    x: offset.x + (panelPos.xOffset + clampedX) * mmToPixels * scale,
                    y: offset.y + clampedY * mmToPixels * scale,
                  };
                }
              }
              currentX += panel.width;
            }

            return pos;
          },
        });

        // Render component 2D model or fallback rectangle
        if (compDef.model2D && (compDef.model2D.startsWith('http') || compDef.model2D.startsWith('/'))) {
          const imageObj = new Image();
          imageObj.crossOrigin = 'anonymous';
          imageObj.onload = () => {
            const compImage = new Konva.Image({
              x: 0,
              y: 0,
              image: imageObj,
              width: compWidth,
              height: compHeight,
            });

            const borderRect = new Konva.Rect({
              x: 0,
              y: 0,
              width: compWidth,
              height: compHeight,
              fill: 'transparent',
              stroke: compDef.color,
              strokeWidth: 2,
              cornerRadius: 2,
              listening: false,
            });

            compGroup.add(compImage);
            compGroup.add(borderRect);
            layer.draw();
          };
          imageObj.onerror = () => {
            const compRect = new Konva.Rect({
              width: compWidth,
              height: compHeight,
              fill: compDef.color,
              opacity: 0.3,
              stroke: compDef.color,
              strokeWidth: 2,
              cornerRadius: 2,
            });
            compGroup.add(compRect);
            layer.draw();
          };
          imageObj.src = compDef.model2D;
        } else {
          // Fallback rectangle when no 2D model
          const compRect = new Konva.Rect({
            width: compWidth,
            height: compHeight,
            fill: compDef.color,
            opacity: 0.3,
            stroke: compDef.color,
            strokeWidth: 2,
            cornerRadius: 2,
          });
          compGroup.add(compRect);
        }

        const compLabel = new Konva.Text({
          x: compWidth / 2 - 30,
          y: compHeight / 2 - 8,
          text: compDef.name,
          fontSize: 10,
          fill: '#333',
          width: 60,
          align: 'center',
        });
        compGroup.add(compLabel);

        // Handle drag end to update component position
        compGroup.on('dragend', () => {
          const pos = compGroup.position();
          const canvasX = (pos.x - offset.x) / scale / mmToPixels;
          const canvasY = (pos.y - offset.y) / scale / mmToPixels;

          let currentX = 0;
          for (const panel of panels) {
            if (canvasX >= currentX && canvasX < currentX + panel.width && canvasY >= 0 && canvasY < panel.height) {
              const localX = canvasX - currentX;
              const snappedX = snapToGrid(localX);
              const snappedY = snapToGrid(canvasY);

              const updatedComponents = localComponents.map((c) =>
                c.id === canvasComp.id
                  ? {
                      ...c,
                      panelId: panel.id,
                      x: Math.max(0, Math.min(snappedX, panel.width)),
                      y: Math.max(0, Math.min(snappedY, panel.height)),
                    }
                  : c
              );

              setLocalComponents(updatedComponents);
              // Don't auto-save, just update local state - user will click Save
              break;
            }
            currentX += panel.width;
          }
        });

        compGroup.cursor = 'move';
        layer.add(compGroup);
      });

      // Stage click handler for deselecting
      const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target === stage) {
          setSelectedPanelId(null);
        }
      };

      stage.on('click', handleStageClick);
      stage.on('tap', handleStageClick);

      // Keyboard handler for delete
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPanelId) {
          handleRemovePanel(selectedPanelId);
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      layer.draw();

      return () => {
        stage.off('click', handleStageClick);
        stage.off('tap', handleStageClick);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [
    panels,
    components,
    componentLibrary,
    offset,
    scale,
    totalWidthPx,
    maxHeightPx,
    panelPositions,
    selectedPanelId,
    project.id,
    snapToGrid,
  ]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Project name at top center - fixed position with padding */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <h3 className="text-2xl font-bold text-red-600">{(project.name || '').toUpperCase()}</h3>
      </div>

      {/* Canvas area - with top padding to avoid title overlap */}
      <div className="flex-1 bg-white relative overflow-auto" style={{ paddingTop: '60px', paddingBottom: '10px' }} ref={containerRef}>
        {/* Empty state with START DESIGN button */}
        {panels.length === 0 && (
          <>
            {/* Subtle grid lines */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="h-full w-full" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #e5e7eb 49px, #e5e7eb 50px)',
              }} />
            </div>

            {/* START DESIGN button - bottom left */}
            <div className="absolute bottom-6 left-6 z-20">
              <button
                onClick={() => setShowAddPanel(true)}
                className="px-6 py-3 bg-red-50 border-2 border-red-500 text-black font-semibold rounded-md hover:bg-red-100 transition-colors shadow-lg"
              >
                START DESIGN
              </button>
              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-2 bg-red-600 text-white px-3 py-2 rounded text-sm whitespace-nowrap">
                Click on START DESIGN to add components.
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-600"></div>
              </div>
            </div>

            {/* Empty state message */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-gray-400">
                <p className="text-lg mb-2">Ready to start designing</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom div with Add Panel and Save buttons */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Panel count and info */}
          {panels.length > 0 && (
            <div className="text-sm text-gray-600">
              {panels.length} panel{panels.length !== 1 ? 's' : ''} added
            </div>
          )}
          {panels.length === 0 && <div></div>}
          
          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {/* Add Panel button */}
            <button
              onClick={() => setShowAddPanel(true)}
              className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 border border-blue-200 font-medium"
            >
              Add Panel
            </button>
            
            {/* Save button */}
            {hasChanges ? (
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 font-medium transition-colors"
              >
                Save
              </button>
            ) : (
              <button
                disabled
                className="px-4 py-2 text-sm bg-gray-200 text-gray-500 rounded-md font-medium cursor-not-allowed"
              >
                Saved
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Panel Modal - Width Selection */}
      {showAddPanel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white border-t border-gray-200 rounded-t-lg shadow-2xl w-full max-w-2xl max-h-[50vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Add Panel</h3>
              <button
                onClick={() => {
                  setShowAddPanel(false);
                  setSelectedWidth('');
                }}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedWidth}
                    onChange={(e) => setSelectedWidth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select width</option>
                    {widthOptions.map((w) => (
                      <option key={w} value={w}>
                        {w}mm
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Available widths from panel library
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddPanel(false);
                  setSelectedWidth('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleAddPanel}
                disabled={!selectedWidth}
                className={`px-4 py-2 rounded-md transition-colors ${
                  selectedWidth
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Add Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
