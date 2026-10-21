import { requirePositive } from '@/src/domain/calculators/common';
import { formatFraction } from '@/src/domain/calculators/fractions';
import { V_BELT_SECTIONS } from '@/src/domain/calculators/beltSize';

/**
 * Belt-number tension lookup.
 * Deflection forces are the PowerDrive pencil-gauge sheet: one used-belt
 * force and one new-belt force, pounds, one belt, by small-sheave diameter.
 * 3L, 4L, and 5L forces are the light-duty table on that same sheet.
 * The stamp parser follows the usual designation: classical inside inches,
 * narrow effective length in tenths, FHP outside length in tenths.
 */

export const TENSION_LOOKUP_NOTE =
  'Typical, check the manufacturer. These are the published pencil-gauge forces: one used-belt force and one new-belt force, for one belt, by small-sheave diameter. The reading should fall between those two. The min–max table on this page is a different published sheet.';

export const STATIC_TENSION_COPY =
  'Ideal tension is the lowest tension at which the belt will not slip under peak load. Set a new belt to the new-belt force. After run-in, hold a used belt at the used-belt force. Over-tension shortens belt and bearing life. Do not use belt dressing.';

export const RUN_IN_COPY =
  'Re-tension after 24 to 48 hours of run-in, then periodically. The pencil-gauge sheet is more specific: check after a jog of about 1–3 minutes, at about 8 hours, 24 hours, and 100 hours, then on a regular schedule. Use the new-belt force at installation and after that first jog. From the 8-hour check on, use the used-belt force. Gates retensions a standard friction belt after about 24 hours of run-in. A premium belt set to that maker\'s number may not need the same run-in. Check the manufacturer.';

export const FHP_NOTE =
  '3L, 4L, and 5L are light-duty fractional-horsepower belts. The stamped number is the outside length in tenths of an inch, so 3L350 is 35.0 in outside. They are not industrial A, B, or 5V belts.';

export const BANDED_NOTE =
  'For a banded belt, multiply the table force by the number of ribs. Lay a narrow steel bar, such as keystock, across the band and push on the bar so every rib deflects the same amount.';

export const PENCIL_GAUGE_CAPACITY_LB = 33;

export const GAUGE_CAPACITY_NOTE =
  'This pencil gauge reads to 33 lb. Above that, use another way to apply the force. Lock out the drive before you put a gauge on the belt.';

export const PENCIL_GAUGE_STEPS = [
  'Measure the belt span.',
  'Set the bottom of the large O-ring on the span scale to that span.',
  'Set the small O-ring on the deflection-force scale to zero.',
  'Place the checker squarely on one belt at the center of the span. Push the plunger perpendicular to the span until the bottom of the large O-ring is even with the top of the next belt, or with the bottom of a straightedge laid across the sheave outside diameters.',
  'Take the checker off and read the force at the bottom of the small O-ring.',
  'Compare that force with the table. A new belt is set to the new-belt force. A used belt is held at the used-belt force.',
] as const;

export const BELT_STAMP_EXAMPLES = ['A42', 'B60', '3L350', '3/5V1000', '5V', 'AX', '4L', '5L', '3V', '8V', 'BX'] as const;

const CLASSICAL_OUTSIDE_ADD = { A: 2, B: 3, C: 4, D: 5 } as const;
const STAMP = /^(\d+\/)?((?:[2-5]L)|(?:[358]V)|[ABCD])(X)?(\d+)?$/;

export type TensionSection = 'A' | 'B' | 'C' | 'D' | '2L' | '3L' | '4L' | '5L' | '3V' | '5V' | '8V';

export type BeltStamp = {
  code: string;
  section: TensionSection;
  cogged: boolean;
  ribs: number;
  banded: boolean;
  lengthCode: number | null;
  lengthInches: number | null;
  lengthBasis: 'inside' | 'outside' | 'effective' | null;
  outsideInches: number | null;
  fhp: boolean;
};

type ForcePair = readonly [number, number];

