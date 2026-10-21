import { starSequence } from '@/src/domain/calculators/starArt';
import { flangeStud, type FlangeClass, type GasketType } from '@/src/domain/calculators/flangeChart';
import {
  coarseFastener,
  fastenerLoad,
  flangeThreadFastener,
  metricFastener,
  passSchedule,
  round,
  socketFor,
  stressAreaIn2,
  torqueFromKdf,
  clampedText,
  clampK,
  clampPercent,
  K_DEFAULT,
  K_DEFAULT_PRESET,
  PERCENT_DEFAULT,
  resolveKPreset,
  torqueInputs,
  washerNote,
  wrenchPair,
} from '@/src/domain/calculators/boltHardware';

describe('flange bolt-up chart', () => {
  it('matches the published stud counts on the spot checks', () => {
    expect(stud('4', 150)).toMatchObject({ count: 8, diameter: '5/8', thread: '5/8-11 UNC' });
    expect(stud('4', 300)).toMatchObject({ count: 8, diameter: '3/4', thread: '3/4-10 UNC' });
    expect(stud('6', 300)).toMatchObject({ count: 12, diameter: '3/4' });
    expect(stud('12', 600)).toMatchObject({ count: 20, diameter: '1-1/4', thread: '1-1/4-8 UN' });
  });

  it('uses the raised-face length for spiral wound, sheet, and kammprofile, and the ring-joint length for RTJ', () => {
    expect(flangeStud('4', 150, 'spiral-wound')?.studLength).toBe('3-1/2');
    expect(flangeStud('4', 150, 'sheet')?.studLength).toBe('3-1/2');
    expect(flangeStud('4', 150, 'kammprofile')?.studLength).toBe('3-1/2');
    expect(flangeStud('4', 150, 'rtj')?.studLength).toBe('4');
    expect(flangeStud('1/2', 150, 'rtj')?.lengthNote).toMatch(/not listed/i);
  });

  it('flags class 400 length and omits sizes the charts do not list', () => {
    const row = flangeStud('4', 400, 'spiral-wound');
    expect(row?.count).toBe(8);
    expect(row?.diameter).toBe('7/8');
    expect(row?.studLength).toBeNull();
    expect(row?.lengthNote).toMatch(/Texas Flange/);
    expect(flangeStud('14', 2500, 'spiral-wound')).toBeNull();
    expect(flangeStud('3-1/2', 900, 'sheet')).toBeNull();
  });

  it('flags the 3-1/2 in wrench instead of presenting it as certain', () => {
    const row = flangeStud('24', 1500, 'spiral-wound');
    expect(row?.diameter).toBe('3-1/2');
    expect(row?.wrenchUncertain).toBe(true);
  });
});

