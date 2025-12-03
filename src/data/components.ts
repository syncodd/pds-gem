import { Component } from '@/types';

export const defaultComponents: Component[] = [
  // Switches
  {
    id: 'switch-16a',
    name: 'Switch 16A',
    type: 'switch',
    category: 'switches',
    width: 20,
    height: 30,
    depth: 15,
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
    width: 25,
    height: 35,
    depth: 18,
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
    width: 30,
    height: 40,
    depth: 20,
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
    width: 15,
    height: 40,
    depth: 12,
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
    width: 18,
    height: 45,
    depth: 15,
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
    width: 20,
    height: 50,
    depth: 18,
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
    width: 22,
    height: 28,
    depth: 20,
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
    width: 25,
    height: 32,
    depth: 22,
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
    width: 10,
    height: 15,
    depth: 8,
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
    width: 15,
    height: 20,
    depth: 10,
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
    width: 18,
    height: 80,
    depth: 70,
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
    width: 18,
    height: 80,
    depth: 70,
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
    width: 100,
    height: 150,
    depth: 80,
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
    width: 120,
    height: 180,
    depth: 90,
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
    width: 400,
    height: 600,
    depth: 300,
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
    width: 400,
    height: 600,
    depth: 300,
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
    width: 48,
    height: 48,
    depth: 60,
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
    width: 48,
    height: 48,
    depth: 60,
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
    width: 22,
    height: 22,
    depth: 30,
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

