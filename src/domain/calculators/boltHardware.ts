/**
 * Fastener geometry and the torque identity T = K·D·F.
 * Torque is never stored as a remembered number. The target percent starts at 75% and K starts
 * at Dry steel 0.20 (same as the watch); both are clamped so neither can be blank or out of range.
 *
 * Inch tensile stress area: As = π/4 · (D − 0.9743/n)², D in inches, n in threads per inch.
 * Metric coarse stress areas are the published ISO values, in mm².
 * SAE J429 proof stress is labeled proof. ASTM A193 B7 and ASTM F1554 are minimum yield, labeled yield.
 * ISO 898-1 proof stress: class 8.8 is 580 MPa through 16 mm and 600 MPa above that; class 10.9 is 830 MPa.
 */

export const TORQUE_FORMULA = 'T = K · D · F';

/** Typical nut-factor presets. Picking one fills K; 'custom' leaves K for the user to type. Your spec overrules these. */
export const K_PRESETS = [
  { id: 'dry', label: 'Dry steel', k: 0.2 },
  { id: 'zinc', label: 'Zinc plated', k: 0.2 },
  { id: 'cadmium', label: 'Cadmium plated', k: 0.16 },
  { id: 'oiled', label: 'Lubricated (oil)', k: 0.15 },
  { id: 'moly', label: 'Moly/anti-seize', k: 0.11 },
  { id: 'ptfe', label: 'PTFE/wax', k: 0.09 },
  { id: 'ss304', label: '304 stainless dry', k: 0.3 },
  { id: 'ss316', label: '316 stainless dry', k: 0.3 },
  { id: 'ss400', label: '400 series stainless dry', k: 0.25 },
  { id: 'ssAntiSeize', label: '304/316 stainless + anti-seize', k: 0.15 },
  { id: 'custom', label: 'Custom', k: null },
] as const;
export type KPresetId = (typeof K_PRESETS)[number]['id'];
export const K_PRESET_NOTE = 'Typical values; use maker/spec K when available.';
export const K_PRESET_STORAGE_KEY = 'mh.boltTorque.kPreset';

/** Input limits shared with the watch (targets/watch/Calc.swift). */
export const PERCENT_MIN = 5;
export const PERCENT_MAX = 100;
export const PERCENT_DEFAULT = 75;
export const K_MIN = 0.05;
export const K_MAX = 0.4;
export const K_DEFAULT_PRESET: KPresetId = 'dry';
export const K_DEFAULT = 0.2;

