import { CALC_DISCLAIMER, FORMULA_VERSION, finiteNumber, requirePositive, roundTo } from '@/src/domain/calculators/common';

export type UnitSystem = 'us' | 'metric';

export type AffinityResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  basis: string;
  warnings: string[];
  flow: number;
  head: number;
  power: number;
  speedRatio: number;
  diameterRatio: number;
};

/**
 * Q2/Q1 = (N2/N1)·(D2/D1)
 * H2/H1 = (N2/N1)²·(D2/D1)²
 * P2/P1 = (N2/N1)³·(D2/D1)³
 * Same fluid. Efficiency is assumed unchanged, which is weak for a large change.
 */
export function pumpAffinity(input: {
  flow: number;
  head: number;
  power: number;
  speed1: number;
  speed2: number;
  diameter1: number;
  diameter2: number;
  system: UnitSystem;
}): AffinityResult {
  const flow = finiteNumber(input.flow, 'Flow');
  const head = finiteNumber(input.head, 'Head');
  const power = finiteNumber(input.power, 'Power');
  if (flow < 0 || head < 0 || power < 0) throw new Error('Flow, head, and power cannot be negative.');
  const speed1 = requirePositive(input.speed1, 'Present speed');
  const speed2 = requirePositive(input.speed2, 'New speed');
  const diameter1 = requirePositive(input.diameter1, 'Present diameter');
  const diameter2 = requirePositive(input.diameter2, 'New diameter');
  const speedRatio = speed2 / speed1;
  const diameterRatio = diameter2 / diameter1;
  const scale = speedRatio * diameterRatio;
  const warnings: string[] = [];
  if (speedRatio < 0.8 || speedRatio > 1.2 || diameterRatio < 0.8 || diameterRatio > 1.2) {
    warnings.push('The speed or diameter change is large. Affinity laws assume the efficiency stays about the same, and a big change usually does not.');
  }
  const units =
    input.system === 'metric'
      ? 'Flow in m³/h, head in m, power in kW, speed in rpm, diameter in mm.'
      : 'Flow in gpm, head in ft, power in hp, speed in rpm, diameter in inches.';
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'Flow scales with speed and diameter. Head scales with the square. Power scales with the cube.',
    units,
    disclaimer: CALC_DISCLAIMER,
    basis: '',
    warnings,
    flow: roundTo(flow * scale, 6),
    head: roundTo(head * scale * scale, 6),
    power: roundTo(power * scale * scale * scale, 6),
    speedRatio: roundTo(speedRatio, 6),
    diameterRatio: roundTo(diameterRatio, 6),
  };
}
