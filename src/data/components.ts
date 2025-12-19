import { Component } from '@/types';

export const defaultComponents: Component[] = [
  // Switches
  {
    id: 'switch-16a',
    name: 'Switch 16A',
    type: 'switch',
    category: 'switches',
    width: 60,
    height: 90,
    depth: 45,
    color: '#4a90e2',
    specs: {
      voltage: '220V',
      current: '16A',
      type: 'SPST',
    },
  },
  {
    id: 'switch-32a',
    name: 'Switch 32A',
    type: 'switch',
    category: 'switches',
    width: 75,
    height: 105,
    depth: 54,
    color: '#4a90e2',
    specs: {
      voltage: '380V',
      current: '32A',
      type: 'DPST',
    },
  },
  {
    id: 'switch-63a',
    name: 'Switch 63A',
    type: 'switch',
    category: 'switches',
    width: 90,
    height: 120,
    depth: 60,
    color: '#4a90e2',
    specs: {
      voltage: '380V',
      current: '63A',
      type: 'TPST',
    },
  },

  // Fuses
  {
    id: 'fuse-10a',
    name: 'Fuse 10A',
    type: 'fuse',
    category: 'protection',
    width: 45,
    height: 120,
    depth: 36,
    color: '#e74c3c',
    specs: {
      rating: '10A',
      type: 'Fast-acting',
    },
  },
  {
    id: 'fuse-20a',
    name: 'Fuse 20A',
    type: 'fuse',
    category: 'protection',
    width: 54,
    height: 135,
    depth: 45,
    color: '#e74c3c',
    specs: {
      rating: '20A',
      type: 'Slow-blow',
    },
  },
  {
    id: 'fuse-32a',
    name: 'Fuse 32A',
    type: 'fuse',
    category: 'protection',
    width: 60,
    height: 150,
    depth: 54,
    color: '#e74c3c',
    specs: {
      rating: '32A',
      type: 'Fast-acting',
    },
  },

  // Relays
  {
    id: 'relay-24v',
    name: 'Relay 24V',
    type: 'relay',
    category: 'control',
    width: 66,
    height: 84,
    depth: 60,
    color: '#2ecc71',
    specs: {
      voltage: '24V',
      contacts: '4',
    },
  },
  {
    id: 'relay-220v',
    name: 'Relay 220V',
    type: 'relay',
    category: 'control',
    width: 75,
    height: 96,
    depth: 66,
    color: '#2ecc71',
    specs: {
      voltage: '220V',
      contacts: '6',
    },
  },

  // Terminals
  {
    id: 'terminal-6p',
    name: 'Terminal 6P',
    type: 'terminal',
    category: 'connection',
    width: 30,
    height: 45,
    depth: 24,
    color: '#9b59b6',
    specs: {
      poles: '6',
      rating: '10A',
    },
  },
  {
    id: 'terminal-12p',
    name: 'Terminal 12P',
    type: 'terminal',
    category: 'connection',
    width: 45,
    height: 60,
    depth: 30,
    color: '#9b59b6',
    specs: {
      poles: '12',
      rating: '16A',
    },
  },

  // Circuit Breakers
  {
    id: 'mcb-16a',
    name: 'MCB 16A',
    type: 'breaker',
    category: 'protection',
    width: 54,
    height: 240,
    depth: 210,
    color: '#f39c12',
    specs: {
      type: 'MCB',
      rating: '16A',
      curve: 'C',
    },
  },
  {
    id: 'mcb-32a',
    name: 'MCB 32A',
    type: 'breaker',
    category: 'protection',
    width: 54,
    height: 240,
    depth: 210,
    color: '#f39c12',
    specs: {
      type: 'MCB',
      rating: '32A',
      curve: 'C',
    },
  },
  {
    id: 'mccb-100a',
    name: 'MCCB 100A',
    type: 'breaker',
    category: 'protection',
    width: 200,
    height: 300,
    depth: 160,
    color: '#e67e22',
    specs: {
      type: 'MCCB',
      rating: '100A',
    },
  },
  {
    id: 'mccb-250a',
    name: 'MCCB 250A',
    type: 'breaker',
    category: 'protection',
    width: 240,
    height: 360,
    depth: 180,
    color: '#e67e22',
    specs: {
      type: 'MCCB',
      rating: '250A',
    },
  },
  {
    id: 'acb-1600a',
    name: 'ACB 1600A',
    type: 'breaker',
    category: 'protection',
    width: 500,
    height: 700,
    depth: 350,
    color: '#c0392b',
    specs: {
      type: 'ACB',
      rating: '1600A',
    },
  },
  {
    id: 'acb-2500a',
    name: 'ACB 2500A',
    type: 'breaker',
    category: 'protection',
    width: 500,
    height: 700,
    depth: 350,
    color: '#c0392b',
    specs: {
      type: 'ACB',
      rating: '2500A',
    },
  },

  // Meters/Indicators
  {
    id: 'meter-voltage',
    name: 'Voltage Meter',
    type: 'meter',
    category: 'monitoring',
    width: 96,
    height: 96,
    depth: 120,
    color: '#3498db',
    specs: {
      type: 'Voltage',
      range: '0-500V',
    },
  },
  {
    id: 'meter-current',
    name: 'Current Meter',
    type: 'meter',
    category: 'monitoring',
    width: 96,
    height: 96,
    depth: 120,
    color: '#3498db',
    specs: {
      type: 'Current',
      range: '0-100A',
    },
  },
  {
    id: 'indicator-led',
    name: 'LED Indicator',
    type: 'indicator',
    category: 'monitoring',
    width: 44,
    height: 44,
    depth: 60,
    color: '#1abc9c',
    specs: {
      type: 'LED',
      voltage: '24V',
    },
  },
];

export const componentCategories = [
  'switches',
  'protection',
  'control',
  'connection',
  'monitoring',
] as const;

export type ComponentCategory = (typeof componentCategories)[number];

