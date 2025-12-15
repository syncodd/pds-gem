'use client';

import { useRef, useEffect, useState } from 'react';
import Konva from 'konva';
import { usePanelStore } from '@/lib/store';
import { Component } from '@/types';

interface PanelCanvasProps {
  width?: number;
  height?: number;
}

export default function PanelCanvas({ width = 800, height = 600 }: PanelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width, height });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

    const {
    panels,
    components,
    componentLibrary,
    selectedComponentType,
    selectedCanvasComponent,
    violations,
    draggingComponent,
    dragPosition,
    dragPanelId,
    activePanelId,
    addComponent,
    updateComponent,
    selectCanvasComponent,
    deleteComponent,
    setDraggingComponent,
    setDragPosition,
    setActivePanel,
  } = usePanelStore();

  // Calculate scale factor (1mm = scale pixels)
  const mmToPixels = 0.5; // 1mm = 0.5 pixels
  
  // Calculate panel positions and total width
  const panelPositions = panels.map((panel, index) => {
    const xOffset = panels
      .slice(0, index)
      .reduce((sum, p) => sum + p.width, 0); // No spacing - panels are adjacent
    return {
      panel,
      xOffset,
      widthPx: panel.width * mmToPixels,
      heightPx: panel.height * mmToPixels,
    };
  });

  const totalWidth = panels.reduce((sum, p) => sum + p.width, 0); // No spacing
  const totalWidthPx = totalWidth * mmToPixels;
  const maxHeight = Math.max(...panels.map((p) => p.height), 800);
  const maxHeightPx = maxHeight * mmToPixels;

  // Calculate grid size based on average panel dimensions
  const avgWidth = panels.length > 0 ? panels.reduce((sum, p) => sum + p.width, 0) / panels.length : 600;
  const gridSize = avgWidth < 500 ? 10 : avgWidth < 1000 ? 20 : 50; // in mm

  // Snap function to align coordinates to grid
  const snapToGrid = (value: number): number => {
    return Math.round(value / gridSize) * gridSize;
  };

  // Find which panel contains the given coordinates (in mm, relative to canvas start)
  const findPanelAtPosition = (x: number, y: number): { panel: Panel; localX: number; localY: number } | null => {
    let currentX = 0;
    for (const panel of panels) {
      if (x >= currentX && x < currentX + panel.width && y >= 0 && y < panel.height) {
        return {
          panel,
          localX: x - currentX,
          localY: y,
        };
      }
      currentX += panel.width; // No spacing - panels are adjacent
    }
    return null;
  };

  // Check if position is valid (within bounds and no collision)
  const isValidPosition = (x: number, y: number, panelId: string, componentId: string, excludeId?: string): boolean => {
    const compDef = componentLibrary.find((c) => c.id === componentId);
    if (!compDef) return false;

    const panel = panels.find((p) => p.id === panelId);
    if (!panel) return false;

    // Check bounds
    if (x < 0 || y < 0 || x + compDef.width > panel.width || y + compDef.height > panel.height) {
      return false;
    }

    // Check collisions with existing components on the same panel
    const testRect = { x, y, width: compDef.width, height: compDef.height };
    const panelComponents = components.filter((c) => c.panelId === panelId);
    for (const canvasComp of panelComponents) {
      if (canvasComp.id === excludeId) continue;
      const existingDef = componentLibrary.find((c) => c.id === canvasComp.componentId);
      if (!existingDef) continue;
      const existingRect = {
        x: canvasComp.x,
        y: canvasComp.y,
        width: existingDef.width,
        height: existingDef.height,
      };
      // Check overlap
      if (
        testRect.x < existingRect.x + existingRect.width &&
        testRect.x + testRect.width > existingRect.x &&
        testRect.y < existingRect.y + existingRect.height &&
        testRect.y + testRect.height > existingRect.y
      ) {
        return false;
      }
    }
    return true;
  };

  // Initialize Konva stage
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate scale to fit all panels with padding
    const padding = 40;
    const scaleX = (containerWidth - padding * 2) / totalWidthPx;
    const scaleY = (containerHeight - padding * 2) / maxHeightPx;
    const newScale = Math.min(scaleX, scaleY, 2); // Max scale of 2

    setScale(newScale);
    setOffset({
      x: (containerWidth - totalWidthPx * newScale) / 2,
      y: (containerHeight - maxHeightPx * newScale) / 2,
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

      const newScaleX = (newWidth - padding * 2) / totalWidthPx;
      const newScaleY = (newHeight - padding * 2) / maxHeightPx;
      const newScaleValue = Math.min(newScaleX, newScaleY, 2);

      setScale(newScaleValue);
      setOffset({
        x: (newWidth - totalWidthPx * newScaleValue) / 2,
        y: (newHeight - maxHeightPx * newScaleValue) / 2,
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
    if (!stageRef.current || !layerRef.current || panels.length === 0) return;

    const stage = stageRef.current;
    const layer = layerRef.current;

    // Clear layer
    layer.destroyChildren();

    // Main canvas group
    const canvasGroup = new Konva.Group({
      x: offset.x,
      y: offset.y,
      scaleX: scale,
      scaleY: scale,
    });

    // Draw grid lines across all panels
    const gridGroup = new Konva.Group();
    const gridColor = '#e5e7eb';
    const gridSizePx = gridSize * mmToPixels;

    // Vertical grid lines across all panels
    for (let x = 0; x <= totalWidthPx; x += gridSizePx) {
      const line = new Konva.Line({
        points: [x, 0, x, maxHeightPx],
        stroke: gridColor,
        strokeWidth: 0.5,
        listening: false,
      });
      gridGroup.add(line);
    }

    // Horizontal grid lines
    for (let y = 0; y <= maxHeightPx; y += gridSizePx) {
      const line = new Konva.Line({
        points: [0, y, totalWidthPx, y],
        stroke: gridColor,
        strokeWidth: 0.5,
        listening: false,
      });
      gridGroup.add(line);
    }
    canvasGroup.add(gridGroup);

    // Render each panel
    panelPositions.forEach(({ panel, xOffset, widthPx, heightPx }) => {
      const isActive = activePanelId === panel.id;
      const panelGroup = new Konva.Group({
        x: xOffset * mmToPixels,
        y: 0,
      });

      // Panel click handler
      const handlePanelClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        
        // Set as active panel
        setActivePanel(panel.id);
        
        if (selectedComponentType) {
          // Get pointer position relative to the panel group
          const pointerPos = panelGroup.getRelativePointerPosition();
          
          if (pointerPos) {
            // Convert from group coordinates (pixels) to panel coordinates (mm)
            const panelX = pointerPos.x / mmToPixels;
            const panelY = pointerPos.y / mmToPixels;

            // Snap to grid
            const snappedX = snapToGrid(panelX);
            const snappedY = snapToGrid(panelY);

            // Check if click is within panel bounds
            if (
              snappedX >= 0 &&
              snappedX <= panel.width &&
              snappedY >= 0 &&
              snappedY <= panel.height
            ) {
              addComponent(panel.id, selectedComponentType, snappedX, snappedY);
            }
          }
        }
      };

      // Panel background/2D model or outline
      if (panel.model2D && (panel.model2D.startsWith('http') || panel.model2D.startsWith('/'))) {
        // Load and display 2D model image
        const imageObj = new Image();
        imageObj.crossOrigin = 'anonymous';
        imageObj.onload = () => {
          // Create image node
          const panelImage = new Konva.Image({
            x: 0,
            y: 0,
            image: imageObj,
            width: widthPx,
            height: heightPx,
            listening: true,
          });
          
          // Add border overlay (highlight if active)
          const borderRect = new Konva.Rect({
            x: 0,
            y: 0,
            width: widthPx,
            height: heightPx,
            fill: 'transparent',
            stroke: isActive ? '#2563eb' : '#dc2626',
            strokeWidth: isActive ? 3 : 2,
            listening: false,
          });
          
          panelGroup.add(panelImage);
          panelGroup.add(borderRect);
          
          // Re-add click handler
          panelImage.on('tap click', handlePanelClick);
          panelImage.cursor = selectedComponentType ? 'crosshair' : 'pointer';
          
          layer.draw();
        };
        imageObj.onerror = () => {
          // Fallback to rectangle if image fails to load
          const panelRect = new Konva.Rect({
            width: widthPx,
            height: heightPx,
            fill: '#ffffff',
            stroke: isActive ? '#2563eb' : '#dc2626',
            strokeWidth: isActive ? 3 : 2,
            listening: true,
          });
          panelGroup.add(panelRect);
          panelRect.on('tap click', handlePanelClick);
          panelRect.cursor = selectedComponentType ? 'crosshair' : 'pointer';
          layer.draw();
        };
        imageObj.src = panel.model2D;
      } else {
        // Panel outline (fallback when no 2D model)
        const panelRect = new Konva.Rect({
          width: widthPx,
          height: heightPx,
          fill: '#ffffff',
          stroke: isActive ? '#2563eb' : '#dc2626',
          strokeWidth: isActive ? 3 : 2,
          listening: true,
        });
        panelGroup.add(panelRect);
        panelRect.on('tap click', handlePanelClick);
        panelRect.cursor = selectedComponentType ? 'crosshair' : 'pointer';
      }

      // Panel name label
      const nameText = new Konva.Text({
        x: 5,
        y: 5,
        text: panel.name,
        fontSize: 12,
        fontStyle: 'bold',
        fill: isActive ? '#2563eb' : '#666',
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

      // Dimension lines
      const dimLine = new Konva.Line({
        points: [0, heightPx + 5, widthPx, heightPx + 5],
        stroke: '#666',
        strokeWidth: 1,
        listening: false,
      });
      panelGroup.add(dimLine);

      const leftDimLine = new Konva.Line({
        points: [0, heightPx + 5, 0, heightPx + 10],
        stroke: '#666',
        strokeWidth: 1,
        listening: false,
      });
      panelGroup.add(leftDimLine);

      const rightDimLine = new Konva.Line({
        points: [widthPx, heightPx + 5, widthPx, heightPx + 10],
        stroke: '#666',
        strokeWidth: 1,
        listening: false,
      });
      panelGroup.add(rightDimLine);

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
      const isSelected = selectedCanvasComponent === canvasComp.id;
      
      // Check if component has violations
      const componentViolations = violations.filter(
        (v) =>
          v.componentId === canvasComp.id ||
          (v.componentIds && v.componentIds.includes(canvasComp.id))
      );
      const hasError = componentViolations.some((v) => v.severity === 'error');
      const hasWarning = componentViolations.some((v) => v.severity === 'warning');

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
          const panelInfo = findPanelAtPosition(canvasX, canvasY);
          if (panelInfo) {
            // Snap to grid within the panel
            const snappedX = snapToGrid(panelInfo.localX);
            const snappedY = snapToGrid(panelInfo.localY);

            // Clamp to panel bounds
            const clampedX = Math.max(0, Math.min(snappedX, panelInfo.panel.width));
            const clampedY = Math.max(0, Math.min(snappedY, panelInfo.panel.height));

            // Find panel position for conversion
            const panelPos = panelPositions.find((p) => p.panel.id === panelInfo.panel.id);
            if (panelPos) {
              // Convert back to stage coordinates
              return {
                x: offset.x + (panelPos.xOffset + clampedX) * mmToPixels * scale,
                y: offset.y + clampedY * mmToPixels * scale,
              };
            }
          }

          // Fallback: keep current position
          return pos;

          // Convert back to stage coordinates
          return {
            x: offset.x + clampedX * mmToPixels * scale,
            y: offset.y + clampedY * mmToPixels * scale,
          };
        },
      });

      // Determine stroke color based on violations
      let strokeColor = compDef.color;
      let strokeWidth = 2;
      if (hasError) {
        strokeColor = '#dc2626'; // Red for errors
        strokeWidth = 3;
      } else if (hasWarning) {
        strokeColor = '#f59e0b'; // Orange for warnings
        strokeWidth = 2.5;
      } else if (isSelected) {
        strokeColor = '#2563eb'; // Blue for selected
        strokeWidth = 3;
      }

      // Render component 2D model or fallback rectangle
      if (compDef.model2D && (compDef.model2D.startsWith('http') || compDef.model2D.startsWith('/'))) {
        // Load and display 2D model image
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
          
          // Add border overlay
          const borderRect = new Konva.Rect({
            x: 0,
            y: 0,
            width: compWidth,
            height: compHeight,
            fill: 'transparent',
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            cornerRadius: 2,
            listening: false,
          });
          
          compGroup.add(compImage);
          compGroup.add(borderRect);
          layer.draw();
        };
        imageObj.onerror = () => {
          // Fallback to rectangle if image fails
          const compRect = new Konva.Rect({
            width: compWidth,
            height: compHeight,
            fill: compDef.color,
            opacity: hasError || hasWarning ? 0.5 : 0.3,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
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
          opacity: hasError || hasWarning ? 0.5 : 0.3,
          stroke: strokeColor,
          strokeWidth: strokeWidth,
          cornerRadius: 2,
        });
        compGroup.add(compRect);
      }
      
      // Add violation indicator
      if (hasError || hasWarning) {
        const violationIndicator = new Konva.Circle({
          x: compWidth - 8,
          y: 8,
          radius: 6,
          fill: hasError ? '#dc2626' : '#f59e0b',
          stroke: '#ffffff',
          strokeWidth: 1,
        });
        compGroup.add(violationIndicator);
        
        // Add exclamation mark for errors
        if (hasError) {
          const exclamation = new Konva.Text({
            x: compWidth - 8,
            y: 8,
            text: '!',
            fontSize: 10,
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            offsetX: 3,
            offsetY: 5,
          });
          compGroup.add(exclamation);
        }
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

      if (isSelected && !hasError && !hasWarning) {
        const selectionRect = new Konva.Rect({
          width: compWidth,
          height: compHeight,
          fill: 'transparent',
          stroke: '#2563eb',
          strokeWidth: 2,
          dash: [5, 5],
          cornerRadius: 2,
        });
        compGroup.add(selectionRect);
      }
      
      // Add pulsing effect for violations
      if (hasError || hasWarning) {
        const pulseRect = new Konva.Rect({
          width: compWidth,
          height: compHeight,
          fill: 'transparent',
          stroke: hasError ? '#dc2626' : '#f59e0b',
          strokeWidth: 2,
          dash: [5, 5],
          cornerRadius: 2,
          opacity: 0.6,
        });
        compGroup.add(pulseRect);
        
        // Animate pulse
        const anim = new Konva.Animation((frame) => {
          const scale = 1 + Math.sin((frame?.time || 0) / 500) * 0.1;
          pulseRect.opacity(0.3 + Math.sin((frame?.time || 0) / 500) * 0.3);
        }, layer);
        anim.start();
        
        // Store animation reference for cleanup
        (compGroup as any)._pulseAnim = anim;
      }

      // Add click handler - stop propagation so it doesn't trigger panel click
      compGroup.on('click', (e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        selectCanvasComponent(canvasComp.id);
      });

      compGroup.on('tap', (e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        selectCanvasComponent(canvasComp.id);
      });

      // Handle drag end to update component position in store
      compGroup.on('dragend', () => {
        const pos = compGroup.position();
        // Convert stage position to canvas coordinates (mm)
        const canvasX = (pos.x - offset.x) / scale / mmToPixels;
        const canvasY = (pos.y - offset.y) / scale / mmToPixels;

        // Find which panel this component is now in
        const panelInfo = findPanelAtPosition(canvasX, canvasY);
        if (panelInfo) {
          const snappedX = snapToGrid(panelInfo.localX);
          const snappedY = snapToGrid(panelInfo.localY);

          // Update component position and panel
          updateComponent(canvasComp.id, {
            panelId: panelInfo.panel.id,
            x: Math.max(0, Math.min(snappedX, panelInfo.panel.width)),
            y: Math.max(0, Math.min(snappedY, panelInfo.panel.height)),
          });
        }
      });

      compGroup.cursor = 'move';
      layer.add(compGroup);
    });

    // Add instruction text when component is selected
    if (selectedComponentType) {
      const instructionText = new Konva.Text({
        x: 10,
        y: 10,
        text: 'Click on panel to place component',
        fontSize: 14,
        fontStyle: 'bold',
        padding: 5,
        fill: '#ffffff',
        backgroundColor: '#2563eb',
        cornerRadius: 4,
      });
      layer.add(instructionText);
    }

    // Render ghost preview when dragging
    if (draggingComponent && dragPosition && dragPanelId) {
      const compDef = componentLibrary.find((c) => c.id === draggingComponent);
      const panelPos = panelPositions.find((p) => p.panel.id === dragPanelId);
      if (compDef && panelPos) {
        const snappedX = snapToGrid(dragPosition.x);
        const snappedY = snapToGrid(dragPosition.y);
        const isValid = isValidPosition(snappedX, snappedY, dragPanelId, draggingComponent);
        
        const ghostX = offset.x + (panelPos.xOffset + snappedX) * mmToPixels * scale;
        const ghostY = offset.y + snappedY * mmToPixels * scale;
        const ghostWidth = compDef.width * mmToPixels;
        const ghostHeight = compDef.height * mmToPixels;

        // Ghost preview rectangle
        const ghostRect = new Konva.Rect({
          x: ghostX,
          y: ghostY,
          width: ghostWidth * scale,
          height: ghostHeight * scale,
          fill: compDef.color,
          opacity: 0.3,
          stroke: isValid ? '#10b981' : '#dc2626', // Green if valid, red if invalid
          strokeWidth: 2,
          dash: [5, 5],
          cornerRadius: 2,
          listening: false,
        });
        layer.add(ghostRect);

        // Label
        const ghostLabel = new Konva.Text({
          x: ghostX + (ghostWidth * scale) / 2 - 30,
          y: ghostY + (ghostHeight * scale) / 2 - 8,
          text: compDef.name,
          fontSize: 10,
          fill: isValid ? '#10b981' : '#dc2626',
          width: 60,
          align: 'center',
          listening: false,
        });
        layer.add(ghostLabel);
      }
    }

    // Stage click handler for deselecting when clicking outside
    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Only deselect if clicking directly on stage (not on panel or components)
      if (e.target === stage) {
        if (!selectedComponentType) {
          selectCanvasComponent(null);
        }
      }
    };

    stage.on('click', handleStageClick);
    stage.on('tap', handleStageClick);

    // Keyboard handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCanvasComponent) {
          deleteComponent(selectedCanvasComponent);
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
  }, [
    panels,
    components,
    componentLibrary,
    selectedComponentType,
    selectedCanvasComponent,
    offset,
    scale,
    totalWidthPx,
    maxHeightPx,
    panelPositions,
    activePanelId,
    addComponent,
    updateComponent,
    selectCanvasComponent,
    deleteComponent,
    violations,
    gridSize,
    snapToGrid,
    draggingComponent,
    dragPosition,
    dragPanelId,
    setDraggingComponent,
    setDragPosition,
    setActivePanel,
    isValidPosition,
    findPanelAtPosition,
  ]);

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    if (!draggingComponent || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert screen coordinates to canvas coordinates (mm)
    const canvasX = (x - offset.x) / scale / mmToPixels;
    const canvasY = (y - offset.y) / scale / mmToPixels;
    
    // Find which panel this position is in
    const panelInfo = findPanelAtPosition(canvasX, canvasY);
    if (panelInfo) {
      setDragPosition({ x: panelInfo.localX, y: panelInfo.localY }, panelInfo.panel.id);
    } else {
      setDragPosition(null, null);
    }
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const componentId = e.dataTransfer.getData('componentId') || draggingComponent;
    if (!componentId) return;
    
    if (dragPosition && dragPanelId) {
      const snappedX = snapToGrid(dragPosition.x);
      const snappedY = snapToGrid(dragPosition.y);
      
      if (isValidPosition(snappedX, snappedY, dragPanelId, componentId)) {
        addComponent(dragPanelId, componentId, snappedX, snappedY);
      }
    } else if (activePanelId && dragPosition) {
      // Fallback to active panel if dragPanelId not set
      const snappedX = snapToGrid(dragPosition.x);
      const snappedY = snapToGrid(dragPosition.y);
      
      if (isValidPosition(snappedX, snappedY, activePanelId, componentId)) {
        addComponent(activePanelId, componentId, snappedX, snappedY);
      }
    }
    
    setDraggingComponent(null);
    setDragPosition(null, null);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragPosition(null);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-100 relative overflow-hidden"
      tabIndex={0}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    />
  );
}
