import { Node, Edge } from '@xyflow/react';
import { Rule, Constraint, RuleCondition, Panel } from '@/types';

/**
 * Convert Rule[] to node graph format (Panel → Constraint → Condition)
 */
export function rulesToNodeGraph(
  rules: Rule[],
  panels: Panel[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeX = 0;
  let nodeY = 0;
  const nodeSpacing = { x: 300, y: 200 };

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

  // Create panel nodes and their connected rules
  rulesByPanel.forEach((panelRules, panelId) => {
    const panel = panels.find((p) => p.id === panelId);
    if (!panel) return;

    // Create panel node
    const panelNodeId = `panel-${panelId}`;
    const panelNode: Node = {
      id: panelNodeId,
      type: 'ruleNode',
      position: { x: nodeX, y: nodeY },
      data: {
        label: panel.name,
        panelId: panel.id,
        panel: panel,
      },
    };
    nodes.push(panelNode);
    nodeY += nodeSpacing.y;

    // For each rule, create constraint and condition nodes
    panelRules.forEach((rule) => {
      rule.constraints.forEach((constraint, constraintIndex) => {
        const constraintNodeId = `constraint-${rule.id}-${constraintIndex}`;
        const constraintNode: Node = {
          id: constraintNodeId,
          type: 'ruleNode',
          position: { x: nodeX + nodeSpacing.x, y: nodeY },
          data: {
            label: `Constraint ${constraintIndex + 1}`,
            constraint: constraint,
          },
        };
        nodes.push(constraintNode);

        // Connect constraint to panel
        edges.push({
          id: `edge-${panelNodeId}-${constraintNodeId}`,
          source: panelNodeId,
          target: constraintNodeId,
        });

        // Add condition nodes connected to constraint
        rule.conditions.forEach((condition, conditionIndex) => {
          const conditionNodeId = `condition-${rule.id}-${constraintIndex}-${conditionIndex}`;
          const conditionNode: Node = {
            id: conditionNodeId,
            type: 'ruleNode',
            position: { x: nodeX + nodeSpacing.x * 2, y: nodeY + conditionIndex * 80 },
            data: {
              label: `Condition ${conditionIndex + 1}`,
              condition: condition,
            },
          };
          nodes.push(conditionNode);

          // Connect condition to constraint
          edges.push({
            id: `edge-${constraintNodeId}-${conditionNodeId}`,
            source: constraintNodeId,
            target: conditionNodeId,
          });
        });

        nodeY += Math.max(rule.conditions.length * 80, 100);
      });
    });

    nodeX += nodeSpacing.x * 3;
    nodeY = 0;
  });

  // Handle global rules (create a special "Global" panel node)
  if (globalRules.length > 0) {
    const globalPanelNodeId = 'panel-global';
    const globalPanelNode: Node = {
      id: globalPanelNodeId,
      type: 'ruleNode',
      position: { x: nodeX, y: nodeY },
      data: {
        label: 'Global Rules',
        panelId: 'global',
      },
    };
    nodes.push(globalPanelNode);
    nodeY += nodeSpacing.y;

    globalRules.forEach((rule) => {
      rule.constraints.forEach((constraint, constraintIndex) => {
        const constraintNodeId = `constraint-${rule.id}-${constraintIndex}`;
        const constraintNode: Node = {
          id: constraintNodeId,
          type: 'ruleNode',
          position: { x: nodeX + nodeSpacing.x, y: nodeY },
          data: {
            label: `Constraint ${constraintIndex + 1}`,
            constraint: constraint,
          },
        };
        nodes.push(constraintNode);

        edges.push({
          id: `edge-${globalPanelNodeId}-${constraintNodeId}`,
          source: globalPanelNodeId,
          target: constraintNodeId,
        });

        rule.conditions.forEach((condition, conditionIndex) => {
          const conditionNodeId = `condition-${rule.id}-${constraintIndex}-${conditionIndex}`;
          const conditionNode: Node = {
            id: conditionNodeId,
            type: 'ruleNode',
            position: { x: nodeX + nodeSpacing.x * 2, y: nodeY + conditionIndex * 80 },
            data: {
              label: `Condition ${conditionIndex + 1}`,
              condition: condition,
            },
          };
          nodes.push(conditionNode);

          edges.push({
            id: `edge-${constraintNodeId}-${conditionNodeId}`,
            source: constraintNodeId,
            target: conditionNodeId,
          });
        });

        nodeY += Math.max(rule.conditions.length * 80, 100);
      });
    });
  }

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

