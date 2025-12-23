import {
  Rule,
  RuleViolation,
  Panel,
  CanvasComponent,
  Component,
  Constraint,
  Combinator,
} from '@/types';
import {
  checkOverlaps,
  getOutOfBoundsComponents,
  checkSpacing,
  getComponentBounds,
  checkIntersectsWithPanelBounds,
} from './collisionDetection';
import { getPanelSizeFromWidth } from './componentUtils';

/**
 * Evaluate all rules against the current design (multi-panel support)
 */
export function evaluateRules(
  rules: Rule[],
  panels: Panel[],
  canvasComponents: CanvasComponent[],
  componentLibrary: Component[],
  combinatorsLibrary: Combinator[] = []
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // Only evaluate enabled rules
  const enabledRules = rules.filter((rule) => rule.enabled !== false);

  // Separate panel-specific and global rules
  const panelRules = enabledRules.filter((rule) => rule.type === 'panel');
  const globalRules = enabledRules.filter((rule) => rule.type === 'global');
  const componentRules = enabledRules.filter((rule) => rule.type === 'component');

  // Evaluate panel-specific rules for each panel
  for (const panel of panels) {
    for (const rule of panelRules) {
      const ruleViolations = evaluateRule(
        rule,
        panel,
        panels,
        canvasComponents,
        componentLibrary,
        combinatorsLibrary,
        enabledRules
      );
      violations.push(...ruleViolations);
    }
  }

  // Evaluate global rules once (not per panel)
  if (globalRules.length > 0 && panels.length > 0) {
    // Use first panel as context for global rules (they don't depend on specific panel)
    for (const rule of globalRules) {
      const ruleViolations = evaluateRule(
        rule,
        panels[0],
        panels,
        canvasComponents,
        componentLibrary,
        combinatorsLibrary,
        enabledRules
      );
      violations.push(...ruleViolations);
    }
  }

  // Evaluate component rules for each panel (component rules can be panel-specific or global)
  for (const panel of panels) {
    for (const rule of componentRules) {
      const ruleViolations = evaluateRule(
        rule,
        panel,
        panels,
        canvasComponents,
        componentLibrary,
        combinatorsLibrary,
        enabledRules
      );
      violations.push(...ruleViolations);
    }
  }

  return violations;
}

/**
 * Evaluate a single rule
 */
export function evaluateRule(
  rule: Rule,
  panel: Panel,
  panels: Panel[],
  canvasComponents: CanvasComponent[],
  componentLibrary: Component[],
  combinatorsLibrary: Combinator[] = [],
  allRules: Rule[] = []
): RuleViolation[] {
  const violations: RuleViolation[] = [];

  // Check if rule applies to this panel
  if (rule.type === 'panel' && rule.panelId && panel.id !== rule.panelId) {
    return violations;
  }

  // Filter components to only those on this panel for panel-specific rules
  const panelComponents = rule.type === 'panel' && rule.panelId
    ? canvasComponents.filter((cc) => cc.panelId === panel.id)
    : canvasComponents;

  // Evaluate conditions
  let conditionsMet = true;
  for (const condition of rule.conditions) {
    const met = evaluateCondition(condition, panel, panelComponents, componentLibrary);
    if (!met) {
      conditionsMet = false;
      break;
    }
  }

  if (!conditionsMet) {
    return violations;
  }

  // Get all panel rules to find gap constraints (needed for maxComponentHeight)
  const allPanelRules = allRules.filter(
    (r) => r.enabled !== false && r.type === 'panel' && (!r.panelId || r.panelId === panel.id)
  );

  // Evaluate constraints
  for (const constraint of rule.constraints) {
    const constraintViolations = checkConstraint(
      constraint,
      rule,
      panel,
      panels,
      panelComponents,
      componentLibrary,
      combinatorsLibrary,
      allPanelRules
    );
    violations.push(...constraintViolations);
  }

  return violations;
}

/**
 * Evaluate a rule condition
 */