describe('anchor and hold-down hardware', () => {
  it('computes the 1/2-13 tensile stress area', () => {
    expect(round(stressAreaIn2(0.5, 13), 4)).toBe(0.1419);
    expect(round(coarseFastener('1/2')!.stressAreaIn2, 4)).toBe(0.1419);
  });

  it('uses ISO 898-1 proof for M16 and M20 class 8.8', () => {
    const m16 = fastenerLoad('8.8', null, metricFastener('M16'));
    const m20 = fastenerLoad('8.8', null, metricFastener('M20'));
    expect(m16?.loadLabel).toBe('91.1 kN proof');
    expect(m20?.loadLabel).toBe('147.0 kN proof');
  });

  it('labels B7 as yield and keeps SAE proof inside the published size band', () => {
    const b7 = fastenerLoad('B7', coarseFastener('3/4'), null);
    expect(b7?.loadKind).toBe('yield');
    expect(b7?.stress).toContain('105 ksi');
    const over = fastenerLoad('SAE 5', coarseFastener('2'), null);
    expect(over?.loadLabel).toBe('Not listed');
    expect(over?.note).toMatch(/1-1\/2/);
  });

  it('gives a 5/8 hold-down both the hex cap screw size and the heavy hex size', () => {
    expect(wrenchPair('5/8')).toEqual({ hex: '15/16', heavy: '1-1/16', heavyUncertain: false });
    expect(socketFor('5/8', 'hex-cap')?.across).toBe('15/16');
    expect(socketFor('5/8', 'heavy-hex')?.across).toBe('1-1/16');
  });

  it('names the usual washer and flags sizes above 3 in', () => {
    expect(washerNote('F1554 Gr 36', 0.75).washer).toBe('F844');
    expect(washerNote('B7', 1).washer).toBe('F436');
    expect(washerNote('B7', 3.5).uncertain).toBe(true);
  });

  it('starts at 75% and Dry steel K 0.20, and clamped inputs are never blank', () => {
    const area = coarseFastener('1/2')!;
    const load = fastenerLoad('SAE 5', area, null)!;
    expect(PERCENT_DEFAULT).toBe(75);
    expect(K_DEFAULT_PRESET).toBe('dry');
    expect(resolveKPreset(K_DEFAULT_PRESET).k).toBe(K_DEFAULT);
    const defaults = torqueFromKdf({ diameterIn: 0.5, proofOrYieldLb: load.load, ...torqueInputs(String(PERCENT_DEFAULT), String(K_DEFAULT)) });
    expect(defaults?.targetPercent).toBe(75);
    expect(defaults?.k).toBe(0.2);
    expect(defaults?.footLb).toBeCloseTo((0.2 * 0.5 * load.load * 0.75) / 12, 9);
    // Blank, invalid, or out-of-range input still gives a torque.
    for (const [p, k] of [['', ''], ['abc', 'x'], ['0', '0'], ['-20', '-1'], ['250', '9']]) {
      expect(torqueFromKdf({ diameterIn: 0.5, proofOrYieldLb: load.load, ...torqueInputs(p, k) })).not.toBeNull();
    }
    // The raw identity still refuses missing inputs.
    expect(torqueFromKdf({ diameterIn: 0.5, proofOrYieldLb: load.load, targetPercent: null, k: 0.2 })).toBeNull();
    expect(torqueFromKdf({ diameterIn: 0.5, proofOrYieldLb: load.load, targetPercent: 70, k: null })).toBeNull();
    const torque = torqueFromKdf({ diameterIn: 0.5, proofOrYieldLb: load.load, targetPercent: 70, k: 0.2 });
    expect(torque?.formula).toBe('T = K · D · F');
    expect(torque?.footLb).toBeGreaterThan(0);
    expect(passSchedule(null).map((step) => step.name)).toEqual(['Snug', '30% of target', '60% of target', '100% of target', 'Check']);
    expect(passSchedule(null).every((step) => step.torque == null)).toBe(true);
    expect(passSchedule(100).map((step) => step.torque)).toEqual([null, '30 ft-lb', '60 ft-lb', '100 ft-lb', null]);
  });

  it('clamps % to 5–100 and custom K to 0.05–0.40, snapping to the nearest limit', () => {
    expect(clampPercent('75')).toBe(75);
    expect(clampPercent('72.5')).toBe(72.5);
    expect(clampPercent('150')).toBe(100);
    expect(clampPercent('0')).toBe(5);
    expect(clampPercent('-10')).toBe(5);
    expect(clampPercent('')).toBe(5);
    expect(clampPercent('abc')).toBe(5);
    expect(clampPercent(' 80 ')).toBe(80);
    expect(clampK('0.2')).toBe(0.2);
    expect(clampK('0.5')).toBe(0.4);
    expect(clampK('0.01')).toBe(0.05);
    expect(clampK('')).toBe(0.05);
    expect(clampK('nope')).toBe(0.05);
    expect(clampedText(clampK('0.5'))).toBe('0.4');
    expect(clampedText(clampPercent('250'))).toBe('100');
  });

  it('falls back to Dry steel for an unrecognized stored K preset', () => {
    expect(resolveKPreset('moly').id).toBe('moly');
    expect(resolveKPreset('custom').id).toBe('custom');
    expect(resolveKPreset('bogus').id).toBe('dry');
    expect(resolveKPreset(null).id).toBe('dry');
    expect(resolveKPreset(undefined).k).toBe(0.2);
  });

  it('builds an 8-bolt star order that visits every bolt once', () => {
    const order = starSequence(8);
    expect(order).toHaveLength(8);
    expect(new Set(order).size).toBe(8);
    expect(order.slice(0, 2)).toEqual([1, 5]);
  });
});

function stud(nps: string, classRating: FlangeClass, gasket: GasketType = 'spiral-wound') {
  const row = flangeStud(nps, classRating, gasket);
  if (!row) throw new Error(`missing ${nps} class ${classRating}`);
  return row;
}

describe('torqueFromKdf sanity (matches the watch)', () => {
  it('1/2 in bolt, K 0.20, 10,000 lbf → 1,000 in-lb = 83.3 ft-lb', () => {
    const { torqueFromKdf } = require('@/src/domain/calculators/boltHardware');
    const r = torqueFromKdf({ diameterIn: 0.5, proofOrYieldLb: 10000, targetPercent: 100, k: 0.2 });
    expect(r.inchLb).toBeCloseTo(1000, 9);
    expect(r.footLb).toBeCloseTo(83.333, 3);
    expect(r.newtonMeters).toBeCloseTo(112.98, 2);
  });
});