export type GaugeRow = {
  section: Exclude<TensionSection, '2L'>;
  sheave: string;
  rpm: string | null;
  /** Used, then new. Null means the sheet does not list that construction. */
  wrapped: ForcePair | null;
  cogged: ForcePair | null;
  /** Light-duty rows are printed as fractions. Industrial rows are decimals. */
  fraction: boolean;
};

export type BeltForceReading = {
  sheave: string;
  rpm: string | null;
  listed: boolean;
  usedLb: number;
  newLb: number;
};

const pair = (used: number, fresh: number): ForcePair => [used, fresh];

export const GAUGE_ROWS: GaugeRow[] = [
  gauge('A', '3.0–3.6', '1000–2500', pair(3.7, 5.5), pair(4.1, 6.1), false),
  gauge('A', '3.0–3.6', '2501–4000', pair(2.8, 4.2), pair(3.4, 5.0), false),
  gauge('A', '3.8–4.8', '1000–2500', pair(4.5, 6.8), pair(5.0, 7.4), false),
  gauge('A', '3.8–4.8', '2501–4000', pair(3.8, 5.7), pair(4.3, 6.4), false),
  gauge('A', '5.0–7.0', '1000–2500', pair(5.4, 8.0), pair(5.7, 8.4), false),
  gauge('A', '5.0–7.0', '2501–4000', pair(4.7, 7.0), pair(5.1, 7.6), false),
  gauge('B', '3.4–4.2', '860–2500', null, pair(4.9, 7.2), false),
  gauge('B', '3.4–4.2', '2501–4000', null, pair(4.2, 6.2), false),
  gauge('B', '4.4–5.6', '860–2500', pair(5.3, 7.9), pair(7.1, 10.5), false),
  gauge('B', '4.4–5.6', '2501–4000', pair(4.5, 6.7), pair(6.1, 9.1), false),
  gauge('B', '5.8–8.6', '860–2500', pair(6.3, 9.4), pair(8.5, 12.6), false),
  gauge('B', '5.8–8.6', '2501–4000', pair(6.0, 8.9), pair(7.3, 10.9), false),
  gauge('C', '7.0–9.0', '500–1740', pair(11.5, 17.0), pair(14.7, 21.8), false),
  gauge('C', '7.0–9.0', '1741–3000', pair(9.4, 13.8), pair(11.9, 17.5), false),
  gauge('C', '9.5–16.0', '500–1740', pair(14.1, 21.0), pair(15.9, 23.5), false),
  gauge('C', '9.5–16.0', '1741–3000', pair(12.5, 18.5), pair(14.6, 21.6), false),
  gauge('D', '12.0–16.0', '200–850', pair(24.9, 37.0), null, false),
  gauge('D', '12.0–16.0', '851–1500', pair(21.2, 31.3), null, false),
  gauge('D', '18.0–20.0', '200–850', pair(30.4, 45.2), null, false),
  gauge('D', '18.0–20.0', '851–1500', pair(25.6, 38.0), null, false),
  gauge('3V', '2.2–2.4', '1000–2500', null, pair(3.3, 4.9), false),
  gauge('3V', '2.2–2.4', '2501–4000', null, pair(2.9, 4.3), false),
  gauge('3V', '2.65–3.65', '1000–2500', pair(3.6, 5.1), pair(4.2, 6.2), false),
  gauge('3V', '2.65–3.65', '2501–4000', pair(3.0, 4.4), pair(3.8, 5.6), false),
  gauge('3V', '4.12–6.90', '1000–2500', pair(4.9, 7.3), pair(5.3, 7.9), false),
  gauge('3V', '4.12–6.90', '2501–4000', pair(4.4, 6.6), pair(4.9, 7.3), false),
  gauge('5V', '4.4–6.7', '500–1749', null, pair(10.2, 15.2), false),
  gauge('5V', '4.4–6.7', '1750–3000', null, pair(8.8, 13.2), false),
  gauge('5V', '4.4–6.7', '3001–4000', null, pair(5.6, 8.5), false),
  gauge('5V', '7.1–10.9', '500–1740', pair(12.7, 18.9), pair(14.8, 22.1), false),
  gauge('5V', '7.1–10.9', '1741–3000', pair(11.2, 16.7), pair(13.7, 20.1), false),
  gauge('5V', '11.8–16.0', '500–1740', pair(15.5, 23.4), pair(17.1, 25.5), false),
  gauge('5V', '11.8–16.0', '1741–3000', pair(14.6, 21.8), pair(16.8, 25.0), false),
  gauge('8V', '12.5–17.0', '200–850', pair(33.0, 49.3), null, false),
  gauge('8V', '12.5–17.0', '851–1500', pair(26.8, 39.9), null, false),
  gauge('8V', '18.0–22.4', '200–850', pair(39.6, 59.2), null, false),
  gauge('8V', '18.0–22.4', '851–1500', pair(35.3, 52.7), null, false),
  gauge('3L', '1.25–1.75', null, pair(0.375, 0.625), null, true),
  gauge('3L', '2.00–2.25', null, pair(0.75, 1.25), null, true),
  gauge('3L', '2.50–3.00', null, pair(1, 1.5), null, true),
  gauge('4L', '2.10–2.80', null, pair(0.625, 1), null, true),
  gauge('4L', '3.00–3.50', null, pair(1.625, 2.5), null, true),
  gauge('4L', '3.70–5.00', null, pair(2, 3), null, true),
  gauge('5L', '3.00–4.20', null, pair(1.5, 2.625), null, true),
  gauge('5L', '4.50–5.20', null, pair(2.5, 3.5), null, true),
];

