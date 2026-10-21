import { CALC_DISCLAIMER, FORMULA_VERSION, requirePositive, roundTo } from '@/src/domain/calculators/common';

export type BoltHole = {
  index: number;
  angleDeg: number;
  x: number;
  y: number;
};

export type BoltCircleResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  holes: BoltHole[];
};

/**
 * 0° is 12 o'clock. Angles increase clockwise, which matches a bolt pattern viewed from the coupling end.
 * x is positive to the right, y is positive up.
 * x = (D/2) · sin(θ), y = (D/2) · cos(θ).
 */
export function boltCircle(diameter: number, count: number, startAngleDeg: number): BoltCircleResult {
  const size = requirePositive(diameter, 'Bolt circle diameter');
  if (!Number.isInteger(count) || count < 2 || count > 64) throw new Error('Use between 2 and 64 holes.');
  if (!Number.isFinite(startAngleDeg)) throw new Error('Start angle must be a number.');
  const radius = size / 2;
  const step = 360 / count;
  const holes = Array.from({ length: count }, (_, index) => {
    const angle = startAngleDeg + index * step;
    const radians = (angle * Math.PI) / 180;
    return {
      index: index + 1,
      angleDeg: roundTo(angle, 3),
      x: roundTo(radius * Math.sin(radians), 4),
      y: roundTo(radius * Math.cos(radians), 4),
    };
  });
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'x = (D/2) · sin(θ), y = (D/2) · cos(θ). θ starts at 12 o’clock and increases clockwise.',
    units: 'Diameter and coordinates use the unit you entered for the diameter.',
    disclaimer: CALC_DISCLAIMER,
    holes,
  };
}
