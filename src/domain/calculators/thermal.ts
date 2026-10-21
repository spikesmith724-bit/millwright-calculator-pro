import { CALC_DISCLAIMER, FORMULA_VERSION, finiteNumber, requirePositive, roundTo } from '@/src/domain/calculators/common';

/**
 * Typical linear expansion coefficients for a field estimate.
 * Per-°F values are the published per-kelvin figures divided by 1.8.
 * Sources, checked as commonly published engineering-table values (not a heat to a specific grade):
 * - Carbon steel 11.7×10⁻⁶ /K → 6.5×10⁻⁶ /°F. Machinery's Handbook lists carbon steel near 6.5×10⁻⁶ in/in/°F.
 * - Gray cast iron 10.6×10⁻⁶ /K → 5.9×10⁻⁶ /°F.
 * - Stainless 304 17.3×10⁻⁶ /K → 9.6×10⁻⁶ /°F. ASM typical 18-8 stainless is in this range.
 * - Aluminum 6061 23.6×10⁻⁶ /K → 13.1×10⁻⁶ /°F.
 * These are estimates. OEM growth data or a hot alignment overrules them.
 */
export const THERMAL_MATERIALS = [
  { id: 'steel', label: 'Carbon steel', alphaPerF: 6.5e-6, source: '11.7×10⁻⁶ /K → 6.5×10⁻⁶ /°F' },
  { id: 'cast-iron', label: 'Gray cast iron', alphaPerF: 5.9e-6, source: '10.6×10⁻⁶ /K → 5.9×10⁻⁶ /°F' },
  { id: 'stainless', label: 'Stainless 304', alphaPerF: 9.6e-6, source: '17.3×10⁻⁶ /K → 9.6×10⁻⁶ /°F' },
  { id: 'aluminum', label: 'Aluminum 6061', alphaPerF: 13.1e-6, source: '23.6×10⁻⁶ /K → 13.1×10⁻⁶ /°F' },
  { id: 'custom', label: 'Custom α', alphaPerF: 6.5e-6, source: 'Entered by the user. Cite the sheet you took it from.' },
] as const;

export const THERMAL_ESTIMATE_LABEL =
  'Estimate. Use OEM thermal growth data or measured hot readings when available.';

export type SimpleThermalInput = {
  alphaPerF: number;
  lengthIn: number;
  deltaTF: number;
};

export type SimpleThermalResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  estimateLabel: string;
  deltaIn: number;
  deltaMils: number;
};

/** ΔL = α · L · ΔT. Length in inches, α in in/in/°F, ΔT in °F. */
export function simpleThermal(input: SimpleThermalInput): SimpleThermalResult {
  const alpha = finiteNumber(input.alphaPerF, 'Coefficient');
  const length = requirePositive(input.lengthIn, 'Length');
  const deltaT = finiteNumber(input.deltaTF, 'Temperature change');
  if (alpha < 0) throw new Error('The expansion coefficient cannot be negative.');
  const deltaIn = alpha * length * deltaT;
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'ΔL = α · L · ΔT',
    units: 'α in in/in/°F, length in inches, ΔT in °F, growth in inches and mils.',
    disclaimer: CALC_DISCLAIMER,
    estimateLabel: THERMAL_ESTIMATE_LABEL,
    deltaIn: roundTo(deltaIn, 6),
    deltaMils: roundTo(deltaIn * 1000, 3),
  };
}

export type MachineThermalInput = {
  centerlineHeightIn: number;
  alphaPerF: number;
  ambientF: number;
  frontFootF: number;
  backFootF: number;
  /** Optional distance between front and back feet, inches, used for the angle. */
  footSpanIn: number | null;
  /** Optional horizontal distance that grows, inches. */
  lateralIn: number | null;
  lateralTempF: number | null;
};

export type MachineGrowth = {
  frontIn: number;
  backIn: number;
  centerlineIn: number;
  horizontalIn: number | null;
};