export function parseBeltStamp(input: string): BeltStamp {
  const compact = input.trim().toUpperCase().replace(/\s+/g, '');
  const match = STAMP.exec(compact);
  if (!match) throw new Error('Enter a belt number such as A42, 3L350, or 3/5V1000.');
  const ribText = match[1];
  const section = match[2] as TensionSection;
  const cogged = match[3] === 'X';
  const digits = match[4];
  let ribs = 1;
  let banded = false;
  if (ribText) {
    banded = true;
    ribs = Number(ribText.slice(0, -1));
    if (!Number.isInteger(ribs) || ribs < 1) throw new Error('Enter a belt number such as A42, 3L350, or 3/5V1000.');
  }
  const fhp = section.endsWith('L');
  const narrow = section.endsWith('V');
  let lengthCode: number | null = null;
  let lengthInches: number | null = null;
  let lengthBasis: BeltStamp['lengthBasis'] = null;
  let outsideInches: number | null = null;
  if (digits) {
    lengthCode = Number(digits);
    if (!Number.isInteger(lengthCode) || lengthCode <= 0) throw new Error('Enter a belt number such as A42, 3L350, or 3/5V1000.');
    if (fhp) {
      lengthInches = lengthCode / 10;
      lengthBasis = 'outside';
    } else if (narrow) {
      lengthInches = lengthCode / 10;
      lengthBasis = 'effective';
    } else {
      lengthInches = lengthCode;
      lengthBasis = 'inside';
      outsideInches = lengthCode + CLASSICAL_OUTSIDE_ADD[section as keyof typeof CLASSICAL_OUTSIDE_ADD];
    }
  }
  const code = `${banded ? `${ribs}/` : ''}${section}${cogged ? 'X' : ''}${digits ? String(lengthCode) : ''}`;
  return { code, section, cogged, ribs, banded, lengthCode, lengthInches, lengthBasis, outsideInches, fhp };
}

export function describeBeltStamp(stamp: BeltStamp): string {
  const ribs = stamp.banded ? `${stamp.ribs} ribs, ` : '';
  const construction = stamp.cogged ? 'cogged' : 'wrapped';
  const duty = stamp.fhp ? ', light-duty FHP' : '';
  return `${stamp.code}. ${ribs}section ${stamp.section}, ${construction}${duty}. ${describeLength(stamp)}`;
}

/** Nominal FHP top width and thickness, in sixty-fourths. Gates catalog nominals: 3L is 3/8 by 7/32, 4L is 1/2 by 5/16, 5L is 21/32 by 3/8. */
const FHP_SIXTY_FOURTHS: Partial<Record<TensionSection, { top: number; depth: number }>> = {
  '2L': { top: 16, depth: 8 },
  '3L': { top: 24, depth: 14 },
  '4L': { top: 32, depth: 20 },
  '5L': { top: 42, depth: 24 },
};

