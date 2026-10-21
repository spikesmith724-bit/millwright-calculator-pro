import { beltTensionHtml } from '@/src/domain/calculators/beltTension';
import { requirePositive } from '@/src/domain/calculators/common';
import { formatFraction } from '@/src/domain/calculators/fractions';

/**
 * Pulley identification, the speed-ratio and horsepower relations, and the
 * published V-belt deflection table.
 * Deflection forces are the Masterdrive classical and narrow tensioning tables
 * (pounds, one belt). New-belt and run-in notes are from that same sheet.
 * Bushing tapers are the Martin sprocket nomenclature card.
 * ANSI roller pitch is floor(chain number / 10) / 8 inch.
 * Horsepower capacity is not given a single range: published "typical" lists
 * disagree, and the rating tables depend on sheave diameter and speed.
 */

export const SPEED_RATIO_FORMULA = 'N1×D1 = N2×D2';
export const BELT_SPEED_FORMULA = 'V = π×D×N/12';
export const HP_TORQUE_FORMULA = 'HP = T×RPM/5252';
export const HP_TORQUE_CONSTANT = 5252;
/** Pound-inches. Published beside the 5252 form; 5252 × 12 is 63024, so the two constants are not forced to agree. */
export const HP_INCH_LB_CONSTANT = 63025;

export const DEFLECTION_PER_INCH = 1 / 64;
export const NEW_BELT_FORCE_FACTOR = 1.33;

export const DRIVE_COPY =
  'N1 and N2 are the driver and driven rpm. D1 and D2 are the pitch diameters for a V-belt, a timing belt, or a chain, and the outside diameters for a flat belt. Belt speed in feet per minute is π × D × N / 12, with D in inches. The two speeds match when the ratio holds.';

export const HP_COPY =
  'T is torque in pound-feet. The same engineering sheet prints horsepower from pound-inches as torque × rpm / 63025. Those two published constants are not the same number of pound-inches.';

export const HP_CAPACITY_COPY =
  'Typical, check the manufacturer\'s rating. A belt section does not have one horsepower. The rating table uses the section, the small sheave pitch diameter, and the rpm. Design horsepower is the motor horsepower times the maker\'s service factor.';

export const DEFLECTION_COPY =
  'Deflect one belt at the middle of the span by 1/64 in for every inch of span. A 32 in span deflects 1/2 in. Read the force and compare it with the table for that section and small sheave. For a banded belt, multiply the table force by the number of belts in the band.';

export const NEW_BELT_COPY =
  'For a new belt, multiply the table\'s maximum force by 1.33. Run the drive about 10 minutes, then check the tension again. Check it through the first 24 hours. After that, the force should sit between the table minimum and maximum.';

export const ALIGNMENT_COPY =
  'Shafts are parallel, and the sheave faces lie in one plane. A straightedge across the faces is the field check. Turn each sheave by hand and look for wobble or a bent shaft. Do not roll or pry a belt into the groove; move the driver so the belt can slip on.';

export type ForceRange = { min: number; max: number };
export type TensionForce = ForceRange | 'nr' | null;

export type TensionRow = {
  section: string;
  family: 'classical' | 'narrow';
  sheave: string;
  rpm: string | null;
  ratio: string | null;
  /** Wrapped classical or narrow belt. "nr" is not recommended. Null is not listed. */
  wrapped: TensionForce;
  cogged: TensionForce;
  haystack: string;
};

export type PulleyNote = { id: string; title: string; body: string; haystack: string };

export type BushingStyle = {
  id: 'qd' | 'taper-lock';
  name: string;
  flange: boolean;
  split: string;
  /** Inches of taper per foot, from the Martin nomenclature card. */
  taperInPerFt: number;
  body: string;
  haystack: string;
};

export type ChainSize = { number: number; pitchInches: number; haystack: string };

export type SpeedRatioResult = {
  n1: number;
  d1: number;
  n2: number;
  d2: number;
  speedRatio: number;
  driverFpm: number;
  drivenFpm: number;
};

export type HorsepowerResult = { hp: number; torqueFtLb: number; rpm: number };

const force = (min: number, max: number): ForceRange => ({ min, max });

