import { beltDriveHtml } from '@/src/domain/calculators/beltDriveRef';
import { CALC_DISCLAIMER, requirePositive, roundTo } from '@/src/domain/calculators/common';
import { formatFraction } from '@/src/domain/calculators/fractions';

/**
 * Nominal V-belt top width and depth are the RMA/MPTA cross sections.
 * Classical outside-length additions are the catalog rule (inside plus a fixed amount).
 * Narrow codes are effective length in tenths of an inch.
 * Timing pitches are the published pitch for each profile. MXL is not GT2.
 * The open-belt length uses the factor 1.57, the two-decimal stand-in for half of pi.
 */
export const BELT_NOTE =
  'Reference only. V-belt top width and depth are the nominal RMA/MPTA sections. Timing profiles are identified by pitch. Confirm a replacement against the sheave stamp and the belt maker.';

export const OPEN_BELT_FACTOR = 1.57;

export const BELT_LENGTH_FORMULA = 'L = 2C + 1.57(D+d) + (D-d)^2/(4C)';

export const BELT_FORMULA_COPY =
  'L is approximate pitch length. C is center distance. D is the larger diameter and d is the smaller. Use pitch diameters for a V-belt or a timing belt, and outside diameters for a flat belt. Keep C, D, and d in the same unit. 1.57 stands in for half of pi, so equal pulleys come out slightly under a half-pi arc. When the diameters are equal, the last term is zero.';

export const GROOVE_COPY =
  'The nominal included angle of these sections is 40°. A finished sheave groove is often 34°, 36°, or 38°, depending on diameter. Identify the section from the nominal top width and depth. A worn belt measures under that width.';

export const FLAT_BELT_COPY =
  'Flat belts have no classical letter and no narrow V designation. Identify one by the measured width and thickness. Endless length is commonly the inside length. Flat-belt pulleys are crowned, and the belt rides on the outside diameter, so the length formula uses those outside diameters.';

export const LENGTH_RULE =
  'A classical code gives the inside length in inches. Outside length is about that inside length plus 2 in on A, 3 in on B, 4 in on C, and 5 in on D. A narrow code gives the effective length in tenths of an inch. That effective length is the outside length used to order the belt.';

export const TIMING_COPY = 'MXL pitch is 2.032 mm and GT2 pitch is 2 mm. They are not the same belt.';

export type ClassicalSectionId = 'A' | 'B' | 'C' | 'D';
export type NarrowSectionId = '3V' | '5V' | '8V';
export type VBeltSectionId = ClassicalSectionId | NarrowSectionId;
export type BeltFamily = 'classical' | 'narrow';
export type BeltView = 'all' | 'v-belt' | 'timing' | 'flat' | 'measure' | 'length' | 'formula' | 'pulley' | 'drive' | 'tension';

export type VBeltSection = {
  id: VBeltSectionId;
  family: BeltFamily;
  topSixtyFourths: number;
  depthSixtyFourths: number;
  topFraction: string;
  depthFraction: string;
  topInches: number;
  depthInches: number;
  topDecimal: string;
  depthDecimal: string;
  topMmLabel: string;
  depthMmLabel: string;
  /** Catalog addition from inside length to outside length. Null on narrow belts. */
  outsideAddInches: number | null;
  haystack: string;
};

export type TimingFamily = 'trapezoidal' | 'htd' | 'gt2';

export type TimingPitch = {
  id: string;
  family: TimingFamily;
  pitchInches: number;
  pitchInchLabel: string;
  pitchMm: number;
  pitchMmLabel: string;
  haystack: string;
};

export type MeasureStep = { title: string; body: string; haystack: string };

export type BeltLengthCode = {
  code: string;
  section: VBeltSectionId;
  family: BeltFamily;
  inches: number;
  basis: 'inside' | 'effective';
  outsideInches: number | null;
};

const CLASSICAL_OUTSIDE_ADD: Record<ClassicalSectionId, number> = { A: 2, B: 3, C: 4, D: 5 };

const CLASSICAL_SECTIONS: { id: ClassicalSectionId; top: number; depth: number }[] = [
  { id: 'A', top: 32, depth: 20 },
  { id: 'B', top: 42, depth: 26 },
  { id: 'C', top: 56, depth: 34 },
  { id: 'D', top: 80, depth: 48 },
];

const NARROW_SECTIONS: { id: NarrowSectionId; top: number; depth: number }[] = [
  { id: '3V', top: 24, depth: 21 },
  { id: '5V', top: 40, depth: 35 },
  { id: '8V', top: 64, depth: 56 },
];

