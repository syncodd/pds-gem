import {
  Rule,
  RuleViolation,
  Panel,
  CanvasComponent,
  Component,
  Constraint,
} from '@/types';
import {
  checkOverlaps,
  getOutOfBoundsComponents,
  checkSpacing,
  getComponentBounds,
  checkIntersectsWithPanelBounds,
} from './collisionDetection';

/**
 * Evaluate all rules against the current design (multi-panel support)
 */
export function evaluateRules(
  rules: Rule[],
  panels: Panel[],
  canvasComponents: CanvasComponent[],
  componentLibrary: Component[]
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
        componentLibrary
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
        componentLibrary
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
        componentLibrary
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
  componentLibrary: Component[]
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

  // Evaluate constraints
  for (const constraint of rule.constraints) {
    const constraintViolations = checkConstraint(
      constraint,
      rule,
      panel,
      panels,
      panelComponents,
      componentLibrary
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
  componentLibrary: Component[]
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
  }

  return violations;
}

