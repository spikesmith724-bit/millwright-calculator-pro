/**
 * NAS 1638 differential limits, particles per 100 mL.
 * Same integers SAE AS4059 Table 1 identifies as identical to NAS 1638.
 * The sample class is the worst range. ISO 4406 codes beside a class are approximate.
 */

export const NAS_RANGES = ['5–15 µm', '15–25 µm', '25–50 µm', '50–100 µm', '>100 µm'] as const;

export type NasRange = (typeof NAS_RANGES)[number];

export type NasClass = '00' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';

export type NasRow = {
  className: NasClass;
  /** Max particles per 100 mL, in NAS_RANGES order. */
  counts: readonly [number, number, number, number, number];
  /** Approximate ISO 4406. Blank where the published crosswalk we use does not give one. */
  approximateIso: string | null;
};

export const NAS_ROWS: readonly NasRow[] = [
  { className: '00', counts: [125, 22, 4, 1, 0], approximateIso: null },
  { className: '0', counts: [250, 44, 8, 2, 0], approximateIso: null },
  { className: '1', counts: [500, 89, 16, 3, 1], approximateIso: '12/10/7' },
  { className: '2', counts: [1000, 178, 32, 6, 1], approximateIso: '13/11/8' },
  { className: '3', counts: [2000, 356, 63, 11, 2], approximateIso: '14/12/9' },
  { className: '4', counts: [4000, 712, 126, 22, 4], approximateIso: '15/13/10' },
  { className: '5', counts: [8000, 1425, 253, 45, 8], approximateIso: '16/14/11' },
  { className: '6', counts: [16000, 2850, 506, 90, 16], approximateIso: '17/15/12' },
  { className: '7', counts: [32000, 5700, 1012, 180, 32], approximateIso: '18/16/13' },
  { className: '8', counts: [64000, 11400, 2025, 360, 64], approximateIso: '19/17/14' },
  { className: '9', counts: [128000, 22800, 4050, 720, 128], approximateIso: '20/18/15' },
  { className: '10', counts: [256000, 45600, 8100, 1440, 256], approximateIso: '21/19/16' },
  { className: '11', counts: [512000, 91200, 16200, 2880, 512], approximateIso: '22/20/17' },
  { className: '12', counts: [1024000, 182400, 32400, 5760, 1024], approximateIso: '23/21/18' },
];

const CLASS_RANK = new Map<string, number>(NAS_ROWS.map((row, index) => [row.className, index]));

export type RangeClass = NasClass | 'dirtier than 12';

export type NasVerdict = {
  overall: RangeClass;
  ranges: RangeClass[];
  drivers: NasRange[];
  approximateIso: string | null;
};

function requireCount(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a number that is zero or greater.`);
  return value;
}

export function classForCount(rangeIndex: number, count: number): RangeClass {
  const particles = requireCount(count, NAS_RANGES[rangeIndex] ?? 'Count');
  for (const row of NAS_ROWS) {
    if (particles <= row.counts[rangeIndex]!) return row.className;
  }
  return 'dirtier than 12';
}

/** Worst differential range sets the NAS class. Counts are particles per 100 mL. */
export function classifyNas(counts: readonly number[]): NasVerdict {
  if (counts.length !== 5) throw new Error('Enter five particle counts.');
  const ranges = counts.map((count, index) => classForCount(index, count));
  let overall: RangeClass = '00';
  let best = -1;
  for (const name of ranges) {
    const rank = name === 'dirtier than 12' ? NAS_ROWS.length : (CLASS_RANK.get(name) ?? -1);
    if (rank > best) {
      best = rank;
      overall = name;
    }
  }
  const drivers = NAS_RANGES.filter((_, index) => ranges[index] === overall);
  const row = NAS_ROWS.find((item) => item.className === overall);
  return { overall, ranges, drivers, approximateIso: row?.approximateIso ?? null };
}

/**
 * ISO 4406 scale. Upper bounds are "up to and including", particles per millilitre.
 * A count above 2,500,000 is reported as >28.
 */
const ISO_SCALE_MAX = [
  0.01, 0.02, 0.04, 0.08, 0.16, 0.32, 0.64, 1.3, 2.5, 5, 10, 20, 40, 80, 160, 320, 640, 1300, 2500, 5000, 10000, 20000, 40000, 80000,
  160000, 320000, 640000, 1300000, 2500000,
] as const;

export function isoScaleNumber(countPerMl: number): string {
  const count = requireCount(countPerMl, 'Particle count');
  if (count > 2500000) return '>28';
  for (let code = 0; code < ISO_SCALE_MAX.length; code += 1) {
    if (count <= ISO_SCALE_MAX[code]!) return String(code);
  }
  return '>28';
}

/** Three cumulative counts per mL: ≥4 µm(c), ≥6 µm(c), ≥14 µm(c). */
export function iso4406Code(atLeast4: number, atLeast6: number, atLeast14: number): string {
  return [isoScaleNumber(atLeast4), isoScaleNumber(atLeast6), isoScaleNumber(atLeast14)].join('/');
}
