import { API_670_VIBRATION, FREQUENCY_NOTE } from '@/src/domain/calculators/apiNotes';
import { CALC_DISCLAIMER, FORMULA_VERSION, requirePositive, roundTo } from '@/src/domain/calculators/common';

export type BearingOrders = {
  bpfo: number;
  bpfi: number;
  bsf: number;
  ftf: number;
};

export type FrequencyResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  basis: string;
  note: string;
  warnings: string[];
  shaftHz: number;
  gearMeshHz: number;
  bearing: BearingOrders | null;
};

/**
 * Gear mesh (Hz) = teeth × rpm / 60.
 * With the inner race turning and the outer race fixed:
 * BPFO = (Nb/2) · Fr · (1 − (Bd/Pd) · cos θ)
 * BPFI = (Nb/2) · Fr · (1 + (Bd/Pd) · cos θ)
 * BSF = (Pd / (2·Bd)) · Fr · (1 − ((Bd/Pd) · cos θ)²)
 * FTF = (Fr/2) · (1 − (Bd/Pd) · cos θ)
 * Bd and Pd must share a unit. The ratio is what matters.
 */
export function machineFrequencies(input: {
  rpm: number;
  teeth: number;
  rollingElements?: number | null;
  ballDiameter?: number | null;
  pitchDiameter?: number | null;
  contactAngleDeg?: number | null;
}): FrequencyResult {
  const rpm = requirePositive(input.rpm, 'Speed');
  if (!Number.isInteger(input.teeth) || input.teeth < 1) throw new Error('Gear teeth must be a whole number greater than zero.');
  const shaftHz = rpm / 60;
  const geometry = readGeometry(input);
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'Gear mesh = teeth × shaft revolutions per second. Bearing tones use the ball count, the ball-to-pitch ratio, and the contact angle.',
    units: 'Frequencies in Hz. Diameters in one unit for both the ball and the pitch.',
    disclaimer: CALC_DISCLAIMER,
    basis: API_670_VIBRATION,
    note: FREQUENCY_NOTE,
    warnings: [],
    shaftHz: roundTo(shaftHz, 6),
    gearMeshHz: roundTo(input.teeth * shaftHz, 6),
    bearing: geometry,
  };
}

function readGeometry(input: {
  rollingElements?: number | null;
  ballDiameter?: number | null;
  pitchDiameter?: number | null;
  contactAngleDeg?: number | null;
  rpm: number;
}): BearingOrders | null {
  const blank =
    input.rollingElements == null && input.ballDiameter == null && input.pitchDiameter == null && (input.contactAngleDeg == null || input.contactAngleDeg === 0);
  if (blank) return null;
  const count = input.rollingElements;
  if (count == null || !Number.isInteger(count) || count < 1) throw new Error('Rolling-element count must be a whole number greater than zero.');
  const ball = requirePositive(input.ballDiameter ?? Number.NaN, 'Ball diameter');
  const pitch = requirePositive(input.pitchDiameter ?? Number.NaN, 'Pitch diameter');
  if (ball >= pitch) throw new Error('Ball diameter must be smaller than the pitch diameter.');
  const angle = input.contactAngleDeg ?? 0;
  if (!Number.isFinite(angle) || angle < 0 || angle > 90) throw new Error('Contact angle must be from 0 to 90 degrees.');
  const ratio = (ball / pitch) * Math.cos((angle * Math.PI) / 180);
  if (ratio >= 1) throw new Error('That ball, pitch, and angle cannot sit in a bearing.');
  const shaftHz = input.rpm / 60;
  return {
    bpfo: roundTo((count / 2) * shaftHz * (1 - ratio), 6),
    bpfi: roundTo((count / 2) * shaftHz * (1 + ratio), 6),
    bsf: roundTo((pitch / (2 * ball)) * shaftHz * (1 - ratio * ratio), 6),
    ftf: roundTo((shaftHz / 2) * (1 - ratio), 6),
  };
}
