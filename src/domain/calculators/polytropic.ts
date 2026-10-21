import { API_617_COMPRESSORS, POLYTROPIC_NOTE } from '@/src/domain/calculators/apiNotes';
import { CALC_DISCLAIMER, FORMULA_VERSION, requirePositive, roundTo } from '@/src/domain/calculators/common';
import type { UnitSystem } from '@/src/domain/calculators/affinity';

/** ft·lbf/(lbmol·°R). Head in feet uses this constant directly, which is the usual compressor-head convention. */
export const R_FT_LBF = 1545.349;

/** kJ/(kmol·K). Head in kJ/kg uses this constant. */
export const R_KJ = 8.314462618;

export type PolytropicResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  basis: string;
  note: string;
  warnings: string[];
  head: number;
  efficiency: number;
  exponent: number;
  pressureRatio: number;
};

/**
 * (n−1)/n = ln(T2/T1) / ln(P2/P1), temperatures absolute.
 * Head = [n/(n−1)] · Z · R · T1 · [rp^((n−1)/n) − 1] / MW
 * Polytropic efficiency = [(k−1)/k] / [(n−1)/n]
 */
export function polytropicHead(input: {
  system: UnitSystem;
  suctionPressure: number;
  dischargePressure: number;
  suctionTemperature: number;
  dischargeTemperature: number;
  specificHeatRatio: number;
  molecularWeight: number;
  compressibility: number;
}): PolytropicResult {
  const p1 = requirePositive(input.suctionPressure, 'Suction pressure');
  const p2 = requirePositive(input.dischargePressure, 'Discharge pressure');
  if (p2 <= p1) throw new Error('Discharge pressure must be above suction pressure. Use absolute pressure.');
  const k = requirePositive(input.specificHeatRatio, 'Specific-heat ratio');
  if (k <= 1) throw new Error('Specific-heat ratio must be greater than 1.');
  const mw = requirePositive(input.molecularWeight, 'Molecular weight');
  const z = requirePositive(input.compressibility, 'Compressibility');
  const t1 = absoluteTemperature(input.suctionTemperature, input.system, 'Suction temperature');
  const t2 = absoluteTemperature(input.dischargeTemperature, input.system, 'Discharge temperature');
  if (t2 <= t1) throw new Error('Discharge temperature must be above suction temperature.');
  const pressureRatio = p2 / p1;
  const exponent = Math.log(t2 / t1) / Math.log(pressureRatio);
  if (exponent <= 0 || exponent >= 1) throw new Error('Those pressures and temperatures do not describe a polytropic compression.');
  const nOver = 1 / exponent;
  const gas = input.system === 'metric' ? R_KJ : R_FT_LBF;
  const head = nOver * z * (gas / mw) * t1 * (pressureRatio ** exponent - 1);
  const efficiency = (k - 1) / k / exponent;
  const warnings: string[] = [];
  if (efficiency > 1) warnings.push('Polytropic efficiency is above 1. Check the specific-heat ratio and the two temperatures.');
  if (efficiency < 0.5) warnings.push('Polytropic efficiency is under 50 percent. Check the temperatures before you treat this as the machine.');
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'Polytropic exponent from the temperature ratio and the pressure ratio. Head from that exponent, Z, R, and molecular weight. Efficiency from k and the exponent.',
    units:
      input.system === 'metric'
        ? 'Pressure in bar absolute, temperature in °C, head in kJ/kg, efficiency as a fraction.'
        : 'Pressure in psia, temperature in °F, head in ft, efficiency as a fraction.',
    disclaimer: CALC_DISCLAIMER,
    basis: API_617_COMPRESSORS,
    note: POLYTROPIC_NOTE,
    warnings,
    head: roundTo(head, 6),
    efficiency: roundTo(efficiency, 6),
    exponent: roundTo(exponent, 6),
    pressureRatio: roundTo(pressureRatio, 6),
  };
}

function absoluteTemperature(value: number, system: UnitSystem, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be a number.`);
  const absolute = system === 'metric' ? value + 273.15 : value + 459.67;
  if (absolute <= 0) throw new Error(`${label} must be above absolute zero.`);
  return absolute;
}
