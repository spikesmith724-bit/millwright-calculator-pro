import { beltChartHtml } from '@/src/domain/calculators/beltSize';
import {
  BUSHINGS,
  CHAIN_SIZES,
  HP_CAPACITY_COPY,
  HP_INCH_LB_CONSTANT,
  HP_TORQUE_CONSTANT,
  NEW_BELT_FORCE_FACTOR,
  TENSION_ROWS,
  ansiRollerPitchInches,
  beltSpeedFpm,
  deflectionExample,
  formatForce,
  horsepowerFromInchPounds,
  solveHorsepower,
  solveSpeedRatio,
  spanDeflectionInches,
  timingPitchDiameter,
} from '@/src/domain/calculators/beltDriveRef';

describe('belt drive reference', () => {
  it('solves N1×D1 = N2×D2 and the belt speed in feet per minute', () => {
    const solved = solveSpeedRatio({ n1: 1750, d1: 4, d2: 8 });
    expect(solved.n2).toBe(875);
    expect(solved.n1 * solved.d1).toBe(solved.n2 * solved.d2);
    expect(solved.speedRatio).toBe(2);
    expect(solved.driverFpm).toBe((Math.PI * 4 * 1750) / 12);
    expect(solved.drivenFpm).toBe(solved.driverFpm);
    expect(solveSpeedRatio({ d1: 4, n2: 875, d2: 8 }).n1).toBe(1750);
    expect(solveSpeedRatio({ n1: 1750, n2: 875, d2: 8 }).d1).toBe(4);
    expect(solveSpeedRatio({ n1: 1750, d1: 4, n2: 875 }).d2).toBe(8);
    expect(beltSpeedFpm(6, 1750)).toBe((Math.PI * 6 * 1750) / 12);
    expect(() => solveSpeedRatio({ n1: 1750, d1: 4 })).toThrow(/three of the four/);
    expect(() => solveSpeedRatio({ n1: 1750, d1: 4, n2: 1000, d2: 8 })).toThrow(/N1×D1 = N2×D2/);
    expect(() => solveSpeedRatio({ n1: 0, d1: 4, d2: 8 })).toThrow(/greater than zero/);
  });

  it('uses HP = T×RPM/5252 and the published pound-inch constant', () => {
    expect(HP_TORQUE_CONSTANT).toBe(5252);
    expect(HP_INCH_LB_CONSTANT).toBe(63025);
    const power = solveHorsepower({ hp: 10, rpm: 1750 });
    expect(power.torqueFtLb).toBe((10 * 5252) / 1750);
    expect(solveHorsepower({ torqueFtLb: power.torqueFtLb, rpm: 1750 }).hp).toBe(10);
    expect(solveHorsepower({ hp: 10, torqueFtLb: power.torqueFtLb }).rpm).toBe(1750);
    expect(horsepowerFromInchPounds(power.torqueFtLb * 12, 1750)).toBe((power.torqueFtLb * 12 * 1750) / 63025);
    expect(() => solveHorsepower({ hp: 10 })).toThrow(/two of horsepower/);
    expect(() => solveHorsepower({ hp: 10, torqueFtLb: 20, rpm: 1750 })).toThrow(/5252/);
    expect(HP_CAPACITY_COPY).toMatch(/check the manufacturer's rating/i);
    expect(HP_CAPACITY_COPY).not.toMatch(/\d+\s+to\s+\d+\s+HP/i);
  });

  it('deflects 1/64 in per inch of span and keeps the published force table', () => {
    expect(spanDeflectionInches(32)).toBe(0.5);
    expect(deflectionExample()).toMatchObject({ span: 32, inches: 0.5, fraction: '1/2' });
    expect(NEW_BELT_FORCE_FACTOR).toBe(1.33);
    const sectionA = TENSION_ROWS.find((item) => item.section === 'A' && item.sheave === '3.2');
    expect(sectionA?.wrapped).toEqual({ min: 3.1, max: 4.5 });
    expect(sectionA?.cogged).toEqual({ min: 3.9, max: 5.6 });
    expect(formatForce(sectionA?.wrapped ?? null)).toBe('3.1–4.5 lb');
    expect(NEW_BELT_FORCE_FACTOR * 4.5).toBeCloseTo(5.985, 10);
    const section8 = TENSION_ROWS.find((item) => item.section === '8V' && item.sheave === '12.50–17.00');
    expect(section8?.wrapped).toEqual({ min: 31, max: 45 });
    expect(formatForce(section8?.cogged ?? null)).toBe('—');
    const smallA = TENSION_ROWS.find((item) => item.section === 'A' && item.sheave === '2.2');
    expect(formatForce(smallA?.wrapped ?? null)).toBe('Not recommended');
    expect(BUSHINGS.find((item) => item.id === 'qd')?.taperInPerFt).toBe(0.75);
    expect(BUSHINGS.find((item) => item.id === 'taper-lock')?.taperInPerFt).toBe(1.678);
    expect(BUSHINGS.find((item) => item.id === 'taper-lock')?.flange).toBe(false);
  });

  it('reads ANSI roller pitch and timing pitch diameter', () => {
    expect(ansiRollerPitchInches(40)).toBe(0.5);
    expect(ansiRollerPitchInches(41)).toBe(0.5);
    expect(ansiRollerPitchInches(35)).toBe(0.375);
    expect(ansiRollerPitchInches(80)).toBe(1);
    expect(ansiRollerPitchInches(100)).toBe(1.25);
    expect(ansiRollerPitchInches(200)).toBe(2.5);
    expect(CHAIN_SIZES.map((item) => item.number)).toEqual([25, 35, 40, 41, 50, 60, 80, 100, 120, 140, 160, 200]);
    expect(timingPitchDiameter(20, 0.5)).toBe(10 / Math.PI);
  });

  it('prints the drive notes in black and white', () => {
    const html = beltChartHtml();
    expect(html).toContain('N1×D1 = N2×D2');
    expect(html).toContain('HP = T×RPM/5252');
    expect(html).toContain('1/64');
    expect(html).toContain('1.33');
    expect(html).toContain('QD');
    expect(html).toContain('Not recommended');
    expect(html).toContain("check the manufacturer's rating");
    expect(html).toContain('color: #000');
    expect(html).toContain('background: #fff');
    expect(html).not.toMatch(/#A9773F|#1F3A5F|#F3EBDD/i);
  });
});