function evaluateCondition(
  condition: any,
  panel: Panel,
  canvasComponents: CanvasComponent[],
  componentLibrary: Component[]
): boolean {
  // For now, implement basic condition checking
  // Can be expanded based on field and operator
  switch (condition.field) {
    case 'componentCount':
      const count = canvasComponents.length;
      switch (condition.operator) {
        case 'greaterThan':
          return count > (condition.value as number);
        case 'lessThan':
          return count < (condition.value as number);
        case 'equals':
          return count === condition.value;
        default:
          return true;
      }
    case 'panelWidth':
      switch (condition.operator) {
        case 'greaterThan':
          return panel.width > (condition.value as number);
        case 'lessThan':
          return panel.width < (condition.value as number);
        case 'equals':
          return panel.width === condition.value;
        default:
          return true;
      }
    case 'panelHeight':
      switch (condition.operator) {
        case 'greaterThan':
          return panel.height > (condition.value as number);
        case 'lessThan':
          return panel.height < (condition.value as number);
        case 'equals':
          return panel.height === condition.value;
        default:
          return true;
      }
    default:
      return true; // Default to true if condition not recognized
  }
}

/**
 * Check a constraint and return violations
 */
function checkConstraint(
  constraint: Constraint,
  rule: Rule,
  panel: Panel,
  panels: Panel[],
  canvasComponents: CanvasComponent[],
  componentLibrary: Component[],
  combinatorsLibrary: Combinator[] = [],
  allPanelRules: Rule[] = []
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const timestamp = Date.now();

  switch (constraint.type) {
    case 'overlap':
      const overlaps = checkOverlaps(canvasComponents, componentLibrary);
      for (const overlap of overlaps) {
        violations.push({
          id: `violation-${timestamp}-${overlap.comp1}-${overlap.comp2}`,
          ruleId: rule.id,
          ruleName: rule.name,
          message: constraint.message || 'Components overlap',
          severity: 'error',
          componentIds: [overlap.comp1, overlap.comp2],
          timestamp,
        });
      }
      break;

    case 'bounds':
      const outOfBounds = getOutOfBoundsComponents(
        canvasComponents,
        componentLibrary,
        panels
      );
      for (const compId of outOfBounds) {
        violations.push({
          id: `violation-${timestamp}-${compId}`,
          ruleId: rule.id,
          ruleName: rule.name,
          message: constraint.message || 'Component is outside panel bounds',
          severity: 'error',
          componentId: compId,
          timestamp,
        });
      }
      break;

    case 'spacing':
      if (constraint.spacing !== undefined) {
        const spacingViolations = checkSpacing(
          canvasComponents,
          componentLibrary,
          constraint.spacing
        );
        for (const violation of spacingViolations) {
          violations.push({
            id: `violation-${timestamp}-${violation.comp1}-${violation.comp2}`,
            ruleId: rule.id,
            ruleName: rule.name,
            message:
              constraint.message ||
              `Components are too close (minimum spacing: ${constraint.spacing}mm)`,
            severity: 'warning',
            componentIds: [violation.comp1, violation.comp2],
            timestamp,
          });
        }
      }
      break;

    case 'count':
      const count = canvasComponents.length;
      if (constraint.max !== undefined && count > constraint.max) {
        violations.push({
          id: `violation-${timestamp}-count`,
          ruleId: rule.id,
          ruleName: rule.name,
          message:
            constraint.message ||
            `Too many components (maximum: ${constraint.max})`,
          severity: 'error',
          timestamp,
        });
      }
      if (constraint.min !== undefined && count < constraint.min) {
        violations.push({
          id: `violation-${timestamp}-count`,
          ruleId: rule.id,
          ruleName: rule.name,
          message:
            constraint.message ||
            `Not enough components (minimum: ${constraint.min})`,
          severity: 'warning',
          timestamp,
        });
      }
      break;

    case 'dimension':
      if (constraint.property === 'width' && panel) {
        if (constraint.min !== undefined && panel.width < constraint.min) {
          violations.push({
            id: `violation-${timestamp}-width`,
            ruleId: rule.id,
            ruleName: rule.name,
            message:
              constraint.message ||
              `Panel width must be at least ${constraint.min}mm`,
            severity: 'error',
            timestamp,
          });
        }
        if (constraint.max !== undefined && panel.width > constraint.max) {
          violations.push({
            id: `violation-${timestamp}-width`,
            ruleId: rule.id,
            ruleName: rule.name,
            message:
              constraint.message ||
              `Panel width must be at most ${constraint.max}mm`,
            severity: 'error',
            timestamp,
          });
        }
      }
      if (constraint.property === 'height' && panel) {
        if (constraint.min !== undefined && panel.height < constraint.min) {
          violations.push({
            id: `violation-${timestamp}-height`,
            ruleId: rule.id,
            ruleName: rule.name,
            message:
              constraint.message ||
              `Panel height must be at least ${constraint.min}mm`,
            severity: 'error',
            timestamp,
          });
        }
        if (constraint.max !== undefined && panel.height > constraint.max) {
          violations.push({
            id: `violation-${timestamp}-height`,
            ruleId: rule.id,
            ruleName: rule.name,
            message:
              constraint.message ||
              `Panel height must be at most ${constraint.max}mm`,
            severity: 'error',
            timestamp,
          });
        }
      }
      break;

    case 'co-usage':
      // Check co-usage based on constraint configuration
      if (rule.type === 'component' && rule.componentId && constraint.requiredComponentIds) {
        // Component rule: Use rule.componentId as the target component
        const targetCanvasComp = canvasComponents.find(
          (cc) => cc.componentId === rule.componentId
        );
        const presentComponentIds = new Set(
          canvasComponents.map((cc) => cc.componentId)
        );

        if (targetCanvasComp) {
          // Target component is present, check if all required components are also present
          for (const requiredId of constraint.requiredComponentIds) {
            if (!presentComponentIds.has(requiredId)) {
              const requiredComp = componentLibrary.find((c) => c.id === requiredId);
              const targetComp = componentLibrary.find((c) => c.id === rule.componentId);
              violations.push({
                id: `violation-${timestamp}-${rule.componentId}-${requiredId}`,
                ruleId: rule.id,
                ruleName: rule.name,
                message:
                  constraint.message ||
                  `${targetComp?.name || rule.componentId} requires ${requiredComp?.name || requiredId} to be present`,
                severity: 'error',
                componentId: targetCanvasComp.id,
                missingComponentId: requiredId,
                requiredComponentId: rule.componentId,
                timestamp,
              });
            }
          }
        }
      } else if (rule.type === 'panel' && constraint.requiredComponentIds) {
        // Panel rule: Check if all required components are present for this panel
        const presentComponentIds = new Set(
          canvasComponents.filter((cc) => cc.panelId === panel.id).map((cc) => cc.componentId)
        );
        const missingIds = constraint.requiredComponentIds.filter(
          (id) => !presentComponentIds.has(id)
        );

        if (missingIds.length > 0) {
          const missingComps = missingIds
            .map((id) => componentLibrary.find((c) => c.id === id)?.name || id)
            .join(', ');
          violations.push({
            id: `violation-${timestamp}-panel-co-usage-${missingIds.join('-')}`,
            ruleId: rule.id,
            ruleName: rule.name,
            message:
              constraint.message ||
              `Panel requires components: ${missingComps}`,
            severity: 'error',
            componentIds: canvasComponents
              .filter((cc) =>
                constraint.requiredComponentIds?.includes(cc.componentId)
              )
              .map((cc) => cc.id),
            missingComponentId: missingIds[0], // First missing component
            timestamp,
          });
        }
      } else if (constraint.requiredComponentIds) {
        // Global rule or component rule without target: Check if all required components are present together
        const presentComponentIds = new Set(
          canvasComponents.map((cc) => cc.componentId)
        );
        const missingIds = constraint.requiredComponentIds.filter(
          (id) => !presentComponentIds.has(id)
        );

        if (missingIds.length > 0) {
          const missingComps = missingIds
            .map((id) => componentLibrary.find((c) => c.id === id)?.name || id)
            .join(', ');
          violations.push({
            id: `violation-${timestamp}-co-usage-${missingIds.join('-')}`,
            ruleId: rule.id,
            ruleName: rule.name,
            message:
              constraint.message ||
              `Missing required components: ${missingComps}`,
            severity: 'error',
            componentIds: canvasComponents
              .filter((cc) =>
                constraint.requiredComponentIds?.includes(cc.componentId)
              )
              .map((cc) => cc.id),
            missingComponentId: missingIds[0], // First missing component
            timestamp,
          });
        }
      } else {
        // Fallback: check component.requiredComponents property
        const actualComponents = canvasComponents
          .map((cc) => {
            const comp = componentLibrary.find((c) => c.id === cc.componentId);
            return { ...cc, component: comp };
          })
          .filter((cc) => cc.component);

        for (const canvasComp of actualComponents) {
          const comp = canvasComp.component!;
          if (comp.requiredComponents) {
            const requiredIds = comp.requiredComponents;
            const presentIds = actualComponents.map((cc) => cc.componentId);
            for (const requiredId of requiredIds) {
              if (!presentIds.includes(requiredId)) {
                const requiredComp = componentLibrary.find((c) => c.id === requiredId);
                violations.push({
                  id: `violation-${timestamp}-${comp.id}-${requiredId}`,
                  ruleId: rule.id,
                  ruleName: rule.name,
                  message:
                    constraint.message ||
                    `${comp.name} requires ${requiredComp?.name || requiredId} to be present`,
                  severity: 'error',
                  componentId: canvasComp.id,
                  missingComponentId: requiredId,
                  requiredComponentId: comp.id,
                  timestamp,
                });
              }
            }
          }
        }
      }
      break;

    case 'noIntersectWithPanelBounds':
      if (constraint.panelIds && constraint.panelIds.length >= 2) {
        const intersecting = checkIntersectsWithPanelBounds(
          canvasComponents,
          componentLibrary,
          panels,
          constraint.panelIds
        );
        for (const compId of intersecting) {
          violations.push({
            id: `violation-${timestamp}-${compId}-panel-intersect`,
            ruleId: rule.id,
            ruleName: rule.name,
            message: constraint.message || 'Component intersects with panel bounding box',
            severity: 'error',
            componentId: compId,
            timestamp,
          });
        }
      }
      break;

    case 'panelSizeMapping':
      // Determine panel size: use constraint.panelSize if specified, otherwise calculate from panel width
      const panelSize = constraint.panelSize !== undefined 
        ? constraint.panelSize 
        : getPanelSizeFromWidth(panel.width);
      
      // Get component types to check (support both old componentType and new componentTypes)
      const componentTypesToCheck = constraint.componentTypes || 
        (constraint.componentType ? [constraint.componentType] : []);
      
      // Filter components to check
      const componentsToCheck = canvasComponents.filter((cc) => {
        const comp = componentLibrary.find((c) => c.id === cc.componentId);
        if (!comp) return false;
        
        // If component types are specified, must match one of them
        if (componentTypesToCheck.length > 0) {
          if (!componentTypesToCheck.includes(comp.type)) {
            return false; // Not in the list of types to check
          }
        }
        
        // Check if component has panelSize spec
        const compPanelSize = comp.specs.panelSize;
        if (compPanelSize === undefined) {
          return false; // Component doesn't have panelSize, skip
        }
        
        // Check if panel size matches
        return Number(compPanelSize) !== panelSize;
      });
      
      // Generate violations for mismatched components
      for (const canvasComp of componentsToCheck) {
        const comp = componentLibrary.find((c) => c.id === canvasComp.componentId);
        violations.push({
          id: `violation-${timestamp}-${canvasComp.id}-panel-size`,
          ruleId: rule.id,
          ruleName: rule.name,
          message:
            constraint.message ||
            `${comp?.name || canvasComp.componentId} size (${comp?.specs.panelSize}cm) does not match required panel size (${panelSize}cm)`,
          severity: 'error',
          componentId: canvasComp.id,
          timestamp,
        });
      }
      break;

    case 'gap':
      // Gap constraint validation - ensure only one gap per placement per panel
      // This is mainly informational, actual gap usage is in height calculations
      // Could add validation here if needed (e.g., check for duplicate gaps)
      break;

    case 'maxComponentHeight':
      // Get gap constraints for this panel from all panel rules
      const gapConstraints: Constraint[] = [];
      for (const panelRule of allPanelRules) {
        for (const c of panelRule.constraints) {
          if (c.type === 'gap') {
            gapConstraints.push(c);
          }
        }
      }
      const topGap = gapConstraints.find((c) => c.placement === 'top');
      const bottomGap = gapConstraints.find((c) => c.placement === 'bottom');
      const topGapSize = topGap?.size || 0;
      const bottomGapSize = bottomGap?.size || 0;

      // Calculate max allowed height
      let maxHeight: number;
      if (constraint.automatic) {
        maxHeight = panel.height - topGapSize - bottomGapSize;
      } else {
        if (constraint.height === undefined) {
          // Invalid constraint - height required when automatic is false
          violations.push({
            id: `violation-${timestamp}-max-height-invalid`,
            ruleId: rule.id,
            ruleName: rule.name,
            message: constraint.message || 'Max component height constraint requires height value when automatic is disabled',
            severity: 'error',
            timestamp,
          });
          break;
        }
        maxHeight = constraint.height;
      }

      // Calculate total component height (including spacing)
      const totalHeight = calculateTotalComponentHeight(
        panel,
        canvasComponents,
        componentLibrary,
        combinatorsLibrary,
        true // Include spacing
      );

      if (totalHeight > maxHeight) {
        violations.push({
          id: `violation-${timestamp}-max-height`,
          ruleId: rule.id,
          ruleName: rule.name,
          message:
            constraint.message ||
            `Total component height (${totalHeight.toFixed(1)}mm) exceeds maximum allowed height (${maxHeight.toFixed(1)}mm)`,
          severity: 'error',
          timestamp,
        });
      }
      break;
  }

  return violations;
}

