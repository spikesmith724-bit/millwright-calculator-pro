import { CALC_DISCLAIMER } from '@/src/domain/calculators/common';
import { formatFraction } from '@/src/domain/calculators/fractions';

/** 1 inch = 25.4 mm exactly. */
export const MM_PER_INCH = 25.4;

/** Within this gap the sockets can stand in for each other. */
export const INTERCHANGE_MM = 0.2;

/** Past the interchangeable band, up to this gap, the fit is only a cautious substitute. */
export const CAUTION_MM = 0.4;

export const FIT_INTERCHANGEABLE = 'interchangeable';
export const FIT_CAUTION = 'snug/loose - use caution';
export const FIT_NONE = 'no good match';

export type SocketFit = typeof FIT_INTERCHANGEABLE | typeof FIT_CAUTION | typeof FIT_NONE;

export type SocketDirection = 'inch-to-metric' | 'metric-to-inch';

export type SocketRow = {
  direction: SocketDirection;
  /** Inch socket, or the nearest inch socket on the metric view. */
  fraction: string;
  inches: number;
  /** Exact millimeters of that inch size. Metric rows still carry the nearest inch size here. */
  exactMm: number;
  /** Nominal size shown in the first column. */
  nominal: string;
  /** Exact equivalent of the nominal size. */
  exactLabel: string;
  nearest: string;
  nearestMm: number;
  diffMm: number;
  diffLabel: string;
  fit: SocketFit;
};

export const SOCKET_NOTE =
  'Reference only. Exact mm = inches × 25.4. Within 0.2 mm: interchangeable. Through 0.4 mm: snug/loose - use caution. Past 0.4 mm: no good match. Difference is the nominal size minus the substitute, in millimeters.';

const FIRST_SIXTEENTH = 4;
const LAST_SIXTEENTH = 32;
const FIRST_METRIC = 6;
const LAST_METRIC = 51;

/** Inch sockets from 1/4 through 2, in 1/16 steps. */
export const INCH_SOCKETS: SocketRow[] = Array.from({ length: LAST_SIXTEENTH - FIRST_SIXTEENTH + 1 }, (_, index) =>
  inchRow(FIRST_SIXTEENTH + index),
);

/** Metric sockets across that same span, in 1 mm steps, matched back to the inch set. */
export const METRIC_SOCKETS: SocketRow[] = Array.from({ length: LAST_METRIC - FIRST_METRIC + 1 }, (_, index) => metricRow(FIRST_METRIC + index));

export function socketRows(direction: SocketDirection): SocketRow[] {
  return direction === 'inch-to-metric' ? INCH_SOCKETS : METRIC_SOCKETS;
}

