'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Konva from 'konva';
import { Project, Panel, CanvasComponent } from '@/types';
import { usePanelStore } from '@/lib/store';
import ProjectComponentProperties from './ProjectComponentProperties';

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
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedWidth, setSelectedWidth] = useState('');
  const [showComponentProperties, setShowComponentProperties] = useState(false);
  const [localPanels, setLocalPanels] = useState<Panel[]>(project.panels || []);
  const [localComponents, setLocalComponents] = useState<CanvasComponent[]>(project.components || []);
  const [originalPanels, setOriginalPanels] = useState<Panel[]>(project.panels || []);
  const [originalComponents, setOriginalComponents] = useState<CanvasComponent[]>(project.components || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  
  // Cache for loaded images to prevent reloading
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  // Store references to component groups for selection updates
  const componentGroupRefsRef = useRef<Map<string, Konva.Group>>(new Map());
  const gapGroupRefsRef = useRef<Map<string, Konva.Group>>(new Map());
  const panelGroupRefsRef = useRef<Map<string, Konva.Group>>(new Map());
  // Store drag timers for hold-to-drag
  const dragTimerRefsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  // Store original positions for visual reordering during drag
  const originalPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

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
    setShowComponentProperties(false);
    // Don't auto-save, just update local state - user will click Save
  };

  // Calculate next component position (top-to-bottom, centralized, with spacing)
  const calculateNextComponentPosition = (panelId: string, componentWidth: number, componentHeight: number) => {
    const panel = localPanels.find((p) => p.id === panelId);
    if (!panel) return { x: 0, y: 0, order: 0 };

    const panelComponents = localComponents
      .filter((c) => c.panelId === panelId)
      .sort((a, b) => (a.properties?.order ?? 0) - (b.properties?.order ?? 0));

    const spacing = 10; // mm spacing between components
    const startY = 10; // Start 10mm from top

    if (panelComponents.length === 0) {
      const centeredX = (panel.width - componentWidth) / 2;
      return { x: centeredX, y: startY, order: 0 };
    }

    // Calculate Y position based on last component
    let totalHeight = startY;
    for (const comp of panelComponents) {
      if (comp.componentId === 'gap') {
        // For gaps, use the gapHeight property
        const gapHeight = comp.properties?.gapHeight || 10;
        totalHeight += gapHeight + spacing;
      } else {
        const compDef = componentLibrary.find((c) => c.id === comp.componentId);
        if (compDef) {
          totalHeight += compDef.height + spacing;
        }
      }
    }

    const centeredX = (panel.width - componentWidth) / 2;
    const nextOrder = panelComponents.length;

    return { x: centeredX, y: totalHeight, order: nextOrder };
  };

  // Handle adding component to selected panel
  const handleAddComponent = (componentId: string, aValue?: string, vValue?: string, pValue?: string) => {
    if (!selectedPanelId) return;

    const component = componentLibrary.find((c) => c.id === componentId);
    if (!component) return;

    const position = calculateNextComponentPosition(selectedPanelId, component.width, component.height);

    const newComponent: CanvasComponent = {
      id: `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      componentId,
      panelId: selectedPanelId,
      x: position.x,
      y: position.y,
      rotation: 0,
      scale: 1,
      properties: {
        order: position.order,
        typeValue: component.type,
        ...(aValue && { aValue }),
        ...(vValue && { vValue }),
        ...(pValue && { pValue }),
      },
    };

    setLocalComponents([...localComponents, newComponent]);
  };

  // Handle adding gap to selected panel
  const handleAddGap = (height: number) => {
    if (!selectedPanelId) return;

    const panel = localPanels.find((p) => p.id === selectedPanelId);
    if (!panel) return;

    // Calculate position for gap (same as component)
    const gapWidth = panel.width; // Gap spans full width
    const position = calculateNextComponentPosition(selectedPanelId, gapWidth, height);

    // Create a gap component (special component with componentId 'gap')
    const gapComponent: CanvasComponent = {
      id: `gap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      componentId: 'gap', // Special ID for gaps
      panelId: selectedPanelId,
      x: 0, // Gap starts at left edge
      y: position.y,
      rotation: 0,
      scale: 1,
      properties: {
        order: position.order,
        gapHeight: height,
      },
    };

    setLocalComponents([...localComponents, gapComponent]);
  };

  // Handle deleting component or gap
  const handleDeleteComponent = (componentId: string) => {
    const updatedComponents = localComponents.filter((c) => c.id !== componentId);
    
    // Recalculate order and positions for remaining components in the same panel
    const deletedComponent = localComponents.find((c) => c.id === componentId);
    if (deletedComponent) {
      const panelId = deletedComponent.panelId;
      const panel = localPanels.find((p) => p.id === panelId);
      if (!panel) {
        setLocalComponents(updatedComponents);
        return;
      }

      const panelComponents = updatedComponents
        .filter((c) => c.panelId === panelId)
        .sort((a, b) => (a.properties?.order ?? 0) - (b.properties?.order ?? 0));
      
      // Recalculate Y positions and order for all components in the panel
      const spacing = 10;
      const startY = 10;
      let currentY = startY;
      
      const repositioned = panelComponents.map((comp, index) => {
        let height = 0;
        if (comp.componentId === 'gap') {
          height = comp.properties?.gapHeight || 10;
        } else {
          const compDef = componentLibrary.find((c) => c.id === comp.componentId);
          height = compDef?.height || 0;
        }
        
        const result = {
          ...comp,
          y: currentY,
          properties: {
            ...comp.properties,
            order: index,
          },
          ...(comp.componentId === 'gap' 
            ? { x: 0 } 
            : { x: (panel.width - (componentLibrary.find((c) => c.id === comp.componentId)?.width || 0)) / 2 }),
        };
        
        currentY += height + spacing;
        return result;
      });
      
      // Update all components with new positions and orders
      const finalComponents = updatedComponents.map((comp) => {
        if (comp.panelId === panelId) {
          const repositionedComp = repositioned.find((r) => r.id === comp.id);
          return repositionedComp || comp;
        }
        return comp;
      });
      
      setLocalComponents(finalComponents);
    } else {
      setLocalComponents(updatedComponents);
    }
  };

  // Handle updating gap height
  const handleUpdateGap = (gapId: string, height: number) => {
    const updatedComponents = localComponents.map((comp) => {
      if (comp.id === gapId && comp.componentId === 'gap') {
        return {
          ...comp,
          properties: {
            ...comp.properties,
            gapHeight: height,
          },
        };
      }
      return comp;
    });
    
    // Recalculate positions for all components in the panel after gap height change
    const gapComponent = updatedComponents.find((c) => c.id === gapId);
    if (gapComponent) {
      const panelId = gapComponent.panelId;
      const panel = localPanels.find((p) => p.id === panelId);
      if (panel) {
        const panelComponents = updatedComponents
          .filter((c) => c.panelId === panelId)
          .sort((a, b) => (a.properties?.order ?? 0) - (b.properties?.order ?? 0));
        
        const spacing = 10;
        const startY = 10;
        let currentY = startY;
        
        const repositioned = panelComponents.map((comp) => {
          let height = 0;
          if (comp.componentId === 'gap') {
            height = comp.properties?.gapHeight || 10;
          } else {
            const compDef = componentLibrary.find((c) => c.id === comp.componentId);
            height = compDef?.height || 0;
          }
          
          const result = {
            ...comp,
            y: currentY,
            ...(comp.componentId === 'gap' ? { x: 0 } : { x: (panel.width - (componentLibrary.find((c) => c.id === comp.componentId)?.width || 0)) / 2 }),
          };
          
          currentY += height + spacing;
          return result;
        });
        
        const finalComponents = updatedComponents.map((comp) => {
          const repositionedComp = repositioned.find((r) => r.id === comp.id);
          return repositionedComp || comp;
        });
        
        setLocalComponents(finalComponents);
      } else {
        setLocalComponents(updatedComponents);
      }
    } else {
      setLocalComponents(updatedComponents);
    }
  };

  // Reorder components when one is dragged vertically
  const reorderComponents = (draggedComponentId: string, newY: number, panelId: string, currentComponents: CanvasComponent[]) => {
    const panel = localPanels.find((p) => p.id === panelId);
    if (!panel) return currentComponents;

    const spacing = 10;
    const startY = 10;

    // Get all components in this panel (excluding dragged one)
    const otherComponents = currentComponents
      .filter((c) => c.panelId === panelId && c.id !== draggedComponentId)
      .map((c) => {
        let height = 0;
        if (c.componentId === 'gap') {
          height = c.properties?.gapHeight || 10;
        } else {
          const compDef = componentLibrary.find((lib) => lib.id === c.componentId);
          height = compDef?.height || 0;
        }
        return { comp: c, height, centerY: c.y + height / 2 };
      })
      .sort((a, b) => a.centerY - b.centerY);

    // Find insertion point based on Y position
    let insertIndex = otherComponents.length;
    for (let i = 0; i < otherComponents.length; i++) {
      if (newY < otherComponents[i].centerY) {
        insertIndex = i;
        break;
      }
    }

    // Rebuild component list with new order
    const reorderedComponents = [...otherComponents];
    const draggedComp = currentComponents.find((c) => c.id === draggedComponentId);
    if (draggedComp) {
      let draggedHeight = 0;
      if (draggedComp.componentId === 'gap') {
        draggedHeight = draggedComp.properties?.gapHeight || 10;
      } else {
        const draggedDef = componentLibrary.find((c) => c.id === draggedComp.componentId);
        draggedHeight = draggedDef?.height || 0;
      }
      reorderedComponents.splice(insertIndex, 0, {
        comp: draggedComp,
        height: draggedHeight,
        centerY: newY,
      });
    }

    // Recalculate Y positions for all components
    const updatedComponents = [...currentComponents];
    let currentY = startY;

    reorderedComponents.forEach((item, index) => {
      const compIndex = updatedComponents.findIndex((c) => c.id === item.comp.id);
      if (compIndex !== -1) {
        if (item.comp.componentId === 'gap') {
          // Gap spans full width, starts at x=0
          updatedComponents[compIndex] = {
            ...updatedComponents[compIndex],
            x: 0,
            y: currentY,
            properties: {
              ...updatedComponents[compIndex].properties,
              order: index,
            },
          };
          currentY += item.height + spacing;
        } else {
          const compDef = componentLibrary.find((c) => c.id === item.comp.componentId);
          if (compDef) {
            const centeredX = (panel.width - compDef.width) / 2;
            updatedComponents[compIndex] = {
              ...updatedComponents[compIndex],
              x: centeredX,
              y: currentY,
              properties: {
                ...updatedComponents[compIndex].properties,
                order: index,
              },
            };
            currentY += compDef.height + spacing;
          }
        }
      }
    });

    return updatedComponents;
  };

  // Initialize Konva stage
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    // Account for padding when calculating available height
    const availableHeight = container.clientHeight - 70; // 60px top padding + 10px bottom padding
    const containerHeight = Math.max(availableHeight, 400); // Minimum height

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
      // Account for padding when calculating available height
      const availableHeight = container.clientHeight - 70; // 60px top padding + 10px bottom padding
      const newHeight = Math.max(availableHeight, 400); // Minimum height

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

    // Clear layer and refs
    layer.destroyChildren();
    componentGroupRefsRef.current.clear();
    gapGroupRefsRef.current.clear();
    panelGroupRefsRef.current.clear();

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
          if (selectedPanelId === panel.id) {
            // Deselect if clicking same panel
            setSelectedPanelId(null);
            setSelectedComponentId(null);
            setShowComponentProperties(false);
          } else {
            // Select panel and open properties, deselect any component
            setSelectedPanelId(panel.id);
            setSelectedComponentId(null);
            setShowComponentProperties(true);
          }
        };

        // Store panel group reference
        panelGroupRefsRef.current.set(panel.id, panelGroup);

        // Panel background/2D model or outline
        if (panel.model2D && (panel.model2D.startsWith('http') || panel.model2D.startsWith('/'))) {
          // Check cache first
          let imageObj = imageCacheRef.current.get(panel.model2D);
          if (!imageObj) {
            imageObj = new Image();
            imageObj.crossOrigin = 'anonymous';
            imageCacheRef.current.set(panel.model2D, imageObj);
          }
          
          if (imageObj.complete && imageObj.naturalWidth > 0) {
            // Image already loaded, use it immediately
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
              name: 'selection-overlay',
            });

            panelGroup.add(panelImage);
            panelGroup.add(colorOverlay);
            panelImage.on('tap click', handlePanelClick);
            panelImage.on('mouseenter', () => { document.body.style.cursor = 'pointer'; });
            panelImage.on('mouseleave', () => { document.body.style.cursor = 'default'; });
          } else {
            // Image not loaded yet, wait for onload
            imageObj.onload = () => {
              const panelImage = new Konva.Image({
                x: 0,
                y: 0,
                image: imageObj!,
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
                name: 'selection-overlay',
              });

              panelGroup.add(panelImage);
              panelGroup.add(colorOverlay);
              panelImage.on('tap click', handlePanelClick);
              panelImage.on('mouseenter', () => { document.body.style.cursor = 'pointer'; });
              panelImage.on('mouseleave', () => { document.body.style.cursor = 'default'; });
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
              panelRect.on('mouseenter', () => { document.body.style.cursor = 'pointer'; });
              panelRect.on('mouseleave', () => { document.body.style.cursor = 'default'; });
              layer.draw();
            };
            if (!imageObj.src) {
              imageObj.src = panel.model2D;
            }
          }
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
          panelRect.on('mouseenter', () => { document.body.style.cursor = 'pointer'; });
          panelRect.on('mouseleave', () => { document.body.style.cursor = 'default'; });
        }

        // Panel name label (conditional)
        if (showLabels) {
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
        }

        // Panel width dimension lines and label (below panel) - bigger and bolder

          const gapFromPanel = 10; // Gap between panel bottom and dimension lines
          const extensionLineLength = 15; // Length of extension lines below panel
          const dimensionStartY = heightPx + gapFromPanel; // Start Y position for dimension lines
          const labelY = dimensionStartY + extensionLineLength + 5; // Position label below extension lines
          
          // Left extension line (vertical line extending down from left edge)
          const leftExtensionLine = new Konva.Line({
            points: [0, dimensionStartY, 0, dimensionStartY + extensionLineLength],
            stroke: '#666',
            strokeWidth: 1,
            listening: false,
          });
          panelGroup.add(leftExtensionLine);
          
          // Right extension line (vertical line extending down from right edge)
          const rightExtensionLine = new Konva.Line({
            points: [widthPx, dimensionStartY, widthPx, dimensionStartY + extensionLineLength],
            stroke: '#666',
            strokeWidth: 1,
            listening: false,
          });
          panelGroup.add(rightExtensionLine);
          
          // Horizontal line at the end (bottom, connecting the extension lines) - bolder
          const bottomHorizontalLine = new Konva.Line({
            points: [0, dimensionStartY + extensionLineLength, widthPx, dimensionStartY + extensionLineLength],
            stroke: '#666',
            strokeWidth: 2,
            listening: false,
          });
          panelGroup.add(bottomHorizontalLine);
          
          // Width label centered between extension lines
          const widthText = new Konva.Text({
            x: widthPx / 2 - 40,
            y: labelY,
            text: `${panel.width}mm`,
            fontSize: 18,
            fontStyle: 'bold',
            fill: '#666',
            width: 80,
            align: 'center',
            listening: false,
          });
          panelGroup.add(widthText);
        

        canvasGroup.add(panelGroup);
      });

      layer.add(canvasGroup);

      // Add height ruler on the left side (for first panel only)
      // Height displays bottom-to-top: 0 at bottom, panel height at top
      if (panels.length > 0) {
        const firstPanel = panels[0];
        const firstPanelHeightPx = firstPanel.height * mmToPixels;
        // Position ruler next to panels (to the left of the first panel)
        const rulerX = offset.x - 60; // Position to the left of the first panel
        const rulerGroup = new Konva.Group({
          x: rulerX,
          y: offset.y,
          scaleX: scale,
          scaleY: scale,
        });

        // Ruler line (vertical line on the right edge of ruler)
        const rulerLine = new Konva.Line({
          points: [50, 0, 50, firstPanelHeightPx],
          stroke: '#666',
          strokeWidth: 1,
          listening: false,
        });
        rulerGroup.add(rulerLine);

        // Ruler ticks and labels - bottom to top
        // Only show labels at 0 (bottom) and max height (top), show lines for all ticks
        const tickInterval = 100; // Every 100mm
        const numTicks = Math.ceil(firstPanel.height / tickInterval);
        
        for (let i = 0; i <= numTicks; i++) {
          const tickHeight = i * tickInterval;
          if (tickHeight > firstPanel.height) break;
          
          // Calculate Y position from bottom (0 at bottom, height at top)
          const tickY = firstPanelHeightPx - (tickHeight * mmToPixels);
          
          // Major tick (horizontal line from left to ruler line)
          const tick = new Konva.Line({
            points: [40, tickY, 50, tickY],
            stroke: '#666',
            strokeWidth: 1,
            listening: false,
          });
          rulerGroup.add(tick);

          // Only show labels at 0 (bottom) and max height (top)
          const isBottom = tickHeight === 0;
          const isTop = Math.abs(tickHeight - firstPanel.height) < 0.1; // Account for floating point
          
          if (isBottom || isTop) {
            // Label (positioned to the right of the ruler line, right-aligned) - bigger and bold
            const label = new Konva.Text({
              x: -140,
              y: tickY - 8,
              text: `${tickHeight}mm`,
              fontSize: 18,
              fontStyle: 'bold',
              fill: '#666',
              align: 'right',
              width: 150,
              listening: false,
            });
            rulerGroup.add(label);
          }

          // Minor ticks (every 50mm)
          if (i < numTicks && tickHeight + 50 <= firstPanel.height) {
            const minorTickHeight = tickHeight + 50;
            const minorTickY = firstPanelHeightPx - (minorTickHeight * mmToPixels);
            const minorTick = new Konva.Line({
              points: [45, minorTickY, 50, minorTickY],
              stroke: '#999',
              strokeWidth: 0.5,
              listening: false,
            });
            rulerGroup.add(minorTick);
          }
        }

        layer.add(rulerGroup);
      }

      // Render components
      components.forEach((canvasComp) => {
        // Handle gap components separately
        if (canvasComp.componentId === 'gap') {
          const panelPos = panelPositions.find((p) => p.panel.id === canvasComp.panelId);
          if (!panelPos) return;

          const gapHeight = (canvasComp.properties?.gapHeight || 10) * mmToPixels;
          const gapWidth = panelPos.panel.width * mmToPixels;
          const gapX = offset.x + panelPos.xOffset * mmToPixels * scale;
          const gapY = offset.y + canvasComp.y * mmToPixels * scale;

          // Store panelPos in a variable that will be captured in the closure
          const currentPanelPos = panelPos;
          const isGapSelected = selectedComponentId === canvasComp.id;

          // Create a group for the gap to make it draggable
          const gapGroup = new Konva.Group({
            x: gapX,
            y: gapY,
            draggable: false, // Start with dragging disabled - enable on hold
            dragBoundFunc: (pos) => {
              // Lock X to panel left edge (x=0) - only allow vertical movement
              const panelLeftX = offset.x + currentPanelPos.xOffset * mmToPixels * scale;
              
              // Allow Y movement within panel bounds
              // Convert stage Y to canvas Y (mm) - account for scale
              const canvasY = (pos.y - offset.y) / scale / mmToPixels;
              const gapHeightMm = canvasComp.properties?.gapHeight || 10;
              const maxY = currentPanelPos.panel.height - gapHeightMm;
              const clampedY = Math.max(0, Math.min(canvasY, maxY));
              
              // Convert back to stage coordinates
              const clampedStageY = offset.y + clampedY * mmToPixels * scale;

              return {
                x: panelLeftX, // Always at panel left edge, no horizontal movement
                y: clampedStageY,
              };
            },
          });

          // Gap rectangle - transparent with dashed border
          const gapRect = new Konva.Rect({
            x: 0,
            y: 0,
            width: gapWidth * scale,
            height: gapHeight * scale,
            fill: 'transparent',
            stroke: isGapSelected ? '#dc2626' : '#d1d5db',
            strokeWidth: 1,
            dash: [5, 5],
            listening: true, // Make it listen to events
          });
          gapGroup.add(gapRect);

          // Gap label (conditional)
          if (showLabels) {
            const gapLabel = new Konva.Text({
              x: (gapWidth * scale) / 2 - 20,
              y: (gapHeight * scale) / 2 - 6,
              text: `Gap ${canvasComp.properties?.gapHeight || 10}mm`,
              fontSize: 8,
              fill: isGapSelected ? '#dc2626' : '#6b7280',
              width: 40,
              align: 'center',
              listening: false,
            });
            gapGroup.add(gapLabel);
          }

          // Gap click handler
          const handleGapClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
            e.cancelBubble = true;
            if (e.evt) {
              e.evt.stopPropagation();
              e.evt.preventDefault();
            }
            
            // Select gap, deselect panel
            const gapId = canvasComp.id;
            const panelId = canvasComp.panelId;
            
            setSelectedComponentId((prevSelected) => {
              if (prevSelected === gapId) {
                // Deselect if clicking same gap
                setSelectedPanelId(null);
                setShowComponentProperties(false);
                return null;
              } else {
                // Select gap, deselect panel
                setSelectedPanelId(null);
                setShowComponentProperties(false);
                return gapId;
              }
            });
          };

          // Add click handler - prevent event from bubbling to panel
          gapGroup.on('click tap', (e) => {
            e.cancelBubble = true;
            if (e.evt) {
              e.evt.stopPropagation();
              e.evt.preventDefault();
            }
            handleGapClick(e);
          });
          
          // Hold-to-drag: enable dragging only after holding
          let dragStartPos: { x: number; y: number } | null = null;
          let isDragging = false;
          let dragTimer: NodeJS.Timeout | null = null;
          
          gapGroup.on('mousedown touchstart', (e) => {
            e.cancelBubble = true;
            if (e.evt) {
              e.evt.stopPropagation();
            }
            
            const stage = gapGroup.getStage();
            if (stage) {
              const pointerPos = stage.getPointerPosition();
              dragStartPos = pointerPos ? { x: pointerPos.x, y: pointerPos.y } : null;
              
              // Start timer to enable dragging after hold
              dragTimer = setTimeout(() => {
                if (dragStartPos && !isDragging) {
                  gapGroup.draggable(true);
                  isDragging = true;
                  document.body.style.cursor = 'grabbing';
                }
              }, 200); // 200ms hold time
            }
          });
          
          gapGroup.on('mousemove touchmove', () => {
            if (dragStartPos && !isDragging) {
              const stage = gapGroup.getStage();
              if (stage) {
                const pointerPos = stage.getPointerPosition();
                if (pointerPos) {
                  const distance = Math.sqrt(
                    Math.pow(pointerPos.x - dragStartPos!.x, 2) + 
                    Math.pow(pointerPos.y - dragStartPos!.y, 2)
                  );
                  // If moved more than 5 pixels, enable dragging immediately
                  if (distance > 5) {
                    if (dragTimer) clearTimeout(dragTimer);
                    gapGroup.draggable(true);
                    isDragging = true;
                    document.body.style.cursor = 'grabbing';
                  }
                }
              }
            }
          });
          
          gapGroup.on('mouseup touchend', () => {
            if (dragTimer) {
              clearTimeout(dragTimer);
              dragTimer = null;
            }
            if (!isDragging) {
              // It was just a click, handle selection
              handleGapClick({ cancelBubble: false, evt: {} } as any);
            }
            dragStartPos = null;
            isDragging = false;
            document.body.style.cursor = 'default';
          });

          // Store original positions for visual reordering
          const gapOriginalY = canvasComp.y;
          originalPositionsRef.current.set(canvasComp.id, { x: 0, y: gapOriginalY });

          // Handle drag move for visual reordering
          gapGroup.on('dragmove', () => {
            const pos = gapGroup.position();
            const canvasY = (pos.y - offset.y) / scale / mmToPixels;
            
            // Get all components in the same panel
            const panelComps = components
              .filter((c) => c.panelId === canvasComp.panelId && c.id !== canvasComp.id)
              .map((c) => {
                let height = 0;
                if (c.componentId === 'gap') {
                  height = c.properties?.gapHeight || 10;
                } else {
                  const compDef = componentLibrary.find((lib) => lib.id === c.componentId);
                  height = compDef?.height || 0;
                }
                return { comp: c, height, centerY: c.y + height / 2 };
              })
              .sort((a, b) => a.centerY - b.centerY);

            const gapHeightMm = canvasComp.properties?.gapHeight || 10;
            const draggedCenterY = canvasY + gapHeightMm / 2;

            // Find insert position
            let insertIndex = panelComps.length;
            for (let i = 0; i < panelComps.length; i++) {
              if (draggedCenterY < panelComps[i].centerY) {
                insertIndex = i;
                break;
              }
            }

            // Calculate new positions for visual reordering
            const spacing = 10;
            const startY = 10;
            let currentY = startY;
            
            panelComps.forEach((item, index) => {
              if (index === insertIndex) {
                // This is where the dragged gap should be
                currentY += gapHeightMm + spacing;
              }
              
              const otherGroup = canvasComp.id === item.comp.id 
                ? gapGroup
                : (item.comp.componentId === 'gap'
                    ? gapGroupRefsRef.current.get(item.comp.id)
                    : componentGroupRefsRef.current.get(item.comp.id));
              
              if (otherGroup) {
                const originalPos = originalPositionsRef.current.get(item.comp.id);
                if (originalPos) {
                  const targetY = offset.y + currentY * mmToPixels * scale;
                  // Smooth transition to new position
                  otherGroup.to({
                    y: targetY,
                    duration: 0.2,
                    easing: Konva.Easings.EaseInOut,
                  });
                }
              }
              
              let height = item.height;
              currentY += height + spacing;
            });
            
            // If dragged gap should be at the end
            if (insertIndex === panelComps.length) {
              // Already handled in loop
            }
          });

          // Handle drag end to update actual order in list
          gapGroup.on('dragend', () => {
            const pos = gapGroup.position();
            const canvasY = (pos.y - offset.y) / scale / mmToPixels;

            // Update gap position temporarily
            const updatedComponents = localComponents.map((c) => {
              if (c.id === canvasComp.id) {
                return {
                  ...c,
                  x: 0,
                  y: canvasY,
                };
              }
              return c;
            });

            // Use the existing reorderComponents function to update actual list
            const reordered = reorderComponents(canvasComp.id, canvasY, canvasComp.panelId, updatedComponents);
            setLocalComponents(reordered);
            
            // Reset dragging state
            gapGroup.draggable(false);
            isDragging = false;
            document.body.style.cursor = 'default';
            
            // Update original positions
            reordered.forEach((comp) => {
              if (comp.panelId === canvasComp.panelId) {
                originalPositionsRef.current.set(comp.id, { x: comp.x, y: comp.y });
              }
            });
          });

          // Add cursor change on hover
          gapGroup.on('mouseenter', () => {
            document.body.style.cursor = 'move';
          });
          gapGroup.on('mouseleave', () => {
            document.body.style.cursor = 'default';
          });

          // Store gap group reference
          gapGroupRefsRef.current.set(canvasComp.id, gapGroup);

          layer.add(gapGroup);
          return;
        }

        const compDef = componentLibrary.find((c) => c.id === canvasComp.componentId);
        if (!compDef) return;

        // Find the panel this component belongs to
        const panelPos = panelPositions.find((p) => p.panel.id === canvasComp.panelId);
        if (!panelPos) return;

        // Use stored X position (should be centered) or calculate centered position
        const storedX = canvasComp.x;
        const centeredX = (panelPos.panel.width - compDef.width) / 2;
        const finalX = Math.abs(storedX - centeredX) < 1 ? storedX : centeredX; // Use stored if close to centered, otherwise use centered
        
        // Components are added directly to layer, so we need absolute stage coordinates
        const compX = offset.x + (panelPos.xOffset + finalX) * mmToPixels * scale;
        const compY = offset.y + canvasComp.y * mmToPixels * scale;
        const compWidth = compDef.width * mmToPixels;
        const compHeight = compDef.height * mmToPixels;

        // Store panelPos in a variable that will be captured in the closure
        const currentPanelPos = panelPos;
        const isComponentSelected = selectedComponentId === canvasComp.id;
        
        // Calculate centered X position relative to panel (in mm)
        const centeredXPos = (currentPanelPos.panel.width - compDef.width) / 2;
        
        const compGroup = new Konva.Group({
          x: compX,
          y: compY,
          rotation: canvasComp.rotation || 0,
          scaleX: scale * (canvasComp.scale || 1),
          scaleY: scale * (canvasComp.scale || 1),
          draggable: false, // Start with dragging disabled - enable on hold
          dragBoundFunc: (pos) => {
            // Lock X to centered position - only allow vertical movement
            // Calculate centered X in stage coordinates
            const centeredStageX = offset.x + (currentPanelPos.xOffset + centeredXPos) * mmToPixels * scale;
            
            // Allow Y movement within panel bounds
            // Convert stage Y to canvas Y (mm) - account for scale
            const canvasY = (pos.y - offset.y) / scale / mmToPixels;
            const maxY = currentPanelPos.panel.height - compDef.height;
            const clampedY = Math.max(0, Math.min(canvasY, maxY));
            
            // Convert back to stage coordinates
            const clampedStageY = offset.y + clampedY * mmToPixels * scale;

            return {
              x: centeredStageX, // Always centered, no horizontal movement
              y: clampedStageY,
            };
          },
        });

        // Component click handler
        const handleComponentClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
          e.cancelBubble = true;
          if (e.evt) {
            e.evt.stopPropagation();
            e.evt.preventDefault();
          }
          
          // Select component, deselect panel
          const compId = canvasComp.id;
          const panelId = canvasComp.panelId;
          
          setSelectedComponentId((prevSelected) => {
            if (prevSelected === compId) {
              // Deselect if clicking same component
              setSelectedPanelId(null);
              setShowComponentProperties(false);
              return null;
            } else {
              // Select component, deselect panel
              setSelectedPanelId(null);
              setShowComponentProperties(false);
              return compId;
            }
          });
        };

        // Render component 2D model or fallback rectangle
        // First add a temporary placeholder rectangle
        // Change color when selected (red tint)
        const fillColor = isComponentSelected ? '#dc2626' : compDef.color;
        const placeholderRect = new Konva.Rect({
          width: compWidth,
          height: compHeight,
          fill: fillColor,
          opacity: 0.3,
          stroke: 'transparent',
          strokeWidth: 0,
          cornerRadius: 2,
          name: 'placeholder',
          listening: true, // Make it listen to events
        });
        compGroup.add(placeholderRect);

        // Store component group reference
        componentGroupRefsRef.current.set(canvasComp.id, compGroup);

        // Try to load 2D model if available
        if (compDef.model2D && (compDef.model2D.startsWith('http') || compDef.model2D.startsWith('/'))) {
          // Check cache first
          let imageObj = imageCacheRef.current.get(compDef.model2D);
          if (!imageObj) {
            imageObj = new Image();
            imageObj.crossOrigin = 'anonymous';
            imageCacheRef.current.set(compDef.model2D, imageObj);
          }
          
          if (imageObj.complete && imageObj.naturalWidth > 0) {
            // Image already loaded, use it immediately
            const placeholder = compGroup.findOne('.placeholder');
            if (placeholder) placeholder.destroy();
            const existingOverlay = compGroup.findOne('.selection-overlay');
            if (existingOverlay) existingOverlay.destroy();
            
            const compImage = new Konva.Image({
              x: 0,
              y: 0,
              image: imageObj,
              width: compWidth,
              height: compHeight,
              listening: true,
            });

            compGroup.add(compImage);
            
            // Add color overlay if selected
            if (isComponentSelected) {
              const colorOverlay = new Konva.Rect({
                x: 0,
                y: 0,
                width: compWidth,
                height: compHeight,
                fill: '#dc2626',
                opacity: 0.5,
                globalCompositeOperation: 'source-atop',
                cornerRadius: 2,
                listening: false,
                name: 'selection-overlay',
              });
              compGroup.add(colorOverlay);
            }
          } else {
            // Image not loaded yet, wait for onload
            imageObj.onload = () => {
              const placeholder = compGroup.findOne('.placeholder');
              if (placeholder) placeholder.destroy();
              const existingOverlay = compGroup.findOne('.selection-overlay');
              if (existingOverlay) existingOverlay.destroy();
              
              const compImage = new Konva.Image({
                x: 0,
                y: 0,
                image: imageObj!,
                width: compWidth,
                height: compHeight,
                listening: true,
              });

              compGroup.add(compImage);
              
              // Add color overlay if selected
              if (isComponentSelected) {
                const colorOverlay = new Konva.Rect({
                  x: 0,
                  y: 0,
                  width: compWidth,
                  height: compHeight,
                  fill: '#dc2626',
                  opacity: 0.5,
                  globalCompositeOperation: 'source-atop',
                  cornerRadius: 2,
                  listening: false,
                  name: 'selection-overlay',
                });
                compGroup.add(colorOverlay);
              }
              
              layer.draw();
            };
            
            imageObj.onerror = () => {
              const placeholder = compGroup.findOne('.placeholder') as Konva.Rect;
              if (placeholder && isComponentSelected) {
                placeholder.fill('#dc2626');
              }
              console.warn(`Failed to load component image: ${compDef.model2D}`);
              layer.draw();
            };
            
            if (!imageObj.src) {
              imageObj.src = compDef.model2D;
            }
          }
        }

        // Build label text with A/V/P values if available
        let labelText = compDef.name;
        const props = canvasComp.properties || {};
        if (props.aValue || props.vValue || props.pValue) {
          const values = [];
          if (props.aValue) values.push(`A: ${props.aValue}`);
          if (props.vValue) values.push(`V: ${props.vValue}`);
          if (props.pValue) values.push(`P: ${props.pValue}`);
          labelText += `\n(${values.join(', ')})`;
        }

        // Component label (conditional)
        if (showLabels) {
          const compLabel = new Konva.Text({
            x: compWidth / 2 - 40,
            y: compHeight / 2 - 12,
            text: labelText,
            fontSize: 9,
            fill: '#333',
            width: 80,
            align: 'center',
            listening: false,
          });
          compGroup.add(compLabel);
        }

        // For placeholder, color is already changed above
        // No need to add border overlay since we changed the fill color

        // Add click handler - prevent event from bubbling to panel
        compGroup.on('click tap', (e) => {
          e.cancelBubble = true;
          if (e.evt) {
            e.evt.stopPropagation();
            e.evt.preventDefault();
          }
          handleComponentClick(e);
        });
        
        // Hold-to-drag: enable dragging only after holding
        let compDragStartPos: { x: number; y: number } | null = null;
        let compIsDragging = false;
        let compDragTimer: NodeJS.Timeout | null = null;
        
        compGroup.on('mousedown touchstart', (e) => {
          e.cancelBubble = true;
          if (e.evt) {
            e.evt.stopPropagation();
          }
          
          const stage = compGroup.getStage();
          if (stage) {
            const pointerPos = stage.getPointerPosition();
            compDragStartPos = pointerPos ? { x: pointerPos.x, y: pointerPos.y } : null;
            
            // Start timer to enable dragging after hold
            compDragTimer = setTimeout(() => {
              if (compDragStartPos && !compIsDragging) {
                compGroup.draggable(true);
                compIsDragging = true;
                document.body.style.cursor = 'grabbing';
              }
            }, 200); // 200ms hold time
          }
        });
        
        compGroup.on('mousemove touchmove', () => {
          if (compDragStartPos && !compIsDragging) {
            const stage = compGroup.getStage();
            if (stage) {
              const pointerPos = stage.getPointerPosition();
              if (pointerPos) {
                const distance = Math.sqrt(
                  Math.pow(pointerPos.x - compDragStartPos!.x, 2) + 
                  Math.pow(pointerPos.y - compDragStartPos!.y, 2)
                );
                // If moved more than 5 pixels, enable dragging immediately
                if (distance > 5) {
                  if (compDragTimer) clearTimeout(compDragTimer);
                  compGroup.draggable(true);
                  compIsDragging = true;
                  document.body.style.cursor = 'grabbing';
                }
              }
            }
          }
        });
        
        compGroup.on('mouseup touchend', () => {
          if (compDragTimer) {
            clearTimeout(compDragTimer);
            compDragTimer = null;
          }
          if (!compIsDragging) {
            // It was just a click, handle selection
            handleComponentClick({ cancelBubble: false, evt: {} } as any);
          }
          compDragStartPos = null;
          compIsDragging = false;
          document.body.style.cursor = 'default';
        });

        // Store original positions for visual reordering
        const compOriginalY = canvasComp.y;
        originalPositionsRef.current.set(canvasComp.id, { x: finalX, y: compOriginalY });

        // Handle drag move for visual reordering
        compGroup.on('dragmove', () => {
          const pos = compGroup.position();
          const canvasY = (pos.y - offset.y) / scale / mmToPixels;
          
          // Get all components in the same panel
          const panelComps = components
            .filter((c) => c.panelId === canvasComp.panelId && c.id !== canvasComp.id)
            .map((c) => {
              let height = 0;
              if (c.componentId === 'gap') {
                height = c.properties?.gapHeight || 10;
              } else {
                const compDef = componentLibrary.find((lib) => lib.id === c.componentId);
                height = compDef?.height || 0;
              }
              return { comp: c, height, centerY: c.y + height / 2 };
            })
            .sort((a, b) => a.centerY - b.centerY);

          const draggedCenterY = canvasY + compDef.height / 2;

          // Find insert position
          let insertIndex = panelComps.length;
          for (let i = 0; i < panelComps.length; i++) {
            if (draggedCenterY < panelComps[i].centerY) {
              insertIndex = i;
              break;
            }
          }

          // Calculate new positions for visual reordering
          const spacing = 10;
          const startY = 10;
          let currentY = startY;
          
          panelComps.forEach((item, index) => {
            if (index === insertIndex) {
              // This is where the dragged component should be
              currentY += compDef.height + spacing;
            }
            
            const otherGroup = canvasComp.id === item.comp.id 
              ? compGroup
              : (item.comp.componentId === 'gap'
                  ? gapGroupRefsRef.current.get(item.comp.id)
                  : componentGroupRefsRef.current.get(item.comp.id));
            
            if (otherGroup) {
              const originalPos = originalPositionsRef.current.get(item.comp.id);
              if (originalPos) {
                const targetY = offset.y + currentY * mmToPixels * scale;
                // Smooth transition to new position
                otherGroup.to({
                  y: targetY,
                  duration: 0.2,
                  easing: Konva.Easings.EaseInOut,
                });
              }
            }
            
            let height = item.height;
            currentY += height + spacing;
          });
          
          // If dragged component should be at the end
          if (insertIndex === panelComps.length) {
            // Already handled in loop
          }
        });

        // Handle drag end to update actual order in list
        compGroup.on('dragend', () => {
          const pos = compGroup.position();
          const canvasY = (pos.y - offset.y) / scale / mmToPixels;

          // Ensure X is centered and update component temporarily
          const centeredX = (currentPanelPos.panel.width - compDef.width) / 2;
          const tempUpdated = localComponents.map((c) =>
            c.id === canvasComp.id
              ? {
                  ...c,
                  x: centeredX,
                  y: canvasY,
                }
              : c
          );

          // Reorder components based on new Y position (this will recalculate all positions)
          const finalUpdated = reorderComponents(canvasComp.id, canvasY, canvasComp.panelId, tempUpdated);
          setLocalComponents(finalUpdated);
          
          // Reset dragging state
          compGroup.draggable(false);
          compIsDragging = false;
          document.body.style.cursor = 'default';
          
          // Update original positions
          finalUpdated.forEach((comp) => {
            if (comp.panelId === canvasComp.panelId) {
              originalPositionsRef.current.set(comp.id, { x: comp.x, y: comp.y });
            }
          });
        });

        compGroup.on('mouseenter', () => { document.body.style.cursor = 'move'; });
        compGroup.on('mouseleave', () => { document.body.style.cursor = 'default'; });
        layer.add(compGroup);
      });

      // Stage click handler for deselecting
      const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target === stage) {
          setSelectedPanelId(null);
          setSelectedComponentId(null);
          setShowComponentProperties(false);
        }
      };

      stage.on('click', handleStageClick);
      stage.on('tap', handleStageClick);

      // Keyboard handler for delete
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.key === 'Delete' || e.key === 'Backspace')) {
          if (selectedComponentId) {
            handleDeleteComponent(selectedComponentId);
            setSelectedComponentId(null);
          } else if (selectedPanelId) {
            handleRemovePanel(selectedPanelId);
          }
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
    project.id,
    snapToGrid,
    localComponents,
    localPanels,
    showLabels,
  ]);

  // Separate effect to update selection visuals without re-rendering everything
  useEffect(() => {
    if (!layerRef.current) return;
    const layer = layerRef.current;

    // Update panel selection overlays
    panelGroupRefsRef.current.forEach((panelGroup, panelId) => {
      // Check if group still exists in the layer
      if (!panelGroup.getParent()) return;
      
      const existingOverlay = panelGroup.findOne('.selection-overlay') as Konva.Rect | null;
      const isSelected = selectedPanelId === panelId;
      
      if (isSelected && !existingOverlay) {
        // Add overlay
        const panelImage = panelGroup.findOne('Image') as Konva.Image | null;
        if (panelImage) {
          const width = panelImage.width();
          const height = panelImage.height();
          const colorOverlay = new Konva.Rect({
            x: 0,
            y: 0,
            width,
            height,
            fill: '#dc2626',
            opacity: 0.5,
            globalCompositeOperation: 'source-atop',
            listening: false,
            name: 'selection-overlay',
          });
          panelGroup.add(colorOverlay);
        } else {
          // Fallback rectangle
          const panelRect = panelGroup.findOne('Rect') as Konva.Rect | null;
          if (panelRect) {
            panelRect.fill('#fee2e2');
          }
        }
      } else if (!isSelected && existingOverlay) {
        // Remove overlay
        existingOverlay.destroy();
        const panelRect = panelGroup.findOne('Rect') as Konva.Rect | null;
        if (panelRect && !panelGroup.findOne('Image')) {
          panelRect.fill('#f3f4f6');
        }
      }
    });

    // Update component selection overlays
    componentGroupRefsRef.current.forEach((compGroup, compId) => {
      // Check if group still exists in the layer
      if (!compGroup.getParent()) return;
      
      const existingOverlay = compGroup.findOne('.selection-overlay') as Konva.Rect | null;
      const placeholder = compGroup.findOne('.placeholder') as Konva.Rect | null;
      const isSelected = selectedComponentId === compId;
      
      if (isSelected) {
        if (!existingOverlay) {
          // Check if there's an image (SVG) or placeholder
          const compImage = compGroup.findOne('Image') as Konva.Image | null;
          if (compImage) {
            // Add overlay for image
            const width = compImage.width();
            const height = compImage.height();
            const colorOverlay = new Konva.Rect({
              x: 0,
              y: 0,
              width,
              height,
              fill: '#dc2626',
              opacity: 0.5,
              globalCompositeOperation: 'source-atop',
              cornerRadius: 2,
              listening: false,
              name: 'selection-overlay',
            });
            compGroup.add(colorOverlay);
          } else if (placeholder) {
            // Update placeholder color
            placeholder.fill('#dc2626');
          }
        }
      } else {
        if (existingOverlay) {
          existingOverlay.destroy();
        }
        if (placeholder) {
          // Reset placeholder color - need to get component definition
          const canvasComp = localComponents.find((c) => c.id === compId);
          if (canvasComp) {
            const compDef = componentLibrary.find((c) => c.id === canvasComp.componentId);
            if (compDef) {
              placeholder.fill(compDef.color);
            }
          }
        }
      }
    });

    // Update gap selection visuals
    gapGroupRefsRef.current.forEach((gapGroup, gapId) => {
      // Check if group still exists in the layer
      if (!gapGroup.getParent()) return;
      
      const gapRect = gapGroup.findOne('Rect') as Konva.Rect | null;
      const gapLabel = gapGroup.findOne('Text') as Konva.Text | null;
      const isSelected = selectedComponentId === gapId;
      
      if (gapRect) {
        gapRect.stroke(isSelected ? '#dc2626' : '#d1d5db');
      }
      if (gapLabel) {
        gapLabel.fill(isSelected ? '#dc2626' : '#6b7280');
      }
    });

    layer.draw();
  }, [selectedPanelId, selectedComponentId, localComponents, componentLibrary]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Project name at top center - fixed position with padding */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
        <h3 className="text-2xl font-bold text-red-600">{(project.name || '').toUpperCase()}</h3>
      </div>

      {/* Canvas area - with top padding to avoid title overlap, no scroll, properly sized */}
      <div className="flex-1 bg-white relative overflow-hidden min-h-0" style={{ paddingTop: '60px', paddingBottom: '10px' }} ref={containerRef}>
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
            {/* Show Labels checkbox */}
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span>Show Labels</span>
            </label>
            
            {/* Delete Panel button - only active when panel is selected */}
            <button
              onClick={() => {
                if (selectedPanelId) {
                  handleRemovePanel(selectedPanelId);
                }
              }}
              disabled={!selectedPanelId}
              className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                selectedPanelId
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Delete Panel
            </button>
            
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

      {/* Component Properties Panel */}
      <ProjectComponentProperties
        isOpen={showComponentProperties}
        selectedPanelId={selectedPanelId}
        selectedPanel={localPanels.find((p) => p.id === selectedPanelId) || null}
        panelComponents={localComponents.filter((c) => c.panelId === selectedPanelId)}
        onAddComponent={handleAddComponent}
        onAddGap={handleAddGap}
        onDeleteComponent={handleDeleteComponent}
        onUpdateGap={handleUpdateGap}
        onClose={() => {
          setShowComponentProperties(false);
          setSelectedPanelId(null);
        }}
      />

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