/**
 * Calculate total component height for a panel
 * Includes: components, combinators (with internal gaps), gap components, and spacing between components
 */
export function calculateTotalComponentHeight(
  panel: Panel,
  canvasComponents: CanvasComponent[],
  componentLibrary: Component[],
  combinatorsLibrary: Combinator[],
  includeSpacing: boolean = true
): number {
  const panelComponents = canvasComponents.filter((cc) => cc.panelId === panel.id);
  const spacing = 10; // mm spacing between components
  let totalHeight = 0;
  let componentCount = 0; // Count non-gap components for spacing calculation

  for (const canvasComp of panelComponents) {
    if (canvasComp.componentId === 'gap') {
      // Gap component - use gapHeight property
      const gapHeight = canvasComp.properties?.gapHeight || 0;
      totalHeight += gapHeight;
    } else {
      // Check if it's a combinator
      const combinator = combinatorsLibrary.find((c) => c.id === canvasComp.componentId);
      if (combinator) {
        // Combinator height already includes internal gaps (from combinator.gaps)
        totalHeight += combinator.height;
        componentCount++;
      } else {
        // Regular component
        const component = componentLibrary.find((c) => c.id === canvasComp.componentId);
        if (component) {
          totalHeight += component.height;
          componentCount++;
        }
      }
    }
  }

  // Add spacing between components (spacing after each component except the last)
  if (includeSpacing && componentCount > 0) {
    totalHeight += spacing * (componentCount - 1);
  }

  return totalHeight;
}