/** Picture choices, narrowest top first. 4L sits beside A because the nominal cross section matches. */
export const MEASURED_SECTIONS = ['3L', '3V', '4L', 'A', '5V', '5L', 'B', 'C', '8V', 'D'] as const;

export type SectionSize = {
  topFraction: string;
  depthFraction: string;
  topInches: number;
  depthInches: number;
};

export type TensionCard = {
  headline: string;
  size: string;
  rows: { key: string; title: string; body: string }[];
  overGauge: boolean;
};

const SECTION_HEADS = ['8VX', '5VX', '3VX', '8V', '5V', '3V', '5L', '4L', '3L', '2L', 'DX', 'CX', 'BX', 'AX', 'D', 'C', 'B', 'A'] as const;

export function sectionSize(section: TensionSection): SectionSize | null {
  const light = FHP_SIXTY_FOURTHS[section];
  if (light) {
    return {
      topFraction: formatFraction(light.top),
      depthFraction: formatFraction(light.depth),
      topInches: light.top / 64,
      depthInches: light.depth / 64,
    };
  }
  const row = V_BELT_SECTIONS.find((item) => item.id === section);
  if (!row) return null;
  return { topFraction: row.topFraction, depthFraction: row.depthFraction, topInches: row.topInches, depthInches: row.depthInches };
}

export function readyBeltStamp(input: string): BeltStamp | null {
  try {
    const stamp = parseBeltStamp(input);
    if (stamp.lengthInches == null) return stamp;
    const longEnough = stamp.lengthBasis === 'inside' ? stamp.lengthInches >= 16 : stamp.lengthInches >= 15;
    if (!longEnough || stamp.lengthInches > 360) return null;
    return stamp;
  } catch {
    return null;
  }
}

export function suggestBeltStamps(query: string): string[] {
  const compact = query.trim().toUpperCase().replace(/\s+/g, '');
  if (!compact) return [...BELT_STAMP_EXAMPLES];
  const ribMatch = /^(\d+)\//.exec(compact);
  const ribs = ribMatch?.[1] ?? '';
  const body = ribMatch ? compact.slice(ribMatch[0].length) : compact;
  const suggestions: string[] = [];
  const push = (code: string) => {
    if (!code || suggestions.includes(code) || suggestions.length >= 8) return;
    suggestions.push(code);
  };
  for (const example of BELT_STAMP_EXAMPLES) {
    if (example.startsWith(compact)) push(example);
  }
  if (!body) {
    for (const section of MEASURED_SECTIONS) push(`${Number(ribs)}/${section}`);
    return suggestions;
  }
  for (const head of SECTION_HEADS) {
    if (head.startsWith(body)) push(withRibs(ribs, head));
    if (!body.startsWith(head)) continue;
    const digits = body.slice(head.length);
    if (digits && !/^\d+$/.test(digits)) continue;
    for (const code of expandHead(head, digits)) push(withRibs(ribs, code));
  }
  return suggestions;
}

export function tapeLengthLine(section: TensionSection, tapeInches: number): string {
  const inches = requirePositive(tapeInches, 'Tape length');
  if (section === 'A' || section === 'B' || section === 'C' || section === 'D') {
    const inside = inches - CLASSICAL_OUTSIDE_ADD[section];
    const nearest = Math.round(inside);
    const close = Math.abs(inside - nearest) <= 0.05 && nearest >= 16;
    const code = close ? ` Closest code ${section}${nearest}.` : '';
    return `${trimPounds(inches)} in outside, about ${trimPounds(inside)} in inside.${code}`;
  }
  if (section.endsWith('L') || section.endsWith('V')) {
    const basis = section.endsWith('L') ? 'outside' : 'effective';
    const tenths = Math.round(inches * 10);
    const close = Math.abs(inches * 10 - tenths) <= 0.05 && inches >= 15;
    const code = close ? ` Closest code ${section}${tenths}.` : '';
    return `${inches.toFixed(1)} in ${basis}.${code}`;
  }
  return `${trimPounds(inches)} in.`;
}

