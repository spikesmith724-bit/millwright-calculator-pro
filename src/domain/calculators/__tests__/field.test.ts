import { pumpAffinity } from '@/src/domain/calculators/affinity';
import { bearingL10 } from '@/src/domain/calculators/bearingLife';
import { beltDrive } from '@/src/domain/calculators/belt';
import { angularityFromFace, couplingAlignment } from '@/src/domain/calculators/couplingFit';
import { convertFieldUnits, FT_TO_M, G, GPM_TO_M3H, HP_TO_KW, PSI_TO_KPA } from '@/src/domain/calculators/fieldUnits';
import { machineFrequencies } from '@/src/domain/calculators/frequencies';
import { npshMargin } from '@/src/domain/calculators/npsh';
import { polytropicHead, R_FT_LBF } from '@/src/domain/calculators/polytropic';

const noClause = /section\s+\d|clause\s+\d|paragraph\s+\d|\d+\.\d+/i;

describe('pump affinity laws', () => {
  it('doubles flow, quadruples head, and cubes power when speed doubles', () => {
    const result = pumpAffinity({ flow: 100, head: 80, power: 10, speed1: 1800, speed2: 3600, diameter1: 10, diameter2: 10, system: 'us' });
    expect(result.flow).toBeCloseTo(200, 6);
    expect(result.head).toBeCloseTo(320, 6);
    expect(result.power).toBeCloseTo(80, 6);
    expect(result.basis).toBe('');
    expect(result.warnings).toHaveLength(1);
  });

  it('uses the same exponents when the impeller diameter changes', () => {
    const diameter = pumpAffinity({ flow: 50, head: 40, power: 5, speed1: 1800, speed2: 1800, diameter1: 8, diameter2: 16, system: 'metric' });
    expect(diameter.flow).toBeCloseTo(100, 6);
    expect(diameter.head).toBeCloseTo(160, 6);
    expect(diameter.power).toBeCloseTo(40, 6);
    const both = pumpAffinity({ flow: 50, head: 80, power: 10, speed1: 1200, speed2: 2400, diameter1: 6, diameter2: 12, system: 'us' });
    expect(both.flow).toBeCloseTo(200, 6);
    expect(both.head).toBeCloseTo(1280, 6);
    expect(both.power).toBeCloseTo(640, 6);
  });

  it('rejects a non-positive speed or a negative flow', () => {
    expect(() => pumpAffinity({ flow: -1, head: 1, power: 1, speed1: 1, speed2: 1, diameter1: 1, diameter2: 1, system: 'us' })).toThrow(/negative/);
    expect(() => pumpAffinity({ flow: 1, head: 1, power: 1, speed1: 0, speed2: 1, diameter1: 1, diameter2: 1, system: 'us' })).toThrow(/speed/i);
  });
});

describe('NPSH margin', () => {
  it('subtracts NPSHr from NPSHa and divides for the ratio', () => {
    const result = npshMargin(20, 16, 'us');
    expect(result.margin).toBeCloseTo(4, 6);
    expect(result.ratio).toBeCloseTo(1.25, 6);
    expect(result.warnings).toHaveLength(0);
    expect(result.basis).toBe('Based on API 610, centrifugal pumps');
    expect(`${result.basis} ${result.note}`).not.toMatch(noClause);
  });

  it('warns when available NPSH does not cover the vendor figure', () => {
    const short = npshMargin(10, 16, 'metric');
    expect(short.margin).toBeCloseTo(-6, 6);
    expect(short.ratio).toBeCloseTo(0.625, 6);
    expect(short.warnings[0]).toMatch(/does not cover/);
    const thin = npshMargin(17, 16, 'us');
    expect(thin.warnings[0]).toMatch(/field judgment/);
    expect(() => npshMargin(10, 0, 'us')).toThrow(/NPSHr/);
  });
});