export const TENSION_ROWS: TensionRow[] = [
  row('A', 'classical', '2.2', null, null, 'nr', force(3.8, 5.4)),
  row('A', 'classical', '3.2', '1750–3600', '2.0–4.0', force(3.1, 4.5), force(3.9, 5.6)),
  row('A', 'classical', '3.4–3.6', '1750–3600', '2.0–4.0', force(3.5, 5.0), force(4.1, 5.9)),
  row('A', 'classical', '3.8–4.2', '1750–3600', '2.0–4.0', force(3.8, 5.4), force(4.3, 6.3)),
  row('A', 'classical', '4.6–7.0', '1750–3600', '2.0–4.0', force(4.6, 6.6), force(4.9, 7.1)),
  row('B', 'classical', '4.0', null, null, 'nr', force(7.1, 10)),
  row('B', 'classical', '5.0–5.2', '1160–1800', '2.0–4.0', 'nr', force(7.3, 11)),
  row('B', 'classical', '5.4–5.6', '1160–1800', '2.0–4.0', force(6.0, 8.8), force(7.4, 11)),
  row('B', 'classical', '6.0–6.8', '1160–1800', '2.0–4.0', force(6.6, 9.6), force(7.7, 11)),
  row('B', 'classical', '7.4–9.4', '1160–1800', '2.0–4.0', force(7.4, 11), force(7.9, 12)),
  row('C', 'classical', '6.8', null, null, 'nr', force(12, 18)),
  row('C', 'classical', '7.5', '870–1800', '2.0–4.0', 'nr', force(12, 18)),
  row('C', 'classical', '8.0–8.5', '870–1800', '2.0–4.0', 'nr', force(13, 18)),
  row('C', 'classical', '9.0–10.5', '870–1800', '2.0–4.0', force(12, 17), force(13, 19)),
  row('C', 'classical', '11.0–16.0', '870–1800', '2.0–4.0', force(13, 20), force(13, 19)),
  row('D', 'classical', '13.0', '690–1200', '2.0–4.0', force(20, 29), null),
  row('D', 'classical', '13.5–15.5', '690–1200', '2.0–4.0', force(22, 33), null),
  row('D', 'classical', '16.0–22.0', '690–1200', '2.0–4.0', force(25, 37), null),
  row('E', 'classical', '21.6', '435–900', '2.0–4.0', force(33, 48), null),
  row('E', 'classical', '24.0', '435–900', '2.0–4.0', force(33, 48), null),
  row('3V', 'narrow', '2.20', '1200–3600', null, 'nr', force(2.8, 4.1)),
  row('3V', 'narrow', '2.35–2.50', '1200–3600', null, 'nr', force(3.2, 4.7)),
  row('3V', 'narrow', '2.65–2.80', '1200–3600', '2.00–4.00', force(3.2, 4.7), force(3.5, 5.1)),
  row('3V', 'narrow', '3.00–3.15', '1200–3600', '2.00–4.00', force(3.6, 5.3), force(3.8, 5.5)),
  row('3V', 'narrow', '3.35–3.65', '1200–3600', '2.00–4.00', force(4.1, 5.9), force(4.1, 6.0)),
  row('3V', 'narrow', '4.12–5.00', '900–3600', null, force(4.7, 6.8), force(4.8, 7.1)),
  row('3V', 'narrow', '5.30–6.90', '900–3600', null, force(5.2, 7.6), force(5.8, 8.6)),
  row('5V', 'narrow', '4.40–4.65', '1200–3600', null, 'nr', force(9, 13)),
  row('5V', 'narrow', '4.90–5.50', '1200–3600', null, 'nr', force(10, 15)),
  row('5V', 'narrow', '5.90–6.70', '1200–3600', '2.00–4.00', 'nr', force(11, 17)),
  row('5V', 'narrow', '7.10–8.00', '600–1800', '2.00–4.00', force(11, 17), force(13, 19)),
  row('5V', 'narrow', '8.50–10.90', '600–1800', '2.00–4.00', force(13, 19), force(14, 20)),
  row('5V', 'narrow', '11.80–16.00', '400–1200', null, force(15, 22), force(15, 23)),
  row('8V', 'narrow', '12.50–17.00', '600–1200', '2.00–4.00', force(31, 45), null),
  row('8V', 'narrow', '18.00–24.00', '400–900', '2.00–4.00', force(36, 53), null),
];