export function beltSizeSummary(stamp: BeltStamp, tapeInches: number | null = null): string {
  const size = sectionSize(stamp.section);
  const top = size ? `Top ${size.topFraction} in.` : '';
  const thickness = size ? ` Thickness ${size.depthFraction} in.` : '';
  const ribs = stamp.banded ? ` ${stamp.ribs} ribs.` : '';
  const cog = stamp.cogged ? ' Cogged.' : '';
  const duty = stamp.fhp ? ' Light-duty FHP.' : '';
  const kin = stamp.section === '4L' ? ' Same nominal size as an A belt.' : stamp.section === '5L' ? ' A B belt is 13/32 in thick.' : '';
  const length = tapeInches != null && tapeInches > 0 ? tapeLengthLine(stamp.section, tapeInches) : describeLength(stamp);
  return `${top}${thickness}${ribs}${cog}${duty}${kin} ${length}`.replace(/\s+/g, ' ').trim();
}

export function tensionCard(stamp: BeltStamp, spanInches: number, tapeInches: number | null = null): TensionCard {
  const rows = forcesForStamp(stamp);
  const listed = rows.filter((row) => row.listed);
  const deflect = deflectionPhrase(spanInches);
  let headline: string;
  if (!listed.length) {
    headline = `This table does not list a push for this belt. Check the manufacturer. The belt should deflect ${deflect}.`;
  } else {
    const low = pushNumber(Math.min(...listed.map((row) => row.usedLb)), stamp.fhp);
    const high = pushNumber(Math.max(...listed.map((row) => row.newLb)), stamp.fhp);
    const range = low === high ? low : `${low}–${high}`;
    const sheave = listed.length > 1 ? ' The exact push depends on the small sheave.' : '';
    headline = `Push ${range} lb at mid-span.${sheave} The belt should deflect ${deflect}.`;
  }
  return {
    headline,
    size: beltSizeSummary(stamp, tapeInches),
    overGauge: exceedsPencilGauge(rows),
    rows: rows.map((row) => ({
      key: `${row.sheave}-${row.rpm ?? 'any'}`,
      title: `Small sheave ${row.sheave} in${row.rpm ? `, ${row.rpm} rpm` : ''}`,
      body: row.listed ? `Used ${readingPounds(stamp, row).used} · New ${readingPounds(stamp, row).fresh}` : 'Not listed',
    })),
  };
}

export function deflectionPhrase(spanInches: number): string {
  const inches = deflectionDistance(spanInches);
  const steps = Math.round(inches * 64);
  if (Math.abs(inches * 64 - steps) < 1e-6) return `${formatFraction(steps)} in`;
  return `${trimPounds(inches)} in`;
}

export function forcesForStamp(stamp: BeltStamp): BeltForceReading[] {
  return GAUGE_ROWS.filter((row) => row.section === stamp.section).map((row) => {
    const listed = forcePair(row, stamp);
    if (!listed) return { sheave: row.sheave, rpm: row.rpm, listed: false, usedLb: 0, newLb: 0 };
    return {
      sheave: row.sheave,
      rpm: row.rpm,
      listed: true,
      usedLb: scalePounds(listed[0], stamp.ribs),
      newLb: scalePounds(listed[1], stamp.ribs),
    };
  });
}

export function formatGaugePounds(value: number, fraction: boolean): string {
  if (fraction) return `${formatFraction(Math.round(value * 64))} lb`;
  return `${trimPounds(value)} lb`;
}

export function readingPounds(stamp: BeltStamp, reading: BeltForceReading): { used: string; fresh: string } {
  const fraction = stamp.fhp;
  return { used: formatGaugePounds(reading.usedLb, fraction), fresh: formatGaugePounds(reading.newLb, fraction) };
}

export function exceedsPencilGauge(rows: BeltForceReading[]): boolean {
  return rows.some((row) => row.listed && (row.usedLb > PENCIL_GAUGE_CAPACITY_LB || row.newLb > PENCIL_GAUGE_CAPACITY_LB));
}

/** Deflection at 1/64 in per inch of span. */
export function deflectionDistance(spanInches: number): number {
  return requirePositive(spanInches, 'Span') / 64;
}

