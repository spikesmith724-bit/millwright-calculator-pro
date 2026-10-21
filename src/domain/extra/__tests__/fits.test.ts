import assert from 'node:assert/strict';

import { fitResult, itToleranceMicrons } from '@/src/domain/extra/fits';

test('IT7 near 25 mm is about 21 micrometers', () => {
  const it = itToleranceMicrons(25, 7);
  assert.ok(it);
  assert.ok(it > 20 && it < 23);
});

test('H/h fit clearance is the sum of the two tolerances at minimum material', () => {
  const fit = fitResult({
    nominalMm: 25,
    holeToleranceMicrons: 21,
    shaftToleranceMicrons: 13,
    holeDeviationMicrons: 0,
    shaftDeviationMicrons: 0,
  });
  assert.ok(Math.abs(fit.minClearanceMm) < 1e-9);
  assert.ok(Math.abs(fit.maxClearanceMm - 0.034) < 1e-9);
});
