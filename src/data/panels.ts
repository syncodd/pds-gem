import { Panel } from '@/types';

// Panel definitions based on SVG files in public/panels
export const defaultPanels: Panel[] = [
  {
    id: 'bos-kasa-60',
    name: 'Boş Kasa 60',
    width: 600, // in mm
    height: 2088.77078144, // in mm
    depth: 200, // default depth
    model2D: '/panels/bos_kasa_60.svg',
  },
  {
    id: 'bos-kasa-80',
    name: 'Boş Kasa 80',
    width: 800, // in mm
    height: 2088.77078144, // in mm
    depth: 200, // default depth
    model2D: '/panels/bos_kasa_80.svg',
  },
  {
    id: 'bos-kasa-120',
    name: 'Boş Kasa 120',
    width: 1200, // in mm
    height: 2088.77078144, // in mm
    depth: 200, // default depth
    model2D: '/panels/bos_kasa_120.svg',
  },
];

