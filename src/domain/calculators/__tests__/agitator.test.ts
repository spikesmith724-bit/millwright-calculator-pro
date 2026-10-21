import { HP_TO_KW } from '@/src/domain/calculators/fieldUnits';
import {
  G_IN_PER_S2,
  agitatorCritical,
  agitatorDeflection,
  agitatorPower,
  agitatorTipSpeed,
  secondMoment,
} from '@/src/domain/calculators/agitator';

describe('agitator calculators', () => {
  it('deflects a cantilever at the seal and estimates critical speed without an API limit', () => {
    const result = agitatorDeflection({
      system: 'us',
      load: 100,
      diameter: 2,
      lengthToImpeller: 40,
      lengthToSeal: 10,
      modulus: 29_000_000,
      runningRpm: 100,
    });
    const inertia = secondMoment(2);
    const atSeal = (100 * 10 ** 2 * (3 * 40 - 10)) / (6 * 29_000_000 * inertia);
    const atImpeller = (100 * 40 ** 3) / (3 * 29_000_000 * inertia);
    expect(result.atSeal).toBeCloseTo(atSeal, 6);
    expect(result.atImpeller).toBeCloseTo(atImpeller, 6);
    expect(result.atSeal).toBeLessThan(result.atImpeller);
    const critical = (30 / Math.PI) * Math.sqrt(G_IN_PER_S2 / atImpeller);
    expect(result.criticalRpm).toBeCloseTo(critical, 2);
    expect(result.margin).toBeCloseTo(critical / 100, 2);
    expect(result.basis).toBe('Based on API 682, seals');
    expect(result.note).toMatch(/not an API limit/i);
    expect(result.formula).not.toMatch(/section|clause|table|figure/i);
    expect(() => agitatorDeflection({
      system: 'us',
      load: 100,
      diameter: 2,
      lengthToImpeller: 40,
      lengthToSeal: 41,
      modulus: 29_000_000,
    })).toThrow(/between the bearing and the impeller/);
  });

  it('uses a measured deflection for critical speed and warns only above the estimate', () => {
    const quiet = agitatorCritical({ system: 'us', deflection: 0.04, runningRpm: 100 });
    const expected = (30 / Math.PI) * Math.sqrt(G_IN_PER_S2 / 0.04);
    expect(quiet.criticalRpm).toBeCloseTo(expected, 2);
    expect(quiet.margin).toBeGreaterThan(1);
    expect(quiet.warnings).toEqual([]);
    expect(quiet.basis).toBe('Based on API 670, machinery protection and vibration');
    const hot = agitatorCritical({ system: 'us', deflection: 0.04, runningRpm: expected + 50 });
    expect(hot.warnings[0]).toMatch(/above this estimate/);
    expect(hot.note).toMatch(/does not set this margin/);
  });

  it('computes tip speed and power from the power number you enter', () => {
    const tip = agitatorTipSpeed({ system: 'us', diameter: 12, rpm: 100 });
    expect(tip.tipSpeed).toBeCloseTo(100 * Math.PI, 4);
    expect(tip.basis).toBe('');
    const metric = agitatorTipSpeed({ system: 'metric', diameter: 1000, rpm: 60 });
    expect(metric.tipSpeed).toBeCloseTo(Math.PI, 4);
    const power = agitatorPower({ system: 'metric', powerNumber: 5, specificGravity: 1, rpm: 120, diameter: 500 });
    expect(power.watts).toBeCloseTo(1250, 3);
    expect(power.horsepower).toBeCloseTo(1.25 / HP_TO_KW, 4);
    expect(power.note).toMatch(/not looked up from an API table/);
    expect(agitatorPower({ system: 'us', powerNumber: 2, specificGravity: 1, rpm: 60, diameter: 12 }).watts).toBeCloseTo(
      2 * 1000 * (12 * 0.0254) ** 5,
      3,
    );
  });
});
