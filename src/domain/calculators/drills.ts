import { CALC_DISCLAIMER } from '@/src/domain/calculators/common';
import { formatFraction } from '@/src/domain/calculators/fractions';

/**
 * Number and letter diameters are the published ANSI/ASME B94.11M decimal inches,
 * in ten-thousandths of an inch. Fractional drills are exact 64ths from 1/64 through 1.
 * Millimeters are that decimal inch × 25.4.
 */
export const DRILL_NOTE =
  'Reference only. Number and letter diameters are the ANSI/ASME B94.11M decimal inches. Fractional sizes are exact 64ths, shown to 4 places. Thousandths are that decimal × 1,000. Millimeters are the decimal inch × 25.4.';

export type DrillType = 'number' | 'letter' | 'fraction';

export type DrillView = 'all' | 'number' | 'letter' | 'fraction' | 'size';

export type DrillRow = {
  type: DrillType;
  name: string;
  /** Exact inches for a fraction. For number and letter sizes, the published decimal. */
  inches: number;
  decimal: string;
  thousandths: string;
  mm: number;
  mmLabel: string;
  /** Published or rounded decimal, in ten-thousandths of an inch. Sort key. */
  tenThousandths: number;
};

/** #1 through #80, published decimal inches in ten-thousandths. */
const NUMBER_TEN_THOUSANDTHS = [
  2280, 2210, 2130, 2090, 2055, 2040, 2010, 1990, 1960, 1935, 1910, 1890, 1850, 1820, 1800, 1770, 1730, 1695, 1660, 1610, 1590, 1570, 1540, 1520, 1495, 1470, 1440, 1405,
  1360, 1285, 1200, 1160, 1130, 1110, 1100, 1065, 1040, 1015, 995, 980, 960, 935, 890, 860, 820, 810, 785, 760, 730, 700, 670, 635, 595, 550, 520, 465, 430, 420, 410, 400, 390,
  380, 370, 360, 350, 330, 320, 310, 292, 280, 260, 250, 240, 225, 210, 200, 180, 160, 145, 135,
];

/** A through Z, published decimal inches in ten-thousandths. */
const LETTER_TEN_THOUSANDTHS = [2340, 2380, 2420, 2460, 2500, 2570, 2610, 2660, 2720, 2770, 2810, 2900, 2950, 3020, 3160, 3230, 3320, 3390, 3480, 3580, 3680, 3770, 3860, 3970, 4040, 4130];

export const NUMBER_DRILLS: DrillRow[] = NUMBER_TEN_THOUSANDTHS.map((tenThousandths, index) =>
  publishedRow('number', `#${index + 1}`, tenThousandths),
);

export const LETTER_DRILLS: DrillRow[] = LETTER_TEN_THOUSANDTHS.map((tenThousandths, index) =>
  publishedRow('letter', String.fromCharCode(65 + index), tenThousandths),
);

export const FRACTION_DRILLS: DrillRow[] = Array.from({ length: 64 }, (_, index) => fractionRow(index + 1));

export const DRILL_INDEX: DrillRow[] = [...NUMBER_DRILLS, ...LETTER_DRILLS, ...FRACTION_DRILLS];

const TYPE_RANK: Record<DrillType, number> = { fraction: 0, letter: 1, number: 2 };

export function listDrills(view: DrillView): DrillRow[] {
  if (view === 'number') return NUMBER_DRILLS;
  if (view === 'letter') return LETTER_DRILLS;
  if (view === 'fraction') return FRACTION_DRILLS;
  if (view === 'size') return [...DRILL_INDEX].sort(bySize);
  return DRILL_INDEX;
}

