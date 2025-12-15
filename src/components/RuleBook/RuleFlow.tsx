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
  const { rules, setRules, addRule, updateRule, deleteRule, panelsLibrary, componentLibrary } =
    usePanelStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const connectionStartRef = useRef<{ nodeId: string; nodeType: string } | null>(null);

  const applyRulesToGraph = useCallback(
    (incomingRules: Rule[]) => {
      const { nodes: graphNodes, edges: graphEdges } = rulesToNodeGraph(incomingRules, panelsLibrary);
      setNodes(graphNodes);
      setEdges(graphEdges);
    },
    [panelsLibrary, setNodes, setEdges]
  );

  // Convert rules to node graph when rules or panels change
  useEffect(() => {
    applyRulesToGraph(rules);
  }, [rules, panelsLibrary, applyRulesToGraph]);

  // Save rules when nodes/edges change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (nodes.length > 0) {
        const newRules = nodeGraphToRules(nodes, edges, panelsLibrary);
        // Update rules in store (this is a simplified approach - in production you might want to be more careful)
        // For now, we'll just update when user explicitly saves
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, panelsLibrary]);

  const onConnectStart = useCallback(
    (_event: React.MouseEvent | React.TouchEvent, params: { nodeId: string | null; handleType: string | null }) => {
      if (!params.nodeId) return;
      
      const sourceNode = nodes.find((n) => n.id === params.nodeId);
      if (!sourceNode) return;

      const sourceType = sourceNode.data.panelId ? 'panel' : 
                        sourceNode.data.constraint ? 'constraint' : 
                        sourceNode.data.condition ? 'condition' : 'unknown';
      
      // Only track panel and constraint nodes (they can create new nodes)
      if (sourceType === 'panel' || sourceType === 'constraint') {
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

      if (nodeType === 'panel') {
        // Create constraint node
        const constraintNodeId = `constraint-${Date.now()}`;
        const newConstraint: Constraint = {
          type: 'overlap',
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
        // Create condition node
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
        setEdges((eds) => [
          ...eds,
          {
            id: `edge-${nodeId}-${conditionNodeId}`,
            source: nodeId,
            target: conditionNodeId,
          },
        ]);
      }
    },
    [nodes, setNodes, setEdges, reactFlowInstance]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Clear connection start ref since connection succeeded
      connectionStartRef.current = null;

      // Only allow connections: Panel → Constraint, Constraint → Condition
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      const sourceType = sourceNode.data.panelId ? 'panel' : 
                        sourceNode.data.constraint ? 'constraint' : 
                        sourceNode.data.condition ? 'condition' : 'unknown';
      const targetType = targetNode.data.panelId ? 'panel' : 
                        targetNode.data.constraint ? 'constraint' : 
                        targetNode.data.condition ? 'condition' : 'unknown';

      // Allow: panel → constraint, constraint → condition
      if (
        (sourceType === 'panel' && targetType === 'constraint') ||
        (sourceType === 'constraint' && targetType === 'condition')
      ) {
        setEdges((eds) => addEdge(params, eds));
      }
    },
    [nodes, setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleSaveNode = () => {
    if (!selectedNode) return;

    // Get updated node from state
    const updatedNode = nodes.find((n) => n.id === selectedNode.id);
    if (!updatedNode) return;

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

    setSelectedNode(null);
  };

  const handleDeleteNode = (nodeId: string) => {
    // Remove node and connected edges
    setNodes((nds) => nds.filter((n) => n.id !== nodeId));
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));

    // Convert to rules and update store
    const updatedNodes = nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    const newRules = nodeGraphToRules(updatedNodes, updatedEdges, panelsLibrary);
    
    // Remove rules that are no longer in the graph
    const ruleIds = new Set(newRules.map((r) => r.id));
    rules.forEach((rule) => {
      if (!ruleIds.has(rule.id)) {
        deleteRule(rule.id);
      }
    });

    setSelectedNode(null);
  };

  const handleAddPanel = () => {
    if (panelsLibrary.length === 0) {
      alert('No panels available. Please add panels first.');
      return;
    }

    // For now, add the first panel. In a full implementation, you'd show a dialog to select a panel
    const panel = panelsLibrary[0];
    const panelNodeId = `panel-${panel.id}-${Date.now()}`;
    
    const newNode: Node = {
      id: panelNodeId,
      type: 'ruleNode',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: panel.name,
        panelId: panel.id,
        panel: panel,
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
      type: 'overlap',
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

    // Calculate position - find a good spot to the right of the constraint
    const existingConditions = edges
      .filter((e) => e.source === constraintNode.id)
      .map((e) => nodes.find((n) => n.id === e.target))
      .filter((n): n is Node => n !== undefined);
    
    const baseX = constraintNode.position.x + 300;
    const baseY = constraintNode.position.y;
    const yOffset = existingConditions.length * 100;

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
    
    // Auto-connect to constraint node
    setEdges((eds) => [
      ...eds,
      {
        id: `edge-${constraintNode.id}-${conditionNodeId}`,
        source: constraintNode.id,
        target: conditionNodeId,
      },
    ]);

    // Select the new node
    setSelectedNode(newNode);
  };

  const handleSaveRulesToBrowser = () => {
    const newRules = nodeGraphToRules(nodes, edges, panelsLibrary);
    setRules(newRules);
    alert('Rules saved to browser storage.');
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
              onClick={handleAddConstraint}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors shadow-[0_1px_0_rgba(0,0,0,0.04)] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={nodes.filter((n) => n.data.panelId || n.data.panel).length === 0}
              title={nodes.filter((n) => n.data.panelId || n.data.panel).length === 0 ? 'Add a panel first' : 'Add constraint to selected panel or first panel'}
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
          </div>

          <div className="flex items-center gap-2 border-r border-gray-200 pr-3">
            <button
              onClick={handleSaveRulesToBrowser}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-900 text-white hover:bg-black transition-colors shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              Save (Browser)
            </button>
            <button
              onClick={handleLoadRulesFromBrowser}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-gray-700 text-white hover:bg-gray-800 transition-colors shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            >
              Load (Browser)
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
            onSave={(rule) => {
              handleSaveNode();
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