export type ColdTargets = {
  /** Positive: set the driven machine higher than the driver when cold. */
  frontIn: number;
  backIn: number;
  frontMils: number;
  backMils: number;
  /** Mils of relative offset per inch of foot span. Null when span was not entered. */
  angleMilsPerIn: number | null;
  angleDeg: number | null;
};

export type MachineThermalResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  estimateLabel: string;
  driver: MachineGrowth;
  driven: MachineGrowth;
  /** Driven growth minus driver growth. */
  relative: MachineGrowth;
  coldTargets: ColdTargets;
};

function growthOf(input: MachineThermalInput): MachineGrowth {
  const height = requirePositive(input.centerlineHeightIn, 'Centerline height');
  const alpha = finiteNumber(input.alphaPerF, 'Coefficient');
  if (alpha < 0) throw new Error('The expansion coefficient cannot be negative.');
  const frontIn = alpha * height * (finiteNumber(input.frontFootF, 'Front temperature') - finiteNumber(input.ambientF, 'Ambient'));
  const backIn = alpha * height * (finiteNumber(input.backFootF, 'Back temperature') - input.ambientF);
  let horizontalIn: number | null = null;
  if (input.lateralIn != null && input.lateralTempF != null) {
    const lateral = requirePositive(input.lateralIn, 'Lateral distance');
    horizontalIn = roundTo(alpha * lateral * (finiteNumber(input.lateralTempF, 'Lateral temperature') - input.ambientF), 6);
  }
  return {
    frontIn: roundTo(frontIn, 6),
    backIn: roundTo(backIn, 6),
    centerlineIn: roundTo((frontIn + backIn) / 2, 6),
    horizontalIn,
  };
}

function subtract(driven: MachineGrowth, driver: MachineGrowth): MachineGrowth {
  return {
    frontIn: roundTo(driven.frontIn - driver.frontIn, 6),
    backIn: roundTo(driven.backIn - driver.backIn, 6),
    centerlineIn: roundTo(driven.centerlineIn - driver.centerlineIn, 6),
    horizontalIn:
      driven.horizontalIn == null && driver.horizontalIn == null
        ? null
        : roundTo((driven.horizontalIn ?? 0) - (driver.horizontalIn ?? 0), 6),
  };
}

/**
 * Each foot's vertical growth is α × centerline height × (foot temperature − ambient).
 * The shaft centerline figure is the average of the two feet.
 * Cold targets put the driven machine where it must sit cold so both shafts meet hot:
 * target = −(driven growth − driver growth). Positive means set the driven machine higher.
 */
export function machineThermal(driverInput: MachineThermalInput, drivenInput: MachineThermalInput): MachineThermalResult {
  const driver = growthOf(driverInput);
  const driven = growthOf(drivenInput);
  const relative = subtract(driven, driver);
  const frontIn = roundTo(-relative.frontIn, 6);
  const backIn = roundTo(-relative.backIn, 6);
  const span = driverInput.footSpanIn;
  let angleMilsPerIn: number | null = null;
  let angleDeg: number | null = null;
  if (span != null) {
    const distance = requirePositive(span, 'Foot span');
    const delta = backIn - frontIn;
    angleMilsPerIn = roundTo((delta * 1000) / distance, 4);
    angleDeg = roundTo((Math.atan(delta / distance) * 180) / Math.PI, 5);
  }
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'Growth at a foot = α · centerline height · (Tfoot − Tambient). Cold target = −(driven − driver).',
    units: 'Heights and growth in inches. Temperatures in °F. α in in/in/°F.',
    disclaimer: CALC_DISCLAIMER,
    estimateLabel: THERMAL_ESTIMATE_LABEL,
    driver,
    driven,
    relative,
    coldTargets: {
      frontIn,
      backIn,
      frontMils: roundTo(frontIn * 1000, 3),
      backMils: roundTo(backIn * 1000, 3),
      angleMilsPerIn,
      angleDeg,
    },
  };
}
