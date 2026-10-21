import { API_610_PUMPS, NPSH_NOTE } from '@/src/domain/calculators/apiNotes';
import { CALC_DISCLAIMER, FORMULA_VERSION, finiteNumber, requirePositive, roundTo } from '@/src/domain/calculators/common';
import type { UnitSystem } from '@/src/domain/calculators/affinity';

export type NpshResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  basis: string;
  note: string;
  warnings: string[];
  margin: number;
  ratio: number;
};

/** Margin = NPSHa − NPSHr. Ratio = NPSHa / NPSHr. Both heads must already be in the same unit. */
export function npshMargin(npsha: number, npshr: number, system: UnitSystem): NpshResult {
  const available = finiteNumber(npsha, 'NPSHa');
  const required = requirePositive(npshr, 'NPSHr');
  const margin = available - required;
  const ratio = available / required;
  const warnings: string[] = [];
  if (margin <= 0) warnings.push('Available NPSH does not cover the vendor figure. Stop and check the suction and the OEM curve before you run it.');
  else if (ratio < 1.1) warnings.push('The margin is thin. That 1.1 screen is field judgment, not an API limit. Confirm the service on the OEM curve.');
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'Margin = NPSHa − NPSHr. Ratio = NPSHa / NPSHr.',
    units: system === 'metric' ? 'Both heads are meters of liquid.' : 'Both heads are feet of liquid.',
    disclaimer: CALC_DISCLAIMER,
    basis: API_610_PUMPS,
    note: NPSH_NOTE,
    warnings,
    margin: roundTo(margin, 6),
    ratio: roundTo(ratio, 6),
  };
}
