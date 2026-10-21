import { CALC_DISCLAIMER, FORMULA_VERSION, requirePositive, roundTo } from '@/src/domain/calculators/common';

export const SLING_WARNING = 'The angle from horizontal is under 30°. Tension rises quickly. Check the sling tag and the lift plan before anyone is under the load.';

export type SlingResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  tensionPerLeg: number;
  angleFactor: number;
  sharePerLeg: number;
  warnings: string[];
};

/**
 * Tension per leg = (load / number of legs) / sin(angle from horizontal).
 * The angle factor is 1 / sin(angle). This is geometry only.
 * It is not a working-load limit and it does not replace the tag on the sling.
 */
export function slingTension(load: number, legs: number, angleFromHorizontalDeg: number): SlingResult {
  const weight = requirePositive(load, 'Load');
  if (!Number.isInteger(legs) || legs < 1) throw new Error('Enter at least one leg.');
  if (!Number.isFinite(angleFromHorizontalDeg) || angleFromHorizontalDeg <= 0 || angleFromHorizontalDeg >= 90) {
    throw new Error('The angle from horizontal must be between 0° and 90°.');
  }
  const radians = (angleFromHorizontalDeg * Math.PI) / 180;
  const sine = Math.sin(radians);
  const share = weight / legs;
  const factor = 1 / sine;
  const warnings = angleFromHorizontalDeg < 30 ? [SLING_WARNING] : [];
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'Tension per leg = (load / legs) / sin(angle from horizontal). Angle factor = 1 / sin(angle).',
    units: 'Load and tension are in the unit you entered. The angle is degrees from horizontal.',
    disclaimer: CALC_DISCLAIMER,
    tensionPerLeg: roundTo(share * factor, 3),
    angleFactor: roundTo(factor, 4),
    sharePerLeg: roundTo(share, 3),
    warnings,
  };
}
