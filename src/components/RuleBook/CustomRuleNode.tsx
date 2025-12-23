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
  logicalOperator?: 'and' | 'or';
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
    const isGlobal = panelId === 'global';
    const bgColor = isGlobal ? 'bg-indigo-50' : 'bg-green-50';
    const borderColor = selected 
      ? (isGlobal ? 'border-indigo-500' : 'border-green-500')
      : (isGlobal ? 'border-indigo-300' : 'border-green-300');
    const dotColor = isGlobal ? 'bg-indigo-500' : 'bg-green-500';
    
    return (
      <div
        className={`
          px-4 py-3 rounded-lg shadow-md border-2 min-w-[200px] ${bgColor}
          ${borderColor}
        `}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${dotColor}`} />
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
        case 'panelSizeMapping': return 'Panel Size Mapping';
        case 'combinatorPanelSizeMapping': return 'Combinator Panel Size Mapping';
        case 'overlap': return 'No Overlaps';
        case 'bounds': return 'Within Bounds';
        case 'spacing': return 'Minimum Spacing';
        case 'count': return 'Component Count';
        case 'dimension': return 'Dimension';
        case 'co-usage': return 'Co-usage';
        case 'noIntersectWithPanelBounds': return 'Not Intersect Panel Bounds';
        case 'gap': return 'Gap';
        case 'maxComponentHeight': return 'Max Component Height';
        default: return 'Constraint';
      }
    };
    
    const getConstraintDetails = () => {
      if (constraint.type === 'panelSizeMapping') {
        const details: string[] = [];
        
        if (constraint.componentTypes && constraint.componentTypes.length > 0) {
          details.push(`Types: ${constraint.componentTypes.join(', ')}`);
        } else {
          details.push('All component types');
        }
        
        if (constraint.panelSize) {
          details.push(`Panel: ${constraint.panelSize}cm`);
        }
        
        return details;
      }
      
      if (constraint.type === 'combinatorPanelSizeMapping') {
        const details: string[] = [];
        
        if (constraint.combinatorTypes && constraint.combinatorTypes.length > 0) {
          details.push(`Types: ${constraint.combinatorTypes.join(', ')}`);
        } else {
          details.push('All combinator types');
        }
        
        if (constraint.panelSize) {
          details.push(`Panel: ${constraint.panelSize}cm`);
        }
        
        return details;
      }
      
      if (constraint.type === 'gap') {
        const details: string[] = [];
        if (constraint.placement) {
          details.push(`Placement: ${constraint.placement}`);
        }
        if (constraint.size !== undefined) {
          details.push(`Size: ${constraint.size}mm`);
        }
        return details;
      }
      
      if (constraint.type === 'maxComponentHeight') {
        const details: string[] = [];
        if (constraint.automatic) {
          details.push('Automatic calculation');
        } else {
          if (constraint.height !== undefined) {
            details.push(`Height: ${constraint.height}mm`);
          }
        }
        return details;
      }
      
      // For other constraint types (legacy support)
      if (constraint.message) {
        return [constraint.message];
      }
      
      return [];
    };
    
    const details = getConstraintDetails();
    
    return (
      <div
        className={`
          px-4 py-3 rounded-lg shadow-md border-2 min-w-[200px] max-w-[280px] bg-blue-50
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
        
        {details.length > 0 && (
          <div className="text-xs text-gray-600 mt-2 space-y-1">
            {details.map((detail, index) => (
              <div key={index} className="truncate" title={detail}>
                {detail}
              </div>
            ))}
          </div>
        )}
        
        {constraint.message && constraint.type !== 'panelSizeMapping' && constraint.type !== 'gap' && constraint.type !== 'maxComponentHeight' && (
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
      </div>
    );
  }
  
  // Logical Operator Node (AND/OR)
  if (data.logicalOperator) {
    const isAnd = data.logicalOperator === 'and';
    const bgColor = 'bg-yellow-50';
    const borderColor = selected ? 'border-yellow-500' : 'border-yellow-300';
    const dotColor = 'bg-yellow-500';
    
    return (
      <div
        className={`
          px-4 py-3 rounded-lg shadow-md border-2 min-w-[150px] ${bgColor}
          ${borderColor}
        `}
      >
        <Handle type="target" position={Position.Top} />
        
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${dotColor}`} />
          <span className="text-xs font-semibold text-gray-600">Logic</span>
        </div>
        
        <div className="font-semibold text-gray-800 mb-1 text-center">
          {data.logicalOperator.toUpperCase()}
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

