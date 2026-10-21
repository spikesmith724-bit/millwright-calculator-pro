import { CALC_DISCLAIMER, FORMULA_VERSION, finiteNumber, requirePositive } from '@/src/domain/calculators/common';

/** 1 ft·lbf = 1.3558179483314004 N·m, and 1 hp = 550 ft·lbf/s. */
export const HP_TO_KW = (550 * 1.3558179483314004) / 1000;

/** 1 psi = 6894.757293168361 Pa, so this many kPa. */
export const PSI_TO_KPA = 6.894757293168361;

export const FT_TO_M = 0.3048;

export const G = 9.80665;

/** 1 US gpm = 0.22712470704 m³/h. Matches the existing flow conversion. */
export const GPM_TO_M3H = 0.22712470704;

/** 1 US gallon = 3.785411784 L. */
export const GPM_TO_LS = 3.785411784 / 60;

export type FieldUnitKind = 'flow' | 'pressure' | 'head' | 'power';

export type FieldUnitResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  basis: string;
  value: number;
};

const PRESSURE = ['psi', 'kpa', 'bar'] as const;
const HEAD = ['ft', 'm'] as const;

/**
 * Head uses SG relative to water at 1000 kg/m³ and standard gravity.
 * Feet of fluid = psi × (kPa per psi) / (SG × g × ft per m).
 */
export function convertFieldUnits(input: { kind: FieldUnitKind; value: number; from: string; to: string; sg?: number | null }): FieldUnitResult {
  const value = finiteNumber(input.value, 'Value');
  if (input.from === input.to) {
    return finish(input.kind, value, 'Same unit. No factor applied.', unitSentence(input.kind, input.from, input.to));
  }
  if (input.kind === 'power') return finish(input.kind, convertPower(value, input.from, input.to), 'hp and kW use 1 hp = 550 ft·lbf/s.', unitSentence(input.kind, input.from, input.to));
  if (input.kind === 'flow') return finish(input.kind, convertFlow(value, input.from, input.to), 'gpm, m³/h, and L/s use the US gallon of 3.785411784 L.', unitSentence(input.kind, input.from, input.to));
  return convertHeadOrPressure(value, input.from, input.to, input.sg ?? null);
}

function convertHeadOrPressure(value: number, from: string, to: string, sg: number | null): FieldUnitResult {
  const fromPressure = isPressure(from);
  const toPressure = isPressure(to);
  const fromHead = isHead(from);
  const toHead = isHead(to);
  if (!fromPressure && !fromHead) throw new Error('Choose a pressure or head unit.');
  if (!toPressure && !toHead) throw new Error('Choose a pressure or head unit.');
  if (fromPressure && toPressure) {
    return finish('pressure', fromPa(toPa(value, from), to), 'psi, kPa, and bar use the defined pascal.', unitSentence('pressure', from, to));
  }
  if (fromHead && toHead) {
    const meters = from === 'ft' ? value * FT_TO_M : value;
    const out = to === 'ft' ? meters / FT_TO_M : meters;
    return finish('head', out, 'Feet and meters of the same fluid. Specific gravity cancels.', unitSentence('head', from, to));
  }
  const gravity = sg == null ? Number.NaN : sg;
  const specific = requirePositive(gravity, 'Specific gravity');
  const pascals = fromPressure ? toPa(value, from) : headToPa(from === 'ft' ? value * FT_TO_M : value, specific);
  const out = toPressure ? fromPa(pascals, to) : paToHead(pascals, specific, to === 'ft' ? 'ft' : 'm');
  return finish('head', out, 'Head = pressure / (specific gravity × 1000 kg/m³ × 9.80665 m/s²).', `SG ${specific}. ${from} to ${to}.`);
}

function convertFlow(value: number, from: string, to: string): number {
  const gpm = toGpm(value, from);
  if (to === 'gpm') return gpm;
  if (to === 'm3h') return gpm * GPM_TO_M3H;
  if (to === 'ls') return gpm * GPM_TO_LS;
  throw new Error('Choose a flow unit.');
}

function toGpm(value: number, unit: string): number {
  if (unit === 'gpm') return value;
  if (unit === 'm3h') return value / GPM_TO_M3H;
  if (unit === 'ls') return value / GPM_TO_LS;
  throw new Error('Choose a flow unit.');
}

function convertPower(value: number, from: string, to: string): number {
  if (from === 'hp' && to === 'kw') return value * HP_TO_KW;
  if (from === 'kw' && to === 'hp') return value / HP_TO_KW;
  throw new Error('Choose a power unit.');
}

function toPa(value: number, unit: string): number {
  if (unit === 'psi') return value * PSI_TO_KPA * 1000;
  if (unit === 'kpa') return value * 1000;
  if (unit === 'bar') return value * 100000;
  throw new Error('Choose a pressure unit.');
}

function fromPa(pascals: number, unit: string): number {
  if (unit === 'psi') return pascals / (PSI_TO_KPA * 1000);
  if (unit === 'kpa') return pascals / 1000;
  if (unit === 'bar') return pascals / 100000;
  throw new Error('Choose a pressure unit.');
}

function headToPa(meters: number, sg: number): number {
  return meters * sg * 1000 * G;
}

function paToHead(pascals: number, sg: number, unit: 'ft' | 'm'): number {
  const meters = pascals / (sg * 1000 * G);
  return unit === 'ft' ? meters / FT_TO_M : meters;
}

function isPressure(unit: string): boolean {
  return (PRESSURE as readonly string[]).includes(unit);
}

function isHead(unit: string): boolean {
  return (HEAD as readonly string[]).includes(unit);
}

function unitSentence(kind: FieldUnitKind, from: string, to: string): string {
  return `${kind}: ${from} to ${to}.`;
}

function finish(kind: FieldUnitKind, value: number, formula: string, units: string): FieldUnitResult {
  return {
    formulaVersion: FORMULA_VERSION,
    formula,
    units,
    disclaimer: CALC_DISCLAIMER,
    basis: '',
    value,
  };
}

export const FIELD_UNIT_CHOICES: Record<FieldUnitKind, { id: string; label: string }[]> = {
  flow: [
    { id: 'gpm', label: 'gpm (US)' },
    { id: 'm3h', label: 'm³/h' },
    { id: 'ls', label: 'L/s' },
  ],
  pressure: [
    { id: 'psi', label: 'psi' },
    { id: 'kpa', label: 'kPa' },
    { id: 'bar', label: 'bar' },
  ],
  head: [
    { id: 'psi', label: 'psi' },
    { id: 'kpa', label: 'kPa' },
    { id: 'bar', label: 'bar' },
    { id: 'ft', label: 'ft of fluid' },
    { id: 'm', label: 'm of fluid' },
  ],
  power: [
    { id: 'hp', label: 'hp' },
    { id: 'kw', label: 'kW' },
  ],
};

export const FIELD_UNIT_PAIRS: Record<FieldUnitKind, { us: [string, string]; metric: [string, string] }> = {
  flow: { us: ['gpm', 'm3h'], metric: ['m3h', 'gpm'] },
  pressure: { us: ['psi', 'kpa'], metric: ['kpa', 'psi'] },
  head: { us: ['psi', 'ft'], metric: ['kpa', 'm'] },
  power: { us: ['hp', 'kw'], metric: ['kw', 'hp'] },
};