function clampTo(value: number | string | null | undefined, min: number, max: number): number {
  const n = typeof value === 'string' ? (value.trim() ? Number(value.trim()) : NaN) : value ?? NaN;
  // Blank or invalid input has no nearest limit; use the lower (more conservative) one.
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** % of proof/yield, 5–100. Out-of-range snaps to the nearest limit; blank or invalid snaps to 5. Never blank. */
export function clampPercent(value: number | string | null | undefined): number {
  return clampTo(value, PERCENT_MIN, PERCENT_MAX);
}

/** Custom K, 0.05–0.40. Out-of-range snaps to the nearest limit; blank or invalid snaps to 0.05. Never blank. */
export function clampK(value: number | string | null | undefined): number {
  return clampTo(value, K_MIN, K_MAX);
}

/** Stored K preset id → preset. Unknown or missing ids fall back to Dry steel. */
export function resolveKPreset(saved: string | null | undefined): (typeof K_PRESETS)[number] {
  return K_PRESETS.find((item) => item.id === saved) ?? K_PRESETS.find((item) => item.id === K_DEFAULT_PRESET)!;
}

/** Clamped torque inputs from the text fields, ready for torqueFromKdf. */
export function torqueInputs(percent: string, kFactor: string): { targetPercent: number; k: number } {
  return { targetPercent: clampPercent(percent), k: clampK(kFactor) };
}

/** Display text for a clamped number (no trailing zeros). */
export function clampedText(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}

export type LoadKind = 'proof' | 'yield';

export type FastenerLoad = {
  grade: string;
  loadKind: LoadKind;
  stress: string;
  /** Pounds for inch sizes, newtons for metric. */
  load: number;
  loadLabel: string;
  note: string | null;
};

export type InchFastener = {
  diameter: string;
  decimalIn: number;
  threadsPerInch: number;
  thread: string;
  stressAreaIn2: number;
  wrench: string;
  wrenchUncertain: boolean;
};

export type MetricFastener = {
  size: string;
  diameterMm: number;
  stressAreaMm2: number;
  socketMm: number;
};

/** ASME B18.2.1 hex cap screw and B18.2.2 finished hex nut, width across flats. */
const HEX_CAP: Record<string, string> = {
  '1/2': '3/4',
  '5/8': '15/16',
  '3/4': '1-1/8',
  '7/8': '1-5/16',
  '1': '1-1/2',
  '1-1/8': '1-11/16',
  '1-1/4': '1-7/8',
  '1-3/8': '2-1/16',
  '1-1/2': '2-1/4',
  '1-3/4': '2-5/8',
  '2': '3',
  '2-1/4': '3-3/8',
  '2-1/2': '3-3/4',
};

export type FastenerHead = 'hex-cap' | 'heavy-hex';

export function wrenchPair(diameter: string): { hex: string; heavy: string; heavyUncertain: boolean } | null {
  const heavy = HEAVY_HEX[diameter];
  const hex = HEX_CAP[diameter];
  if (!heavy || !hex) return null;
  return { hex, heavy: heavy.across, heavyUncertain: Boolean(heavy.uncertain) };
}

export function socketFor(diameter: string, head: FastenerHead): { across: string; uncertain: boolean } | null {
  const pair = wrenchPair(diameter);
  if (!pair) return null;
  if (head === 'heavy-hex') return { across: pair.heavy, uncertain: pair.heavyUncertain };
  return { across: pair.hex, uncertain: false };
}
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

/** Coarse thread used on anchors. Flange studs switch to 8UN at 1-1/8; anchors stay UNC. */
const COARSE: { diameter: string; inches: number; tpi: number }[] = [
  { diameter: '1/2', inches: 0.5, tpi: 13 },
  { diameter: '5/8', inches: 0.625, tpi: 11 },
  { diameter: '3/4', inches: 0.75, tpi: 10 },
  { diameter: '7/8', inches: 0.875, tpi: 9 },
  { diameter: '1', inches: 1, tpi: 8 },
  { diameter: '1-1/8', inches: 1.125, tpi: 7 },
  { diameter: '1-1/4', inches: 1.25, tpi: 7 },
  { diameter: '1-3/8', inches: 1.375, tpi: 6 },
  { diameter: '1-1/2', inches: 1.5, tpi: 6 },
  { diameter: '1-3/4', inches: 1.75, tpi: 5 },
  { diameter: '2', inches: 2, tpi: 4.5 },
  { diameter: '2-1/4', inches: 2.25, tpi: 4.5 },
  { diameter: '2-1/2', inches: 2.5, tpi: 4 },
];

/** 8UN series used on flange studs from 1-1/8 in. */
const EIGHT_UN: { diameter: string; inches: number }[] = [
  { diameter: '1-1/8', inches: 1.125 },
  { diameter: '1-1/4', inches: 1.25 },
  { diameter: '1-3/8', inches: 1.375 },
  { diameter: '1-1/2', inches: 1.5 },
  { diameter: '1-5/8', inches: 1.625 },
  { diameter: '1-3/4', inches: 1.75 },
  { diameter: '1-7/8', inches: 1.875 },
  { diameter: '2', inches: 2 },
  { diameter: '2-1/4', inches: 2.25 },
  { diameter: '2-1/2', inches: 2.5 },
  { diameter: '2-3/4', inches: 2.75 },
  { diameter: '3', inches: 3 },
  { diameter: '3-1/2', inches: 3.5 },
];

const METRIC: MetricFastener[] = [
  { size: 'M6', diameterMm: 6, stressAreaMm2: 20.1, socketMm: 10 },
  { size: 'M8', diameterMm: 8, stressAreaMm2: 36.6, socketMm: 13 },
  { size: 'M10', diameterMm: 10, stressAreaMm2: 58, socketMm: 16 },
  { size: 'M12', diameterMm: 12, stressAreaMm2: 84.3, socketMm: 18 },
  { size: 'M14', diameterMm: 14, stressAreaMm2: 115, socketMm: 21 },
  { size: 'M16', diameterMm: 16, stressAreaMm2: 157, socketMm: 24 },
  { size: 'M18', diameterMm: 18, stressAreaMm2: 192, socketMm: 27 },
  { size: 'M20', diameterMm: 20, stressAreaMm2: 245, socketMm: 30 },
  { size: 'M22', diameterMm: 22, stressAreaMm2: 303, socketMm: 34 },
  { size: 'M24', diameterMm: 24, stressAreaMm2: 353, socketMm: 36 },
  { size: 'M27', diameterMm: 27, stressAreaMm2: 459, socketMm: 41 },
  { size: 'M30', diameterMm: 30, stressAreaMm2: 561, socketMm: 46 },
  { size: 'M33', diameterMm: 33, stressAreaMm2: 694, socketMm: 50 },
  { size: 'M36', diameterMm: 36, stressAreaMm2: 817, socketMm: 55 },
];

export const ANCHOR_DIAMETERS = COARSE.map((row) => row.diameter);
export const HOLD_INCH_DIAMETERS = ['1/2', '5/8', '3/4', '7/8', '1', '1-1/8', '1-1/4', '1-1/2'] as const;
export const HOLD_METRIC_SIZES = METRIC.filter((row) => row.diameterMm >= 12 && row.diameterMm <= 36).map((row) => row.size);

export const ANCHOR_GRADES = ['F1554 Gr 36', 'F1554 Gr 55', 'F1554 Gr 105', 'B7'] as const;
export const HOLD_GRADES = ['SAE 5', 'SAE 8', 'B7', '8.8', '10.9'] as const;

export const ANCHOR_ABOUT =
  'Tensile stress area uses As = π/4 · (D − 0.9743/n)² on the coarse thread. Wrench size is the ASME B18.2.2 heavy hex nut across flats. The washer note is the usual companion (F844 with Grade 36, F436 with Grade 55, Grade 105, and B7) and the drawing still governs. Yield: ASTM F1554 for Grades 36, 55, and 105; ASTM A193 for B7. F436 is not listed here above 3 in.';

export const HOLD_ABOUT =
  'Inch stress area uses As = π/4 · (D − 0.9743/n)². Metric areas are ISO coarse-thread stress areas. Socket size is ASME B18.2.2 heavy hex across flats for inch bolts, and ISO 4032 width across flats for metric nuts. Proof load: SAE J429 for Grades 5 and 8, ISO 898-1 for 8.8 and 10.9. B7 is ASTM A193 minimum yield, labeled yield, not proof.';

export const ANCHOR_PRACTICE =
  'Projection is per the drawing. Do not tension the anchors until the grout has cured. If an anchor sits in a sleeve, confirm it still has free stretch. The tension value is the one you were given.';

export const HOLD_PRACTICE =
  'Check soft foot before the final torque. The soft-foot tolerance is the one you enter. The bolts should not be bottomed or bound in their holes. Leave clearance to move the machine. Recheck alignment after the final torque.';

export function stressAreaIn2(diameterIn: number, threadsPerInch: number): number {
  const root = diameterIn - 0.9743 / threadsPerInch;
  return (Math.PI / 4) * root * root;
}

export function coarseFastener(diameter: string): InchFastener | null {
  const row = COARSE.find((item) => item.diameter === diameter);
  if (!row) return null;
  const wrench = HEAVY_HEX[diameter];
  return {
    diameter,
    decimalIn: row.inches,
    threadsPerInch: row.tpi,
    thread: `${diameter}-${formatTpi(row.tpi)} UNC`,
    stressAreaIn2: stressAreaIn2(row.inches, row.tpi),
    wrench: wrench?.across ?? '',
    wrenchUncertain: Boolean(wrench?.uncertain),
  };
}

/** Flange stud thread: UNC through 1 in, 8UN from 1-1/8 in. */
export function flangeThreadFastener(diameter: string): InchFastener | null {
  if (diameter === '1/2' || diameter === '5/8' || diameter === '3/4' || diameter === '7/8' || diameter === '1') {
    return coarseFastener(diameter);
  }
  const row = EIGHT_UN.find((item) => item.diameter === diameter);
  if (!row) return null;
  const wrench = HEAVY_HEX[diameter];
  return {
    diameter,
    decimalIn: row.inches,
    threadsPerInch: 8,
    thread: `${diameter}-8 UN`,
    stressAreaIn2: stressAreaIn2(row.inches, 8),
    wrench: wrench?.across ?? '',
    wrenchUncertain: Boolean(wrench?.uncertain) || !wrench,
  };
}

export function metricFastener(size: string): MetricFastener | null {
  return METRIC.find((row) => row.size === size) ?? null;
}

export function washerNote(grade: string, diameterIn: number | null): { washer: string; uncertain: boolean; note: string } {
  if (diameterIn != null && diameterIn > 3) {
    return { washer: 'Confirm', uncertain: true, note: 'Confirm the washer standard. This chart does not list an F436 size above 3 in.' };
  }
  if (grade === 'F1554 Gr 36') {
    return { washer: 'F844', uncertain: false, note: 'Grade 36 is often paired with an F844 washer. Use the washer the drawing names.' };
  }
  if (grade === 'F1554 Gr 55' || grade === 'F1554 Gr 105' || grade === 'B7') {
    return { washer: 'F436', uncertain: false, note: 'This grade is often paired with an F436 washer through 3 in. Use the washer the drawing names.' };
  }
  return { washer: 'See drawing', uncertain: true, note: 'This chart does not assign a washer to that grade.' };
}

export function fastenerLoad(grade: string, fastener: InchFastener | null, metric: MetricFastener | null): FastenerLoad | null {
  if (metric && (grade === '8.8' || grade === '10.9')) {
    const mpa = grade === '10.9' ? 830 : metric.diameterMm <= 16 ? 580 : 600;
    const newtons = metric.stressAreaMm2 * mpa;
    return {
      grade,
      loadKind: 'proof',
      stress: `${mpa} MPa`,
      load: newtons,
      loadLabel: `${(newtons / 1000).toFixed(1)} kN proof`,
      note: grade === '8.8' && metric.diameterMm <= 16 ? 'ISO 898-1 class 8.8 proof is 580 MPa through 16 mm.' : null,
    };
  }
  if (!fastener) return null;
  const inches = fastener.decimalIn;
  if (grade === 'SAE 5') {
    if (inches > 1.5) return flagged(grade, 'SAE J429 Grade 5 proof published here stops at 1-1/2 in.');
    const ksi = inches <= 1 ? 85 : 74;
    return inchLoad(grade, 'proof', ksi, fastener, inches <= 1 ? '85 ksi through 1 in.' : '74 ksi over 1 in through 1-1/2 in.');
  }
  if (grade === 'SAE 8') {
    if (inches > 1.5) return flagged(grade, 'SAE J429 Grade 8 proof published here stops at 1-1/2 in.');
    return inchLoad(grade, 'proof', 120, fastener, '120 ksi through 1-1/2 in.');
  }
  if (grade === 'B7') {
    const ksi = inches <= 2.5 ? 105 : inches <= 4 ? 95 : inches <= 7 ? 75 : null;
    if (ksi == null) return flagged(grade, 'ASTM A193 B7 yield published here stops at 7 in.');
    const band = inches <= 2.5 ? '105 ksi through 2-1/2 in.' : inches <= 4 ? '95 ksi over 2-1/2 in through 4 in.' : '75 ksi over 4 in through 7 in.';
    return inchLoad(grade, 'yield', ksi, fastener, band);
  }
  if (grade === 'F1554 Gr 36') return inchLoad(grade, 'yield', 36, fastener, 'ASTM F1554 Grade 36 minimum yield.');
  if (grade === 'F1554 Gr 55') return inchLoad(grade, 'yield', 55, fastener, 'ASTM F1554 Grade 55 minimum yield.');
  if (grade === 'F1554 Gr 105') return inchLoad(grade, 'yield', 105, fastener, 'ASTM F1554 Grade 105 minimum yield.');
  return null;
}

export type TorqueResult = {
  formula: string;
  targetPercent: number;
  k: number;
  forceLb: number;
  inchLb: number;
  footLb: number;
  newtonMeters: number | null;
};

/**
 * T = K·D·F. D is nominal inches, F is pounds, K is dimensionless.
 * Returns null when K or the percent is missing or not positive. Screens pass clamped values
 * from torqueInputs, so on screen this only happens when there is no published load.
 */
export function torqueFromKdf(input: {
  diameterIn: number;
  proofOrYieldLb: number;
  targetPercent: number | null;
  k: number | null;
}): TorqueResult | null {
  if (input.k == null || input.targetPercent == null) return null;
  if (!Number.isFinite(input.k) || input.k <= 0) return null;
  if (!Number.isFinite(input.targetPercent) || input.targetPercent <= 0) return null;
  const forceLb = input.proofOrYieldLb * (input.targetPercent / 100);
  const inchLb = input.k * input.diameterIn * forceLb;
  return {
    formula: TORQUE_FORMULA,
    targetPercent: input.targetPercent,
    k: input.k,
    forceLb,
    inchLb,
    footLb: inchLb / 12,
    newtonMeters: inchLb * 0.1129848,
  };
}

export type PassStep = { name: string; torque: string | null };

export const PASS_EMPTY_HINT = 'Enter spec or % and K to see values';

export function passSchedule(footLb: number | null): PassStep[] {
  if (footLb == null) {
    return [
      { name: 'Snug', torque: null },
      { name: '30% of target', torque: null },
      { name: '60% of target', torque: null },
      { name: '100% of target', torque: null },
      { name: 'Check', torque: null },
    ];
  }
  const n = (fraction: number) => `${round(footLb * fraction, 1)} ft-lb`;
  return [
    { name: 'Snug', torque: null },
    { name: '30%', torque: n(0.3) },
    { name: '60%', torque: n(0.6) },
    { name: '100%', torque: n(1) },
    { name: 'Check', torque: null },
  ];
}

function inchLoad(grade: string, loadKind: LoadKind, ksi: number, fastener: InchFastener, note: string): FastenerLoad {
  const pounds = ksi * 1000 * fastener.stressAreaIn2;
  const word = loadKind === 'proof' ? 'proof' : 'yield';
  return {
    grade,
    loadKind,
    stress: `${ksi} ksi ${word}`,
    load: pounds,
    loadLabel: `${formatPounds(pounds)} lb ${word}`,
    note,
  };
}

function flagged(grade: string, note: string): FastenerLoad {
  return { grade, loadKind: 'proof', stress: 'Not listed', load: 0, loadLabel: 'Not listed', note };
}

function formatTpi(tpi: number): string {
  return Number.isInteger(tpi) ? String(tpi) : String(tpi);
}

function formatPounds(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function round(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