/** Thousandths of an inch for the trapezoidal inch-pitch profiles. */
const TRAPEZOIDAL_PITCHES: { id: string; thousandths: number }[] = [
  { id: 'MXL', thousandths: 80 },
  { id: 'XL', thousandths: 200 },
  { id: 'L', thousandths: 375 },
  { id: 'H', thousandths: 500 },
];

const METRIC_PITCHES: { id: string; family: 'htd' | 'gt2'; mm: number }[] = [
  { id: 'HTD 3M', family: 'htd', mm: 3 },
  { id: 'HTD 5M', family: 'htd', mm: 5 },
  { id: 'HTD 8M', family: 'htd', mm: 8 },
  { id: 'HTD 14M', family: 'htd', mm: 14 },
  { id: 'GT2', family: 'gt2', mm: 2 },
];

export const V_BELT_SECTIONS: VBeltSection[] = [
  ...CLASSICAL_SECTIONS.map((row) => sectionFrom(row.id, 'classical', row.top, row.depth, CLASSICAL_OUTSIDE_ADD[row.id])),
  ...NARROW_SECTIONS.map((row) => sectionFrom(row.id, 'narrow', row.top, row.depth, null)),
];

export const TIMING_PITCHES: TimingPitch[] = [
  ...TRAPEZOIDAL_PITCHES.map((row) => trapezoidalPitch(row.id, row.thousandths)),
  ...METRIC_PITCHES.map((row) => metricPitch(row.id, row.family, row.mm)),
];

export const MEASURE_STEPS: MeasureStep[] = [
  {
    title: 'Belt section',
    body: 'Measure the top width across the top face, not along the angled side. Measure the depth from the top face to the bottom. Compare those two numbers with the section table.',
    haystack: '',
  },
  {
    title: 'Sheave groove',
    body: 'Measure the groove top width straight across the groove at the outside of the sheave. Measure the groove depth from the top of the rim to the bottom of the groove.',
    haystack: '',
  },
  {
    title: 'Pulley diameter',
    body: 'Measure the outside diameter across the rim. On a V-belt sheave the pitch diameter, also called the datum diameter, is smaller than the outside diameter. Read it from the sheave stamp or the maker table.',
    haystack: '',
  },
  {
    title: 'Center distance',
    body: 'Center distance is the distance from shaft center to shaft center, with both shafts in the same plane.',
    haystack: '',
  },
  {
    title: 'Timing pitch',
    body: 'Pitch is the distance from the center of one tooth to the center of the next tooth along the belt. Counting several teeth and dividing is steadier than measuring one gap.',
    haystack: '',
  },
].map((step) => ({ ...step, haystack: `${step.title} ${step.body}` }));

const LENGTH_EXAMPLE_CODES = ['A42', '5V1000'] as const;

export function classicalLengths(section: ClassicalSectionId, insideInches: number): { insideInches: number; outsideInches: number } {
  const inside = requirePositive(insideInches, 'Inside length');
  return { insideInches: inside, outsideInches: inside + CLASSICAL_OUTSIDE_ADD[section] };
}

/** Narrow designation digits are tenths of an inch of effective length. 5V1000 → 100. */
export function narrowEffectiveInches(code: number): number {
  const value = requirePositive(code, 'Length code');
  if (!Number.isInteger(value)) throw new Error('Length code must be a whole number of tenths of an inch.');
  return value / 10;
}

export function decodeBeltCode(code: string): BeltLengthCode {
  const compact = code.trim().toUpperCase().replace(/\s+/g, '');
  const match = /^(A|B|C|D|3V|5V|8V)(\d+)$/.exec(compact);
  const section = match?.[1];
  const digits = match?.[2];
  if (!section || !digits) throw new Error('Enter a belt code such as A42 or 5V1000.');
  const numeric = Number(digits);
  const normalized = `${section}${String(numeric)}`;
  if (section === 'A' || section === 'B' || section === 'C' || section === 'D') {
    const lengths = classicalLengths(section, numeric);
    return {
      code: normalized,
      section,
      family: 'classical',
      inches: lengths.insideInches,
      basis: 'inside',
      outsideInches: lengths.outsideInches,
    };
  }
  return {
    code: normalized,
    section: section as NarrowSectionId,
    family: 'narrow',
    inches: narrowEffectiveInches(numeric),
    basis: 'effective',
    outsideInches: null,
  };
}