export function beltTensionHtml(): string {
  const rows = GAUGE_ROWS.map((row) => {
    const wrapped = htmlForce(row.wrapped, row.fraction);
    const cogged = htmlForce(row.cogged, row.fraction);
    const rpm = row.rpm ?? '—';
    return `<tr><td>${row.section}</td><td>${escapeHtml(row.sheave)}</td><td>${escapeHtml(rpm)}</td><td>${wrapped.used}</td><td>${wrapped.fresh}</td><td>${cogged.used}</td><td>${cogged.fresh}</td></tr>`;
  }).join('');
  const steps = PENCIL_GAUGE_STEPS.map((step) => `<li>${escapeHtml(step)}</li>`).join('');
  return `<h2>Belt number lookup</h2>
  <p>${escapeHtml(TENSION_LOOKUP_NOTE)}</p>
  <p>${escapeHtml(FHP_NOTE)}</p>
  <p>${escapeHtml(STATIC_TENSION_COPY)}</p>
  <p>${escapeHtml(BANDED_NOTE)}</p>
  <p>${escapeHtml(RUN_IN_COPY)}</p>
  <p>${escapeHtml(GAUGE_CAPACITY_NOTE)}</p>
  <ol>${steps}</ol>
  <table><thead><tr><th>Section</th><th>Small sheave, in</th><th>rpm</th><th>Wrapped used</th><th>Wrapped new</th><th>Cogged used</th><th>Cogged new</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function describeLength(stamp: BeltStamp): string {
  if (stamp.lengthInches == null || stamp.lengthBasis == null) return 'Length is not on this stamp.';
  if (stamp.lengthBasis === 'inside') return `${trimPounds(stamp.lengthInches)} in inside, about ${stamp.outsideInches} in outside.`;
  if (stamp.lengthBasis === 'outside') return `${stamp.lengthInches.toFixed(1)} in outside.`;
  return `${stamp.lengthInches.toFixed(1)} in effective.`;
}

function forcePair(row: GaugeRow, stamp: BeltStamp): ForcePair | null {
  if (stamp.fhp) return row.wrapped;
  return stamp.cogged ? row.cogged : row.wrapped;
}

function scalePounds(value: number, ribs: number): number {
  return Math.round(value * ribs * 1000) / 1000;
}

function htmlForce(value: ForcePair | null, fraction: boolean): { used: string; fresh: string } {
  if (!value) return { used: 'Not listed', fresh: 'Not listed' };
  return { used: formatGaugePounds(value[0], fraction), fresh: formatGaugePounds(value[1], fraction) };
}

function trimPounds(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  return String(rounded);
}

function pushNumber(value: number, fraction: boolean): string {
  if (fraction) return formatFraction(Math.round(value * 64));
  return (Math.round(value * 10) / 10).toFixed(1);
}

function withRibs(ribs: string, code: string): string {
  if (!ribs) return code;
  const stamp = readyBeltStamp(`${ribs}/${code}`);
  return stamp?.code ?? `${Number(ribs)}/${code}`;
}

function expandHead(head: string, digits: string): string[] {
  const exact = digits && usefulCode(`${head}${digits}`) ? [parseBeltStamp(`${head}${digits}`).code] : [];
  const one = digitCodes(head, digits, 1);
  if (one.length) return [...exact, ...one];
  return [...exact, ...digitCodes(head, digits, 2)];
}

function digitCodes(head: string, digits: string, extra: number): string[] {
  const codes: string[] = [];
  for (let digit = 0; digit <= 9; digit += 1) {
    const suffix = extra === 1 ? String(digit) : `${digit}0`;
    const code = `${head}${digits}${suffix}`;
    if (usefulCode(code)) codes.push(parseBeltStamp(code).code);
  }
  return codes;
}

function usefulCode(code: string): boolean {
  const stamp = readyBeltStamp(code);
  return stamp != null && stamp.lengthInches != null;
}

function gauge(
  section: GaugeRow['section'],
  sheave: string,
  rpm: string | null,
  wrapped: ForcePair | null,
  cogged: ForcePair | null,
  fraction: boolean,
): GaugeRow {
  return { section, sheave, rpm, wrapped, cogged, fraction };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