export const BUSHINGS: BushingStyle[] = [
  {
    id: 'qd',
    name: 'QD',
    flange: true,
    split: 'Single split through the whole bushing',
    taperInPerFt: 0.75,
    body: 'Flanged quick-detachable bushing. Cap screws pull it into the hub. To remove it, move those screws into the tapped holes in the sheave so they push against the flange. The published taper is 3/4 in per foot. It is not interchangeable with a taper-lock bushing.',
    haystack: 'QD Flanged quick-detachable bushing. Cap screws pull it into the hub. To remove it, move those screws into the tapped holes in the sheave so they push against the flange. The published taper is 3/4 in per foot. It is not interchangeable with a taper-lock bushing.',
  },
  {
    id: 'taper-lock',
    name: 'Taper-lock',
    flange: false,
    split: 'Single split through the whole bushing',
    taperInPerFt: 1.678,
    body: 'Flangeless bushing. Screws draw it into the hub until the face sits flush. The published taper for this style is 1.678 in per foot. It is not interchangeable with a QD bushing.',
    haystack: 'Taper-lock Flangeless bushing. Screws draw it into the hub until the face sits flush. The published taper for this style is 1.678 in per foot. It is not interchangeable with a QD bushing.',
  },
];

export const PULLEY_NOTES: PulleyNote[] = [
  {
    id: 'classical-sheave',
    title: 'Classical V-sheave',
    body: 'Grooves for A, B, C, or D. The sheave is usually stamped with the section and the datum diameter. Match the groove top width to the section table. The bushing, when it has one, is QD or taper-lock and is a separate piece from the groove.',
    haystack: 'Classical V-sheave Grooves for A, B, C, or D. The sheave is usually stamped with the section and the datum diameter. Match the groove top width to the section table. The bushing, when it has one, is QD or taper-lock and is a separate piece from the groove.',
  },
  {
    id: 'narrow-sheave',
    title: 'Narrow V-sheave',
    body: 'Grooves for 3V, 5V, or 8V. A 5V groove is 5/8 in across the top. A B groove is 21/32 in. They are not the same sheave.',
    haystack: 'Narrow V-sheave Grooves for 3V, 5V, or 8V. A 5V groove is 5/8 in across the top. A B groove is 21/32 in. They are not the same sheave.',
  },
  {
    id: 'timing-pulley',
    title: 'Timing pulley',
    body: 'Teeth match the belt pitch on this chart. Pitch diameter is the tooth count times the pitch, divided by π. A flange on one or both sides keeps the belt on.',
    haystack: 'Timing pulley Teeth match the belt pitch on this chart. Pitch diameter is the tooth count times the pitch, divided by π. A flange on one or both sides keeps the belt on.',
  },
  {
    id: 'sprocket',
    title: 'Sprocket',
    body: 'Roller chain, not a belt. Pitch is the distance from one tooth to the next. The ANSI chain number gives that pitch: divide the number by 10, drop the fraction, and divide by 8. Chain 40 and chain 41 are both 1/2 in pitch. 41 is the light series.',
    haystack: 'Sprocket Roller chain, not a belt. Pitch is the distance from one tooth to the next. The ANSI chain number gives that pitch: divide the number by 10, drop the fraction, and divide by 8. Chain 40 and chain 41 are both 1/2 in pitch. 41 is the light series.',
  },
  {
    id: 'flat-pulley',
    title: 'Flat and crowned pulley',
    body: 'No groove. The face is higher at the center so a flat belt tracks to the middle. Measure the face width and the outside diameter. The open-belt length uses those outside diameters.',
    haystack: 'Flat and crowned pulley No groove. The face is higher at the center so a flat belt tracks to the middle. Measure the face width and the outside diameter. The open-belt length uses those outside diameters.',
  },
  {
    id: 'split-taper',
    title: 'Split taper',
    body: 'A third bushing, not a QD and not a taper-lock. It is flanged, with a double split through the barrel only and an external key. The styles do not interchange.',
    haystack: 'Split taper A third bushing, not a QD and not a taper-lock. It is flanged, with a double split through the barrel only and an external key. The styles do not interchange.',
  },
];