export function searchDrills(rows: DrillRow[], query: string): DrillRow[] {
  const text = query.trim().toLowerCase().replace(/["”″]/g, '').replace(/\s+/g, ' ').trim();
  if (!text) return rows;
  if (text.startsWith('#')) {
    const name = `#${text.slice(1).replace(/^0+(?=\d)/, '')}`;
    return rows.filter((row) => row.type === 'number' && row.name === name);
  }
  if (/^[a-z]$/.test(text)) return rows.filter((row) => row.type === 'letter' && row.name.toLowerCase() === text);
  if (text.includes('/')) return rows.filter((row) => row.type === 'fraction' && fractionHit(row.name, text));
  const numeric = text.startsWith('.') ? `0${text}` : text;
  if (!/^\d*\.?\d+$/.test(numeric)) return [];
  if (numeric.includes('.')) return rows.filter((row) => decimalPrefix(row.decimal, numeric) || decimalPrefix(row.mmLabel, numeric));
  return rows.filter((row) => integerHit(row, numeric));
}

export function drillChartHtml(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Drill index</title><style>
    body { font-family: Georgia, "Times New Roman", serif; color: #000; background: #fff; margin: 24px; }
    h1 { font-size: 18px; font-weight: 500; margin: 0 0 8px; }
    h2 { font-size: 14px; font-weight: 600; margin: 16px 0 4px; }
    p { font-size: 11px; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #000; padding: 3px 6px; font-size: 11px; color: #000; background: #fff; }
    th { font-weight: 600; text-align: left; }
    td:nth-child(n+2), th:nth-child(n+2) { text-align: right; }
  </style></head><body>
  <h1>Drill index</h1>
  <p>${escapeHtml(DRILL_NOTE)} ${escapeHtml(CALC_DISCLAIMER)}</p>
  ${section('Number drills, #1 through #80', NUMBER_DRILLS)}
  ${section('Letter drills, A through Z', LETTER_DRILLS)}
  ${section('Fractional drills, 1/64 through 1 inch', FRACTION_DRILLS)}
  </body></html>`;
}

function publishedRow(type: DrillType, name: string, tenThousandths: number): DrillRow {
  return finish(type, name, tenThousandths / 10000, tenThousandths);
}

function fractionRow(steps: number): DrillRow {
  const tenThousandths = divRoundHalfAway(steps * 10000, 64);
  return finish('fraction', formatFraction(steps), steps / 64, tenThousandths);
}

function finish(type: DrillType, name: string, inches: number, tenThousandths: number): DrillRow {
  const mmThousandths = divRoundHalfAway(tenThousandths * 254, 100);
  return {
    type,
    name,
    inches,
    decimal: formatInch(tenThousandths),
    thousandths: formatThousandths(tenThousandths),
    mm: mmThousandths / 1000,
    mmLabel: formatMm(mmThousandths),
    tenThousandths,
  };
}

function bySize(left: DrillRow, right: DrillRow): number {
  return left.tenThousandths - right.tenThousandths || TYPE_RANK[left.type] - TYPE_RANK[right.type];
}

function integerHit(row: DrillRow, numeric: string): boolean {
  return row.name === `#${numeric}` || row.name === numeric || row.thousandths === numeric || row.name.startsWith(`${numeric}/`) || row.name.endsWith(`/${numeric}`);
}

function fractionHit(name: string, query: string): boolean {
  const left = fractionParts(name);
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
  if (!label.startsWith(query)) return false;
  return /^0*$/.test(label.slice(query.length));
}

function divRoundHalfAway(numerator: number, denominator: number): number {
  const num = Math.abs(numerator);
  const den = Math.abs(denominator);
  const quotient = Math.floor(num / den);
  const remainder = num % den;
  return remainder * 2 >= den ? quotient + 1 : quotient;
}

function formatInch(tenThousandths: number): string {
  return `${Math.trunc(tenThousandths / 10000)}.${String(tenThousandths % 10000).padStart(4, '0')}`;
}

function formatThousandths(tenThousandths: number): string {
  if (tenThousandths % 10 === 0) return String(tenThousandths / 10);
  return (tenThousandths / 10).toFixed(1);
}

function formatMm(thousandths: number): string {
  return `${Math.trunc(thousandths / 1000)}.${String(thousandths % 1000).padStart(3, '0')}`;
}

function section(title: string, rows: DrillRow[]): string {
  const body = rows
    .map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${row.decimal}</td><td>${row.thousandths}</td><td>${row.mmLabel}</td></tr>`)
    .join('');
  return `<h2>${escapeHtml(title)}</h2><table><thead><tr><th>Size</th><th>Decimal in</th><th>Thousandths</th><th>mm</th></tr></thead><tbody>${body}</tbody></table>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