export function lengthExamples(): BeltLengthCode[] {
  return LENGTH_EXAMPLE_CODES.map((code) => decodeBeltCode(code));
}

/**
 * Open-belt pitch length. Either diameter may be passed first.
 * L = 2C + 1.57(D+d) + (D−d)^2 / (4C), with D the larger diameter.
 */
export function openBeltLength(diameterA: number, diameterB: number, center: number): number {
  const first = requirePositive(diameterA, 'Diameter');
  const second = requirePositive(diameterB, 'Diameter');
  const span = requirePositive(center, 'Center distance');
  const large = Math.max(first, second);
  const small = Math.min(first, second);
  if (span * 2 < large + small) throw new Error('Center distance is shorter than half the sum of the diameters.');
  const difference = large - small;
  return 2 * span + OPEN_BELT_FACTOR * (large + small) + (difference * difference) / (4 * span);
}

export function beltLengthExample(): { large: number; small: number; center: number; inches: number; label: string } {
  const large = 12;
  const small = 6;
  const center = 24;
  const inches = openBeltLength(large, small, center);
  return { large, small, center, inches, label: formatComputedInches(inches) };
}

export function beltQueryHits(query: string, haystack: string, identity?: { sectionId?: string; code?: string }): boolean {
  const text = normalizeBeltQuery(query);
  if (!text) return true;
  if (/^(?:3v|5v|8v|[abcd])$/.test(text)) {
    if (identity?.sectionId?.toLowerCase() === text) return true;
    return (identity?.code ?? '').toLowerCase().startsWith(text);
  }
  return normalizeBeltQuery(haystack).includes(text);
}

