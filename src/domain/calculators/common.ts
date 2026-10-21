/** Shown on every calculator. Not a permission to do the work. */
export const CALC_DISCLAIMER = 'Verify against OEM specs and site procedures.';

export const FORMULA_VERSION = '2026-10-10.1';

export type CalcWarning = { tone: 'warning'; message: string };

export function roundTo(value: number, places: number): number {
  const factor = 10 ** places;
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function finiteNumber(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be a number.`);
  return value;
}

export function requirePositive(value: number, label: string): number {
  finiteNumber(value, label);
  if (value <= 0) throw new Error(`${label} must be greater than zero.`);
  return value;
}