const CHAIN_NUMBERS = [25, 35, 40, 41, 50, 60, 80, 100, 120, 140, 160, 200];

export const CHAIN_SIZES: ChainSize[] = CHAIN_NUMBERS.map((number) => {
  const pitchInches = ansiRollerPitchInches(number);
  return { number, pitchInches, haystack: `sprocket chain ${number} ${pitchInches}` };
});

export function ansiRollerPitchInches(chainNumber: number): number {
  if (!Number.isInteger(chainNumber) || chainNumber < 20) throw new Error('Enter an ANSI roller chain number such as 40 or 80.');
  return Math.floor(chainNumber / 10) / 8;
}

export function timingPitchDiameter(teeth: number, pitch: number): number {
  return (requirePositive(teeth, 'Tooth count') * requirePositive(pitch, 'Pitch')) / Math.PI;
}

/** Feet per minute. D is inches, N is rpm. */
export function beltSpeedFpm(diameterInches: number, rpm: number): number {
  return (Math.PI * requirePositive(diameterInches, 'Diameter') * requirePositive(rpm, 'Speed')) / 12;
}

export function spanDeflectionInches(spanInches: number): number {
  return requirePositive(spanInches, 'Span') * DEFLECTION_PER_INCH;
}

export function deflectionExample(): { span: number; inches: number; fraction: string } {
  const span = 32;
  const inches = spanDeflectionInches(span);
  return { span, inches, fraction: formatFraction(span) };
}

export function solveSpeedRatio(input: { n1?: number | null; d1?: number | null; n2?: number | null; d2?: number | null }): SpeedRatioResult {
  const known = [input.n1, input.d1, input.n2, input.d2].filter((value) => value != null);
  if (known.length < 3) throw new Error('Enter three of the four values.');
  const n1 = input.n1 == null ? null : requirePositive(input.n1, 'Driver speed');
  const d1 = input.d1 == null ? null : requirePositive(input.d1, 'Driver diameter');
  const n2 = input.n2 == null ? null : requirePositive(input.n2, 'Driven speed');
  const d2 = input.d2 == null ? null : requirePositive(input.d2, 'Driven diameter');
  const solvedN1 = n1 ?? (n2! * d2!) / d1!;
  const solvedD1 = d1 ?? (n2! * d2!) / n1!;
  const solvedN2 = n2 ?? (n1! * d1!) / d2!;
  const solvedD2 = d2 ?? (n1! * d1!) / n2!;
  const left = solvedN1 * solvedD1;
  const right = solvedN2 * solvedD2;
  if (Math.abs(left - right) > 1e-6 * Math.max(Math.abs(left), Math.abs(right))) {
    throw new Error('Those four values do not satisfy N1×D1 = N2×D2.');
  }
  return {
    n1: solvedN1,
    d1: solvedD1,
    n2: solvedN2,
    d2: solvedD2,
    speedRatio: solvedN1 / solvedN2,
    driverFpm: beltSpeedFpm(solvedD1, solvedN1),
    drivenFpm: beltSpeedFpm(solvedD2, solvedN2),
  };
}

export function solveHorsepower(input: { hp?: number | null; torqueFtLb?: number | null; rpm?: number | null }): HorsepowerResult {
  const known = [input.hp, input.torqueFtLb, input.rpm].filter((value) => value != null);
  if (known.length < 2) throw new Error('Enter two of horsepower, torque, and rpm.');
  const hp = input.hp == null ? null : requirePositive(input.hp, 'Horsepower');
  const torque = input.torqueFtLb == null ? null : requirePositive(input.torqueFtLb, 'Torque');
  const rpm = input.rpm == null ? null : requirePositive(input.rpm, 'Speed');
  const solvedHp = hp ?? (torque! * rpm!) / HP_TORQUE_CONSTANT;
  const solvedTorque = torque ?? (hp! * HP_TORQUE_CONSTANT) / rpm!;
  const solvedRpm = rpm ?? (hp! * HP_TORQUE_CONSTANT) / torque!;
  const expected = (solvedTorque * solvedRpm) / HP_TORQUE_CONSTANT;
  if (Math.abs(solvedHp - expected) > 1e-6 * Math.max(Math.abs(solvedHp), Math.abs(expected), 1)) {
    throw new Error('Those three values do not satisfy HP = T×RPM/5252.');
  }
  return { hp: solvedHp, torqueFtLb: solvedTorque, rpm: solvedRpm };
}

