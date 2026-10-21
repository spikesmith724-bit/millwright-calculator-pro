/** ISO 286 tolerance-grade magnitude at a nominal size. Not a copied tolerance table. */

export function standardToleranceUnitMicrons(nominalMm: number): number {
  if (nominalMm <= 0) return 0;
  return 0.45 * Math.cbrt(nominalMm) + 0.001 * nominalMm;
}

const IT_FACTOR: Record<number, number> = {
  5: 7,
  6: 10,
  7: 16,
  8: 25,
  9: 40,
  10: 64,
  11: 100,
  12: 160,
  13: 250,
  14: 400,
  15: 640,
  16: 1000,
};

export function itToleranceMicrons(nominalMm: number, grade: number): number | null {
  const factor = IT_FACTOR[grade];
  if (!factor) return null;
  return standardToleranceUnitMicrons(nominalMm) * factor;
}

export function fitResult(input: {
  nominalMm: number;
  holeToleranceMicrons: number;
  shaftToleranceMicrons: number;
  holeDeviationMicrons: number;
  shaftDeviationMicrons: number;
}) {
  const holeMin = input.nominalMm + input.holeDeviationMicrons / 1000;
  const holeMax = holeMin + input.holeToleranceMicrons / 1000;
  const shaftMax = input.nominalMm + input.shaftDeviationMicrons / 1000;
  const shaftMin = shaftMax - input.shaftToleranceMicrons / 1000;
  return {
    holeMin,
    holeMax,
    shaftMin,
    shaftMax,
    maxClearanceMm: holeMax - shaftMin,
    minClearanceMm: holeMin - shaftMax,
  };
}
