import { API_670_VIBRATION } from '@/src/domain/calculators/apiNotes';
import { CALC_DISCLAIMER, FORMULA_VERSION, finiteNumber, requirePositive, roundTo } from '@/src/domain/calculators/common';
import type { UnitSystem } from '@/src/domain/calculators/affinity';
import { HP_TO_KW } from '@/src/domain/calculators/fieldUnits';

/** Standard gravity, 9.80665 m/s², expressed in inches per second squared. */
export const G_IN_PER_S2 = 9.80665 / 0.0254;

export const STEEL_E_PSI = 29_000_000;
export const STEEL_E_GPA = 200;

const SEAL_BASIS = 'Based on API 682, seals';

export const DEFLECTION_NOTE =
  'The beam formula assumes one diameter, a fixed support at the bearing, and the load at the impeller. API 682 is about the seal, not this deflection. Compare the number with the seal maker. It is not an API limit.';

export const CRITICAL_NOTE =
  'First critical speed here is the single-mass estimate from static deflection. API 670 is about machinery protection and vibration, and it does not set this margin. Many mixer makers want running speed below the first critical by a margin they publish. Use theirs.';

export const TIP_NOTE = 'Tip speed is geometry from the diameter and the speed. It is not an API rating.';

export const POWER_NOTE =
  'Power uses the power number you entered for this impeller. That number is not looked up from an API table. Density is water at 1000 kg/m³ times the specific gravity you entered.';

export type AgitatorDeflection = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  basis: string;
  note: string;
  warnings: string[];
  atSeal: number;
  atImpeller: number;
  criticalRpm: number;
  margin: number | null;
};

export type AgitatorCritical = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  basis: string;
  note: string;
  warnings: string[];
  criticalRpm: number;
  margin: number | null;
};

export type AgitatorTip = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  basis: string;
  note: string;
  warnings: string[];
  tipSpeed: number;
};

export type AgitatorPower = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  basis: string;
  note: string;
  warnings: string[];
  watts: number;
  kilowatts: number;
  horsepower: number;
};

export function secondMoment(diameter: number): number {
  return (Math.PI * diameter ** 4) / 64;
}

/** Cantilever deflection. x and L are the same length unit. Returns that length unit. */
export function cantileverDeflectionAt(load: number, modulus: number, diameter: number, lengthToLoad: number, at: number): number {
  const inertia = secondMoment(diameter);
  return (load * at ** 2 * (3 * lengthToLoad - at)) / (6 * modulus * inertia);
}

export function criticalRpmFromDeflection(deflection: number, system: UnitSystem): number {
  const delta = system === 'metric' ? deflection / 1000 : deflection;
  const gravity = system === 'metric' ? 9.80665 : G_IN_PER_S2;
  return (30 / Math.PI) * Math.sqrt(gravity / delta);
}

export function agitatorDeflection(input: {
  system: UnitSystem;
  load: number;
  diameter: number;
  lengthToImpeller: number;
  lengthToSeal: number;
  modulus: number;
  runningRpm?: number | null;
}): AgitatorDeflection {
  const load = requirePositive(input.load, 'Load');
  const diameter = requirePositive(input.diameter, 'Shaft diameter');
  const lengthToImpeller = requirePositive(input.lengthToImpeller, 'Length to the impeller');
  const lengthToSeal = requirePositive(input.lengthToSeal, 'Length to the seal');
  const modulus = requirePositive(input.modulus, 'Modulus');
  if (lengthToSeal > lengthToImpeller) throw new Error('The seal has to sit between the bearing and the impeller on this cantilever.');
  const atSeal = cantileverDeflectionAt(load, modulus, diameter, lengthToImpeller, lengthToSeal);
  const atImpeller = cantileverDeflectionAt(load, modulus, diameter, lengthToImpeller, lengthToImpeller);
  const criticalRpm = criticalRpmFromDeflection(atImpeller, input.system);
  const running = input.runningRpm == null ? null : requirePositive(input.runningRpm, 'Running speed');
  const margin = running == null ? null : criticalRpm / running;
  const warnings = margin != null && margin < 1 ? ['Running speed is above this estimate of the first critical. Compare it with the mixer maker before you treat it as a limit.'] : [];
  const lengthUnit = input.system === 'metric' ? 'mm' : 'in';
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'δ = W x² (3L − x) / (6 E I), I = π d⁴ / 64. Nc = (30/π) √(g/δ) from the impeller deflection.',
    units: input.system === 'metric' ? 'Load in N, lengths in mm, modulus in N/mm². Deflection in mm.' : 'Load in lbf, lengths in inches, modulus in psi. Deflection in inches.',
    disclaimer: CALC_DISCLAIMER,
    basis: SEAL_BASIS,
    note: DEFLECTION_NOTE,
    warnings,
    atSeal: roundTo(atSeal, 6),
    atImpeller: roundTo(atImpeller, 6),
    criticalRpm: roundTo(criticalRpm, 3),
    margin: margin == null ? null : roundTo(margin, 3),
  };
}

