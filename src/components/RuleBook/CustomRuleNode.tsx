'use client';

import { Handle, Position, NodeProps } from '@xyflow/react';
import { Rule, Constraint, RuleCondition, Panel, Combinator } from '@/types';

interface CustomRuleNodeData {
  label: string;
  rule?: Rule;
  constraint?: Constraint;
  condition?: RuleCondition;
  panelId?: string;
  panel?: Panel;
  combinatorId?: string;
  combinator?: Combinator;
}

export default function CustomRuleNode({ data, selected }: NodeProps<CustomRuleNodeData>) {
  const { rule, constraint, condition, panel, panelId, combinator, combinatorId } = data;
  
  // Combinator Node
  if (combinator || combinatorId) {
    return (
      <div
        className={`
          px-4 py-3 rounded-lg shadow-md border-2 min-w-[200px] bg-orange-50
          ${selected ? 'border-orange-500' : 'border-orange-300'}
        `}
      >
        <Handle type="target" position={Position.Top} />
        
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs font-semibold text-gray-600">Combinator</span>
        </div>
        
        <div className="font-semibold text-gray-800 mb-1">
          {combinator?.name || combinatorId || 'Combinator'}
        </div>
        
        <Handle type="source" position={Position.Bottom} />
      </div>
    );
  }
  
  // Panel Node
  if (panel || panelId) {
    return (
      <div
        className={`
          px-4 py-3 rounded-lg shadow-md border-2 min-w-[200px] bg-green-50
          ${selected ? 'border-green-500' : 'border-green-300'}
        `}
      >
        <Handle type="target" position={Position.Top} />
        
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-xs font-semibold text-gray-600">Panel</span>
        </div>
        
        <div className="font-semibold text-gray-800 mb-1">
          {panel?.name || panelId || 'Panel'}
        </div>
        
        <Handle type="source" position={Position.Bottom} />
      </div>
    );
  }
  
  // Constraint Node
  if (constraint) {
    const getConstraintLabel = () => {
      switch (constraint.type) {
        case 'overlap': return 'No Overlaps';
        case 'bounds': return 'Within Bounds';
        case 'spacing': return 'Minimum Spacing';
        case 'count': return 'Component Count';
        case 'dimension': return 'Dimension';
        case 'co-usage': return 'Co-usage';
        case 'noIntersectWithPanelBounds': return 'Not Intersect Panel Bounds';
        default: return 'Constraint';
      }
    };
    
    return (
      <div
        className={`
          px-4 py-3 rounded-lg shadow-md border-2 min-w-[200px] bg-blue-50
          ${selected ? 'border-blue-500' : 'border-blue-300'}
        `}
      >
        <Handle type="target" position={Position.Top} />
        
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold text-gray-600">Constraint</span>
        </div>
        
        <div className="font-semibold text-gray-800 mb-1">
          {getConstraintLabel()}
        </div>
        
        {constraint.message && (
          <div className="text-xs text-gray-500 mt-1 truncate">
            {constraint.message}
          </div>
        )}
        
        <Handle type="source" position={Position.Bottom} />
      </div>
    );
  }
  
  // Condition Node
  if (condition) {
    const getOperatorLabel = () => {
      switch (condition.operator) {
        case 'equals': return '=';
        case 'greaterThan': return '>';
        case 'lessThan': return '<';
        case 'notEquals': return '≠';
        default: return condition.operator;
      }
    };
    
    return (
      <div
        className={`
          px-4 py-3 rounded-lg shadow-md border-2 min-w-[200px] bg-purple-50
          ${selected ? 'border-purple-500' : 'border-purple-300'}
        `}
      >
        <Handle type="target" position={Position.Top} />
        
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-xs font-semibold text-gray-600">Condition</span>
        </div>
        
        <div className="font-semibold text-gray-800 mb-1">
          {condition.field} {getOperatorLabel()} {String(condition.value)}
        </div>
        
        <Handle type="source" position={Position.Bottom} />
      </div>
    );
  }
  
  // Legacy Rule Node (for backward compatibility)
  if (rule) {
    const getTypeColor = () => {
      switch (rule.type) {
        case 'global':
          return 'bg-blue-500';
        case 'panel':
          return 'bg-green-500';
        case 'component':
          return 'bg-purple-500';
        case 'combinator':
          return 'bg-orange-500';
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
        case 'combinator':
          return 'Combinator';
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
  
  // Default fallback
  return (
    <div className="px-4 py-3 rounded-lg shadow-md border-2 min-w-[200px] bg-gray-50">
      <Handle type="target" position={Position.Top} />
      <div className="font-semibold text-gray-800">{data.label || 'Node'}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