export function searchSockets(rows: SocketRow[], query: string): SocketRow[] {
  const text = query.trim().toLowerCase().replace(/["”″]/g, '').replace(/\s+/g, ' ').trim();
  if (!text) return rows;
  if (text.includes('/')) return rows.filter((row) => fractionHit(row.fraction, text) || fractionHit(row.nearest, text));
  if (/interchange/.test(text)) return rows.filter((row) => row.fit === FIT_INTERCHANGEABLE);
  if (/no good|no match/.test(text)) return rows.filter((row) => row.fit === FIT_NONE);
  if (/caution|snug|loose/.test(text)) return rows.filter((row) => row.fit === FIT_CAUTION);
  const numeric = text.startsWith('.') ? `0${text}` : text;
  if (!/^\d*\.?\d+$/.test(numeric)) return [];
  if (numeric.includes('.')) {
    return rows.filter((row) => decimalPrefix(row.exactLabel, numeric) || decimalPrefix(row.diffLabel.replace(/^\+/, ''), numeric));
  }
  return rows.filter((row) => integerHit(row, numeric));
}

export function socketChartHtml(): string {
  const inch = table('Inch to metric', ['Inch', 'Exact mm', 'Nearest metric', 'Difference mm', 'Fit'], INCH_SOCKETS);
  const metric = table('Metric to inch', ['Metric mm', 'Exact in', 'Nearest inch', 'Difference mm', 'Fit'], METRIC_SOCKETS);
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Socket cross-reference</title><style>
    body { font-family: Georgia, "Times New Roman", serif; color: #000; background: #fff; margin: 24px; }
    h1 { font-size: 18px; font-weight: 500; margin: 0 0 8px; }
    h2 { font-size: 14px; font-weight: 600; margin: 16px 0 4px; }
    p { font-size: 11px; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #000; padding: 3px 6px; font-size: 11px; color: #000; background: #fff; }
    th { font-weight: 600; text-align: left; }
  </style></head><body>
  <h1>Socket cross-reference</h1>
  <p>${escapeHtml(SOCKET_NOTE)} ${escapeHtml(CALC_DISCLAIMER)}</p>
  ${inch}${metric}
  </body></html>`;
}

function inchRow(sixteenths: number): SocketRow {
  const exactEighths = sixteenths * 127;
  const nearest = divRoundHalfAway(exactEighths, 80);
  const fraction = formatFraction(sixteenths * 4);
  const exactHundredths = divRoundHalfAway(exactEighths * 5, 4);
  const diffEighths = exactEighths - nearest * 80;
  return {
    direction: 'inch-to-metric',
    fraction,
    inches: sixteenths / 16,
    exactMm: exactEighths / 80,
    nominal: fraction,
    exactLabel: formatHundredths(exactHundredths),
    nearest: String(nearest),
    nearestMm: nearest,
    diffMm: diffEighths / 80,
    diffLabel: formatSignedHundredths(divRoundHalfAway(diffEighths * 5, 4)),
    fit: fitFromEighths(diffEighths),
  };
}

function metricRow(mm: number): SocketRow {
  const nearest = Math.min(LAST_SIXTEENTH, Math.max(FIRST_SIXTEENTH, divRoundHalfAway(mm * 80, 127)));
  const fraction = formatFraction(nearest * 4);
  const exactEighths = nearest * 127;
  const diffEighths = mm * 80 - exactEighths;
  const inchTenThousandths = divRoundHalfAway(mm * 50000, 127);
  return {
    direction: 'metric-to-inch',
    fraction,
    inches: nearest / 16,
    exactMm: exactEighths / 80,
    nominal: String(mm),
    exactLabel: formatTenThousandths(inchTenThousandths),
    nearest: fraction,
    nearestMm: exactEighths / 80,
    diffMm: diffEighths / 80,
    diffLabel: formatSignedHundredths(divRoundHalfAway(diffEighths * 5, 4)),
    fit: fitFromEighths(diffEighths),
  };
}

function fitFromEighths(diffEighths: number): SocketFit {
  const gap = Math.abs(diffEighths);
  if (gap <= 16) return FIT_INTERCHANGEABLE;
  if (gap <= 32) return FIT_CAUTION;
  return FIT_NONE;
}

function integerHit(row: SocketRow, numeric: string): boolean {
  const fraction = row.fraction;
  const nearest = row.nearest;
  return (
    row.nominal === numeric ||
    nearest === numeric ||
    String(Math.round(row.exactMm)) === numeric ||
    fraction === numeric ||
    fraction.startsWith(`${numeric}/`) ||
    fraction.endsWith(`/${numeric}`) ||
    nearest.startsWith(`${numeric}/`) ||
    nearest.endsWith(`/${numeric}`)
  );
}

function fractionHit(label: string, query: string): boolean {
  const left = fractionParts(label);
  const right = fractionParts(query);
  if (!left || !right) return false;
  if (left.whole !== right.whole || left.num !== right.num) return false;
  return right.den === '' || left.den.startsWith(right.den);
}

function fractionParts(label: string): { whole: string; num: string; den: string } | null {
  const text = label.trim().replace(/\s+/g, ' ');
  const mixed = text.match(/^(\d+) (\d+)\/(\d*)$/);
  if (mixed) return { whole: mixed[1] ?? '', num: mixed[2] ?? '', den: mixed[3] ?? '' };
  const plain = text.match(/^(\d+)\/(\d*)$/);
  if (plain) return { whole: '', num: plain[1] ?? '', den: plain[2] ?? '' };
  return null;
}

function decimalPrefix(label: string, query: string): boolean {
  const bare = label.replace(/^\+/, '');
  if (!bare.startsWith(query)) return false;
  return /^0*$/.test(bare.slice(query.length));
}

/** Round half away from zero. */
function divRoundHalfAway(numerator: number, denominator: number): number {
  const sign = Math.sign(numerator) * Math.sign(denominator) || 1;
  const num = Math.abs(numerator);
  const den = Math.abs(denominator);
  const quotient = Math.floor(num / den);
  const remainder = num % den;
  return sign * (remainder * 2 >= den ? quotient + 1 : quotient);
}

function formatHundredths(hundredths: number): string {
  const sign = hundredths < 0 ? '-' : '';
  const abs = Math.abs(hundredths);
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

function formatSignedHundredths(hundredths: number): string {
  if (hundredths === 0) return '0.00';
  return `${hundredths > 0 ? '+' : ''}${formatHundredths(hundredths)}`;
}

function formatTenThousandths(units: number): string {
  const sign = units < 0 ? '-' : '';
  const abs = Math.abs(units);
  return `${sign}${Math.trunc(abs / 10000)}.${String(abs % 10000).padStart(4, '0')}`;
}

function table(title: string, headers: string[], rows: SocketRow[]): string {
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const body = rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.nominal)}</td><td>${escapeHtml(row.exactLabel)}</td><td>${escapeHtml(row.nearest)}</td><td>${escapeHtml(row.diffLabel)}</td><td>${escapeHtml(row.fit)}</td></tr>`,
    )
    .join('');
  return `<h2>${escapeHtml(title)}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
