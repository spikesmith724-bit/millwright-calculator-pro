import { API_BEARING_LIFE, BEARING_NOTE } from '@/src/domain/calculators/apiNotes';
import { CALC_DISCLAIMER, FORMULA_VERSION, finiteNumber, requirePositive, roundTo } from '@/src/domain/calculators/common';
import type { UnitSystem } from '@/src/domain/calculators/affinity';

export type BearingLifeResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  basis: string;
  note: string;
  warnings: string[];
  hours: number;
  revolutions: number;
  exponent: number;
};

/**
 * Basic rating life, ISO 281 / ABMA.
 * L10 revolutions = (C/P)^p × 10^6
 * p = 3 for ball bearings, 10/3 for roller bearings.
 * Hours = revolutions / (rpm × 60)
 * C and P must be the same force unit.
 */
export function bearingL10(input: {
  system: UnitSystem;
  kind: 'ball' | 'roller';
  capacity: number;
  load: number;
  rpm: number;
  requiredHours?: number | null;
}): BearingLifeResult {
  const capacity = requirePositive(input.capacity, 'Dynamic capacity');
  const load = requirePositive(input.load, 'Equivalent load');
  const rpm = requirePositive(input.rpm, 'Speed');
  const exponent = input.kind === 'roller' ? 10 / 3 : 3;
  const revolutions = (capacity / load) ** exponent * 1_000_000;
  const hours = revolutions / (rpm * 60);
  const warnings: string[] = [];
  if (input.requiredHours != null) {
    const required = finiteNumber(input.requiredHours, 'Life to compare');
    if (required <= 0) throw new Error('Life to compare must be greater than zero.');
    if (hours < required) warnings.push('Calculated L10 is under the life you entered. That comparison is yours, not a clause from API 610 or API 613.');
  }
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'L10 revolutions = (C/P)^p × 1,000,000. Ball bearings use p = 3. Roller bearings use p = 10/3. Hours = revolutions / (rpm × 60).',
    units: input.system === 'metric' ? 'Capacity and load in newtons. Speed in rpm. Life in hours.' : 'Capacity and load in lbf. Speed in rpm. Life in hours.',
    disclaimer: CALC_DISCLAIMER,
    basis: API_BEARING_LIFE,
    note: BEARING_NOTE,
    warnings,
    hours: roundTo(hours, 6),
    revolutions: roundTo(revolutions, 3),
    exponent,
  };
}
