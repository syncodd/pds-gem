'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { Rule } from '@/types';

interface CustomRuleNodeData {
  label: string;
  rule: Rule;
}

export default function CustomRuleNode({ data, selected }: NodeProps<CustomRuleNodeData>) {
  const { rule } = data;
  
  const getTypeColor = () => {
    switch (rule.type) {
      case 'global':
        return 'bg-blue-500';
      case 'panel':
        return 'bg-green-500';
      case 'component':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeLabel = () => {
    switch (rule.type) {
      case 'global':
        return 'Global';
      case 'panel':
        return 'Panel';
      case 'component':
        return 'Component';
      default:
        return 'Rule';
    }
  };

  return (
    <div
      className={`
        px-4 py-3 rounded-lg shadow-md border-2 min-w-[200px]
        ${selected ? 'border-blue-500' : 'border-gray-300'}
        ${rule.enabled === false ? 'opacity-50' : ''}
      `}
    >
      <Handle type="target" position={Position.Top} />
      
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${getTypeColor()}`} />
        <span className="text-xs font-semibold text-gray-600">{getTypeLabel()}</span>
        {rule.enabled === false && (
          <span className="text-xs text-gray-400">(Disabled)</span>
        )}
      </div>
      
      <div className="font-semibold text-gray-800 mb-1">{rule.name}</div>
      
      <div className="text-xs text-gray-500">
        {rule.constraints.length} constraint{rule.constraints.length !== 1 ? 's' : ''}
      </div>
      
      {rule.conditions.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

