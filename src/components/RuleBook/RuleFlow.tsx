'use client';

import { useCallback, useState, useEffect } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Rule } from '@/types';
import { usePanelStore } from '@/lib/store';
import RuleNodeEditor from './RuleNodeEditor';
import CustomRuleNode from './CustomRuleNode';

const nodeTypes: NodeTypes = {
  ruleNode: CustomRuleNode,
};

export default function RuleFlow() {
  const { rules, addRule, updateRule, deleteRule, panelsLibrary, componentLibrary } =
    usePanelStore();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Convert rules to nodes when rules change
  useEffect(() => {
    const ruleNodes: Node[] = rules.map((rule, index) => ({
      id: rule.id,
      type: 'ruleNode',
      position: { x: (index % 4) * 250, y: Math.floor(index / 4) * 200 },
      data: {
        label: rule.name,
        rule: rule,
      },
    }));
    setNodes(ruleNodes);
  }, [rules, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleSaveRule = (updatedRule: Rule) => {
    updateRule(updatedRule.id, updatedRule);
    setSelectedNode(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    deleteRule(ruleId);
    setSelectedNode(null);
  };

  const handleAddRule = () => {
    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      name: 'New Rule',
      type: 'global',
      conditions: [],
      constraints: [],
      enabled: true,
    };
    addRule(newRule);
    // Node will be added automatically via useEffect
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
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
        
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={handleAddRule}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
          >
            + Add Rule
          </button>
        </div>
      </div>

      {selectedNode && (
        <div className="w-96 border-l border-gray-200 bg-white overflow-y-auto">
          <RuleNodeEditor
            node={selectedNode}
            rule={(selectedNode.data as any).rule}
            panels={panelsLibrary}
            components={componentLibrary}
            onSave={handleSaveRule}
            onDelete={handleDeleteRule}
            onClose={() => setSelectedNode(null)}
          />
        </div>
      )}
    </div>
  );
}