export function agitatorCritical(input: { system: UnitSystem; deflection: number; runningRpm?: number | null }): AgitatorCritical {
  const deflection = requirePositive(input.deflection, 'Static deflection');
  finiteNumber(deflection, 'Static deflection');
  const criticalRpm = criticalRpmFromDeflection(deflection, input.system);
  const running = input.runningRpm == null ? null : requirePositive(input.runningRpm, 'Running speed');
  const margin = running == null ? null : criticalRpm / running;
  const warnings = margin != null && margin < 1 ? ['Running speed is above this estimate of the first critical. Compare it with the mixer maker before you treat it as a limit.'] : [];
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'Nc = (30/π) √(g/δ). Margin = Nc / running speed.',
    units: input.system === 'metric' ? 'Deflection in mm. Speed in rpm.' : 'Deflection in inches. Speed in rpm.',
    disclaimer: CALC_DISCLAIMER,
    basis: API_670_VIBRATION,
    note: CRITICAL_NOTE,
    warnings,
    criticalRpm: roundTo(criticalRpm, 3),
    margin: margin == null ? null : roundTo(margin, 3),
  };
}

export function agitatorTipSpeed(input: { system: UnitSystem; diameter: number; rpm: number }): AgitatorTip {
  const diameter = requirePositive(input.diameter, 'Impeller diameter');
  const rpm = requirePositive(input.rpm, 'Speed');
  const tipSpeed = input.system === 'metric' ? (Math.PI * (diameter / 1000) * rpm) / 60 : (Math.PI * diameter * rpm) / 12;
  return {
    formulaVersion: FORMULA_VERSION,
    formula: input.system === 'metric' ? 'V = π D N / 60, with D in meters and N in rpm.' : 'V = π D N / 12, with D in inches and N in rpm.',
    units: input.system === 'metric' ? 'Diameter in mm. Tip speed in m/s.' : 'Diameter in inches. Tip speed in ft/min.',
    disclaimer: CALC_DISCLAIMER,
    basis: '',
    note: TIP_NOTE,
    warnings: [],
    tipSpeed: roundTo(tipSpeed, 4),
  };
}

export function agitatorPower(input: { system: UnitSystem; powerNumber: number; specificGravity: number; rpm: number; diameter: number }): AgitatorPower {
  const powerNumber = requirePositive(input.powerNumber, 'Power number');
  const specificGravity = requirePositive(input.specificGravity, 'Specific gravity');
  const rpm = requirePositive(input.rpm, 'Speed');
  const diameter = requirePositive(input.diameter, 'Impeller diameter');
  const meters = input.system === 'metric' ? diameter / 1000 : diameter * 0.0254;
  const rps = rpm / 60;
  const watts = powerNumber * (specificGravity * 1000) * rps ** 3 * meters ** 5;
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'P = Np × ρ × N³ × D⁵. N is revolutions per second. ρ is specific gravity × 1000 kg/m³.',
    units: input.system === 'metric' ? 'Diameter in mm. Result in kW and hp.' : 'Diameter in inches. Result in hp and kW.',
    disclaimer: CALC_DISCLAIMER,
    basis: '',
    note: POWER_NOTE,
    warnings: [],
    watts: roundTo(watts, 4),
    kilowatts: roundTo(watts / 1000, 6),
    horsepower: roundTo(watts / 1000 / HP_TO_KW, 6),
  };
}
