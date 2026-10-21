import { CALC_DISCLAIMER, FORMULA_VERSION, finiteNumber, requirePositive, roundTo } from '@/src/domain/calculators/common';
import type { UnitSystem } from '@/src/domain/calculators/affinity';

export type BeltResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  basis: string;
  warnings: string[];
  ratio: number;
  drivenRpm: number;
  linearSpeed: number | null;
  effectiveTension: number | null;
};

/**
 * Speed ratio = driven size / driver size. That is a reduction when the driven side is larger.
 * Driven rpm = driver rpm / ratio.
 * Belt or chain speed uses the driver pitch diameter.
 * Effective tension = power / linear speed. Installation tension is higher and comes from the maker.
 */
export function beltDrive(input: {
  system: UnitSystem;
  kind: 'belt' | 'chain';
  driverSize: number;
  drivenSize: number;
  driverRpm: number;
  pitchDiameter: number | null;
  power: number | null;
}): BeltResult {
  const driver = requirePositive(input.driverSize, input.kind === 'chain' ? 'Driver teeth or diameter' : 'Driver diameter');
  const driven = requirePositive(input.drivenSize, input.kind === 'chain' ? 'Driven teeth or diameter' : 'Driven diameter');
  const rpm = requirePositive(input.driverRpm, 'Driver speed');
  const ratio = driven / driver;
  const drivenRpm = rpm / ratio;
  const diameter = input.pitchDiameter == null ? (input.kind === 'belt' ? driver : null) : input.pitchDiameter;
  let linearSpeed: number | null = null;
  let effectiveTension: number | null = null;
  if (diameter != null) {
    const pitch = requirePositive(diameter, 'Pitch diameter');
    linearSpeed = linearSpeedOf(pitch, rpm, input.system);
    if (input.power != null) {
      const power = finiteNumber(input.power, 'Power');
      if (power < 0) throw new Error('Power cannot be negative.');
      if (power > 0) effectiveTension = tensionOf(power, linearSpeed, input.system);
    }
  }
  const warnings: string[] = [];
  if (ratio > 6) warnings.push('The ratio is above 6. A single belt or chain reduction that large is hard on the wrap. Check the maker.');
  const name = input.kind === 'chain' ? 'chain' : 'belt';
  return {
    formulaVersion: FORMULA_VERSION,
    formula: `Speed ratio = driven / driver. ${name} speed = π × pitch diameter × rpm. Effective tension = power / speed.`,
    units:
      input.system === 'metric'
        ? 'Diameter in mm, speed in rpm, power in kW, linear speed in m/s, tension in N.'
        : 'Diameter in inches, speed in rpm, power in hp, linear speed in ft/min, tension in lbf.',
    disclaimer: CALC_DISCLAIMER,
    basis: '',
    warnings,
    ratio: roundTo(ratio, 6),
    drivenRpm: roundTo(drivenRpm, 6),
    linearSpeed: linearSpeed == null ? null : roundTo(linearSpeed, 6),
    effectiveTension: effectiveTension == null ? null : roundTo(effectiveTension, 6),
  };
}


function linearSpeedOf(diameter: number, rpm: number, system: UnitSystem): number {
  if (system === 'metric') return (Math.PI * (diameter / 1000) * rpm) / 60;
  return (Math.PI * diameter * rpm) / 12;
}

function tensionOf(power: number, speed: number, system: UnitSystem): number {
  if (speed <= 0) throw new Error('Linear speed must be greater than zero.');
  if (system === 'metric') return (power * 1000) / speed;
  return (power * 33000) / speed;
}
