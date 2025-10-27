export interface WaterSite {
  id: string;
  name: string;
  type: 'borehole' | 'treatment' | 'kiosk';
  state: string;
  coordinates: [number, number];
  quality: {
    ph: number;
    turbidity: number;
    chlorine: number;
  };
  uptime: number;
  status: 'optimal' | 'warning' | 'critical';
  lastMaintenance: string;
  peopleServed: number;
}

export const waterSites: WaterSite[] = [
  {
    id: 'LG-001',
    name: 'Ikeja Central Borehole',
    type: 'borehole',
    state: 'Lagos',
    coordinates: [3.35, 6.5],
    quality: { ph: 7.2, turbidity: 2.1, chlorine: 0.5 },
    uptime: 98.5,
    status: 'optimal',
    lastMaintenance: '2025-10-15',
    peopleServed: 5200
  },
  {
    id: 'KN-002',
    name: 'Kano Municipal Treatment Plant',
    type: 'treatment',
    state: 'Kano',
    coordinates: [8.5, 12.0],
    quality: { ph: 6.8, turbidity: 4.5, chlorine: 0.3 },
    uptime: 92.1,
    status: 'warning',
    lastMaintenance: '2025-09-28',
    peopleServed: 8400
  },
  {
    id: 'KD-003',
    name: 'Kaduna South Water Kiosk',
    type: 'kiosk',
    state: 'Kaduna',
    coordinates: [7.5, 10.5],
    quality: { ph: 6.2, turbidity: 7.8, chlorine: 0.1 },
    uptime: 85.3,
    status: 'critical',
    lastMaintenance: '2025-08-12',
    peopleServed: 3100
  },
  {
    id: 'RV-004',
    name: 'Port Harcourt Borehole Station',
    type: 'borehole',
    state: 'Rivers',
    coordinates: [7.0, 4.9],
    quality: { ph: 7.4, turbidity: 1.8, chlorine: 0.6 },
    uptime: 97.2,
    status: 'optimal',
    lastMaintenance: '2025-10-20',
    peopleServed: 4800
  },
  {
    id: 'OY-005',
    name: 'Ibadan Central Treatment',
    type: 'treatment',
    state: 'Oyo',
    coordinates: [4.0, 8.0],
    quality: { ph: 7.0, turbidity: 3.2, chlorine: 0.4 },
    uptime: 94.5,
    status: 'optimal',
    lastMaintenance: '2025-10-10',
    peopleServed: 6700
  },
  {
    id: 'KD-006',
    name: 'Zaria Water Point',
    type: 'kiosk',
    state: 'Kaduna',
    coordinates: [7.7, 10.7],
    quality: { ph: 5.9, turbidity: 9.2, chlorine: 0.05 },
    uptime: 78.9,
    status: 'critical',
    lastMaintenance: '2025-07-25',
    peopleServed: 2900
  },
  {
    id: 'LG-007',
    name: 'Lagos Island Water Station',
    type: 'treatment',
    state: 'Lagos',
    coordinates: [3.4, 6.45],
    quality: { ph: 7.3, turbidity: 2.0, chlorine: 0.55 },
    uptime: 99.1,
    status: 'optimal',
    lastMaintenance: '2025-10-22',
    peopleServed: 7800
  },
  {
    id: 'KN-008',
    name: 'Gwale District Borehole',
    type: 'borehole',
    state: 'Kano',
    coordinates: [8.6, 12.1],
    quality: { ph: 6.5, turbidity: 5.1, chlorine: 0.25 },
    uptime: 88.7,
    status: 'warning',
    lastMaintenance: '2025-09-15',
    peopleServed: 4200
  }
];
