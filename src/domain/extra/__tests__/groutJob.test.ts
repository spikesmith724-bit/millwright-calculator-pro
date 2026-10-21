import assert from 'node:assert/strict';
import { calculateGrout, sleeveVoidCuIn } from '@/src/domain/extra/groutJob';

const base = {
  shape: 'rectangular' as const,
  lengthFt: 3,
  widthFt: 2,
  pads: [],
  extraAreaSqFt: 0,
  depthIn: 2,
  shoulderIn: 0,
  formIn: 0,
  sleeveCount: 0,
  sleeveDiameterIn: 0,
  sleeveHeightIn: 0,
  wastePercent: 0,
  yieldCuFt: null,
  weightLbPerUnit: null,
  components: [],
  formHoursPerCuYd: 0,
  pourHoursPerCuYd: 0,
  cureHoursPerCuYd: 0,
};

test('rectangular pour of 3 ft by 2 ft by 2 in is one cubic foot', () => {
  const result = calculateGrout(base);
  assert.ok(Math.abs(result.netCuFt - 1) < 1e-9);
  assert.ok(Math.abs(result.netCuYd - 1 / 27) < 1e-9);
  assert.equal(result.units, null);
});

test('shoulder and form grow both sides', () => {
  const result = calculateGrout({ ...base, shoulderIn: 1, formIn: 1, depthIn: 1 });
  // 36+4 by 24+4 by 1 in = 1120 cu in
  assert.ok(Math.abs(result.grossCuFt - 1120 / 1728) < 1e-9);
});

test('sleeve voids are cylinders and cannot drive volume negative', () => {
  const voidIn = sleeveVoidCuIn(1, 2, 2);
  assert.ok(Math.abs(voidIn - Math.PI * 2) < 1e-9);
  const result = calculateGrout({
    ...base,
    depthIn: 0.01,
    sleeveCount: 4,
    sleeveDiameterIn: 6,
    sleeveHeightIn: 12,
  });
  assert.equal(result.netCuFt, 0);
});

test('waste factor rounds the order up to a whole unit', () => {
  const result = calculateGrout({ ...base, wastePercent: 10, yieldCuFt: 0.5 });
  assert.ok(Math.abs(result.orderCuFt - 1.1) < 1e-9);
  assert.ok(Math.abs(result.unitsExact! - 2.2) < 1e-9);
  assert.equal(result.units, 3);
});

test('an exact unit count is not rounded up', () => {
  const result = calculateGrout({ ...base, yieldCuFt: 0.5 });
  assert.equal(result.unitsExact, 2);
  assert.equal(result.units, 2);
});

test('delivery weight uses the rounded-up unit count and splits components', () => {
  const result = calculateGrout({
    ...base,
    wastePercent: 10,
    yieldCuFt: 0.5,
    weightLbPerUnit: 50,
    components: [
      { name: 'Resin', weightLb: 10 },
      { name: 'Hardener', weightLb: 5 },
      { name: 'Aggregate', weightLb: 35 },
    ],
  });
  assert.equal(result.units, 3);
  assert.equal(result.weightLb, 150);
  assert.ok(Math.abs(result.weightTons! - 0.075) < 1e-9);
  assert.deepEqual(
    result.components.map((line) => [line.name, line.pounds]),
    [
      ['Resin', 30],
      ['Hardener', 15],
      ['Aggregate', 105],
    ],
  );
});

test('crew hours stay independent of cure duration', () => {
  const result = calculateGrout({
    ...base,
    formHoursPerCuYd: 27,
    pourHoursPerCuYd: 0,
    cureHoursPerCuYd: 27,
  });
  assert.ok(Math.abs(result.formHours - 1) < 1e-9);
  assert.ok(Math.abs(result.cureHours - 1) < 1e-9);
  assert.equal(result.weightLb, null);
});

test('custom pads plus extra area', () => {
  const result = calculateGrout({
    ...base,
    shape: 'custom',
    pads: [
      { lengthFt: 3, widthFt: 2 },
      { lengthFt: 3, widthFt: 2 },
    ],
    extraAreaSqFt: 1,
    depthIn: 2,
  });
  // two 1 cu ft pads + 1 sq ft * 2 in = 288 cu in
  assert.ok(Math.abs(result.netCuFt - (2 + 288 / 1728)) < 1e-9);
});

test('labor hours scale with order yards', () => {
  const result = calculateGrout({
    ...base,
    formHoursPerCuYd: 27,
    pourHoursPerCuYd: 0,
    cureHoursPerCuYd: 0,
  });
  assert.ok(Math.abs(result.formHours - 1) < 1e-9);
  assert.ok(Math.abs(result.totalHours - 1) < 1e-9);
});
