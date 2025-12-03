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
    panel,
    components,
    componentLibrary,
    selectedComponentType,
    selectedCanvasComponent,
    violations,
    addComponent,
    updateComponent,
    selectCanvasComponent,
    deleteComponent,
  } = usePanelStore();

  // Calculate scale factor (1mm = scale pixels)
  const mmToPixels = 0.5; // 1mm = 0.5 pixels
  const panelWidthPx = panel.width * mmToPixels;
  const panelHeightPx = panel.height * mmToPixels;

  // Calculate grid size based on panel dimensions (10mm for small panels, 20mm for larger)
  const gridSize = panel.width < 500 ? 10 : panel.width < 1000 ? 20 : 50; // in mm

  // Snap function to align coordinates to grid
  const snapToGrid = (value: number): number => {
    return Math.round(value / gridSize) * gridSize;
  };

  // Initialize Konva stage
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Calculate scale to fit panel with padding
    const padding = 40;
    const scaleX = (containerWidth - padding * 2) / panelWidthPx;
    const scaleY = (containerHeight - padding * 2) / panelHeightPx;
    const newScale = Math.min(scaleX, scaleY, 2); // Max scale of 2

    setScale(newScale);
    setOffset({
      x: (containerWidth - panelWidthPx * newScale) / 2,
      y: (containerHeight - panelHeightPx * newScale) / 2,
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

      const newScaleX = (newWidth - padding * 2) / panelWidthPx;
      const newScaleY = (newHeight - padding * 2) / panelHeightPx;
      const newScaleValue = Math.min(newScaleX, newScaleY, 2);

      setScale(newScaleValue);
      setOffset({
        x: (newWidth - panelWidthPx * newScaleValue) / 2,
        y: (newHeight - panelHeightPx * newScaleValue) / 2,
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
  }, [panelWidthPx, panelHeightPx, panel.model2D]);

  // Render panel and components
  useEffect(() => {
    if (!stageRef.current || !layerRef.current) return;

    const stage = stageRef.current;
    const layer = layerRef.current;

    // Clear layer
    layer.destroyChildren();

    // Panel group
    const panelGroup = new Konva.Group({
      x: offset.x,
      y: offset.y,
      scaleX: scale,
      scaleY: scale,
    });

    // Draw grid lines
    const gridGroup = new Konva.Group();
    const gridColor = '#e5e7eb';
    const gridSizePx = gridSize * mmToPixels;

    // Vertical grid lines
    for (let x = 0; x <= panelWidthPx; x += gridSizePx) {
      const line = new Konva.Line({
        points: [x, 0, x, panelHeightPx],
        stroke: gridColor,
        strokeWidth: 0.5,
        listening: false,
      });
      gridGroup.add(line);
    }

    // Horizontal grid lines
    for (let y = 0; y <= panelHeightPx; y += gridSizePx) {
      const line = new Konva.Line({
        points: [0, y, panelWidthPx, y],
        stroke: gridColor,
        strokeWidth: 0.5,
        listening: false,
      });
      gridGroup.add(line);
    }
    panelGroup.add(gridGroup);

    // Make panel clickable - define handler before using it
    const handlePanelClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      
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
            addComponent(selectedComponentType, snappedX, snappedY);
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
          width: panelWidthPx,
          height: panelHeightPx,
          listening: true,
        });
        
        // Add border overlay
        const borderRect = new Konva.Rect({
          x: 0,
          y: 0,
          width: panelWidthPx,
          height: panelHeightPx,
          fill: 'transparent',
          stroke: '#dc2626',
          strokeWidth: 2,
          listening: false,
        });
        
        panelGroup.add(panelImage);
        panelGroup.add(borderRect);
        
        // Re-add click handler
        panelImage.on('tap click', handlePanelClick);
        panelImage.cursor = selectedComponentType ? 'crosshair' : 'default';
        
        layer.draw();
      };
      imageObj.onerror = () => {
        // Fallback to rectangle if image fails to load
        const panelRect = new Konva.Rect({
          width: panelWidthPx,
          height: panelHeightPx,
          fill: '#ffffff',
          stroke: '#dc2626',
          strokeWidth: 2,
        });
        panelGroup.add(panelRect);
        panelRect.on('tap click', handlePanelClick);
        panelRect.cursor = selectedComponentType ? 'crosshair' : 'default';
        layer.draw();
      };
      imageObj.src = panel.model2D;
    } else {
      // Panel outline (fallback when no 2D model)
      const panelRect = new Konva.Rect({
        width: panelWidthPx,
        height: panelHeightPx,
        fill: '#ffffff',
        stroke: '#dc2626',
        strokeWidth: 2,
        listening: true,
      });
      panelGroup.add(panelRect);
      panelRect.on('tap click', handlePanelClick);
      panelRect.cursor = selectedComponentType ? 'crosshair' : 'default';
    }

    // Panel dimensions text
    const dimText = new Konva.Text({
      x: panelWidthPx / 2 - 40,
      y: panelHeightPx + 10,
      text: `${panel.width} × ${panel.height}mm`,
      fontSize: 12,
      fill: '#666',
      width: 80,
      align: 'center',
    });
    panelGroup.add(dimText);

    // Dimension lines
    const dimLine = new Konva.Line({
      points: [0, panelHeightPx + 5, panelWidthPx, panelHeightPx + 5],
      stroke: '#666',
      strokeWidth: 1,
    });
    panelGroup.add(dimLine);

    const leftDimLine = new Konva.Line({
      points: [0, panelHeightPx + 5, 0, panelHeightPx + 10],
      stroke: '#666',
      strokeWidth: 1,
    });
    panelGroup.add(leftDimLine);

    const rightDimLine = new Konva.Line({
      points: [panelWidthPx, panelHeightPx + 5, panelWidthPx, panelHeightPx + 10],
      stroke: '#666',
      strokeWidth: 1,
    });
    panelGroup.add(rightDimLine);

    layer.add(panelGroup);

    // Render components
    components.forEach((canvasComp) => {
      const compDef = componentLibrary.find((c) => c.id === canvasComp.componentId);
      if (!compDef) return;

      const compX = offset.x + canvasComp.x * mmToPixels * scale;
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
          // Convert stage position to panel coordinates
          const panelX = (pos.x - offset.x) / scale / mmToPixels;
          const panelY = (pos.y - offset.y) / scale / mmToPixels;

          // Snap to grid
          const snappedX = snapToGrid(panelX);
          const snappedY = snapToGrid(panelY);

          // Clamp to panel bounds
          const clampedX = Math.max(0, Math.min(snappedX, panel.width));
          const clampedY = Math.max(0, Math.min(snappedY, panel.height));

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
        // Convert stage position to panel coordinates
        const panelX = (pos.x - offset.x) / scale / mmToPixels;
        const panelY = (pos.y - offset.y) / scale / mmToPixels;

        // Snap to grid (already done by dragBoundFunc, but ensure it's saved)
        const snappedX = snapToGrid(panelX);
        const snappedY = snapToGrid(panelY);

        // Update component position in store
        updateComponent(canvasComp.id, {
          x: Math.max(0, Math.min(snappedX, panel.width)),
          y: Math.max(0, Math.min(snappedY, panel.height)),
        });
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
    panel,
    components,
    componentLibrary,
    selectedComponentType,
    selectedCanvasComponent,
    offset,
    scale,
    panelWidthPx,
    panelHeightPx,
    addComponent,
    updateComponent,
    selectCanvasComponent,
    deleteComponent,
    violations,
    gridSize,
    snapToGrid,
  ]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-100 relative overflow-hidden"
      tabIndex={0}
    />
  );
}
