export const VISCOSITY_NOTE =
  'ISO VG is the viscosity grade, the oil’s thickness near 40°C. It is not a cleanliness code. Cleanliness is an ISO 4406 code such as 16/14/11, or a NAS class.';

export const FLUSH_LIMIT_NOTE = 'Typical, per OEM and the API 614 lube-system spec. The project datasheet wins.';

export type FlushTarget = {
  id: string;
  equipment: string;
  isoCode: string;
  nas: string;
  grades: string;
  note: string;
};

/** Common field targets. Not a clause from a standard and not an OEM limit. */
export const FLUSH_TARGETS: FlushTarget[] = [
  {
    id: 'turbine',
    equipment: 'Turbines and API 614 lube systems',
    isoCode: '18/15/12, often cleaner',
    nas: 'About 6 to 7',
    grades: '32, sometimes 46',
    note: 'Light turbine oil is usually ISO VG 32. Control oil and servo valves on the same train are often held nearer 16/14/11.',
  },
  {
    id: 'hydraulic',
    equipment: 'Hydraulics',
    isoCode: '19/17/14 down to 18/16/13',
    nas: 'About 8 to 7',
    grades: '32, 46, 68',
    note: 'Higher pressure wants the cleaner end. Servo and proportional valves are commonly targeted at 16/14/11, about NAS 5.',
  },
  {
    id: 'gearbox',
    equipment: 'Gearboxes',
    isoCode: '17/15/12',
    nas: 'About 6',
    grades: '68, 100, 150, 220, 320',
    note: 'The grade follows the reducer. Worm sets often sit at the heavy end of this list. Check the nameplate before you top up.',
  },
  {
    id: 'journal',
    equipment: 'Journal bearings',
    isoCode: '17/15/12',
    nas: 'About 6',
    grades: '32, 46, 68',
    note: 'High-speed journals are usually the lighter grades. The cleanliness target is still the ISO code or the NAS class, not the VG number.',
  },
];

export const ISO_VG_GRADES = [32, 46, 68, 100, 150, 220, 320] as const;