export function beltChartHtml(): string {
  const example = beltLengthExample();
  const sections = V_BELT_SECTIONS.map((section) => {
    const length =
      section.outsideAddInches == null
        ? 'Effective length, tenths of an inch'
        : `Outside about inside + ${section.outsideAddInches} in`;
    return `<tr><td>${escapeHtml(section.id)}</td><td>${escapeHtml(section.family)}</td><td>${escapeHtml(section.topFraction)} in</td><td>${section.topDecimal}</td><td>${section.topMmLabel}</td><td>${escapeHtml(section.depthFraction)} in</td><td>${section.depthDecimal}</td><td>${section.depthMmLabel}</td><td>${escapeHtml(length)}</td></tr>`;
  }).join('');
  const pitches = TIMING_PITCHES.map(
    (pitch) =>
      `<tr><td>${escapeHtml(pitch.id)}</td><td>${escapeHtml(pitch.family)}</td><td>${pitch.pitchInchLabel} in</td><td>${pitch.pitchMmLabel} mm</td></tr>`,
  ).join('');
  const steps = MEASURE_STEPS.map((step) => `<li><strong>${escapeHtml(step.title)}.</strong> ${escapeHtml(step.body)}</li>`).join('');
  const codes = lengthExamples()
    .map((item) => {
      const detail =
        item.basis === 'inside'
          ? `${item.inches} in inside, about ${item.outsideInches} in outside`
          : `${item.inches.toFixed(1)} in effective`;
      return `<tr><td>${escapeHtml(item.code)}</td><td>${escapeHtml(detail)}</td></tr>`;
    })
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Belt sizing</title><style>
    body { font-family: Georgia, "Times New Roman", serif; color: #000; background: #fff; margin: 24px; }
    h1 { font-size: 18px; font-weight: 500; margin: 0 0 8px; }
    h2 { font-size: 14px; font-weight: 600; margin: 16px 0 4px; }
    p, li { font-size: 11px; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #000; padding: 3px 6px; font-size: 11px; color: #000; background: #fff; text-align: left; }
    th { font-weight: 600; }
  </style></head><body>
  <h1>Belt sizing</h1>
  <p>${escapeHtml(BELT_NOTE)} ${escapeHtml(CALC_DISCLAIMER)}</p>
  <h2>V-belt sections</h2>
  <table><thead><tr><th>Section</th><th>Family</th><th>Top width</th><th>Top in</th><th>Top mm</th><th>Depth</th><th>Depth in</th><th>Depth mm</th><th>Length</th></tr></thead><tbody>${sections}</tbody></table>
  <p>${escapeHtml(GROOVE_COPY)}</p>
  <h2>Timing belt pitch</h2>
  <table><thead><tr><th>Profile</th><th>Family</th><th>Pitch</th><th>Pitch</th></tr></thead><tbody>${pitches}</tbody></table>
  <p>${escapeHtml(TIMING_COPY)}</p>
  <h2>Flat belts</h2>
  <p>${escapeHtml(FLAT_BELT_COPY)}</p>
  <h2>Measuring pulleys and center distance</h2>
  <ol>${steps}</ol>
  <h2>Length codes</h2>
  <p>${escapeHtml(LENGTH_RULE)}</p>
  <table><thead><tr><th>Code</th><th>Length</th></tr></thead><tbody>${codes}</tbody></table>
  <h2>Open-belt length</h2>
  <p>${escapeHtml(BELT_LENGTH_FORMULA)}</p>
  <p>${escapeHtml(BELT_FORMULA_COPY)}</p>
  <p>Example: D = ${example.large} in, d = ${example.small} in, C = ${example.center} in, L = ${example.label} in.</p>
  ${beltDriveHtml()}
  </body></html>`;
}

function sectionFrom(id: VBeltSectionId, family: BeltFamily, top: number, depth: number, outsideAddInches: number | null): VBeltSection {
  const topMm = mmLabelFromSixtyFourths(top);
  const depthMm = mmLabelFromSixtyFourths(depth);
  const section: VBeltSection = {
    id,
    family,
    topSixtyFourths: top,
    depthSixtyFourths: depth,
    topFraction: formatFraction(top),
    depthFraction: formatFraction(depth),
    topInches: top / 64,
    depthInches: depth / 64,
    topDecimal: decimalFromSixtyFourths(top),
    depthDecimal: decimalFromSixtyFourths(depth),
    topMmLabel: topMm,
    depthMmLabel: depthMm,
    outsideAddInches,
    haystack: '',
  };
  section.haystack = [
    id,
    family,
    section.topFraction,
    section.topDecimal,
    section.topMmLabel,
    section.depthFraction,
    section.depthDecimal,
    section.depthMmLabel,
    outsideAddInches == null ? 'effective tenths' : `outside ${outsideAddInches}`,
  ].join(' ');
  return section;
}

function trapezoidalPitch(id: string, thousandths: number): TimingPitch {
  const mmThousandths = (thousandths * 127) / 5;
  const pitch: TimingPitch = {
    id,
    family: 'trapezoidal',
    pitchInches: thousandths / 1000,
    pitchInchLabel: formatThousandths(thousandths, 3),
    pitchMm: mmThousandths / 1000,
    pitchMmLabel: formatThousandths(mmThousandths, 3),
    haystack: '',
  };
  pitch.haystack = `${id} trapezoidal ${pitch.pitchInchLabel} ${pitch.pitchMmLabel}`;
  return pitch;
}

function metricPitch(id: string, family: 'htd' | 'gt2', mm: number): TimingPitch {
  const inchTenThousandths = divRoundHalfAway(mm * 100000, 254);
  const pitch: TimingPitch = {
    id,
    family,
    pitchInches: inchTenThousandths / 10000,
    pitchInchLabel: formatThousandths(inchTenThousandths, 4),
    pitchMm: mm,
    pitchMmLabel: String(mm),
    haystack: '',
  };
  pitch.haystack = `${id} ${family} ${pitch.pitchInchLabel} ${pitch.pitchMmLabel}`;
  return pitch;
}

function decimalFromSixtyFourths(sixtyFourths: number): string {
  const micro = sixtyFourths * 15625;
  const padded = String(micro).padStart(7, '0');
  const whole = padded.slice(0, -6);
  const fraction = padded.slice(-6).replace(/0+$/, '');
  return `${whole}.${fraction.padEnd(3, '0')}`;
}

function mmLabelFromSixtyFourths(sixtyFourths: number): string {
  return formatThousandths(divRoundHalfAway(sixtyFourths * 3175, 8), 3);
}

function formatThousandths(value: number, places: number): string {
  const negative = value < 0;
  const digits = String(Math.abs(value)).padStart(places + 1, '0');
  return `${negative ? '-' : ''}${digits.slice(0, -places)}.${digits.slice(-places)}`;
}

function formatComputedInches(value: number): string {
  return roundTo(value, 3).toFixed(3);
}

function divRoundHalfAway(numerator: number, denominator: number): number {
  const num = Math.abs(numerator);
  const den = Math.abs(denominator);
  const quotient = Math.floor(num / den);
  const remainder = num % den;
  const rounded = remainder * 2 >= den ? quotient + 1 : quotient;
  return numerator < 0 ? -rounded : rounded;
}

function normalizeBeltQuery(query: string): string {
  return query.trim().toLowerCase().replace(/["”″]/g, '').replace(/\s+/g, '');
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