/**
 * Calculate available height (empty area) for a panel
 * Returns: available height in mm, or null if no maxComponentHeight constraint
 */
export function calculateAvailableHeight(
  panel: Panel,
  canvasComponents: CanvasComponent[],
  componentLibrary: Component[],
  combinatorsLibrary: Combinator[],
  rules: Rule[] // Should be pre-filtered to match the panel
): { available: number; maxHeight: number; used: number } | null {
  // Use the provided rules (already filtered to match the panel)
  // No need to filter again - the caller should have done width-based matching
  const panelRules = rules.filter((rule) => rule.enabled !== false && rule.type === 'panel');

  // Find maxComponentHeight constraint and collect all gap constraints
  let maxHeightConstraint: Constraint | null = null;
  const gapConstraints: Constraint[] = [];

  for (const rule of panelRules) {
    for (const constraint of rule.constraints) {
      if (constraint.type === 'maxComponentHeight') {
        maxHeightConstraint = constraint;
      } else if (constraint.type === 'gap') {
        gapConstraints.push(constraint);
      }
    }
  }

  if (!maxHeightConstraint) {
    return null; // No constraint
  }

  // Get gap constraints
  const topGap = gapConstraints.find((c) => c.placement === 'top');
  const bottomGap = gapConstraints.find((c) => c.placement === 'bottom');
  const topGapSize = topGap?.size || 0;
  const bottomGapSize = bottomGap?.size || 0;

  // Calculate max allowed height
  let maxHeight: number;
  if (maxHeightConstraint.automatic) {
    maxHeight = panel.height - topGapSize - bottomGapSize;
  } else {
    if (maxHeightConstraint.height === undefined) {
      return null; // Invalid constraint
    }
    maxHeight = maxHeightConstraint.height;
  }

  // Calculate used height (including spacing)
  const usedHeight = calculateTotalComponentHeight(
    panel,
    canvasComponents,
    componentLibrary,
    combinatorsLibrary,
    true // Include spacing
  );

  const available = Math.max(0, maxHeight - usedHeight);

  return { available, maxHeight, used: usedHeight };
}

