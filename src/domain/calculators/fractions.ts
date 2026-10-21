import { CALC_DISCLAIMER, FORMULA_VERSION, roundTo } from '@/src/domain/calculators/common';

/** 1 inch = 25.4 mm exactly. */
export const MM_PER_INCH = 25.4;

export type FractionRow = {
  steps: number;
  fraction: string;
  inches: number;
  decimalIn: string;
  mm: number;
  mmLabel: string;
};

export type FractionMatch = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  fraction: string;
  inches: number;
  decimalIn: string;
  mm: number;
  mmLabel: string;
  inputInches: number;
  deltaIn: number;
  exact: boolean;
};

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x || 1;
}

/** Reduced fraction. 64 steps is 1. 96 steps is 1 1/2. 0 is 0. */
export function formatFraction(steps: number): string {
  const whole = Math.trunc(steps / 64);
  const remainder = Math.abs(steps % 64);
  if (remainder === 0) return String(whole);
  const divisor = gcd(remainder, 64);
  const fraction = `${remainder / divisor}/${64 / divisor}`;
  return whole > 0 ? `${whole} ${fraction}` : fraction;
}

export function decimalInches(inches: number): string {
  return roundTo(inches, 4).toFixed(4);
}

export function millimeters(inches: number): string {
  return roundTo(inches * MM_PER_INCH, 3).toFixed(3);
}

function rowFor(steps: number): FractionRow {
  const inches = steps / 64;
  const mm = inches * MM_PER_INCH;
  return {
    steps,
    fraction: formatFraction(steps),
    inches,
    decimalIn: decimalInches(inches),
    mm,
    mmLabel: millimeters(inches),
  };
}

/** 1/64 through 1 inch, lowest terms. */
export const FRACTION_CHART: FractionRow[] = Array.from({ length: 64 }, (_, index) => rowFor(index + 1));

export function searchFractions(query: string): FractionRow[] {
  const text = query.trim().toLowerCase().replace(/["”″]/g, '').replace(/\s+/g, '');
  if (!text) return FRACTION_CHART;
  if (text.includes('/')) {
    return FRACTION_CHART.filter((row) => row.fraction.replace(/\s+/g, '') === text || `${row.steps}/64` === text || row.fraction.replace(/\s+/g, '').startsWith(text));
  }
  const numeric = text.startsWith('.') ? `0${text}` : text;
  if (!/^\d*\.?\d+$/.test(numeric) || numeric === '.') return [];
  if (numeric.includes('.')) {
    return FRACTION_CHART.filter((row) => decimalPrefix(row.decimalIn, numeric) || decimalPrefix(row.mmLabel, numeric));
  }
  return FRACTION_CHART.filter(
    (row) => row.fraction === numeric || String(row.steps) === numeric || row.fraction.startsWith(`${numeric}/`) || row.fraction.endsWith(`/${numeric}`),
  );
}

/**
 * Nearest 1/64. A tie rounds to the larger fraction.
 * Mixed numbers (1 1/2, 1-1/2) and plain decimals are both inches.
 */
export function nearestSixtyFourth(raw: string): FractionMatch {
  const inputInches = parseInches(raw);
  if (inputInches < 0) throw new Error('Length cannot be negative.');
  const steps = Math.round(inputInches * 64);
  const inches = steps / 64;
  const deltaIn = roundTo(inputInches - inches, 6);
  const mm = inches * MM_PER_INCH;
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'Nearest 64th. A value halfway between two 64ths rounds to the larger one. Millimeters = inches × 25.4.',
    units: 'Inches and millimeters.',
    disclaimer: CALC_DISCLAIMER,
    fraction: formatFraction(steps),
    inches,
    decimalIn: decimalInches(inches),
    mm,
    mmLabel: millimeters(inches),
    inputInches,
    deltaIn,
    exact: Math.abs(inputInches - inches) < 1e-9,
  };
}

export function fractionChartHtml(note?: string): string {
  const rows = FRACTION_CHART.map(
    (row) => `<tr><td>${escapeHtml(row.fraction)}</td><td>${row.decimalIn}</td><td>${row.mmLabel}</td></tr>`,
  ).join('');
  const extra = note?.trim() ? `<p>${escapeHtml(note.trim())}</p>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fraction chart</title><style>
    body { font-family: Georgia, "Times New Roman", serif; color: #000; background: #fff; margin: 24px; }
    h1 { font-size: 18px; font-weight: 500; margin: 0 0 8px; }
    p { font-size: 12px; margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 3px 8px; font-size: 11px; color: #000; background: #fff; }
    th { font-weight: 600; text-align: left; }
    td:nth-child(2), td:nth-child(3), th:nth-child(2), th:nth-child(3) { text-align: right; }
  </style></head><body>
  <h1>Fraction chart, 1/64 through 1 inch</h1>
  <p>Decimal inches to 4 places. Millimeters are inches × 25.4. ${escapeHtml(CALC_DISCLAIMER)}</p>
  ${extra}
  <table><thead><tr><th>Fraction</th><th>Decimal in</th><th>mm</th></tr></thead><tbody>${rows}</tbody></table>
  </body></html>`;
}

function decimalPrefix(label: string, query: string): boolean {
  if (!label.startsWith(query)) return false;
  return /^0*$/.test(label.slice(query.length));
}

function parseInches(raw: string): number {
  const text = raw
    .trim()
    .toLowerCase()
    .replace(/["”″]/g, '')
    .replace(/\binches?\b|\bin\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) throw new Error('Enter a fraction or a decimal.');
  if (text.startsWith('-')) throw new Error('Length cannot be negative.');
  const mixed = text.match(/^(\d+) (\d+)\/(\d+)$/) ?? text.match(/^(\d+)-(\d+)\/(\d+)$/);
  if (mixed) return wholeAndFraction(Number(mixed[1]), Number(mixed[2]), Number(mixed[3]));
  const fraction = text.match(/^(\d+)\/(\d+)$/);
  if (fraction) return wholeAndFraction(0, Number(fraction[1]), Number(fraction[2]));
  if (!/^\d*\.?\d+$/.test(text) || text === '.') throw new Error('Enter a fraction such as 3/8, or a decimal such as 0.375.');
  return Number(text);
}

function wholeAndFraction(whole: number, numerator: number, denominator: number): number {
  if (denominator === 0) throw new Error('The denominator cannot be zero.');
  return whole + numerator / denominator;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