describe('polytropic head', () => {
  it('gets the exponent from the temperature ratio and the head from R, Z, and molecular weight', () => {
    const suction = 80;
    const discharge = 200;
    const t1 = suction + 459.67;
    const t2 = discharge + 459.67;
    const exponent = Math.log(t2 / t1) / Math.log(2);
    const head = (1 / exponent) * (R_FT_LBF / 28.96) * t1 * (2 ** exponent - 1);
    const efficiency = 0.4 / 1.4 / exponent;
    const result = polytropicHead({
      system: 'us',
      suctionPressure: 14.7,
      dischargePressure: 29.4,
      suctionTemperature: suction,
      dischargeTemperature: discharge,
      specificHeatRatio: 1.4,
      molecularWeight: 28.96,
      compressibility: 1,
    });
    expect(result.exponent).toBeCloseTo(exponent, 5);
    expect(result.head).toBeCloseTo(head, 3);
    expect(result.efficiency).toBeCloseTo(efficiency, 5);
    expect(result.basis).toBe('Based on API 617, centrifugal compressors');
    expect(result.note).not.toMatch(noClause);
  });

  it('rejects a gauge-looking pressure rise that does not rise, and a heat ratio of 1', () => {
    const base = {
      system: 'metric' as const,
      suctionPressure: 1,
      dischargePressure: 1,
      suctionTemperature: 20,
      dischargeTemperature: 80,
      specificHeatRatio: 1.4,
      molecularWeight: 29,
      compressibility: 1,
    };
    expect(() => polytropicHead(base)).toThrow(/above suction/);
    expect(() => polytropicHead({ ...base, dischargePressure: 2, specificHeatRatio: 1 })).toThrow(/greater than 1/);
  });
});

describe('gear mesh and bearing frequencies', () => {
  it('uses teeth times shaft speed, and the standard inner-race bearing orders', () => {
    const result = machineFrequencies({ rpm: 1800, teeth: 20, rollingElements: 8, ballDiameter: 0.5, pitchDiameter: 2, contactAngleDeg: 0 });
    expect(result.shaftHz).toBeCloseTo(30, 6);
    expect(result.gearMeshHz).toBeCloseTo(600, 6);
    expect(result.bearing).toEqual({ bpfo: 90, bpfi: 150, bsf: 56.25, ftf: 11.25 });
    expect(result.basis).toBe('Based on API 670, machinery protection and vibration');
    expect(result.note).not.toMatch(noClause);
  });

  it('returns gear mesh alone when the bearing geometry is blank, and rejects a ball larger than the pitch', () => {
    const mesh = machineFrequencies({ rpm: 3600, teeth: 40 });
    expect(mesh.gearMeshHz).toBeCloseTo(2400, 6);
    expect(mesh.bearing).toBeNull();
    expect(() => machineFrequencies({ rpm: 1800, teeth: 10, rollingElements: 8, ballDiameter: 2, pitchDiameter: 2, contactAngleDeg: 0 })).toThrow(/smaller/);
    expect(() => machineFrequencies({ rpm: 1800, teeth: 1.5 })).toThrow(/whole number/);
  });
});

describe('coupling alignment screen', () => {
  it('tightens the field screen as speed rises and lets maker limits replace it', () => {
    const at3600 = couplingAlignment({ system: 'us', rpm: 3600, offset: 0.5, angularity: 0.1 });
    expect(at3600.offsetLimit).toBeCloseTo(1, 6);
    expect(at3600.angularLimit).toBeCloseTo(0.2, 6);
    expect(at3600.within).toBe(true);
    expect(at3600.limitSource).toBe('speed-screen');
    const over = couplingAlignment({ system: 'us', rpm: 3600, offset: 2, angularity: 0.1 });
    expect(over.within).toBe(false);
    expect(over.warnings[0]).toMatch(/Offset/);
    const fast = couplingAlignment({ system: 'us', rpm: 10000, offset: 0.4, angularity: 0.05 });
    expect(fast.offsetLimit).toBeCloseTo(0.5, 6);
    expect(fast.angularLimit).toBeCloseTo(0.1, 6);
    const slow = couplingAlignment({ system: 'us', rpm: 400, offset: 4, angularity: 0.5 });
    expect(slow.offsetLimit).toBeCloseTo(5, 6);
    expect(slow.angularLimit).toBeCloseTo(1, 6);
    const maker = couplingAlignment({ system: 'us', rpm: 3600, offset: 2, angularity: 0.4, makerOffset: 3, makerAngularity: 0.5 });
    expect(maker.within).toBe(true);
    expect(maker.limitSource).toBe('maker');
    expect(maker.basis).toBe('Based on API 671, couplings; API 686, installation, alignment, and grouting');
    expect(maker.note).not.toMatch(noClause);
    expect(angularityFromFace(4, 4)).toBeCloseTo(1, 6);
  });
});

