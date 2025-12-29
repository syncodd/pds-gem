'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import Konva from 'konva';
import { Project, Panel, CanvasComponent, Constraint } from '@/types';
import { usePanelStore } from '@/lib/store';
import { evaluateRules, validateComponentHeight, calculateTotalComponentHeight } from '@/lib/ruleEngine';
import ProjectComponentProperties from './ProjectComponentProperties';
import CombinatorPropertiesPanel from './CombinatorPropertiesPanel';

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
  const [showCombinatorProperties, setShowCombinatorProperties] = useState(false);
  const [localPanels, setLocalPanels] = useState<Panel[]>(project.panels || []);
  const [localComponents, setLocalComponents] = useState<CanvasComponent[]>(project.components || []);
  const [originalPanels, setOriginalPanels] = useState<Panel[]>(project.panels || []);
  const [originalComponents, setOriginalComponents] = useState<CanvasComponent[]>(project.components || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [stageReady, setStageReady] = useState(false); // Track when stage is initialized
  
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

  const { componentLibrary, combinatorsLibrary, updateProject, setCurrentProject, projects, panelsLibrary, loadProjects, rules, setViolations } = usePanelStore();

  // Get unique width values from panels library
  const widthOptions = useMemo(() => {
    const widths = new Set<number>();
    panelsLibrary.forEach((panel) => {
      widths.add(panel.width);
    });
    return Array.from(widths).sort((a, b) => a - b);
  }, [panelsLibrary]);

  // Track if this is the first mount to always sync on initial load
  const isFirstMountRef = useRef(true);

  // Update local state when project ID changes (new project selected)
  // Only sync when project ID changes, not when projects array changes (to avoid resetting unsaved changes)
  useEffect(() => {
    const latestProject = projects.find((p) => p.id === project.id) || project;
    const storePanelsLength = latestProject.panels?.length || 0;
    const storeComponentsLength = latestProject.components?.length || 0;

    // On first mount, always sync from store (project prop might be stale)
    // After first mount, only sync if we don't have unsaved changes
    const hasLocalChanges = localPanels.length > storePanelsLength || 
                            localComponents.length > storeComponentsLength;

    if (isFirstMountRef.current || !hasLocalChanges) {
      setLocalPanels(latestProject.panels || []);
      setLocalComponents(latestProject.components || []);
      setOriginalPanels(latestProject.panels || []);
      setOriginalComponents(latestProject.components || []);
      setHasChanges(false);
      isFirstMountRef.current = false;
    }
  }, [project.id, projects]); // Only depend on project.id and projects array

  // Detect changes by comparing local state with original
  useEffect(() => {
    const panelsChanged = JSON.stringify(localPanels) !== JSON.stringify(originalPanels);
    const componentsChanged = JSON.stringify(localComponents) !== JSON.stringify(originalComponents);
    setHasChanges(panelsChanged || componentsChanged);
    
    // Preserve selection if panel still exists after update
    if (selectedPanelId && !localPanels.find((p) => p.id === selectedPanelId)) {
      // Panel was deleted, clear selection
      setSelectedPanelId(null);
      setShowComponentProperties(false);
    }
  }, [localPanels, localComponents, originalPanels, originalComponents, selectedPanelId]);

  // Use local state for panels and components
  const panels = localPanels;
  const components = localComponents;

  // Evaluate rules and update violations
  useEffect(() => {
    if (rules && rules.length > 0 && panels.length > 0 && componentLibrary.length > 0) {
      const violations = evaluateRules(rules, panels, components, componentLibrary, combinatorsLibrary);
      setViolations(violations);
    } else {
      // Clear violations if no rules or no panels
      setViolations([]);
    }
  }, [rules, panels, components, componentLibrary, combinatorsLibrary, setViolations]);

  // Automatically apply gap constraints from rules
  useEffect(() => {
    if (!rules || rules.length === 0 || localPanels.length === 0) return;

    const updatedComponents: CanvasComponent[] = [];
    const gapComponentIds = new Set<string>();

    // Process each panel
    for (const panel of localPanels) {
      // Get gap constraints for this panel
      // Check both exact panel ID match and width-based matching (for panels copied from library)
      const panelRules = rules.filter((rule) => {
        if (rule.enabled === false) return false;
        if (rule.type !== 'panel') return false;
        
        // Exact ID match
        if (rule.panelId === panel.id) return true;
        
        // Width-based matching (for panels copied from library)
        if (rule.panelId && panelsLibrary) {
          const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
          if (libraryPanel && libraryPanel.width === panel.width) return true;
        }
        
        // Also check if no panelId specified (applies to all panels)
        if (!rule.panelId) return true;
        
        return false;
      });

      let topGap: Constraint | null = null;
      let bottomGap: Constraint | null = null;

      for (const rule of panelRules) {
        for (const constraint of rule.constraints) {
          if (constraint.type === 'gap') {
            if (constraint.placement === 'top') {
              topGap = constraint;
            } else if (constraint.placement === 'bottom') {
              bottomGap = constraint;
            }
          }
        }
      }

      // Get existing components for this panel (excluding old gap components)
      const panelComponents = localComponents.filter(
        (c) => c.panelId === panel.id && c.componentId !== 'gap'
      );

      // Add top gap if constraint exists
      if (topGap && topGap.size) {
        const topGapId = `gap-top-${panel.id}`;
        gapComponentIds.add(topGapId);
        
        // Check if top gap already exists
        const existingTopGap = localComponents.find((c) => c.id === topGapId);
        if (existingTopGap) {
          // Update existing gap
          updatedComponents.push({
            ...existingTopGap,
            properties: {
              ...existingTopGap.properties,
              gapHeight: topGap.size || 0,
              order: -1, // Top gap has lowest order
            },
            y: 0,
            x: 0,
          });
        } else {
          // Create new top gap
          updatedComponents.push({
            id: topGapId,
            componentId: 'gap',
            panelId: panel.id,
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            properties: {
              order: -1,
              gapHeight: topGap.size || 0,
            },
          });
        }
      }

      // Don't add regular components here - they're already in localComponents
      // We only need to add/update gap components

      // Add bottom gap if constraint exists
      if (bottomGap && bottomGap.size) {
        const bottomGapId = `gap-bottom-${panel.id}`;
        gapComponentIds.add(bottomGapId);
        
        // Check if bottom gap already exists
        const existingBottomGap = localComponents.find((c) => c.id === bottomGapId);
        if (existingBottomGap) {
          // Update existing gap - position will be recalculated
          updatedComponents.push({
            ...existingBottomGap,
            properties: {
              ...existingBottomGap.properties,
              gapHeight: bottomGap.size || 0,
              order: 9999, // Bottom gap has highest order
            },
          });
        } else {
          // Create new bottom gap - position will be calculated
          updatedComponents.push({
            id: bottomGapId,
            componentId: 'gap',
            panelId: panel.id,
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            properties: {
              order: 9999,
              gapHeight: bottomGap.size || 0,
            },
          });
        }
      }
    }

    // Merge components: 
    // updatedComponents contains only gap components (top and bottom gaps)
    // Keep all existing non-gap components, remove old gaps, add new/updated gaps
    const existingNonGapComponents = localComponents.filter((c) => c.componentId !== 'gap');
    
    // Final components: all existing non-gap components + all gap components from updatedComponents
    const finalComponents = existingNonGapComponents.concat(updatedComponents);

    // Recalculate positions for all components
    const repositionedComponents = finalComponents.map((comp) => {
      const panel = localPanels.find((p) => p.id === comp.panelId);
      if (!panel) return comp;

      const panelComps = finalComponents
        .filter((c) => c.panelId === comp.panelId)
        .sort((a, b) => (a.properties?.order ?? 0) - (b.properties?.order ?? 0));

      const spacing = 10;
      let currentY = 0;

      // Find position in sorted order
      const compIndex = panelComps.findIndex((c) => c.id === comp.id);
      if (compIndex === -1) return comp;

      // Check if current component is a combinator
      const currentCombinatorDef = combinatorsLibrary.find((c) => c.id === comp.componentId);
      const isCurrentCombinator = !!currentCombinatorDef;

      // Calculate Y position
      for (let i = 0; i < compIndex; i++) {
        const prevComp = panelComps[i];
        if (prevComp.componentId === 'gap') {
          currentY += (prevComp.properties?.gapHeight || 0) + spacing;
        } else {
          const compDef = componentLibrary.find((c) => c.id === prevComp.componentId);
          const combinatorDef = combinatorsLibrary.find((c) => c.id === prevComp.componentId);
          const isPrevCombinator = !!combinatorDef;
          const def = compDef || combinatorDef;
          if (def) {
            currentY += def.height;
            // Only add spacing if not between two combinators
            if (!(isCurrentCombinator && isPrevCombinator)) {
              currentY += spacing;
            }
          }
        }
      }
      
      // Add spacing before current component if there are previous components and not between combinators
      if (compIndex > 0) {
        const prevComp = panelComps[compIndex - 1];
        if (prevComp.componentId !== 'gap') {
          const prevCompDef = componentLibrary.find((c) => c.id === prevComp.componentId);
          const prevCombinatorDef = combinatorsLibrary.find((c) => c.id === prevComp.componentId);
          const isPrevCombinator = !!prevCombinatorDef;
          // Only add spacing if not between two combinators
          if (!(isCurrentCombinator && isPrevCombinator)) {
            currentY += spacing;
          }
        } else {
          // Previous was a gap, add spacing
          currentY += spacing;
        }
      }

      return {
        ...comp,
        y: currentY,
        x: (() => {
          if (comp.componentId === 'gap') return 0;
          const compDef = componentLibrary.find((c) => c.id === comp.componentId);
          const combinatorDef = combinatorsLibrary.find((c) => c.id === comp.componentId);
          const width = compDef?.width || combinatorDef?.width || 0;
          return (panel.width - width) / 2;
        })(),
      };
    });

    // Only update if gap components changed (to avoid infinite loops)
    const currentGapIds = new Set(
      localComponents.filter((c) => c.componentId === 'gap').map((c) => c.id)
    );
    const newGapIds = new Set(gapComponentIds);
    
    // Always update to ensure positions are recalculated correctly
    // This is safe because we're only adding/updating gap components and recalculating positions
    setLocalComponents(repositionedComponents);
  }, [rules, localPanels, componentLibrary, combinatorsLibrary, panelsLibrary]); // Note: intentionally not including localComponents to avoid loops

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
    
    const saveData = {
      panels: localPanels,
      components: localComponents,
      updatedAt: Date.now(),
    };

    updateProject(project.id, saveData);
    
    const updatedProject = {
      ...project,
      ...saveData,
    };
    
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
    
    // Defer modal closing to avoid DOM manipulation errors during React's render cycle
    // Use requestAnimationFrame twice to ensure React has finished rendering and Konva has initialized
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShowAddPanel(false);
      });
    });
    
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
  const calculateNextComponentPosition = (panelId: string, componentWidth: number, componentHeight: number, isCombinator: boolean = false) => {
    const panel = localPanels.find((p) => p.id === panelId);
    if (!panel) return { x: 0, y: 0, order: 0 };

    const panelComponents = localComponents
      .filter((c) => c.panelId === panelId)
      .sort((a, b) => (a.properties?.order ?? 0) - (b.properties?.order ?? 0));

    const spacing = 10; // mm spacing between components
    
    // Get gap constraints for this panel
    const panelRules = rules.filter(
      (rule) => rule.enabled !== false && rule.type === 'panel' && (!rule.panelId || rule.panelId === panelId)
    );
    let topGapSize = 0;
    for (const rule of panelRules) {
      for (const constraint of rule.constraints) {
        if (constraint.type === 'gap' && constraint.placement === 'top') {
          topGapSize = constraint.size || 0;
          break;
        }
      }
    }
    
    const startY = topGapSize; // Start from top gap

    if (panelComponents.length === 0) {
      const centeredX = (panel.width - componentWidth) / 2;
      return { x: centeredX, y: startY, order: 0 };
    }

    // Calculate Y position based on last component
    // Spacing is between components, not after each one
    // No spacing between combinators
    let totalHeight = startY;
    for (let i = 0; i < panelComponents.length; i++) {
      const comp = panelComponents[i];
      if (comp.componentId === 'gap') {
        // For gaps, use the gapHeight property
        const gapHeight = comp.properties?.gapHeight || 10;
        totalHeight += gapHeight;
      } else {
        const compDef = componentLibrary.find((c) => c.id === comp.componentId);
        const combinatorDef = combinatorsLibrary.find((c) => c.id === comp.componentId);
        const def = compDef || combinatorDef;
        if (def) {
          totalHeight += def.height;
        }
      }
      // Add spacing after this component (before the next one)
      // But skip spacing if both current and next are combinators
      if (i < panelComponents.length - 1) {
        const nextComp = panelComponents[i + 1];
        if (nextComp.componentId !== 'gap') {
          const currentCombinatorDef = combinatorsLibrary.find((c) => c.id === comp.componentId);
          const nextCombinatorDef = combinatorsLibrary.find((c) => c.id === nextComp.componentId);
          const isCurrentCombinator = !!currentCombinatorDef;
          const isNextCombinator = !!nextCombinatorDef;
          // Only add spacing if not between two combinators
          if (!(isCurrentCombinator && isNextCombinator)) {
            totalHeight += spacing;
          }
        } else {
          // Next is a gap, add spacing
          totalHeight += spacing;
        }
      }
    }

    // Check if the last component in the panel is a combinator
    // If both the last component and the new component are combinators, don't add spacing
    if (panelComponents.length > 0) {
      const lastComp = panelComponents[panelComponents.length - 1];
      if (lastComp.componentId !== 'gap') {
        const lastCombinatorDef = combinatorsLibrary.find((c) => c.id === lastComp.componentId);
        const isLastCombinator = !!lastCombinatorDef;
        // Only add spacing if not between two combinators
        if (!(isLastCombinator && isCombinator)) {
          totalHeight += spacing;
        }
      } else {
        // Last was a gap, add spacing
        totalHeight += spacing;
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

    const panel = localPanels.find((p) => p.id === selectedPanelId);
    if (!panel) return;

    // Filter rules to match panel (by ID or width for panels copied from library)
    const matchingRules = rules.filter((rule) => {
      if (rule.enabled === false) return false;
      if (rule.type !== 'panel') return false;
      
      // Exact ID match
      if (rule.panelId === panel.id) return true;
      
      // Width-based matching (for panels copied from library)
      if (rule.panelId && panelsLibrary) {
        const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
        if (libraryPanel && libraryPanel.width === panel.width) return true;
      }
      
      return false;
    });

    // Validate against maxComponentHeight constraint
    const validationError = validateComponentHeight(
      panel,
      localComponents,
      componentLibrary,
      combinatorsLibrary,
      matchingRules,
      component.height,
      false
    );

    if (validationError) {
      alert(validationError);
      return;
    }

    const position = calculateNextComponentPosition(selectedPanelId, component.width, component.height, false);

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

  // Handle adding combinator to selected panel
  const handleAddCombinator = (combinatorId: string) => {
    if (!selectedPanelId) return;

    const combinator = combinatorsLibrary.find((c) => c.id === combinatorId);
    if (!combinator) return;

    const panel = localPanels.find((p) => p.id === selectedPanelId);
    if (!panel) return;

    // Filter rules to match panel (by ID or width for panels copied from library)
    const matchingRules = rules.filter((rule) => {
      if (rule.enabled === false) return false;
      if (rule.type !== 'panel') return false;
      
      // Exact ID match
      if (rule.panelId === panel.id) return true;
      
      // Width-based matching (for panels copied from library)
      if (rule.panelId && panelsLibrary) {
        const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
        if (libraryPanel && libraryPanel.width === panel.width) return true;
      }
      
      return false;
    });

    // Validate against maxComponentHeight constraint
    const validationError = validateComponentHeight(
      panel,
      localComponents,
      componentLibrary,
      combinatorsLibrary,
      matchingRules,
      combinator.height,
      true
    );

    if (validationError) {
      alert(validationError);
      return;
    }

    const position = calculateNextComponentPosition(selectedPanelId, combinator.width, combinator.height, true);

    const newComponent: CanvasComponent = {
      id: `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      componentId: combinatorId, // Use combinator ID as componentId
      panelId: selectedPanelId,
      x: position.x,
      y: position.y,
      rotation: 0,
      scale: 1,
      properties: {
        order: position.order,
        isCombinator: true, // Mark as combinator
      },
    };

    setLocalComponents([...localComponents, newComponent]);
  };


  // Handle duplicating component
  const handleDuplicateComponent = (componentId: string) => {
    const componentToDuplicate = localComponents.find((c) => c.id === componentId);
    if (!componentToDuplicate) return;

    const panel = localPanels.find((p) => p.id === componentToDuplicate.panelId);
    if (!panel) return;

    // Find the component or combinator definition
    const compDef = componentLibrary.find((c) => c.id === componentToDuplicate.componentId);
    const combinatorDef = combinatorsLibrary.find((c) => c.id === componentToDuplicate.componentId);
    const def = compDef || combinatorDef;
    if (!def) return;

    // Filter rules to match panel (by ID or width for panels copied from library)
    const matchingRules = rules.filter((rule) => {
      if (rule.enabled === false) return false;
      if (rule.type !== 'panel') return false;
      
      // Exact ID match
      if (rule.panelId === panel.id) return true;
      
      // Width-based matching (for panels copied from library)
      if (rule.panelId && panelsLibrary) {
        const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
        if (libraryPanel && libraryPanel.width === panel.width) return true;
      }
      
      return false;
    });

    // Validate against maxComponentHeight constraint
    const validationError = validateComponentHeight(
      panel,
      localComponents,
      componentLibrary,
      combinatorsLibrary,
      matchingRules,
      def.height,
      !!combinatorDef
    );

    if (validationError) {
      alert(validationError);
      return;
    }

    // Calculate position for the duplicate (after the original)
    const position = calculateNextComponentPosition(componentToDuplicate.panelId, def.width, def.height, !!combinatorDef);

    // Create duplicate with same properties but new ID and position
    const duplicatedComponent: CanvasComponent = {
      id: `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      componentId: componentToDuplicate.componentId,
      panelId: componentToDuplicate.panelId,
      x: position.x,
      y: position.y,
      rotation: componentToDuplicate.rotation || 0,
      scale: componentToDuplicate.scale || 1,
      properties: {
        ...componentToDuplicate.properties,
        order: position.order,
      },
    };

    setLocalComponents([...localComponents, duplicatedComponent]);
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
      
      // Get gap constraints for this panel
      const panelRules = rules.filter((rule) => {
        if (rule.enabled === false) return false;
        if (rule.type !== 'panel') return false;
        if (rule.panelId === panel.id) return true;
        if (rule.panelId && panelsLibrary) {
          const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
          if (libraryPanel && libraryPanel.width === panel.width) return true;
        }
        return false;
      });
      
      let topGapSize = 0;
      for (const rule of panelRules) {
        for (const constraint of rule.constraints) {
          if (constraint.type === 'gap' && constraint.placement === 'top') {
            topGapSize = constraint.size || 0;
            break;
          }
        }
      }
      
      // Recalculate Y positions and order for all components in the panel
      const spacing = 10;
      const startY = topGapSize; // Start from top gap
      let currentY = startY;
      
      const repositioned = panelComponents.map((comp, index) => {
        let height = 0;
        if (comp.componentId === 'gap') {
          height = comp.properties?.gapHeight || 10;
        } else {
          const compDef = componentLibrary.find((c) => c.id === comp.componentId);
          const combinatorDef = combinatorsLibrary.find((c) => c.id === comp.componentId);
          height = compDef?.height || combinatorDef?.height || 0;
        }
        
        // Calculate x position
        let xPos = 0;
        if (comp.componentId !== 'gap') {
          const compDef = componentLibrary.find((c) => c.id === comp.componentId);
          const combinatorDef = combinatorsLibrary.find((c) => c.id === comp.componentId);
          const width = compDef?.width || combinatorDef?.width || 0;
          xPos = (panel.width - width) / 2;
        }
        
        const result = {
          ...comp,
          x: xPos,
          y: currentY,
          properties: {
            ...comp.properties,
            order: index + (topGapSize > 0 ? 1 : 0), // Account for top gap in order
          },
        };
        
        currentY += height;
        // Add spacing after this component (before the next one)
        // But skip spacing if both current and next are combinators
        if (index < panelComponents.length - 1) {
          const nextComp = panelComponents[index + 1];
          if (nextComp.componentId !== 'gap') {
            const currentCombinatorDef = combinatorsLibrary.find((c) => c.id === comp.componentId);
            const nextCombinatorDef = combinatorsLibrary.find((c) => c.id === nextComp.componentId);
            const isCurrentCombinator = !!currentCombinatorDef;
            const isNextCombinator = !!nextCombinatorDef;
            // Only add spacing if not between two combinators
            if (!(isCurrentCombinator && isNextCombinator)) {
              currentY += spacing;
            }
          } else {
            // Next is a gap, add spacing
            currentY += spacing;
          }
        }
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

  // Automatically apply gap constraints from rules
  useEffect(() => {
    if (!rules || rules.length === 0 || localPanels.length === 0) return;

    const updatedComponents: CanvasComponent[] = [];
    const gapComponentIds = new Set<string>();

    // Process each panel
    for (const panel of localPanels) {
      // Get gap constraints for this panel
      // Check both exact panel ID match and width-based matching (for panels copied from library)
      const panelRules = rules.filter((rule) => {
        if (rule.enabled === false) return false;
        if (rule.type !== 'panel') return false;
        
        // Exact ID match
        if (rule.panelId === panel.id) return true;
        
        // Width-based matching (for panels copied from library)
        if (rule.panelId && panelsLibrary) {
          const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
          if (libraryPanel && libraryPanel.width === panel.width) return true;
        }
        
        // Also check if no panelId specified (applies to all panels)
        if (!rule.panelId) return true;
        
        return false;
      });

      let topGap: Constraint | null = null;
      let bottomGap: Constraint | null = null;

      for (const rule of panelRules) {
        for (const constraint of rule.constraints) {
          if (constraint.type === 'gap') {
            if (constraint.placement === 'top') {
              topGap = constraint;
            } else if (constraint.placement === 'bottom') {
              bottomGap = constraint;
            }
          }
        }
      }

      // Get existing components for this panel (excluding old gap components)
      const panelComponents = localComponents.filter(
        (c) => c.panelId === panel.id && c.componentId !== 'gap'
      );

      // Add top gap if constraint exists
      if (topGap && topGap.size) {
        const topGapId = `gap-top-${panel.id}`;
        gapComponentIds.add(topGapId);
        
        // Check if top gap already exists
        const existingTopGap = localComponents.find((c) => c.id === topGapId);
        if (existingTopGap) {
          // Update existing gap
          updatedComponents.push({
            ...existingTopGap,
          properties: {
              ...existingTopGap.properties,
              gapHeight: topGap.size || 0,
              order: -1, // Top gap has lowest order
          },
            y: 0,
            x: 0,
          });
        } else {
          // Create new top gap
          updatedComponents.push({
            id: topGapId,
            componentId: 'gap',
            panelId: panel.id,
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            properties: {
              order: -1,
              gapHeight: topGap.size || 0,
            },
          });
        }
      }

      // Don't add regular components here - they're already in localComponents
      // We only need to add/update gap components

      // Add bottom gap if constraint exists
      if (bottomGap && bottomGap.size) {
        const bottomGapId = `gap-bottom-${panel.id}`;
        gapComponentIds.add(bottomGapId);
        
        // Check if bottom gap already exists
        const existingBottomGap = localComponents.find((c) => c.id === bottomGapId);
        if (existingBottomGap) {
          // Update existing gap - position will be recalculated
          updatedComponents.push({
            ...existingBottomGap,
            properties: {
              ...existingBottomGap.properties,
              gapHeight: bottomGap.size || 0,
              order: 9999, // Bottom gap has highest order
            },
          });
        } else {
          // Create new bottom gap - position will be calculated
          updatedComponents.push({
            id: bottomGapId,
            componentId: 'gap',
            panelId: panel.id,
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            properties: {
              order: 9999,
              gapHeight: bottomGap.size || 0,
            },
          });
        }
      }
    }

    // Merge components: 
    // updatedComponents contains only gap components (top and bottom gaps)
    // Keep all existing non-gap components, remove old gaps, add new/updated gaps
    const existingNonGapComponents = localComponents.filter((c) => c.componentId !== 'gap');
    
    // Final components: all existing non-gap components + all gap components from updatedComponents
    const finalComponents = existingNonGapComponents.concat(updatedComponents);

    // Recalculate positions for all components
    const repositionedComponents = finalComponents.map((comp) => {
      const panel = localPanels.find((p) => p.id === comp.panelId);
      if (!panel) return comp;

      const panelComps = finalComponents
        .filter((c) => c.panelId === comp.panelId)
          .sort((a, b) => (a.properties?.order ?? 0) - (b.properties?.order ?? 0));
        
        const spacing = 10;
      let currentY = 0;

      // Find position in sorted order
      const compIndex = panelComps.findIndex((c) => c.id === comp.id);
      if (compIndex === -1) return comp;

      // Calculate Y position
      for (let i = 0; i < compIndex; i++) {
        const prevComp = panelComps[i];
        if (prevComp.componentId === 'gap') {
          currentY += (prevComp.properties?.gapHeight || 0) + spacing;
          } else {
          const compDef = componentLibrary.find((c) => c.id === prevComp.componentId);
          const combinatorDef = combinatorsLibrary.find((c) => c.id === prevComp.componentId);
          const def = compDef || combinatorDef;
          if (def) {
            currentY += def.height + spacing;
          }
        }
      }

      return {
            ...comp,
            y: currentY,
        x: (() => {
          if (comp.componentId === 'gap') return 0;
          const compDef = componentLibrary.find((c) => c.id === comp.componentId);
          const combinatorDef = combinatorsLibrary.find((c) => c.id === comp.componentId);
          const width = compDef?.width || combinatorDef?.width || 0;
          return (panel.width - width) / 2;
        })(),
      };
        });
        
    setLocalComponents(repositionedComponents);
  }, [rules, localPanels, componentLibrary, combinatorsLibrary]);

  // Reorder components when one is dragged vertically
  const reorderComponents = (draggedComponentId: string, newY: number, panelId: string, currentComponents: CanvasComponent[]) => {
    const panel = localPanels.find((p) => p.id === panelId);
    if (!panel) return currentComponents;

    // Don't allow reordering gaps - they stay fixed
    const draggedComp = currentComponents.find((c) => c.id === draggedComponentId);
    if (draggedComp?.componentId === 'gap') {
      return currentComponents; // Gaps cannot be moved
    }

    // Get gap constraints for this panel
    const panelRules = rules.filter((rule) => {
      if (rule.enabled === false) return false;
      if (rule.type !== 'panel') return false;
      if (rule.panelId === panel.id) return true;
      if (rule.panelId && panelsLibrary) {
        const libraryPanel = panelsLibrary.find((p) => p.id === rule.panelId);
        if (libraryPanel && libraryPanel.width === panel.width) return true;
      }
      return false;
    });

    let topGapSize = 0;
    let bottomGapSize = 0;
    const topGapId = `gap-top-${panel.id}`;
    const bottomGapId = `gap-bottom-${panel.id}`;

    for (const rule of panelRules) {
      for (const constraint of rule.constraints) {
        if (constraint.type === 'gap') {
          if (constraint.placement === 'top') {
            topGapSize = constraint.size || 0;
          } else if (constraint.placement === 'bottom') {
            bottomGapSize = constraint.size || 0;
          }
        }
      }
    }

    const spacing = 10;
    const startY = topGapSize; // Start after top gap

    // Get all components in this panel (excluding dragged one and gaps - gaps stay fixed)
    const otherComponents = currentComponents
      .filter((c) => c.panelId === panelId && c.id !== draggedComponentId && c.componentId !== 'gap')
      .map((c) => {
          const compDef = componentLibrary.find((lib) => lib.id === c.componentId);
        const combinatorDef = combinatorsLibrary.find((lib) => lib.id === c.componentId);
        const height = compDef?.height || combinatorDef?.height || 0;
        return { comp: c, height, centerY: c.y + height / 2 };
      })
      .sort((a, b) => a.centerY - b.centerY);

    // Find insertion point based on Y position (excluding gaps from consideration)
    let insertIndex = otherComponents.length;
    for (let i = 0; i < otherComponents.length; i++) {
      if (newY < otherComponents[i].centerY) {
        insertIndex = i;
        break;
      }
    }

    // Rebuild component list with new order (gaps will be added back in fixed positions)
    const reorderedComponents = [...otherComponents];
    if (draggedComp) {
        const draggedDef = componentLibrary.find((c) => c.id === draggedComp.componentId);
      const draggedCombinatorDef = combinatorsLibrary.find((c) => c.id === draggedComp.componentId);
      const draggedHeight = draggedDef?.height || draggedCombinatorDef?.height || 0;
      reorderedComponents.splice(insertIndex, 0, {
        comp: draggedComp,
        height: draggedHeight,
        centerY: newY,
      });
    }

    // Recalculate Y positions for all components (gaps stay in fixed positions)
    const updatedComponents = [...currentComponents];
    
    // First, ensure top gap stays at y=0 (never move it)
    const topGap = updatedComponents.find((c) => c.id === topGapId);
    if (topGap) {
      const topGapIndex = updatedComponents.findIndex((c) => c.id === topGapId);
      updatedComponents[topGapIndex] = {
        ...topGap,
            x: 0,
        y: 0, // Top gap always at y=0
            properties: {
          ...topGap.properties,
          order: -1, // Top gap always has lowest order
            },
          };
    }
    
    // Start positioning regular components after top gap
    let currentY = startY;

    // Position regular components (gaps are excluded from reorderedComponents)
    reorderedComponents.forEach((item, index) => {
      const compIndex = updatedComponents.findIndex((c) => c.id === item.comp.id);
      if (compIndex !== -1) {
          const compDef = componentLibrary.find((c) => c.id === item.comp.componentId);
          const combinatorDef = combinatorsLibrary.find((c) => c.id === item.comp.componentId);
          const def = compDef || combinatorDef;
          if (def) {
            const centeredX = (panel.width - def.width) / 2;
            updatedComponents[compIndex] = {
              ...updatedComponents[compIndex],
              x: centeredX,
              y: currentY,
              properties: {
                ...updatedComponents[compIndex].properties,
              order: index + (topGapSize > 0 ? 1 : 0), // Account for top gap in order
              },
            };
            currentY += def.height + spacing;
        }
      }
    });

    // Finally, position bottom gap if it exists (always at the end)
    const bottomGap = updatedComponents.find((c) => c.id === bottomGapId);
    if (bottomGap) {
      const bottomGapIndex = updatedComponents.findIndex((c) => c.id === bottomGapId);
      updatedComponents[bottomGapIndex] = {
        ...bottomGap,
        x: 0,
        y: currentY, // Position after all components
        properties: {
          ...bottomGap.properties,
          order: 9999, // Bottom gap always has highest order
        },
      };
    }

    return updatedComponents;
  };

  // Initialize Konva stage - only when there are panels to render
  useEffect(() => {
    if (!containerRef.current) return;

    // If no panels, clean up stage and return (empty state will be shown)
    if (panels.length === 0) {
      if (stageRef.current) {
        try {
          stageRef.current.destroy();
        } catch (e) {
          // Ignore errors during cleanup
        }
        stageRef.current = null;
        layerRef.current = null;
      }
      setStageReady(false); // Mark stage as not ready when no panels
      return;
    }

    // Clean up existing stage before creating new one
    if (stageRef.current) {
      try {
        stageRef.current.destroy();
      } catch (e) {
        // Ignore errors during cleanup
      }
      stageRef.current = null;
      layerRef.current = null;
      setStageReady(false); // Mark stage as not ready when destroyed
    }

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

    // Create stage - use requestAnimationFrame to ensure DOM is ready and empty state is unmounted
    let rafId: number;
    rafId = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      
      // Double-check stage wasn't already created or destroyed during the frame
      if (stageRef.current) {
        // Stage already exists, skip creation
        return;
      }

      const stage = new Konva.Stage({
        container: containerRef.current,
        width: containerWidth,
        height: containerHeight,
      });

      const layer = new Konva.Layer();
      stage.add(layer);

      stageRef.current = stage;
      layerRef.current = layer;
      setStageReady(true); // Mark stage as ready
    });

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !stageRef.current) return;
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

      const currentStage = stageRef.current;
      if (currentStage) {
        currentStage.width(newWidth);
        currentStage.height(newHeight);
        currentStage.draw();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(rafId);
      // Clean up stage using ref to avoid closure issues
      if (stageRef.current) {
        try {
          stageRef.current.destroy();
        } catch (e) {
          // Stage might already be destroyed, ignore error
        }
        stageRef.current = null;
        layerRef.current = null;
      }
    };
  }, [totalWidthPx, maxHeightPx, panels.length]);

  // Render panels and components
  useEffect(() => {
    // If we have panels but no stage, the Konva init effect should create it
    // This effect will re-run when stage is created (via panels.length dependency in Konva effect)
    if (!stageRef.current || !layerRef.current) {
      return;
    }

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

        // Panel click handler - use function form of setState to get current value
        const handlePanelClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
          e.cancelBubble = true;
          setSelectedPanelId((currentSelectedId) => {
            if (currentSelectedId === panel.id) {
              // Deselect if clicking same panel
              setSelectedComponentId(null);
              setShowComponentProperties(false);
              return null;
            } else {
              // Select panel and open properties, deselect any component
              setSelectedComponentId(null);
              setShowComponentProperties(true);
              return panel.id;
            }
          });
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
            fill: '#666', // Keep title color unchanged, don't change to blue when selected
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

          // Create a group for the gap - invisible and not moveable
          const gapGroup = new Konva.Group({
            x: gapX,
            y: gapY,
            draggable: false, // Gaps are not draggable
            listening: false, // Don't listen to events - gaps are invisible and non-interactive
            opacity: 0, // Completely invisible
          });

          // Gap rectangle - completely invisible (no visual representation)
          const gapRect = new Konva.Rect({
            x: 0,
            y: 0,
            width: gapWidth * scale,
            height: gapHeight * scale,
            fill: 'transparent',
            stroke: 'transparent',
            strokeWidth: 0,
            listening: false,
            visible: false, // Make it completely invisible
          });
          gapGroup.add(gapRect);

          // No event handlers - gaps are invisible and non-interactive
          // Store gap group reference (needed for positioning calculations)
          gapGroupRefsRef.current.set(canvasComp.id, gapGroup);

          layer.add(gapGroup);
          return;
        }

        // Regular component rendering continues below
        const compDef = componentLibrary.find((c) => c.id === canvasComp.componentId);
        const combinatorDef = combinatorsLibrary.find((c) => c.id === canvasComp.componentId);
        const def = compDef || combinatorDef;
        if (!def) return;

        // Find the panel this component belongs to
        const panelPos = panelPositions.find((p) => p.panel.id === canvasComp.panelId);
        if (!panelPos) return;

        // Handle combinator rendering separately
        if (combinatorDef) {
          // Render combinator with its components
          // Always center combinator horizontally in the panel
          const centeredX = (panelPos.panel.width - combinatorDef.width) / 2;
          
          const combX = offset.x + (panelPos.xOffset + centeredX) * mmToPixels * scale;
          const combY = offset.y + canvasComp.y * mmToPixels * scale;
          const combWidth = combinatorDef.width * mmToPixels;
          const combHeight = combinatorDef.height * mmToPixels;

          const currentPanelPos = panelPos;
          const isCombinatorSelected = selectedComponentId === canvasComp.id;
          const centeredXPos = centeredX; // Use the same centered X position

          // Create combinator group
          const combinatorGroup = new Konva.Group({
            x: combX,
            y: combY,
            rotation: canvasComp.rotation || 0,
            scaleX: scale * (canvasComp.scale || 1),
            scaleY: scale * (canvasComp.scale || 1),
            draggable: false,
            dragBoundFunc: (pos) => {
              const centeredStageX = offset.x + (currentPanelPos.xOffset + centeredXPos) * mmToPixels * scale;
              const canvasY = (pos.y - offset.y) / scale / mmToPixels;
              const maxY = currentPanelPos.panel.height - combinatorDef.height;
              const clampedY = Math.max(0, Math.min(canvasY, maxY));
              const clampedStageY = offset.y + clampedY * mmToPixels * scale;
              return { x: centeredStageX, y: clampedStageY };
            },
          });

          // Draw combinator bottom line only (no full border)
          const bottomLine = new Konva.Line({
            points: [0, combHeight, combWidth, combHeight],
            stroke: isCombinatorSelected ? '#dc2626' : '#000000',
            strokeWidth: isCombinatorSelected ? 2 : 1,
            listening: true,
            perfectDrawEnabled: false,
            hitStrokeWidth: 10, // Make it easier to click/drag
          });
          combinatorGroup.add(bottomLine);

          // Render components inside combinator using gaps
          const gaps = combinatorDef.gaps || new Array(combinatorDef.componentIds.length + 1).fill(0);
          const topGap = gaps[0] || 0;
          
          // Calculate starting Y position (start from top gap)
          let componentY = topGap;
          
          combinatorDef.componentIds.forEach((compId, index) => {
            const innerComp = componentLibrary.find((c) => c.id === compId);
            if (!innerComp) return;

            const innerCompWidth = innerComp.width * mmToPixels;
            const innerCompHeight = innerComp.height * mmToPixels;
            const innerCompX = (combWidth - innerCompWidth) / 2; // Center horizontally
            const innerCompY = componentY * mmToPixels; // Convert to pixels

            // Create a group for the inner component
            const innerCompGroup = new Konva.Group({
              x: innerCompX,
              y: innerCompY,
              listening: false, // Read-only, no interaction
            });
            // Store component ID for later reference
            innerCompGroup.setAttr('data-component-id', innerComp.id);

            // Component rectangle (fallback/placeholder)
            const innerCompRect = new Konva.Rect({
              x: 0,
              y: 0,
              width: innerCompWidth,
              height: innerCompHeight,
              fill: isCombinatorSelected ? '#dc2626' : innerComp.color,
              stroke: isCombinatorSelected ? '#dc2626' : '#333',
              strokeWidth: isCombinatorSelected ? 2 : 1,
              cornerRadius: 2,
              opacity: isCombinatorSelected ? 0.8 : 0.8,
              listening: false,
              name: 'placeholder',
            });
            innerCompGroup.add(innerCompRect);

            // Try to load 2D model (SVG) if available
            if (innerComp.model2D && (innerComp.model2D.startsWith('http') || innerComp.model2D.startsWith('/'))) {
              // Check cache first
              let imageObj = imageCacheRef.current.get(innerComp.model2D);
              if (!imageObj) {
                imageObj = new Image();
                imageObj.crossOrigin = 'anonymous';
                imageCacheRef.current.set(innerComp.model2D, imageObj);
              }
              
              if (imageObj.complete && imageObj.naturalWidth > 0) {
                // Image already loaded, use it immediately
                innerCompRect.destroy();
                
                const innerCompImage = new Konva.Image({
                  x: 0,
                  y: 0,
                  image: imageObj,
                  width: innerCompWidth,
                  height: innerCompHeight,
                  listening: false,
                  opacity: 1,
                });
                innerCompGroup.add(innerCompImage);
                
                // Add red color overlay if combinator is selected
                if (isCombinatorSelected) {
                  const colorOverlay = new Konva.Rect({
                    x: 0,
                    y: 0,
                    width: innerCompWidth,
                    height: innerCompHeight,
                    fill: '#dc2626',
                    opacity: 0.5,
                    globalCompositeOperation: 'source-atop',
                    listening: false,
                    name: 'selection-overlay',
                  });
                  innerCompGroup.add(colorOverlay);
                }
              } else {
                // Image not loaded yet, wait for onload
                imageObj.onload = () => {
                  const placeholder = innerCompGroup.findOne('.placeholder');
                  if (placeholder) placeholder.destroy();
                  
                  const innerCompImage = new Konva.Image({
                    x: 0,
                    y: 0,
                    image: imageObj!,
                    width: innerCompWidth,
                    height: innerCompHeight,
                    listening: false,
                    opacity: 1,
                  });
                  innerCompGroup.add(innerCompImage);
                  
                  // Add red color overlay if combinator is selected
                  if (isCombinatorSelected) {
                    const colorOverlay = new Konva.Rect({
                      x: 0,
                      y: 0,
                      width: innerCompWidth,
                      height: innerCompHeight,
                      fill: '#dc2626',
                      opacity: 0.5,
                      globalCompositeOperation: 'source-atop',
                      listening: false,
                      name: 'selection-overlay',
                    });
                    innerCompGroup.add(colorOverlay);
                  }
                  
                  if (layer && layer.getStage()) {
                    layer.draw();
                  }
                };
                
                imageObj.onerror = () => {
                  // Keep the placeholder rectangle if image fails to load
                  console.warn(`Failed to load inner component image: ${innerComp.model2D}`);
                  if (layer && layer.getStage()) {
                    layer.draw();
                  }
                };
                
                if (!imageObj.src) {
                  imageObj.src = innerComp.model2D;
                }
              }
            }

            // Component label
            if (showLabels) {
              const innerLabel = new Konva.Text({
                x: 5,
                y: 5,
                text: innerComp.name,
                fontSize: 9,
                fill: '#fff',
                fontStyle: 'bold',
                width: innerCompWidth - 10,
                listening: false,
              });
              innerCompGroup.add(innerLabel);
            }

            combinatorGroup.add(innerCompGroup);

            // Move to next position using gap
            componentY += innerComp.height;
            const gapIndex = index + 1;
            const gap = gaps.length > gapIndex ? gaps[gapIndex] : 0;
            componentY += gap;
          });

          // Combinator label
          if (showLabels) {
            const combLabel = new Konva.Text({
              x: combWidth / 2 - 40,
              y: combHeight - 20,
              text: combinatorDef.name,
              fontSize: 10,
              fill: isCombinatorSelected ? '#dc2626' : '#4a90e2',
              width: 80,
              align: 'center',
              fontStyle: 'bold',
              listening: false,
            });
            combinatorGroup.add(combLabel);
          }

          // Click handler for combinator
          const handleCombinatorClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
            e.cancelBubble = true;
            if (e.evt) {
              if (typeof e.evt.stopPropagation === 'function') {
                e.evt.stopPropagation();
              }
              if (typeof e.evt.preventDefault === 'function') {
                e.evt.preventDefault();
              }
            }
            
            const compId = canvasComp.id;
            setSelectedComponentId((prevSelected) => {
              if (prevSelected === compId) {
                // Deselect if clicking same combinator
                setShowCombinatorProperties(false);
                return null;
              } else {
                // Select combinator and open combinator properties panel
                setShowCombinatorProperties(true);
                return compId;
              }
            });
          };

          combinatorGroup.on('click tap', handleCombinatorClick);

          // Hold-to-drag for combinator (same as regular components)
          let combDragStartPos: { x: number; y: number } | null = null;
          let combIsDragging = false;
          let combDragTimer: NodeJS.Timeout | null = null;

          combinatorGroup.on('mousedown touchstart', (e) => {
            e.cancelBubble = true;
            const stage = combinatorGroup.getStage();
            if (stage) {
              const pointerPos = stage.getPointerPosition();
              if (pointerPos) {
                combDragStartPos = pointerPos;
                combDragTimer = setTimeout(() => {
                  if (combDragStartPos && !combIsDragging) {
                    combinatorGroup.draggable(true);
                    combIsDragging = true;
                    document.body.style.cursor = 'grabbing';
                  }
                }, 200);
              }
            }
          });

          combinatorGroup.on('mousemove touchmove', () => {
            if (combDragStartPos && !combIsDragging) {
              const stage = combinatorGroup.getStage();
              if (stage) {
                const pointerPos = stage.getPointerPosition();
                if (pointerPos) {
                  const distance = Math.sqrt(
                    Math.pow(pointerPos.x - combDragStartPos!.x, 2) + 
                    Math.pow(pointerPos.y - combDragStartPos!.y, 2)
                  );
                  if (distance > 5) {
                    if (combDragTimer) clearTimeout(combDragTimer);
                    combinatorGroup.draggable(true);
                    combIsDragging = true;
                    document.body.style.cursor = 'grabbing';
                  }
                }
              }
            }
          });

          combinatorGroup.on('mouseup touchend', () => {
            if (combDragTimer) {
              clearTimeout(combDragTimer);
              combDragTimer = null;
            }
            if (!combIsDragging) {
              handleCombinatorClick({ cancelBubble: false, evt: {} } as any);
            }
            combDragStartPos = null;
            combIsDragging = false;
            document.body.style.cursor = 'default';
          });

          combinatorGroup.on('dragend', () => {
            const pos = combinatorGroup.position();
            const canvasY = (pos.y - offset.y) / scale / mmToPixels;
            const centeredX = (currentPanelPos.panel.width - combinatorDef.width) / 2;
            
            const updated = localComponents.map((c) =>
              c.id === canvasComp.id
                ? { ...c, x: centeredX, y: canvasY }
                : c
            );
            
            const finalUpdated = reorderComponents(canvasComp.id, canvasY, canvasComp.panelId, updated);
            setLocalComponents(finalUpdated);
            
            combinatorGroup.draggable(false);
            combIsDragging = false;
            document.body.style.cursor = 'default';
          });

          combinatorGroup.on('mouseenter', () => { document.body.style.cursor = 'move'; });
          combinatorGroup.on('mouseleave', () => { document.body.style.cursor = 'default'; });

          componentGroupRefsRef.current.set(canvasComp.id, combinatorGroup);
          layer.add(combinatorGroup);
          return; // Skip regular component rendering for combinators
        }

        // Regular component rendering (non-combinator)
        // Use stored X position (should be centered) or calculate centered position
        const storedX = canvasComp.x;
        const centeredX = (panelPos.panel.width - def.width) / 2;
        const finalX = Math.abs(storedX - centeredX) < 1 ? storedX : centeredX; // Use stored if close to centered, otherwise use centered
        
        // Components are added directly to layer, so we need absolute stage coordinates
        const compX = offset.x + (panelPos.xOffset + finalX) * mmToPixels * scale;
        const compY = offset.y + canvasComp.y * mmToPixels * scale;
        const compWidth = def.width * mmToPixels;
        const compHeight = def.height * mmToPixels;

        // Store panelPos in a variable that will be captured in the closure
        const currentPanelPos = panelPos;
        const isComponentSelected = selectedComponentId === canvasComp.id;
        
        // Calculate centered X position relative to panel (in mm)
        const centeredXPos = (currentPanelPos.panel.width - def.width) / 2;
        
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
            const maxY = currentPanelPos.panel.height - def.height;
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
        // Use a default color for combinators (blue-ish) or component color
        const defaultColor = combinatorDef ? '#4a90e2' : (compDef?.color || '#4a90e2');
        const fillColor = isComponentSelected ? '#dc2626' : defaultColor;
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

        // Try to load 2D model if available (only for components, not combinators)
        if (compDef && compDef.model2D && (compDef.model2D.startsWith('http') || compDef.model2D.startsWith('/'))) {
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
        // At this point, combinatorDef should be null (combinators handled above)
        let labelText = compDef?.name || 'Unknown';
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

          const draggedCenterY = canvasY + def.height / 2;

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
              currentY += def.height + spacing;
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
          const centeredX = (currentPanelPos.panel.width - def.width) / 2;
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
          setShowCombinatorProperties(false);
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
    stageReady, // Re-run when stage becomes ready
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
      
      const canvasComp = localComponents.find((c) => c.id === compId);
      const combinatorDef = canvasComp ? combinatorsLibrary.find((c) => c.id === canvasComp.componentId) : null;
      const isCombinator = !!combinatorDef;
      
      if (isCombinator) {
        // Handle combinator selection
        const isSelected = selectedComponentId === compId;
        const bottomLine = compGroup.findOne('Line') as Konva.Line | null;
        
        if (bottomLine) {
          // Update bottom line stroke and width
          bottomLine.stroke(isSelected ? '#dc2626' : '#000000');
          bottomLine.strokeWidth(isSelected ? 2 : 1);
        }
        
        // Update inner component overlays
        const innerGroups = compGroup.find('Group') as Konva.Group[];
        innerGroups.forEach((innerGroup) => {
          const existingOverlay = innerGroup.findOne('.selection-overlay') as Konva.Rect | null;
          const innerImage = innerGroup.findOne('Image') as Konva.Image | null;
          const placeholder = innerGroup.findOne('.placeholder') as Konva.Rect | null;
          
          if (isSelected) {
            if (innerImage && !existingOverlay) {
              // Add red overlay to inner component SVG
              const width = innerImage.width();
              const height = innerImage.height();
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
              innerGroup.add(colorOverlay);
            } else if (placeholder && !existingOverlay) {
              // Update placeholder to red
              placeholder.fill('#dc2626');
              placeholder.stroke('#dc2626');
              placeholder.strokeWidth(2);
            }
          } else {
            // Remove overlays and reset colors
            if (existingOverlay) {
              existingOverlay.destroy();
            }
            if (placeholder) {
              // Reset placeholder - need to find the component
              const innerCompId = innerGroup.getAttr('data-component-id');
              if (innerCompId) {
                const innerComp = componentLibrary.find((c) => c.id === innerCompId);
                if (innerComp) {
                  placeholder.fill(innerComp.color);
                  placeholder.stroke('#333');
                  placeholder.strokeWidth(1);
                }
              }
            }
          }
        });
      } else {
        // Handle regular component selection
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
            if (canvasComp) {
              const compDef = componentLibrary.find((c) => c.id === canvasComp.componentId);
              if (compDef) {
                placeholder.fill(compDef.color);
              }
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
  }, [selectedPanelId, selectedComponentId, localComponents, componentLibrary, combinatorsLibrary]);

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
        selectedComponentId={selectedComponentId}
        onAddComponent={handleAddComponent}
        onAddCombinator={handleAddCombinator}
        onDeleteComponent={handleDeleteComponent}
        onDuplicateComponent={handleDuplicateComponent}
        onUpdateCombinator={(componentId, newCombinatorId) => {
          // Replace the combinator
          const updatedComponents = localComponents.map((c) => {
            if (c.id === componentId) {
              return {
                ...c,
                componentId: newCombinatorId,
              };
            }
            return c;
          });
          setLocalComponents(updatedComponents);
        }}
        onClose={() => {
          setShowComponentProperties(false);
          setSelectedPanelId(null);
        }}
      />

      {/* Combinator Properties Panel */}
      {(() => {
        const selectedCombinator = selectedComponentId
          ? (() => {
              const canvasComp = localComponents.find((c) => c.id === selectedComponentId);
              if (!canvasComp) return null;
              const combinatorDef = combinatorsLibrary.find((c) => c.id === canvasComp.componentId);
              if (!combinatorDef) return null;
              return { canvasComp, combinatorDef };
            })()
          : null;

        return (
          <CombinatorPropertiesPanel
            isOpen={showCombinatorProperties && !!selectedCombinator}
            selectedCombinator={selectedCombinator}
            selectedPanel={selectedCombinator ? localPanels.find((p) => p.id === selectedCombinator.canvasComp.panelId) || null : null}
            onUpdateCombinator={(componentId, newCombinatorId) => {
              // Replace the combinator
              const updatedComponents = localComponents.map((c) => {
                if (c.id === componentId) {
                  return {
                    ...c,
                    componentId: newCombinatorId,
                  };
                }
                return c;
              });
              setLocalComponents(updatedComponents);
            }}
            onClose={() => {
              setShowCombinatorProperties(false);
              setSelectedComponentId(null);
            }}
          />
        );
      })()}

      {/* Add Panel Modal - Width Selection */}
      {showAddPanel && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none"
          onClick={(e) => {
            // Close modal when clicking backdrop
            if (e.target === e.currentTarget) {
              // Use requestAnimationFrame to defer closing
              requestAnimationFrame(() => {
                setShowAddPanel(false);
                setSelectedWidth('');
              });
            }
          }}
        >
          <div 
            className="pointer-events-auto bg-white border-t border-gray-200 rounded-t-lg shadow-2xl w-full max-w-2xl max-h-[50vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Add Panel</h3>
              <button
                onClick={() => {
                  // Use requestAnimationFrame to defer closing
                  requestAnimationFrame(() => {
                    setShowAddPanel(false);
                    setSelectedWidth('');
                  });
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
                  // Use requestAnimationFrame to defer closing
                  requestAnimationFrame(() => {
                    setShowAddPanel(false);
                    setSelectedWidth('');
                  });
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
