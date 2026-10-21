/**
 * ASME B16.5 stud count and diameter, NPS 1/2–24, classes 150–2500.
 * Count and diameter: Engineering Toolbox ASME/ANSI B16.5 flange bolt chart, cross-checked
 * to the Texas Flange ASME B16.5 stud chart where both list the size. Checked 2026-10-10.
 * Raised-face and ring-joint stud lengths: Texas Flange chart only. Class 400 length is not
 * on that chart, so those rows flag the length instead of inventing one.
 * Class 2500 stops at NPS 12 on both charts. NPS 3-1/2 is listed only for classes 150–600.
 */

export const FLANGE_NPS = [
  '1/2', '3/4', '1', '1-1/4', '1-1/2', '2', '2-1/2', '3', '3-1/2', '4', '5', '6', '8', '10', '12', '14', '16', '18', '20', '24',
] as const;

export const FLANGE_CLASSES = [150, 300, 400, 600, 900, 1500, 2500] as const;

export type FlangeClass = (typeof FLANGE_CLASSES)[number];
export type GasketType = 'spiral-wound' | 'rtj' | 'sheet' | 'kammprofile';

export const GASKET_TYPES: { id: GasketType; label: string }[] = [
  { id: 'spiral-wound', label: 'Spiral wound' },
  { id: 'rtj', label: 'RTJ' },
  { id: 'sheet', label: 'Sheet' },
  { id: 'kammprofile', label: 'Kammprofile' },
];

export type FlangeStud = {
  nps: string;
  classRating: FlangeClass;
  count: number;
  diameter: string;
  thread: string;
  wrench: string;
  wrenchUncertain: boolean;
  rfLength: string | null;
  rtjLength: string | null;
  /** Published length for the facing this gasket uses. Null when the chart does not list it. */
  studLength: string | null;
  lengthFacing: 'RF' | 'RTJ';
  lengthNote: string | null;
};