/**
 * Validate if adding a component/combinator would violate maxComponentHeight constraint
 * Returns error message if violation, null if valid
 */
export function validateComponentHeight(
  panel: Panel,
  canvasComponents: CanvasComponent[],
  componentLibrary: Component[],
  combinatorsLibrary: Combinator[],
  rules: Rule[],
  newComponentHeight: number,
  isCombinator: boolean = false
): string | null {
  // Get panel rules - need to support width-based matching
  // For now, use simple ID matching (width-based matching should be done by caller)
  const panelRules = rules.filter(
    (rule) => rule.enabled !== false && rule.type === 'panel' && (!rule.panelId || rule.panelId === panel.id)
  );

  // Find maxComponentHeight constraint and collect all gap constraints
  let maxHeightConstraint: Constraint | null = null;
  const gapConstraints: Constraint[] = [];

  for (const rule of panelRules) {
    for (const constraint of rule.constraints) {
      if (constraint.type === 'maxComponentHeight') {
        maxHeightConstraint = constraint;
      } else if (constraint.type === 'gap') {
        gapConstraints.push(constraint);
      }
    }
  }

  if (!maxHeightConstraint) {
    return null; // No constraint, allow addition
  }

  // Calculate current total height (including spacing)
  const currentHeight = calculateTotalComponentHeight(
    panel,
    canvasComponents,
    componentLibrary,
    combinatorsLibrary,
    true // Include spacing
  );

  // Calculate spacing that will be added for the new component
  const spacing = 10;
  const panelComponents = canvasComponents.filter((cc) => cc.panelId === panel.id && cc.componentId !== 'gap');
  const spacingToAdd = panelComponents.length > 0 ? spacing : 0; // Add spacing if there are existing components

  // Calculate new total height (current + new component + spacing if needed)
  const newTotalHeight = currentHeight + newComponentHeight + spacingToAdd;

  // Get gap constraints
  const topGap = gapConstraints.find((c) => c.placement === 'top');
  const bottomGap = gapConstraints.find((c) => c.placement === 'bottom');
  const topGapSize = topGap?.size || 0;
  const bottomGapSize = bottomGap?.size || 0;

  // Calculate max allowed height
  let maxHeight: number;
  if (maxHeightConstraint.automatic) {
    maxHeight = panel.height - topGapSize - bottomGapSize;
  } else {
    if (maxHeightConstraint.height === undefined) {
      return 'Max component height constraint is invalid (height not specified)';
    }
    maxHeight = maxHeightConstraint.height;
  }

  // Check if new total height exceeds max
  if (newTotalHeight > maxHeight) {
    return (
      maxHeightConstraint.message ||
      `Adding this ${isCombinator ? 'combinator' : 'component'} would exceed maximum component height (${maxHeight.toFixed(1)}mm). Current: ${currentHeight.toFixed(1)}mm, After adding: ${newTotalHeight.toFixed(1)}mm`
    );
  }

  return null; // Valid
}