describe('belt and chain', () => {
  it('halves the speed on a 2:1 diameter ratio and divides power by belt speed', () => {
    const result = beltDrive({ system: 'us', kind: 'belt', driverSize: 6, drivenSize: 12, driverRpm: 1800, pitchDiameter: null, power: 10 });
    const speed = (Math.PI * 6 * 1800) / 12;
    expect(result.ratio).toBeCloseTo(2, 6);
    expect(result.drivenRpm).toBeCloseTo(900, 6);
    expect(result.linearSpeed).toBeCloseTo(speed, 4);
    expect(result.effectiveTension).toBeCloseTo((10 * 33000) / speed, 4);
    expect(result.basis).toBe('');
  });

  it('uses tooth counts for the ratio and the pitch diameter for chain speed', () => {
    const result = beltDrive({ system: 'us', kind: 'chain', driverSize: 20, drivenSize: 40, driverRpm: 1750, pitchDiameter: 6, power: null });
    expect(result.ratio).toBeCloseTo(2, 6);
    expect(result.drivenRpm).toBeCloseTo(875, 6);
    expect(result.linearSpeed).toBeCloseTo((Math.PI * 6 * 1750) / 12, 4);
    expect(result.effectiveTension).toBeNull();
    expect(() => beltDrive({ system: 'metric', kind: 'belt', driverSize: 0, drivenSize: 100, driverRpm: 100, pitchDiameter: null, power: null })).toThrow(/diameter/i);
  });
});

describe('field unit converter', () => {
  it('converts gpm, psi, feet of head with specific gravity, and horsepower', () => {
    expect(convertFieldUnits({ kind: 'flow', value: 1, from: 'gpm', to: 'm3h' }).value).toBeCloseTo(GPM_TO_M3H, 8);
    expect(convertFieldUnits({ kind: 'power', value: 1, from: 'hp', to: 'kw' }).value).toBeCloseTo(HP_TO_KW, 8);
    const feet = convertFieldUnits({ kind: 'head', value: 10, from: 'psi', to: 'ft', sg: 1 });
    const expectedFt = (10 * PSI_TO_KPA) / (G * FT_TO_M);
    expect(feet.value).toBeCloseTo(expectedFt, 6);
    expect(feet.value).toBeCloseTo(23.07, 1);
    const lighter = convertFieldUnits({ kind: 'head', value: 10, from: 'psi', to: 'ft', sg: 0.8 });
    expect(lighter.value).toBeCloseTo(expectedFt / 0.8, 5);
    expect(convertFieldUnits({ kind: 'pressure', value: 1, from: 'psi', to: 'kpa' }).value).toBeCloseTo(PSI_TO_KPA, 6);
    expect(() => convertFieldUnits({ kind: 'head', value: 10, from: 'psi', to: 'ft' })).toThrow(/Specific gravity/);
    expect(convertFieldUnits({ kind: 'head', value: 10, from: 'ft', to: 'm', sg: null }).basis).toBe('');
  });
});

describe('bearing L10', () => {
  it('uses the cube for a ball bearing and 10/3 for a roller', () => {
    const ball = bearingL10({ system: 'us', kind: 'ball', capacity: 10000, load: 2000, rpm: 1800 });
    expect(ball.hours).toBeCloseTo((5 ** 3 * 1_000_000) / (1800 * 60), 4);
    expect(ball.exponent).toBe(3);
    const roller = bearingL10({ system: 'metric', kind: 'roller', capacity: 10000, load: 2000, rpm: 1800 });
    expect(roller.hours).toBeCloseTo((5 ** (10 / 3) * 1_000_000) / (1800 * 60), 3);
    expect(roller.exponent).toBeCloseTo(10 / 3, 6);
    const short = bearingL10({ system: 'us', kind: 'ball', capacity: 10000, load: 2000, rpm: 1800, requiredHours: 5000 });
    expect(short.warnings[0]).toMatch(/under the life you entered/);
    expect(ball.basis).toBe('Based on API 610, centrifugal pumps; API 613, gears');
    expect(`${ball.basis} ${ball.note}`).not.toMatch(noClause);
    expect(() => bearingL10({ system: 'us', kind: 'ball', capacity: 10, load: 0, rpm: 1800 })).toThrow(/load/i);
  });
});
