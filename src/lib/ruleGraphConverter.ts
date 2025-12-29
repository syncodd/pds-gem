import { Node, Edge } from '@xyflow/react';
import { Rule, Constraint, RuleCondition, Panel } from '@/types';

/**
 * Convert Rule[] to node graph format (Panel → Constraint → Condition)
 * Layout: All panel nodes at top (same y level), constraints evenly spaced below
 */
export function rulesToNodeGraph(
  rules: Rule[],
  panels: Panel[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  const nodeSpacing = { x: 350, y: 150 };
  const topRowY = 0; // All panels at top
  const constraintRowY = 200; // Constraints below panels
  const conditionRowY = 400; // Conditions below constraints
  const logicRowY = 600; // Logical operators below conditions

  // Group rules by panel (for panel-specific rules) or global
  const rulesByPanel = new Map<string, Rule[]>();
  const globalRules: Rule[] = [];

  rules.forEach((rule) => {
    if (rule.type === 'panel' && rule.panelId) {
      if (!rulesByPanel.has(rule.panelId)) {
        rulesByPanel.set(rule.panelId, []);
      }
      rulesByPanel.get(rule.panelId)!.push(rule);
    } else {
      globalRules.push(rule);
    }
  });

  // Node dimensions (from CustomRuleNode: min-w-[200px] max-w-[280px])
  const constraintNodeWidth = 280; // Use max width to ensure no overlap
  const constraintNodePadding = 50; // Padding between nodes
  const constraintSpacing = constraintNodeWidth + constraintNodePadding; // 330px total spacing

  // Step 1: Calculate panel positions based on constraint requirements
  // First, count constraints per panel to determine required spacing
  const constraintsPerPanel = new Map<string, number>();
  rulesByPanel.forEach((panelRules, panelId) => {
    let constraintCount = 0;
    panelRules.forEach((rule) => {
      constraintCount += rule.constraints.length;
    });
    constraintsPerPanel.set(panelId, constraintCount);
  });

  if (globalRules.length > 0) {
    let globalConstraintCount = 0;
    globalRules.forEach((rule) => {
      globalConstraintCount += rule.constraints.length;
    });
    constraintsPerPanel.set('global', globalConstraintCount);
  }

  // Calculate required width for each panel's constraints
  const panelRequiredWidths = new Map<string, number>();
  constraintsPerPanel.forEach((count, panelId) => {
    if (count === 0) {
      panelRequiredWidths.set(panelId, constraintSpacing); // Minimum width for panel itself
    } else if (count === 1) {
      panelRequiredWidths.set(panelId, constraintSpacing); // Single constraint needs one spacing
    } else {
      // Multiple constraints: need (count - 1) * spacing + node width
      panelRequiredWidths.set(panelId, (count - 1) * constraintSpacing + constraintNodeWidth);
    }
  });

  // Step 2: Create all panel nodes at the top row with proper spacing
  const panelNodes: Node[] = [];
  const panelNodeMap = new Map<string, Node>();
  const panelPositions = new Map<string, number>();
  let panelX = 0;
  const minPanelSpacing = 400; // Minimum spacing between panel columns

  rulesByPanel.forEach((panelRules, panelId) => {
    const panel = panels.find((p) => p.id === panelId);
    if (!panel) return;

    const panelNodeId = `panel-${panelId}`;
    const panelNode: Node = {
      id: panelNodeId,
      type: 'ruleNode',
      position: { x: panelX, y: topRowY },
      data: {
        label: panel.name,
        panelId: panel.id,
        panel: panel,
      },
    };
    panelNodes.push(panelNode);
    panelNodeMap.set(panelId, panelNode);
    panelPositions.set(panelId, panelX);
    
    // Move to next panel position: use max of required width and minimum spacing
    const requiredWidth = panelRequiredWidths.get(panelId) || constraintSpacing;
    panelX += Math.max(requiredWidth, minPanelSpacing);
  });

  // Add global panel node if needed
  if (globalRules.length > 0) {
    const globalPanelNodeId = 'panel-global';
    const globalPanelNode: Node = {
      id: globalPanelNodeId,
      type: 'ruleNode',
      position: { x: panelX, y: topRowY },
      data: {
        label: 'Global Rules',
        panelId: 'global',
      },
    };
    panelNodes.push(globalPanelNode);
    panelNodeMap.set('global', globalPanelNode);
    panelPositions.set('global', panelX);
  }

  nodes.push(...panelNodes);

  // Step 3: Create constraint nodes below panels, evenly spaced
  const constraintNodes: Node[] = [];
  const constraintNodeMap = new Map<string, { node: Node; panelId: string }>();

  // Create constraint nodes for each panel
  rulesByPanel.forEach((panelRules, panelId) => {
    const panelX = panelPositions.get(panelId) || 0;
    const constraintCount = constraintsPerPanel.get(panelId) || 0;
    
    if (constraintCount === 0) return;

    // Calculate constraint positions: center them around the panel's X position
    // Ensure they stay within the panel's allocated space
    let constraintX: number;
    if (constraintCount === 1) {
      // Single constraint: place directly below panel
      constraintX = panelX;
    } else {
      // Multiple constraints: center them around panel X position
      const totalWidth = (constraintCount - 1) * constraintSpacing;
      constraintX = panelX - totalWidth / 2;
    }

    panelRules.forEach((rule) => {
      rule.constraints.forEach((constraint, constraintIndex) => {
        const constraintNodeId = `constraint-${rule.id}-${constraintIndex}`;
        const constraintNode: Node = {
          id: constraintNodeId,
          type: 'ruleNode',
          position: { x: constraintX, y: constraintRowY },
          data: {
            label: `Constraint ${constraintIndex + 1}`,
            constraint: constraint,
          },
        };
        constraintNodes.push(constraintNode);
        constraintNodeMap.set(constraintNodeId, { node: constraintNode, panelId });

        // Connect constraint to panel
        const panelNode = panelNodeMap.get(panelId);
        if (panelNode) {
          edges.push({
            id: `edge-${panelNode.id}-${constraintNodeId}`,
            source: panelNode.id,
            target: constraintNodeId,
          });
        }

        // Move to next constraint position
        constraintX += constraintSpacing;
      });
    });
  });

  // Handle global rules constraints
  if (globalRules.length > 0) {
    const globalPanelX = panelPositions.get('global') || 0;
    const globalConstraintCount = constraintsPerPanel.get('global') || 0;
    
    if (globalConstraintCount > 0) {
      let constraintX: number;
      if (globalConstraintCount === 1) {
        constraintX = globalPanelX;
      } else {
        const totalWidth = (globalConstraintCount - 1) * constraintSpacing;
        constraintX = globalPanelX - totalWidth / 2;
      }

      globalRules.forEach((rule) => {
        rule.constraints.forEach((constraint, constraintIndex) => {
          const constraintNodeId = `constraint-${rule.id}-${constraintIndex}`;
          const constraintNode: Node = {
            id: constraintNodeId,
            type: 'ruleNode',
            position: { x: constraintX, y: constraintRowY },
            data: {
              label: `Constraint ${constraintIndex + 1}`,
              constraint: constraint,
            },
          };
          constraintNodes.push(constraintNode);
          constraintNodeMap.set(constraintNodeId, { node: constraintNode, panelId: 'global' });

          const globalPanelNode = panelNodeMap.get('global');
          if (globalPanelNode) {
            edges.push({
              id: `edge-${globalPanelNode.id}-${constraintNodeId}`,
              source: globalPanelNode.id,
              target: constraintNodeId,
            });
          }

          constraintX += constraintSpacing;
        });
      });
    }
  }

  nodes.push(...constraintNodes);

  // Step 3: Create condition and logical operator nodes below constraints
  // We need to track which constraints have conditions and how they're connected
  const constraintToRuleMap = new Map<string, { rule: Rule; constraintIndex: number; panelId: string }>();
  
  // Build map of constraints to their rules
  rulesByPanel.forEach((panelRules, panelId) => {
    panelRules.forEach((rule) => {
      rule.constraints.forEach((constraint, constraintIndex) => {
        const constraintNodeId = `constraint-${rule.id}-${constraintIndex}`;
        constraintToRuleMap.set(constraintNodeId, { rule, constraintIndex, panelId });
      });
    });
  });

  globalRules.forEach((rule) => {
    rule.constraints.forEach((constraint, constraintIndex) => {
      const constraintNodeId = `constraint-${rule.id}-${constraintIndex}`;
      constraintToRuleMap.set(constraintNodeId, { rule, constraintIndex, panelId: 'global' });
    });
  });

  const conditionNodes: Node[] = [];
  const logicNodes: Node[] = [];
  const logicNodeMap = new Map<string, Node>();
  
  constraintNodes.forEach((constraintNode) => {
    const constraintInfo = constraintToRuleMap.get(constraintNode.id);
    if (!constraintInfo) return;

    const { rule, constraintIndex } = constraintInfo;
    const conditions = rule.conditions;
    if (conditions.length === 0) return;

    const conditionSpacing = 180;
    const constraintX = constraintNode.position.x;

    if (conditions.length === 1) {
      // Single condition - place directly below constraint
      const condition = conditions[0];
      const conditionNodeId = `condition-${rule.id}-${constraintIndex}-0`;
      const conditionNode: Node = {
        id: conditionNodeId,
        type: 'ruleNode',
        position: { x: constraintX, y: conditionRowY },
        data: {
          label: `Condition`,
          condition: condition,
        },
      };
      conditionNodes.push(conditionNode);

      edges.push({
        id: `edge-${constraintNode.id}-${conditionNodeId}`,
        source: constraintNode.id,
        target: conditionNodeId,
      });
    } else {
      // Multiple conditions - need logic node
      const logicNodeId = `logical-${rule.id}-${constraintIndex}`;
      
      // Check if logic node already exists (multiple constraints might share conditions)
      let logicNode = logicNodeMap.get(logicNodeId);
      if (!logicNode) {
        logicNode = {
          id: logicNodeId,
          type: 'ruleNode',
          position: { x: constraintX, y: conditionRowY },
          data: {
            label: 'AND',
            logicalOperator: 'and',
          },
        };
        logicNodes.push(logicNode);
        logicNodeMap.set(logicNodeId, logicNode);
      }

      // Connect constraint to logic node (if not already connected)
      const existingEdge = edges.find(e => e.source === constraintNode.id && e.target === logicNodeId);
      if (!existingEdge) {
        edges.push({
          id: `edge-${constraintNode.id}-${logicNodeId}`,
          source: constraintNode.id,
          target: logicNodeId,
        });
      }

      // Place conditions below logic node, evenly spaced
      conditions.forEach((condition, conditionIndex) => {
        const conditionNodeId = `condition-${rule.id}-${constraintIndex}-${conditionIndex}`;
        
        // Check if condition node already exists
        const existingCondition = conditionNodes.find(n => n.id === conditionNodeId);
        if (existingCondition) return;

        const conditionNode: Node = {
          id: conditionNodeId,
          type: 'ruleNode',
          position: { 
            x: constraintX + (conditionIndex - (conditions.length - 1) / 2) * conditionSpacing, 
            y: logicRowY 
          },
          data: {
            label: `Condition ${conditionIndex + 1}`,
            condition: condition,
          },
        };
        conditionNodes.push(conditionNode);

        // Connect condition to logic node (if not already connected)
        const existingConditionEdge = edges.find(e => e.source === logicNodeId && e.target === conditionNodeId);
        if (!existingConditionEdge) {
          edges.push({
            id: `edge-${logicNodeId}-${conditionNodeId}`,
            source: logicNodeId,
            target: conditionNodeId,
          });
        }
      });
    }
  });

  nodes.push(...logicNodes);
  nodes.push(...conditionNodes);

  return { nodes, edges };
}

/**
 * Convert node graph back to Rule[] format
 */
export function nodeGraphToRules(
  nodes: Node[],
  edges: Edge[],
  panels: Panel[]
): Rule[] {
  const rules: Rule[] = [];
  const ruleMap = new Map<string, Rule>();

  // Find all panel nodes
  const panelNodes = nodes.filter((n) => n.data.panelId || n.data.panel);
  const globalPanelNode = nodes.find((n) => n.data.panelId === 'global');

  // Process each panel node
  panelNodes.forEach((panelNode) => {
    const panelId = panelNode.data.panelId;
    if (panelId === 'global') return; // Handle global separately

    // Find constraints connected to this panel
    const constraintEdges = edges.filter((e) => e.source === panelNode.id);
    const constraintNodes = constraintEdges
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n): n is Node => n !== undefined && n.data.constraint !== undefined);

    constraintNodes.forEach((constraintNode) => {
      const constraint = constraintNode.data.constraint as Constraint;
      if (!constraint) return;

      // Find conditions connected to this constraint
      const conditionEdges = edges.filter((e) => e.source === constraintNode.id);
      const conditionNodes = conditionEdges
        .map((e) => nodes.find((n) => n.id === e.target))
        .filter((n): n is Node => n !== undefined && n.data.condition !== undefined);

      const conditions = conditionNodes.map((n) => n.data.condition as RuleCondition);

      // Create or update rule
      const ruleId = `rule-${panelId}-${constraintNode.id}`;
      if (!ruleMap.has(ruleId)) {
        const rule: Rule = {
          id: ruleId,
          name: `Rule for ${panelNode.data.label || panelId}`,
          type: 'panel',
          panelId: panelId,
          conditions: [],
          constraints: [],
          enabled: true,
        };
        ruleMap.set(ruleId, rule);
      }

      const rule = ruleMap.get(ruleId)!;
      rule.constraints.push(constraint);
      rule.conditions.push(...conditions);
    });
  });

  // Process global panel node
  if (globalPanelNode) {
    const constraintEdges = edges.filter((e) => e.source === globalPanelNode.id);
    const constraintNodes = constraintEdges
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n): n is Node => n !== undefined && n.data.constraint !== undefined);

    constraintNodes.forEach((constraintNode) => {
      const constraint = constraintNode.data.constraint as Constraint;
      if (!constraint) return;

      const conditionEdges = edges.filter((e) => e.source === constraintNode.id);
      const conditionNodes = conditionEdges
        .map((e) => nodes.find((n) => n.id === e.target))
        .filter((n): n is Node => n !== undefined && n.data.condition !== undefined);

      const conditions = conditionNodes.map((n) => n.data.condition as RuleCondition);

      const ruleId = `rule-global-${constraintNode.id}`;
      if (!ruleMap.has(ruleId)) {
        const rule: Rule = {
          id: ruleId,
          name: `Global Rule`,
          type: 'global',
          conditions: [],
          constraints: [],
          enabled: true,
        };
        ruleMap.set(ruleId, rule);
      }

      const rule = ruleMap.get(ruleId)!;
      rule.constraints.push(constraint);
      rule.conditions.push(...conditions);
    });
  }

  return Array.from(ruleMap.values());
}