export function horsepowerFromInchPounds(torqueInLb: number, rpm: number): number {
  return (requirePositive(torqueInLb, 'Torque') * requirePositive(rpm, 'Speed')) / HP_INCH_LB_CONSTANT;
}

export function formatForce(value: TensionForce): string {
  if (value === 'nr') return 'Not recommended';
  if (value == null) return '—';
  return `${trimNumber(value.min)}–${trimNumber(value.max)} lb`;
}

export function beltDriveHtml(): string {
  const pulleys = PULLEY_NOTES.map((item) => `<h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.body)}</p>`).join('');
  const bushings = BUSHINGS.map(
    (item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.flange ? 'Yes' : 'No'}</td><td>${item.taperInPerFt}</td><td>${escapeHtml(item.split)}</td></tr>`,
  ).join('');
  const chains = CHAIN_SIZES.map((item) => `<tr><td>${item.number}</td><td>${trimNumber(item.pitchInches)} in</td></tr>`).join('');
  const example = deflectionExample();
  const tension = TENSION_ROWS.map(
    (item) =>
      `<tr><td>${escapeHtml(item.section)}</td><td>${escapeHtml(item.sheave)}</td><td>${escapeHtml(item.rpm ?? '—')}</td><td>${escapeHtml(item.ratio ?? '—')}</td><td>${escapeHtml(formatForce(item.wrapped))}</td><td>${escapeHtml(formatForce(item.cogged))}</td></tr>`,
  ).join('');
  return `${pulleys}
  <h2>Bushings</h2>
  <table><thead><tr><th>Style</th><th>Flange</th><th>Taper, in/ft</th><th>Split</th></tr></thead><tbody>${bushings}</tbody></table>
  <h2>ANSI roller chain pitch</h2>
  <table><thead><tr><th>Chain</th><th>Pitch</th></tr></thead><tbody>${chains}</tbody></table>
  <h2>Speed ratio and belt speed</h2>
  <p>${escapeHtml(SPEED_RATIO_FORMULA)}. ${escapeHtml(BELT_SPEED_FORMULA)}, with V in ft/min and D in inches. ${escapeHtml(DRIVE_COPY)}</p>
  <h2>Horsepower and torque</h2>
  <p>${escapeHtml(HP_TORQUE_FORMULA)}. ${escapeHtml(HP_COPY)}</p>
  <p>${escapeHtml(HP_CAPACITY_COPY)}</p>
  <h2>Installation tension</h2>
  <p>${escapeHtml(DEFLECTION_COPY)} Example: a ${example.span} in span deflects ${escapeHtml(example.fraction)} in.</p>
  <p>${escapeHtml(NEW_BELT_COPY)}</p>
  <table><thead><tr><th>Section</th><th>Small sheave, in</th><th>rpm</th><th>Ratio</th><th>Wrapped, lb</th><th>Cogged, lb</th></tr></thead><tbody>${tension}</tbody></table>
  <h2>Alignment and run-in</h2>
  <p>${escapeHtml(ALIGNMENT_COPY)}</p>
  ${beltTensionHtml()}`;
}

function row(
  section: string,
  family: 'classical' | 'narrow',
  sheave: string,
  rpm: string | null,
  ratio: string | null,
  wrapped: TensionForce,
  cogged: TensionForce,
): TensionRow {
  const item: TensionRow = { section, family, sheave, rpm, ratio, wrapped, cogged, haystack: '' };
  item.haystack = `${section} ${family} ${sheave} ${rpm ?? ''} ${ratio ?? ''} ${formatForce(wrapped)} ${formatForce(cogged)}`;
  return item;
}

function trimNumber(value: number): string {
  return String(value);
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