/** count, diameter, RF length, RTJ length. A dash means the chart does not list that length. */
const ROWS: Record<FlangeClass, string[]> = {
  150: [
    '1/2 4 1/2 2-1/4 —',
    '3/4 4 1/2 2-1/2 —',
    '1 4 1/2 2-1/2 3',
    '1-1/4 4 1/2 2-3/4 3-1/4',
    '1-1/2 4 1/2 2-3/4 3-1/4',
    '2 4 5/8 3-1/4 3-3/4',
    '2-1/2 4 5/8 3-1/2 4',
    '3 4 5/8 3-1/2 4',
    '3-1/2 8 5/8 3-1/2 4',
    '4 8 5/8 3-1/2 4',
    '5 8 3/4 3-3/4 4-1/4',
    '6 8 3/4 4 4-1/2',
    '8 8 3/4 4-1/4 4-3/4',
    '10 12 7/8 4-1/2 5',
    '12 12 7/8 4-3/4 5-1/4',
    '14 12 1 5-1/4 5-3/4',
    '16 16 1 5-1/4 5-3/4',
    '18 16 1-1/8 5-3/4 6-1/4',
    '20 20 1-1/8 6-1/4 6-3/4',
    '24 20 1-1/4 6-3/4 7-1/4',
  ],
  300: [
    '1/2 4 1/2 2-1/2 3',
    '3/4 4 5/8 3 3-1/2',
    '1 4 5/8 3 3-1/2',
    '1-1/4 4 5/8 3-1/4 3-3/4',
    '1-1/2 4 3/4 3-1/2 4',
    '2 8 5/8 3-1/2 4',
    '2-1/2 8 3/4 4 4-1/2',
    '3 8 3/4 4-1/4 4-3/4',
    '3-1/2 8 3/4 4-1/4 5',
    '4 8 3/4 4-1/2 5',
    '5 8 3/4 4-3/4 5-1/4',
    '6 12 3/4 4-3/4 5-1/2',
    '8 12 7/8 5-1/2 6',
    '10 16 1 6-1/4 6-3/4',
    '12 16 1-1/8 6-3/4 7-1/4',
    '14 20 1-1/8 7 7-1/2',
    '16 20 1-1/4 7-1/2 8',
    '18 24 1-1/4 7-3/4 8-1/4',
    '20 24 1-1/4 8 8-3/4',
    '24 24 1-1/2 9 10',
  ],
  400: [
    '1/2 4 1/2 — —',
    '3/4 4 5/8 — —',
    '1 4 5/8 — —',
    '1-1/4 4 5/8 — —',
    '1-1/2 4 3/4 — —',
    '2 8 5/8 — —',
    '2-1/2 8 3/4 — —',
    '3 8 3/4 — —',
    '3-1/2 8 7/8 — —',
    '4 8 7/8 — —',
    '5 8 7/8 — —',
    '6 12 7/8 — —',
    '8 12 1 — —',
    '10 16 1-1/8 — —',
    '12 16 1-1/4 — —',
    '14 20 1-1/4 — —',
    '16 20 1-3/8 — —',
    '18 24 1-3/8 — —',
    '20 24 1-1/2 — —',
    '24 24 1-3/4 — —',
  ],
  600: [
    '1/2 4 1/2 3 3',
    '3/4 4 5/8 3-1/2 3-1/2',
    '1 4 5/8 3-1/2 3-1/2',
    '1-1/4 4 5/8 3-3/4 3-3/4',
    '1-1/2 4 3/4 4-1/4 4-1/4',
    '2 8 5/8 4-1/4 4-1/4',
    '2-1/2 8 3/4 4-3/4 4-3/4',
    '3 8 3/4 5 5',
    '3-1/2 8 7/8 5-1/2 5-1/2',
    '4 8 7/8 5-3/4 5-3/4',
    '5 8 1 6-1/2 6-1/2',
    '6 12 1 6-3/4 6-3/4',
    '8 12 1-1/8 7-1/2 7-3/4',
    '10 16 1-1/4 8-1/2 8-1/2',
    '12 20 1-1/4 8-3/4 8-3/4',
    '14 20 1-3/8 9-1/4 9-1/4',
    '16 20 1-1/2 10 10',
    '18 20 1-5/8 10-3/4 10-3/4',
    '20 24 1-5/8 11-1/4 11-1/2',
    '24 24 1-7/8 13 13-1/4',
  ],
  900: [
    '1/2 4 3/4 4-1/4 4-1/4',
    '3/4 4 3/4 4-1/2 4-1/2',
    '1 4 7/8 5 5',
    '1-1/4 4 7/8 5 5',
    '1-1/2 4 1 5-1/2 5-1/2',
    '2 8 7/8 5-3/4 5-3/4',
    '2-1/2 8 1 6-1/4 6-1/4',
    '3 8 7/8 5-3/4 5-3/4',
    '4 8 1-1/8 6-3/4 6-3/4',
    '5 8 1-1/4 7-1/2 7-1/2',
    '6 12 1-1/8 7-1/2 7-3/4',
    '8 12 1-3/8 8-3/4 8-3/4',
    '10 16 1-3/8 9-1/4 9-1/4',
    '12 20 1-3/8 10 10',
    '14 20 1-1/2 10-3/4 11',
    '16 20 1-5/8 11-1/4 11-1/2',
    '18 20 1-7/8 12-3/4 13-1/4',
    '20 20 2 13-3/4 14-1/4',
    '24 20 2-1/2 17-1/4 18',
  ],
  1500: [
    '1/2 4 3/4 4-1/4 4-1/4',
    '3/4 4 3/4 4-1/2 4-1/2',
    '1 4 7/8 5 5',
    '1-1/4 4 7/8 5 5',
    '1-1/2 4 1 5-1/2 5-1/2',
    '2 8 7/8 5-3/4 5-3/4',
    '2-1/2 8 1 6-1/4 6-1/4',
    '3 8 1-1/8 7 7',
    '4 8 1-1/4 7-3/4 7-3/4',
    '5 8 1-1/2 9-3/4 9-3/4',
    '6 12 1-3/8 10-1/4 10-1/2',
    '8 12 1-5/8 11-1/2 11-3/4',
    '10 12 1-7/8 13-1/4 13-1/2',
    '12 16 2 14-3/4 15-1/4',
    '14 16 2-1/4 16 16-3/4',
    '16 16 2-1/2 17-1/2 18-1/2',
    '18 16 2-3/4 19-1/2 20-3/4',
    '20 16 3 21-1/4 22-1/4',
    '24 16 3-1/2 24-1/4 25-1/2',
  ],
  2500: [
    '1/2 4 3/4 4-3/4 4-3/4',
    '3/4 4 3/4 5 5',
    '1 4 7/8 5-1/2 5-1/2',
    '1-1/4 4 1 6 6',
    '1-1/2 4 1-1/8 6-3/4 6-3/4',
    '2 8 1 7 7',
    '2-1/2 8 1-1/8 7-3/4 8',
    '3 8 1-1/4 8-3/4 9',
    '4 8 1-1/2 10 10-1/4',
    '5 8 1-3/4 11-3/4 12-1/4',
    '6 8 2 13-1/2 14',
    '8 12 2 15 15-1/2',
    '10 12 2-1/2 19-1/4 20',
    '12 12 2-3/4 21-1/4 22',
  ],
};

