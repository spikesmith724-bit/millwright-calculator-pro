import { API_COUPLING_ALIGNMENT, COUPLING_NOTE } from '@/src/domain/calculators/apiNotes';
import { CALC_DISCLAIMER, FORMULA_VERSION, finiteNumber, requirePositive, roundTo } from '@/src/domain/calculators/common';
import type { UnitSystem } from '@/src/domain/calculators/affinity';

export type CouplingResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  basis: string;
  note: string;
  warnings: string[];
  offset: number;
  angularity: number;
  offsetLimit: number;
  angularLimit: number;
  within: boolean;
  limitSource: 'maker' | 'speed-screen' | 'mixed';
};

/**
 * Speed screen, in mils and mils per inch. Not an API 671 or API 686 table.
 * Offset limit = clamp(3600 / rpm, 0.5, 5)
 * Angularity limit = clamp(720 / rpm, 0.1, 1)
 * Maker limits replace the screen on the axis you fill in.
 */
export function couplingAlignment(input: {
  system: UnitSystem;
  rpm: number;
  offset: number;
  angularity: number;
  makerOffset?: number | null;
  makerAngularity?: number | null;
}): CouplingResult {
  const rpm = requirePositive(input.rpm, 'Speed');
  const offset = finiteNumber(input.offset, 'Offset');
  const angularity = finiteNumber(input.angularity, 'Angularity');
  if (offset < 0 || angularity < 0) throw new Error('Offset and angularity cannot be negative.');
  const measured = input.system === 'metric' ? { offset: offset / 0.0254, angularity: angularity / 0.1 } : { offset, angularity };
  const screen = speedScreen(rpm);
  const makerOffset = optionalLimit(input.makerOffset, input.system, 'Offset limit', 'offset');
  const makerAngular = optionalLimit(input.makerAngularity, input.system, 'Angularity limit', 'angular');
  const offsetLimit = makerOffset ?? screen.offsetMils;
  const angularLimit = makerAngular ?? screen.angularMilsPerIn;
  const offsetOver = measured.offset > offsetLimit + 1e-9;
  const angularOver = measured.angularity > angularLimit + 1e-9;
  const warnings: string[] = [];
  if (offsetOver) warnings.push('Offset is over the limit in use.');
  if (angularOver) warnings.push('Angularity is over the limit in use.');
  const limitSource = makerOffset != null && makerAngular != null ? 'maker' : makerOffset == null && makerAngular == null ? 'speed-screen' : 'mixed';
  const shown = input.system === 'metric'
    ? {
        offset: measured.offset * 0.0254,
        angularity: measured.angularity * 0.1,
        offsetLimit: offsetLimit * 0.0254,
        angularLimit: angularLimit * 0.1,
      }
    : { offset: measured.offset, angularity: measured.angularity, offsetLimit, angularLimit: angularLimit };
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'Speed screen: offset limit mils = clamp(3600 / rpm, 0.5, 5). Angularity limit mils/in = clamp(720 / rpm, 0.1, 1). Maker limits replace that screen.',
    units: input.system === 'metric' ? 'Offset in mm. Angularity in mm per 100 mm. Speed in rpm.' : 'Offset in mils. Angularity in mils per inch. Speed in rpm.',
    disclaimer: CALC_DISCLAIMER,
    basis: API_COUPLING_ALIGNMENT,
    note: COUPLING_NOTE,
    warnings,
    offset: roundTo(shown.offset, 6),
    angularity: roundTo(shown.angularity, 6),
    offsetLimit: roundTo(shown.offsetLimit, 6),
    angularLimit: roundTo(shown.angularLimit, 6),
    within: !offsetOver && !angularOver,
    limitSource,
  };
}

export function angularityFromFace(faceTir: number, diameter: number): number {
  const tir = finiteNumber(faceTir, 'Face reading');
  const width = requirePositive(diameter, 'Face diameter');
  if (tir < 0) throw new Error('Face reading cannot be negative.');
  return roundTo(tir / width, 6);
}

function speedScreen(rpm: number): { offsetMils: number; angularMilsPerIn: number } {
  return {
    offsetMils: clamp(3600 / rpm, 0.5, 5),
    angularMilsPerIn: clamp(720 / rpm, 0.1, 1),
  };
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

function optionalLimit(value: number | null | undefined, system: UnitSystem, label: string, axis: 'offset' | 'angular'): number | null {
  if (value == null) return null;
  const limit = requirePositive(value, label);
  if (system === 'us') return limit;
  return axis === 'offset' ? limit / 0.0254 : limit / 0.1;
}
