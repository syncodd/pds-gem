'use client';

import { useEffect, useRef, useState } from 'react';
import Konva from 'konva';
import { Component } from '@/types';

interface CombinatorPreviewCanvasProps {
  components: Component[];
  combinatorWidth: number;
  combinatorHeight: number;
  gaps?: number[]; // Array of gaps: gaps[0] = top gap, gaps[1..n-1] = gaps between components, gaps[n] = bottom gap
  onReorder: (newOrder: string[]) => void;
  onRemove?: (componentId: string) => void;
  onGapChange?: (index: number, value: number) => void;
  showLabels?: boolean;
}

const mmToPixels = 0.5; // 1mm = 0.5 pixels

export default function CombinatorPreviewCanvas({
  components,
  combinatorWidth,
  combinatorHeight,
  gaps = [],
  onReorder,
  onRemove,
  onGapChange,
  showLabels = true,
}: CombinatorPreviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const componentGroupRefsRef = useRef<Map<string, Konva.Group>>(new Map());
  const originalPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Calculate scale to fit preview
  const scale = 0.8;
  const previewWidth = combinatorWidth * mmToPixels * scale;
  const previewHeight = combinatorHeight * mmToPixels * scale;
  const canvasWidth = Math.max(400, previewWidth + 40);
  const canvasHeight = Math.max(300, previewHeight + 40);

  useEffect(() => {
    if (!containerRef.current) return;

    let timeoutId: NodeJS.Timeout | null = null;

    // Small delay to ensure container is fully mounted
    timeoutId = setTimeout(() => {
      if (!containerRef.current) return;

      let stage: Konva.Stage | null = null;
      let layer: Konva.Layer | null = null;

      try {
        stage = new Konva.Stage({
          container: containerRef.current,
          width: canvasWidth,
          height: canvasHeight,
        });

        layer = new Konva.Layer();
        stage.add(layer);
        stageRef.current = stage;
        layerRef.current = layer;

        // Verify stage is properly initialized
        if (!stage || !stage.container()) {
          console.warn('Stage not properly initialized');
          if (stage) {
            try {
              stage.destroy();
            } catch (error) {
              // Ignore errors
            }
          }
          return;
        }
      } catch (error) {
        console.error('Failed to initialize Konva stage:', error);
        if (stage) {
          try {
            stage.destroy();
          } catch (e) {
            // Ignore errors
          }
        }
        return;
      }

      // Store references for cleanup
      const currentStage = stage;
      const currentLayer = layer;

      // Calculate center position for combinator boundary
      const boundaryX = (canvasWidth - previewWidth) / 2;
      const boundaryY = (canvasHeight - previewHeight) / 2;

      // Draw combinator boundary box
      const boundaryBox = new Konva.Rect({
        x: boundaryX,
        y: boundaryY,
        width: previewWidth,
        height: previewHeight,
        stroke: '#000000',
        strokeWidth: 2,
        fill: 'rgba(0, 0, 0, 0.05)',
        cornerRadius: 0,
      });
      layer.add(boundaryBox);

      // Add label for combinator boundary
      const boundaryLabel = new Konva.Text({
        x: boundaryX + 5,
        y: boundaryY + 5,
        text: `Combinator: ${combinatorWidth} × ${combinatorHeight}mm`,
        fontSize: 12,
        fill: '#000000',
        fontStyle: 'bold',
      });
      layer.add(boundaryLabel);

      // Apply top gap (just spacing, no visual element)
      const topGap = gaps.length > 0 ? gaps[0] : 0;
      let currentY = boundaryY + (topGap * mmToPixels * scale);
      const centerX = boundaryX + previewWidth / 2;

      components.forEach((component, index) => {
        const compWidth = component.width * mmToPixels * scale;
        const compHeight = component.height * mmToPixels * scale;
        const compX = centerX - compWidth / 2;
        const compY = currentY;

        const compGroup = new Konva.Group({
          x: compX,
          y: compY,
          draggable: true,
          dragBoundFunc: (pos) => {
            // Lock X to centered position - only allow vertical movement
            const canvasY = pos.y;
            const minY = boundaryY;
            const maxY = boundaryY + previewHeight - compHeight;
            const clampedY = Math.max(minY, Math.min(canvasY, maxY));
            return { x: centerX - compWidth / 2, y: clampedY };
          },
        });

        // Create initial rectangle (will be replaced by image if SVG loads)
        const compRect = new Konva.Rect({
          width: compWidth,
          height: compHeight,
          fill: component.color,
          stroke: '#333',
          strokeWidth: 1,
          cornerRadius: 0,
          opacity: 0.8,
          name: 'component-rect',
        });
        compGroup.add(compRect);

        // Try to load SVG image
        if (component.model2D && (component.model2D.startsWith('http') || component.model2D.startsWith('/'))) {
          const imageObj = new Image();
          imageObj.crossOrigin = 'anonymous';
          
          imageObj.onload = () => {
            if (compGroup && compGroup.getParent()) {
              // Remove existing rectangle
              const existingRect = compGroup.findOne('.component-rect');
              if (existingRect) {
                existingRect.destroy();
              }
              
              // Create image node
              const compImage = new Konva.Image({
                x: 0,
                y: 0,
                image: imageObj,
                width: compWidth,
                height: compHeight,
                listening: false,
                name: 'component-image',
              });
              compGroup.add(compImage);
              
              // Move labels to top
              const label = compGroup.findOne('.component-label');
              const dimLabel = compGroup.findOne('.dim-label');
              if (label) label.moveToTop();
              if (dimLabel) dimLabel.moveToTop();
              
              if (layerRef.current) {
                layerRef.current.draw();
              }
            }
          };
          
          imageObj.onerror = () => {
            // Keep the rectangle if image fails to load
            if (layerRef.current) {
              layerRef.current.draw();
            }
          };
          
          // Start loading the image
          imageObj.src = component.model2D.startsWith('/') 
            ? component.model2D 
            : component.model2D;
        }

        // Component label (only if showLabels is true)
        if (showLabels) {
        const compLabel = new Konva.Text({
          x: 5,
          y: 5,
          text: component.name,
          fontSize: 10,
            fill: '#000',
          fontStyle: 'bold',
          width: compWidth - 10,
            name: 'component-label',
        });
        compGroup.add(compLabel);

        // Component dimensions label
        const dimLabel = new Konva.Text({
          x: 5,
          y: compHeight - 20,
          text: `${component.width} × ${component.height}mm`,
          fontSize: 8,
            fill: '#000',
          width: compWidth - 10,
            name: 'dim-label',
        });
        compGroup.add(dimLabel);
        }

        // Remove button (if onRemove is provided)
        if (onRemove) {
          const removeBtn = new Konva.Circle({
            x: compWidth - 10,
            y: 10,
            radius: 8,
            fill: '#ef4444',
            stroke: '#fff',
            strokeWidth: 1,
          });
          const removeIcon = new Konva.Text({
            x: compWidth - 14,
            y: 6,
            text: '×',
            fontSize: 12,
            fill: '#fff',
            fontStyle: 'bold',
          });
          compGroup.add(removeBtn);
          compGroup.add(removeIcon);

          removeBtn.on('click', () => {
            onRemove(component.id);
          });
          removeIcon.on('click', () => {
            onRemove(component.id);
          });
        }

        // Drag start
        compGroup.on('dragstart', () => {
          setDraggedId(component.id);
          compGroup.moveToTop();
          const rect = compGroup.findOne('.component-rect');
          const image = compGroup.findOne('.component-image');
          if (rect) rect.opacity(1);
          if (image) image.opacity(1);
        });

        // Drag move - visual reordering
        compGroup.on('dragmove', () => {
          const pos = compGroup.position();
          const canvasY = pos.y;

          // Find insert position
          const otherComps = components
            .filter((c) => c.id !== component.id)
            .map((c) => {
              const otherGroup = componentGroupRefsRef.current.get(c.id);
              if (!otherGroup) return null;
              const otherPos = originalPositionsRef.current.get(c.id);
              if (!otherPos) return null;
              return {
                comp: c,
                centerY: otherPos.y + (c.height * mmToPixels * scale) / 2,
              };
            })
            .filter(Boolean) as Array<{ comp: Component; centerY: number }>;

          const draggedCenterY = canvasY + compHeight / 2;
          otherComps.sort((a, b) => a.centerY - b.centerY);

          let insertIndex = otherComps.length;
          for (let i = 0; i < otherComps.length; i++) {
            if (draggedCenterY < otherComps[i].centerY) {
              insertIndex = i;
              break;
            }
          }

          // Calculate new positions for visual reordering using gaps
          const topGap = gaps.length > 0 ? gaps[0] : 0;
          let newY = boundaryY + (topGap * mmToPixels * scale);
          let currentIndex = 0;

          otherComps.forEach((item, idx) => {
            if (idx === insertIndex) {
              // This is where the dragged component should be
              const gapIndex = idx + 1;
              const gap = gaps.length > gapIndex ? gaps[gapIndex] : 0;
              newY += compHeight + (gap * mmToPixels * scale);
            }
            const otherGroup = componentGroupRefsRef.current.get(item.comp.id);
            if (otherGroup && otherGroup !== compGroup) {
              const targetY = newY;
              otherGroup.to({
                y: targetY,
                duration: 0.2,
                easing: Konva.Easings.EaseInOut,
              });
            }
            const gapIndex = idx + 1;
            const gap = gaps.length > gapIndex ? gaps[gapIndex] : 0;
            newY += item.comp.height * mmToPixels * scale + (gap * mmToPixels * scale);
          });

          // If dragged component should be at the end
          if (insertIndex === otherComps.length) {
            // Already handled in loop
          }
        });

        // Drag end - update order
        compGroup.on('dragend', () => {
          const pos = compGroup.position();
          const canvasY = pos.y;

          // Find insert position
          const otherComps = components
            .filter((c) => c.id !== component.id)
            .map((c) => {
              const otherPos = originalPositionsRef.current.get(c.id);
              if (!otherPos) return null;
              return {
                comp: c,
                centerY: otherPos.y + (c.height * mmToPixels * scale) / 2,
              };
            })
            .filter(Boolean) as Array<{ comp: Component; centerY: number }>;

          const draggedCenterY = canvasY + compHeight / 2;
          otherComps.sort((a, b) => a.centerY - b.centerY);

          let insertIndex = otherComps.length;
          for (let i = 0; i < otherComps.length; i++) {
            if (draggedCenterY < otherComps[i].centerY) {
              insertIndex = i;
              break;
            }
          }

          // Reorder componentIds array
          const currentOrder = components.map((c) => c.id);
          const draggedIndex = currentOrder.indexOf(component.id);
          const newOrder = [...currentOrder];
          newOrder.splice(draggedIndex, 1);
          newOrder.splice(insertIndex, 0, component.id);

          onReorder(newOrder);

          // Reset opacity
          const rect = compGroup.findOne('.component-rect');
          const image = compGroup.findOne('.component-image');
          if (rect) rect.opacity(0.8);
          if (image) image.opacity(0.8);
          setDraggedId(null);
        });

        // Store original position
        originalPositionsRef.current.set(component.id, { x: compX, y: compY });
        componentGroupRefsRef.current.set(component.id, compGroup);
        layer.add(compGroup);

        // Move to next position using gap (just spacing, no visual element)
        currentY += compHeight;
        const gapIndex = index + 1;
        const gap = gaps.length > gapIndex ? gaps[gapIndex] : 0;
        currentY += gap * mmToPixels * scale;
      });

      // Only draw if stage and layer are properly initialized and attached
      if (currentStage && currentLayer && currentStage.getLayers().includes(currentLayer)) {
        try {
          // Use requestAnimationFrame to ensure stage is ready
          requestAnimationFrame(() => {
            if (currentStage && currentLayer && currentStage.container()) {
              try {
                currentLayer.draw();
              } catch (error) {
                console.warn('Failed to draw layer:', error);
              }
            }
          });
        } catch (error) {
          console.warn('Failed to schedule draw:', error);
        }
      }
    }, 0);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (stageRef.current) {
        try {
          // Check if stage still has a container before destroying
          if (stageRef.current.container()) {
            stageRef.current.destroy();
          }
        } catch (error) {
          // Ignore errors during cleanup (stage might already be destroyed)
        }
        stageRef.current = null;
        layerRef.current = null;
      }
    };
    }, [components, combinatorWidth, combinatorHeight, gaps, canvasWidth, canvasHeight, onReorder, onRemove, onGapChange, showLabels]);

  // Update positions when components or gaps change
  useEffect(() => {
    if (!layerRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const layer = layerRef.current;

    // Check if layer is attached to stage
    if (!stage.getLayers().includes(layer)) return;

    const boundaryY = (canvasHeight - previewHeight) / 2;
    const topGap = gaps.length > 0 ? gaps[0] : 0;
    let currentY = boundaryY + (topGap * mmToPixels * scale);
    const centerX = (canvasWidth - previewWidth) / 2 + previewWidth / 2;

    components.forEach((component, index) => {
      const compGroup = componentGroupRefsRef.current.get(component.id);
      if (compGroup) {
        const compHeight = component.height * mmToPixels * scale;
        const compWidth = component.width * mmToPixels * scale;
        const compX = centerX - compWidth / 2;

        compGroup.to({
          x: compX,
          y: currentY,
          duration: 0.3,
          easing: Konva.Easings.EaseInOut,
        });

        originalPositionsRef.current.set(component.id, { x: compX, y: currentY });
        
        // Move to next position using gap
        currentY += compHeight;
        const gapIndex = index + 1;
        const gap = gaps.length > gapIndex ? gaps[gapIndex] : 0;
        currentY += gap * mmToPixels * scale;
      }
    });

    // Only draw if stage and layer are properly initialized and attached
    if (stage && layer && stage.getLayers().includes(layer) && stage.container()) {
      try {
        // Use requestAnimationFrame to ensure stage is ready
        requestAnimationFrame(() => {
          if (stage && layer && stage.container()) {
            try {
              layer.draw();
            } catch (error) {
              console.warn('Failed to draw layer on update:', error);
            }
          }
        });
      } catch (error) {
        console.warn('Failed to schedule draw on update:', error);
      }
    }
  }, [components, gaps, canvasWidth, canvasHeight, previewWidth, previewHeight, showLabels, onGapChange]);

  // Update label visibility when showLabels changes
  useEffect(() => {
    if (!layerRef.current) return;
    
    const layer = layerRef.current;
    layer.find('.component-label').forEach((label) => {
      label.visible(showLabels);
    });
    layer.find('.dim-label').forEach((label) => {
      label.visible(showLabels);
    });
    
    if (layer.getStage()) {
      layer.draw();
    }
  }, [showLabels]);

  return (
    <div className="w-full">
      <div className="text-sm font-semibold text-gray-700 mb-2">Preview</div>
      <div
        ref={containerRef}
        className="border border-gray-300 rounded-lg bg-gray-50"
        style={{ width: canvasWidth, height: canvasHeight }}
      />
    </div>
  );
}

