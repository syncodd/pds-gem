'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Background,
  Controls,
  MiniMap,
  NodeTypes,
  useReactFlow,
  ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Rule, Constraint, RuleCondition, Panel } from '@/types';
import { usePanelStore } from '@/lib/store';
import { storage } from '@/lib/storage';
import RuleNodeEditor from './RuleNodeEditor';
import CustomRuleNode from './CustomRuleNode';
import { rulesToNodeGraph, nodeGraphToRules } from '@/lib/ruleGraphConverter';

const nodeTypes: NodeTypes = {
  ruleNode: CustomRuleNode,
};

export default function RuleFlow() {
  const { rules, setRules, addRule, updateRule, deleteRule, panelsLibrary, componentLibrary, combinatorsLibrary } =
    usePanelStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const connectionStartRef = useRef<{ nodeId: string; nodeType: string } | null>(null);
  
  // Change tracking for save system
  const [originalNodes, setOriginalNodes] = useState<Node[]>([]);
  const [originalEdges, setOriginalEdges] = useState<Edge[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const applyRulesToGraph = useCallback(
    (incomingRules: Rule[]) => {
      const { nodes: graphNodes, edges: graphEdges } = rulesToNodeGraph(incomingRules, panelsLibrary);
      setNodes(graphNodes);
      setEdges(graphEdges);
      // Set original state when loading rules
      setOriginalNodes(graphNodes);
      setOriginalEdges(graphEdges);
      setHasChanges(false);
    },
    [panelsLibrary, setNodes, setEdges]
  );

  // Convert rules to node graph when rules or panels change
  useEffect(() => {
    applyRulesToGraph(rules);
  }, [rules, panelsLibrary, applyRulesToGraph]);

  // Track changes by comparing current nodes/edges with original
  useEffect(() => {
    const nodesChanged = JSON.stringify(nodes) !== JSON.stringify(originalNodes);
    const edgesChanged = JSON.stringify(edges) !== JSON.stringify(originalEdges);
    setHasChanges(nodesChanged || edgesChanged);
  }, [nodes, edges, originalNodes, originalEdges]);

  const onConnectStart = useCallback(
    (_event: React.MouseEvent | React.TouchEvent, params: { nodeId: string | null; handleType: string | null }) => {
      if (!params.nodeId) return;
      
      const sourceNode = nodes.find((n) => n.id === params.nodeId);
      if (!sourceNode) return;

      const sourceType = sourceNode.data.panelId ? 'panel' : 
                        sourceNode.data.combinatorId ? 'combinator' :
                        sourceNode.data.constraint ? 'constraint' : 
                        sourceNode.data.condition ? 'condition' :
                        sourceNode.data.logicalOperator ? 'logical' : 'unknown';
      
      // Only track panel, combinator, constraint, condition, and logical nodes (they can create new nodes)
      if (sourceType === 'panel' || sourceType === 'combinator' || sourceType === 'constraint' || sourceType === 'condition' || sourceType === 'logical') {
        connectionStartRef.current = {
          nodeId: params.nodeId,
          nodeType: sourceType,
        };
      }
    },
    [nodes]
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectionStartRef.current || !reactFlowInstance) {
        return;
      }

      const { nodeId, nodeType } = connectionStartRef.current;
      
      // Check if the event target is the ReactFlow pane (empty space)
      const target = event.target as HTMLElement;
      const isPane = target?.classList?.contains('react-flow__pane') || 
                    target?.closest('.react-flow__pane') !== null;
      
      // If not pane, connection likely ended on a node (onConnect will handle it)
      if (!isPane) {
        // Reset after a short delay to allow onConnect to clear it first
        setTimeout(() => {
          if (connectionStartRef.current?.nodeId === nodeId) {
            connectionStartRef.current = null;
          }
        }, 50);
        return;
      }

      // Connection ended in empty space - create new node
      connectionStartRef.current = null;

      // Get the position where connection ended
      const clientX = (event as MouseEvent).clientX ?? (event as TouchEvent).touches?.[0]?.clientX ?? 0;
      const clientY = (event as MouseEvent).clientY ?? (event as TouchEvent).touches?.[0]?.clientY ?? 0;
      
      const position = reactFlowInstance.screenToFlowPosition({
        x: clientX,
        y: clientY,
      });

      const sourceNode = nodes.find((n) => n.id === nodeId);
      if (!sourceNode) return;

      if (nodeType === 'panel' || nodeType === 'combinator') {
        // Create constraint node
        const constraintNodeId = `constraint-${Date.now()}`;
        const newConstraint: Constraint = {
          type: 'panelSizeMapping',
          message: '',
        };

        const newNode: Node = {
          id: constraintNodeId,
          type: 'ruleNode',
          position: position,
          data: {
            label: 'New Constraint',
            constraint: newConstraint,
          },
        };

        setNodes((nds) => [...nds, newNode]);
        setEdges((eds) => [
          ...eds,
          {
            id: `edge-${nodeId}-${constraintNodeId}`,
            source: nodeId,
            target: constraintNodeId,
          },
        ]);
      } else if (nodeType === 'constraint') {
        // When dragging from constraint, create condition (logic will be auto-added if needed)
        const conditionNodeId = `condition-${Date.now()}`;
        const newCondition: RuleCondition = {
          field: 'componentCount',
          operator: 'greaterThan',
          value: 0,
        };

        const newNode: Node = {
          id: conditionNodeId,
          type: 'ruleNode',
          position: position,
          data: {
            label: 'New Condition',
            condition: newCondition,
          },
        };

        setNodes((nds) => [...nds, newNode]);
        
        // Check if we need to insert a logic node
        const existingConditionEdges = edges.filter((e) => e.source === nodeId && 
          nodes.find((n) => n.id === e.target)?.data.condition);
        
        if (existingConditionEdges.length > 0) {
          // Need to create/use logic node
          const existingLogicEdges = edges.filter((e) => e.source === nodeId &&
            nodes.find((n) => n.id === e.target)?.data.logicalOperator);
          
          if (existingLogicEdges.length === 0) {
            // Create logic node
            const logicNodeId = `logical-${Date.now()}`;
            const logicNode: Node = {
              id: logicNodeId,
              type: 'ruleNode',
              position: {
                x: sourceNode.position.x + 300,
                y: sourceNode.position.y,
              },
              data: {
                label: 'AND',
                logicalOperator: 'and',
              },
            };
            
            setNodes((nds) => [...nds, logicNode]);
            
            // Connect constraint to logic
            setEdges((eds) => [
              ...eds,
              {
                id: `edge-${nodeId}-${logicNodeId}`,
                source: nodeId,
                target: logicNodeId,
              },
            ]);
            
            // Move existing conditions to logic
            existingConditionEdges.forEach((edge) => {
              setEdges((eds) => {
                const filtered = eds.filter((e) => e.id !== edge.id);
                return [
                  ...filtered,
                  {
                    ...edge,
                    source: logicNodeId,
                  },
                ];
              });
            });
            
            // Connect new condition to logic
            setEdges((eds) => [
              ...eds,
              {
                id: `edge-${logicNodeId}-${conditionNodeId}`,
                source: logicNodeId,
                target: conditionNodeId,
              },
            ]);
          } else {
            // Use existing logic node
            const logicNode = nodes.find((n) => n.id === existingLogicEdges[0].target);
            if (logicNode) {
              setEdges((eds) => [
                ...eds,
                {
                  id: `edge-${logicNode.id}-${conditionNodeId}`,
                  source: logicNode.id,
                  target: conditionNodeId,
                },
              ]);
            }
          }
        } else {
          // First condition - connect directly
          setEdges((eds) => [
            ...eds,
            {
              id: `edge-${nodeId}-${conditionNodeId}`,
              source: nodeId,
              target: conditionNodeId,
            },
          ]);
        }
      } else if (nodeType === 'condition' || nodeType === 'logical') {
        // Create logical operator node (default to AND)
        const logicalNodeId = `logical-${Date.now()}`;
        const newNode: Node = {
          id: logicalNodeId,
          type: 'ruleNode',
          position: position,
          data: {
            label: 'AND',
            logicalOperator: 'and',
          },
        };

        setNodes((nds) => [...nds, newNode]);
        setEdges((eds) => [
          ...eds,
          {
            id: `edge-${nodeId}-${logicalNodeId}`,
            source: nodeId,
            target: logicalNodeId,
          },
        ]);
      }
    },
    [nodes, edges, setNodes, setEdges, reactFlowInstance]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Clear connection start ref since connection succeeded
      connectionStartRef.current = null;

      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      const sourceType = sourceNode.data.panelId ? 'panel' : 
                        sourceNode.data.combinatorId ? 'combinator' :
                        sourceNode.data.constraint ? 'constraint' : 
                        sourceNode.data.condition ? 'condition' :
                        sourceNode.data.logicalOperator ? 'logical' : 'unknown';
      const targetType = targetNode.data.panelId ? 'panel' : 
                        targetNode.data.combinatorId ? 'combinator' :
                        targetNode.data.constraint ? 'constraint' : 
                        targetNode.data.condition ? 'condition' :
                        targetNode.data.logicalOperator ? 'logical' : 'unknown';

      // Handle constraint → condition: auto-insert logic node if multiple conditions
      if (sourceType === 'constraint' && targetType === 'condition') {
        // Check how many conditions are already connected to this constraint
        const existingConditionEdges = edges.filter((e) => e.source === sourceNode.id && 
          nodes.find((n) => n.id === e.target)?.data.condition);
        
        if (existingConditionEdges.length === 0) {
          // First condition - connect directly
          setEdges((eds) => addEdge(params, eds));
        } else {
          // Multiple conditions - need to insert logic node
          // Check if there's already a logic node connected to this constraint
          const existingLogicEdges = edges.filter((e) => e.source === sourceNode.id &&
            nodes.find((n) => n.id === e.target)?.data.logicalOperator);
          
          let logicNode: Node | null = null;
          
          if (existingLogicEdges.length === 0) {
            // Create new logic node
            const logicNodeId = `logical-${Date.now()}`;
            const constraintPos = sourceNode.position;
            
            logicNode = {
              id: logicNodeId,
              type: 'ruleNode',
              position: {
                x: constraintPos.x + 300,
                y: constraintPos.y,
              },
              data: {
                label: 'AND',
                logicalOperator: 'and',
              },
            };
            
            setNodes((nds) => [...nds, logicNode!]);
            
            // Connect constraint to logic node
            setEdges((eds) => [
              ...eds,
              {
                id: `edge-${sourceNode.id}-${logicNodeId}`,
                source: sourceNode.id,
                target: logicNodeId,
              },
            ]);
            
            // Move existing condition connections to connect to logic node instead
            existingConditionEdges.forEach((edge) => {
              setEdges((eds) => [
                ...eds.filter((e) => e.id !== edge.id),
                {
                  ...edge,
                  source: logicNodeId,
                },
              ]);
            });
          } else {
            // Use existing logic node
            logicNode = nodes.find((n) => n.id === existingLogicEdges[0].target) || null;
          }
          
          // Connect new condition to logic node
          if (logicNode) {
            setEdges((eds) => [
              ...eds,
              {
                id: `edge-${logicNode.id}-${targetNode.id}`,
                source: logicNode.id,
                target: targetNode.id,
              },
            ]);
          }
        }
        return;
      }

      // Allow: panel → constraint, combinator → constraint, condition → logical, logical → logical, logical → condition
      if (
        ((sourceType === 'panel' || sourceType === 'combinator') && targetType === 'constraint') ||
        (sourceType === 'condition' && targetType === 'logical') ||
        (sourceType === 'logical' && targetType === 'logical') ||
        (sourceType === 'logical' && targetType === 'condition')
      ) {
        setEdges((eds) => addEdge(params, eds));
      }
    },
    [nodes, edges, setNodes, setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleSave = () => {
    if (!hasChanges) return;

    // Convert to rules and save
    const newRules = nodeGraphToRules(nodes, edges, panelsLibrary);
    
    // Update rules in store
    newRules.forEach((rule) => {
      const existingRule = rules.find((r) => r.id === rule.id);
      if (existingRule) {
        updateRule(rule.id, rule);
      } else {
        addRule(rule);
      }
    });

    // Remove rules that are no longer in the graph
    const ruleIds = new Set(newRules.map((r) => r.id));
    rules.forEach((rule) => {
      if (!ruleIds.has(rule.id)) {
        deleteRule(rule.id);
      }
    });

    // Update original state to mark as saved
    setOriginalNodes([...nodes]);
    setOriginalEdges([...edges]);
    setHasChanges(false);
  };

  const handleDeleteNode = (nodeId: string) => {
    // Only remove the specific node and its direct edges (don't cascade delete)
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    
    // Clear selection if deleted node was selected
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
    }
    // Don't save immediately - let user click Save button
  };

  const handleAddPanel = () => {
    if (panelsLibrary.length === 0) {
      alert('No panels available. Please add panels first.');
      return;
    }

    // Allow selecting a panel from a dropdown or use first panel if only one
    // For now, we'll allow adding multiple instances of any panel
    // User can change the panel selection in the properties panel after adding
    const panel = panelsLibrary[0];
    const panelNodeId = `panel-${panel.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate position to avoid overlap
    const existingPanelNodes = nodes.filter((n) => n.data.panelId || n.data.panel);
    const baseX = existingPanelNodes.length * 250;
    const baseY = existingPanelNodes.length * 150;
    
    const newNode: Node = {
      id: panelNodeId,
      type: 'ruleNode',
      position: { x: baseX, y: baseY },
      data: {
        label: panel.name,
        panelId: panel.id,
        panel: panel,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const handleAddCombinator = () => {
    if (combinatorsLibrary.length === 0) {
      alert('No combinators available. Please add combinators first.');
      return;
    }

    // For now, add the first combinator. In a full implementation, you'd show a dialog to select a combinator
    const combinator = combinatorsLibrary[0];
    const combinatorNodeId = `combinator-${combinator.id}-${Date.now()}`;
    
    const newNode: Node = {
      id: combinatorNodeId,
      type: 'ruleNode',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: combinator.name,
        combinatorId: combinator.id,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const handleAddConstraint = () => {
    // Find a panel node to connect to (use selected node or first panel node)
    const panelNode = selectedNode?.data.panelId 
      ? selectedNode 
      : nodes.find((n) => n.data.panelId || n.data.panel);
    
    if (!panelNode) {
      alert('Please add a panel node first.');
      return;
    }

    const constraintNodeId = `constraint-${Date.now()}`;
    const newConstraint: Constraint = {
      type: 'panelSizeMapping',
      message: '',
    };

    // Calculate position - find a good spot to the right of the panel
    const existingConstraints = edges
      .filter((e) => e.source === panelNode.id)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n): n is Node => n !== undefined);
    
    const baseX = panelNode.position.x + 300;
    const baseY = panelNode.position.y;
    const yOffset = existingConstraints.length * 120;

    const newNode: Node = {
      id: constraintNodeId,
      type: 'ruleNode',
      position: {
        x: baseX,
        y: baseY + yOffset,
      },
      data: {
        label: 'New Constraint',
        constraint: newConstraint,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    
    // Auto-connect to panel node
    setEdges((eds) => [
      ...eds,
      {
        id: `edge-${panelNode.id}-${constraintNodeId}`,
        source: panelNode.id,
        target: constraintNodeId,
      },
    ]);

    // Select the new node
    setSelectedNode(newNode);
  };

  const handleAddCondition = () => {
    // Find a constraint node to connect to (use selected node or first constraint node)
    const constraintNode = selectedNode?.data.constraint
      ? selectedNode
      : nodes.find((n) => n.data.constraint);
    
    if (!constraintNode) {
      alert('Please add a constraint node first.');
      return;
    }

    const conditionNodeId = `condition-${Date.now()}`;
    const newCondition: RuleCondition = {
      field: 'componentCount',
      operator: 'greaterThan',
      value: 0,
    };

    // Check if there are already conditions connected to this constraint
    const existingConditionEdges = edges.filter((e) => e.source === constraintNode.id && 
      nodes.find((n) => n.id === e.target)?.data.condition);
    
    let targetSourceId = constraintNode.id;
    let baseX = constraintNode.position.x + 300;
    let baseY = constraintNode.position.y;
    
    // If there are existing conditions, we need to use/create a logic node
    if (existingConditionEdges.length > 0) {
      // Check if there's already a logic node
      const existingLogicEdges = edges.filter((e) => e.source === constraintNode.id &&
        nodes.find((n) => n.id === e.target)?.data.logicalOperator);
      
      if (existingLogicEdges.length === 0) {
        // Create logic node
        const logicNodeId = `logical-${Date.now()}`;
        const logicNode: Node = {
          id: logicNodeId,
          type: 'ruleNode',
          position: {
            x: baseX,
            y: baseY,
          },
          data: {
            label: 'AND',
            logicalOperator: 'and',
          },
        };
        
        setNodes((nds) => [...nds, logicNode]);
        
        // Connect constraint to logic node
        setEdges((eds) => [
          ...eds,
          {
            id: `edge-${constraintNode.id}-${logicNodeId}`,
            source: constraintNode.id,
            target: logicNodeId,
          },
        ]);
        
        // Move existing condition connections to logic node
        existingConditionEdges.forEach((edge) => {
          setEdges((eds) => [
            ...eds.filter((e) => e.id !== edge.id),
            {
              ...edge,
              source: logicNodeId,
            },
          ]);
        });
        
        targetSourceId = logicNodeId;
        baseX = logicNode.position.x + 300;
      } else {
        // Use existing logic node
        const logicNode = nodes.find((n) => n.id === existingLogicEdges[0].target);
        if (logicNode) {
          targetSourceId = logicNode.id;
          baseX = logicNode.position.x + 300;
          baseY = logicNode.position.y;
        }
      }
    }

    // Calculate position for new condition
    const existingConditionsFromSource = edges
      .filter((e) => e.source === targetSourceId)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n): n is Node => n !== undefined && n.data.condition !== undefined);
    
    const yOffset = existingConditionsFromSource.length * 100;

    const newNode: Node = {
      id: conditionNodeId,
      type: 'ruleNode',
      position: {
        x: baseX,
        y: baseY + yOffset,
      },
      data: {
        label: 'New Condition',
        condition: newCondition,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    
    // Auto-connect to source (constraint or logic node)
    setEdges((eds) => [
      ...eds,
      {
        id: `edge-${targetSourceId}-${conditionNodeId}`,
        source: targetSourceId,
        target: conditionNodeId,
      },
    ]);

    // Select the new node
    setSelectedNode(newNode);
  };

  const handleAddLogicalOperator = (operator: 'and' | 'or' = 'and') => {
    // Find a condition or logic node to connect to (use selected node or first available)
    const sourceNode = selectedNode?.data.condition || selectedNode?.data.logicalOperator
      ? selectedNode
      : nodes.find((n) => n.data.condition || n.data.logicalOperator);
    
    if (!sourceNode) {
      alert('Please add a condition or logic node first.');
      return;
    }

    const logicalNodeId = `logical-${Date.now()}`;
    
    // Calculate position - find a good spot to the right of the source
    const existingLogical = edges
      .filter((e) => e.source === sourceNode.id)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n): n is Node => n !== undefined && n.data.logicalOperator !== undefined);
    
    const baseX = sourceNode.position.x + 300;
    const baseY = sourceNode.position.y;
    const yOffset = existingLogical.length * 100;

    const newNode: Node = {
      id: logicalNodeId,
      type: 'ruleNode',
      position: {
        x: baseX,
        y: baseY + yOffset,
      },
      data: {
        label: operator.toUpperCase(),
        logicalOperator: operator,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    
    // Auto-connect to source node
    setEdges((eds) => [
      ...eds,
      {
        id: `edge-${sourceNode.id}-${logicalNodeId}`,
        source: sourceNode.id,
        target: logicalNodeId,
      },
    ]);

    // Select the new node
    setSelectedNode(newNode);
  };

  const handleLoadRulesFromBrowser = () => {
    const saved = storage.loadRules();
    if (!saved || saved.length === 0) {
      alert('No saved rules found in browser storage.');
      return;
    }
    setRules(saved);
    applyRulesToGraph(saved);
    alert('Rules loaded from browser storage.');
  };

  const handleExportRules = () => {
    const newRules = nodeGraphToRules(nodes, edges, panelsLibrary);
    const json = JSON.stringify(newRules, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rules.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportRules = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string) as Rule[];
          if (!Array.isArray(parsed)) throw new Error('Invalid rules format');
          setRules(parsed);
          applyRulesToGraph(parsed);
          alert('Rules imported successfully.');
        } catch (err) {
          console.error('Failed to import rules', err);
          alert('Failed to import rules. Please select a valid rules JSON file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="h-full flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onNodeClick={onNodeClick}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
        
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur border border-gray-200 shadow-sm rounded-lg px-3 py-2">
          <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
            <button
              onClick={handleAddPanel}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              + Panel
            </button>
            <button
              onClick={handleAddCombinator}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-orange-500 text-white hover:bg-orange-600 transition-colors shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              + Combinator
            </button>
            <button
              onClick={handleAddConstraint}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-[0_1px_0_rgba(0,0,0,0.04)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={nodes.filter((n) => n.data.panelId || n.data.panel || n.data.combinatorId || n.data.combinator).length === 0}
              title={nodes.filter((n) => n.data.panelId || n.data.panel || n.data.combinatorId || n.data.combinator).length === 0 ? 'Add a panel or combinator first' : 'Add constraint to selected panel/combinator or first one'}
            >
              + Constraint
            </button>
            <button
              onClick={handleAddCondition}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-colors shadow-[0_1px_0_rgba(0,0,0,0.04)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={nodes.filter((n) => n.data.constraint).length === 0}
              title={nodes.filter((n) => n.data.constraint).length === 0 ? 'Add a constraint first' : 'Add condition to selected constraint or first constraint'}
            >
              + Condition
            </button>
            <button
              onClick={() => handleAddLogicalOperator('and')}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-yellow-500 text-white hover:bg-yellow-600 transition-colors shadow-[0_1px_0_rgba(0,0,0,0.04)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={nodes.filter((n) => n.data.condition || n.data.logicalOperator).length === 0}
              title={nodes.filter((n) => n.data.condition || n.data.logicalOperator).length === 0 ? 'Add a condition or logic node first' : 'Add logic operator to selected node or first available'}
            >
              + Logic
            </button>
          </div>

          <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-900 text-white hover:bg-black transition-colors shadow-[0_1px_0_rgba(0,0,0,0.04)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
            <button
              onClick={handleLoadRulesFromBrowser}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-700 text-white hover:bg-gray-800 transition-colors shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              Load
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportRules}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-500 text-white hover:bg-indigo-600 transition-colors shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              Export JSON
            </button>
            <button
              onClick={handleImportRules}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              Import JSON
            </button>
          </div>
        </div>
      </div>

      {selectedNode && (
        <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
          <RuleNodeEditor
            node={selectedNode}
            rule={selectedNode.data.rule}
            panels={panelsLibrary}
            components={componentLibrary}
            onUpdateNode={(nodeId, data) => {
              setNodes((nds) =>
                nds.map((node) =>
                  node.id === nodeId ? { ...node, data } : node
                )
              );
            }}
            onSave={() => {
              // Save is now handled by the main Save button in toolbar
              // This callback is kept for compatibility but doesn't need to do anything
            }}
            onDelete={(ruleId) => {
              handleDeleteNode(selectedNode.id);
            }}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      )}
    </div>
  );
}