/** ASME B18.2.2 heavy hex nut, width across flats. 3-1/2 in is flagged. */
const HEAVY_HEX: Record<string, { across: string; uncertain?: boolean }> = {
  '1/2': { across: '7/8' },
  '5/8': { across: '1-1/16' },
  '3/4': { across: '1-1/4' },
  '7/8': { across: '1-7/16' },
  '1': { across: '1-5/8' },
  '1-1/8': { across: '1-13/16' },
  '1-1/4': { across: '2' },
  '1-3/8': { across: '2-3/16' },
  '1-1/2': { across: '2-3/8' },
  '1-5/8': { across: '2-9/16' },
  '1-3/4': { across: '2-3/4' },
  '1-7/8': { across: '2-15/16' },
  '2': { across: '3-1/8' },
  '2-1/4': { across: '3-1/2' },
  '2-1/2': { across: '3-7/8' },
  '2-3/4': { across: '4-1/4' },
  '3': { across: '4-5/8' },
  '3-1/2': { across: '5-3/8', uncertain: true },
};

const UNC: Record<string, string> = {
  '1/2': '1/2-13 UNC',
  '5/8': '5/8-11 UNC',
  '3/4': '3/4-10 UNC',
  '7/8': '7/8-9 UNC',
  '1': '1-8 UNC',
};

export const API_686_CITATION = 'Based on API RP 686 practices; see current edition';

export const FLANGE_ABOUT =
  'Stud count and diameter: Engineering Toolbox ASME/ANSI B16.5 flange bolt dimensions, cross-checked to the Texas Flange ASME B16.5 stud chart where both list the size. Checked 2026-10-10. Stud length for raised face and ring joint: Texas Flange chart. Class 400 length is not on that chart. Wrench size: ASME B18.2.2 heavy hex nut, width across flats. The 3-1/2 in size is flagged. Thread is UNC through 1 in and 8UN from 1-1/8 in.';

export const FLANGE_PRACTICE =
  'Record the tightening sequence. Check pipe movement at the coupling before the nozzle bolts go on, and again after they are tight. Write the movement limit you were given. This chart does not supply one. Protect the stud threads. The length shown is the published length for that facing. A thicker gasket changes it.';

export function threadCallout(diameter: string): string {
  return UNC[diameter] ?? `${diameter}-8 UN`;
}

export function heavyHexWrench(diameter: string): { across: string; uncertain: boolean } | null {
  const row = HEAVY_HEX[diameter];
  if (!row) return null;
  return { across: row.across, uncertain: Boolean(row.uncertain) };
}

function parseRow(classRating: FlangeClass, line: string): FlangeStud {
  const [nps, count, diameter, rf, rtj] = line.split(' ');
  if (!nps || !count || !diameter || !rf || !rtj) throw new Error(`Bad flange row: ${line}`);
  const wrench = heavyHexWrench(diameter);
  return {
    nps,
    classRating,
    count: Number(count),
    diameter,
    thread: threadCallout(diameter),
    wrench: wrench?.across ?? '',
    wrenchUncertain: wrench?.uncertain ?? true,
    rfLength: rf === '—' ? null : rf,
    rtjLength: rtj === '—' ? null : rtj,
    studLength: null,
    lengthFacing: 'RF',
    lengthNote: null,
  };
}

const INDEX = new Map<string, FlangeStud>();
for (const classRating of FLANGE_CLASSES) {
  for (const line of ROWS[classRating]) {
    const row = parseRow(classRating, line);
    INDEX.set(`${row.classRating}|${row.nps}`, row);
  }
}

export function flangeStud(nps: string, classRating: FlangeClass, gasket: GasketType): FlangeStud | null {
  const found = INDEX.get(`${classRating}|${nps}`);
  if (!found) return null;
  const ring = gasket === 'rtj';
  const studLength = ring ? found.rtjLength : found.rfLength;
  let lengthNote: string | null = null;
  if (!studLength) {
    lengthNote = classRating === 400
      ? 'Length is not on the Texas Flange chart used here.'
      : 'This facing is not listed for that size.';
  }
  return {
    ...found,
    studLength,
    lengthFacing: ring ? 'RTJ' : 'RF',
    lengthNote,
  };
}

export function flangeSizesFor(classRating: FlangeClass): string[] {
  return FLANGE_NPS.filter((nps) => INDEX.has(`${classRating}|${nps}`));
}
