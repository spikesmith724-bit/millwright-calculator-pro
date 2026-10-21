import { reverseDial, rimAndFace } from '@/src/domain/calculators/alignment';
import { boltCircle } from '@/src/domain/calculators/boltCircle';
import { epoxyGrout, groutOrderLine, GROUT_615 } from '@/src/domain/calculators/grout';
import { slingTension } from '@/src/domain/calculators/sling';
import { machineThermal, simpleThermal, THERMAL_MATERIALS } from '@/src/domain/calculators/thermal';
import { convertUnits } from '@/src/domain/calculators/units';

/**
 * Rim-and-face derivation.
 * Face diameter 4 in, front foot 8 in from the coupling, back foot 20 in.
 * Rim bottom 8 mils, top 0, sag 0. Face bottom 4, top 0.
 * Rim TIR = 8. Face TIR = 4. Parallel offset = 4 mils. Slope = 4/4 = 1 mil per inch.
 * Front = 1×8 + 4 = 12 mils added. Back = 1×20 + 4 = 24 mils added.
 * Sag of 2 mils raises the rim TIR to 10, so the parallel half becomes 5:
 * front 13, back 25.
 * Horizontal uses the same relation with right − left and no sag.
 * Rim right −6, face right 2: front = (2×8/4) + (−6/2) = 1. Back = 10 − 3 = 7.
 */
describe('shaft alignment', () => {
  it('solves a rim-and-face example and applies sag only to the bottom rim', () => {
    const base = {
      faceDiameterIn: 4,
      frontFootIn: 8,
      backFootIn: 20,
      rim: { top: 0, bottom: 8, left: 0, right: -6 },
      face: { top: 0, bottom: 4, left: 0, right: 2 },
    };
    const plain = rimAndFace({ ...base, sagMils: 0 });
    expect(plain.front).toEqual({ verticalMils: 12, horizontalMils: 1 });
    expect(plain.back).toEqual({ verticalMils: 24, horizontalMils: 7 });
    expect(plain.disclaimer).toMatch(/Verify against OEM/);
    const sagged = rimAndFace({ ...base, sagMils: 2 });
    expect(sagged.front.verticalMils).toBe(13);
    expect(sagged.back.verticalMils).toBe(25);
    expect(sagged.front.horizontalMils).toBe(1);
  });

  /**
   * Reverse dial. Span 10 in. Front foot 15 in from the near indicator, back 25 in.
   * Both bottom readings are +10 mils and sag is 0, tops are 0.
   * Near offset = 10/2 = 5. Far offset = −10/2 = −5 (the far indicator is reversed).
   * Slope = (−5 − 5) / 10 = −1 mil per inch.
   * Offset at 15 in = 5 − 15 = −10, so shim added = 10.
   * Offset at 25 in = 5 − 25 = −20, so shim added = 20.
   */
  it('solves a reverse-dial example by reversing the far indicator', () => {
    const zeros = { top: 0, bottom: 0, left: 0, right: 0 };
    const result = reverseDial({
      indicatorSpanIn: 10,
      frontFootFromNearIn: 15,
      backFootFromNearIn: 25,
      sagNearMils: 0,
      sagFarMils: 0,
      near: { ...zeros, bottom: 10 },
      far: { ...zeros, bottom: 10 },
    });
    expect(result.front.verticalMils).toBe(10);
    expect(result.back.verticalMils).toBe(20);
    expect(result.formulaVersion).toMatch(/2026-10-10/);
  });
});

describe('thermal growth', () => {
  it('uses the published steel coefficient for a 20 in centerline and a 100°F rise', () => {
    const steel = THERMAL_MATERIALS.find((item) => item.id === 'steel');
    expect(steel?.alphaPerF).toBe(6.5e-6);
    const result = simpleThermal({ alphaPerF: 6.5e-6, lengthIn: 20, deltaTF: 100 });
    expect(result.deltaIn).toBeCloseTo(0.013, 6);
    expect(result.deltaMils).toBeCloseTo(13, 3);
    expect(result.estimateLabel).toMatch(/OEM thermal growth/);
  });

  /**
   * Driver: steel, 20 in centerline, ambient 70°F, both feet 170°F → 0.013 in at each foot.
   * Driven: same steel, 10 in centerline, feet stay at ambient → 0 growth.
   * Relative (driven − driver) front = −0.013. Cold target = +0.013 in (set the driven machine higher).
   * Uneven driver feet: front 170°F, back 70°F, span 20 in.
   * Cold targets 0.013 and 0. Angle = atan(−0.013/20).
   */
  it('compares two machines and returns a cold-alignment target', () => {
    const even = machineThermal(
      {
        centerlineHeightIn: 20,
        alphaPerF: 6.5e-6,
        ambientF: 70,
        frontFootF: 170,
        backFootF: 170,
        footSpanIn: 30,
        lateralIn: null,
        lateralTempF: null,
      },
      {
        centerlineHeightIn: 10,
        alphaPerF: 6.5e-6,
        ambientF: 70,
        frontFootF: 70,
        backFootF: 70,
        footSpanIn: null,
        lateralIn: 4,
        lateralTempF: 170,
      },
    );
    expect(even.driver.frontIn).toBeCloseTo(0.013, 6);
    expect(even.driver.centerlineIn).toBeCloseTo(0.013, 6);
    expect(even.coldTargets.frontMils).toBeCloseTo(13, 3);
    expect(even.coldTargets.angleDeg).toBe(0);
    expect(even.driven.horizontalIn).toBeCloseTo(6.5e-6 * 4 * 100, 6);

    const uneven = machineThermal(
      {
        centerlineHeightIn: 20,
        alphaPerF: 6.5e-6,
        ambientF: 70,
        frontFootF: 170,
        backFootF: 70,
        footSpanIn: 20,
        lateralIn: null,
        lateralTempF: null,
      },
      {
        centerlineHeightIn: 10,
        alphaPerF: 6.5e-6,
        ambientF: 70,
        frontFootF: 70,
        backFootF: 70,
        footSpanIn: null,
        lateralIn: null,
        lateralTempF: null,
      },
    );
    expect(uneven.coldTargets.frontIn).toBeCloseTo(0.013, 6);
    expect(uneven.coldTargets.backIn).toBeCloseTo(0, 6);
    expect(uneven.coldTargets.angleMilsPerIn).toBeCloseTo(-0.65, 3);
  });
});

describe('sling angle', () => {
  it('divides the load by sin of the angle and warns under 30 degrees', () => {
    const result = slingTension(1000, 2, 60);
    expect(result.sharePerLeg).toBe(500);
    expect(result.tensionPerLeg).toBeCloseTo(1000 / Math.sqrt(3), 3);
    expect(result.angleFactor).toBeCloseTo(2 / Math.sqrt(3), 4);
    expect(result.warnings).toHaveLength(0);
    expect(slingTension(1000, 2, 30).warnings).toHaveLength(0);
    expect(slingTension(1000, 2, 29).warnings[0]).toMatch(/under 30/);
  });
});

describe('unit conversions', () => {
  it('converts defined factors for length, torque, temperature, and speed', () => {
    expect(convertUnits('length', 1, 'in', 'mm').value).toBeCloseTo(25.4, 6);
    expect(convertUnits('length', 1, 'mil', 'thou').value).toBe(1);
    expect(convertUnits('torque', 12, 'inlb', 'ftlb').value).toBeCloseTo(1, 6);
    expect(convertUnits('torque', 1, 'ftlb', 'nm').value).toBeCloseTo(1.3558179483314004, 6);
    expect(convertUnits('pressure', 1, 'psi', 'kpa').value).toBeCloseTo(6.894757293168361, 4);
    expect(convertUnits('temperature', 212, 'f', 'c').value).toBeCloseTo(100, 6);
    expect(convertUnits('flow', 1, 'gpm', 'm3h').value).toBeCloseTo(0.22712470704, 6);
    expect(convertUnits('speed', 1800, 'rpm', 'hz').value).toBeCloseTo(30, 6);
  });
});

describe('bolt circle', () => {
  it('places four holes starting at 12 o’clock and going clockwise', () => {
    const result = boltCircle(10, 4, 0);
    expect(result.holes.map((hole) => [hole.x, hole.y])).toEqual([
      [0, 5],
      [5, 0],
      [0, -5],
      [-5, 0],
    ]);
  });
});

/**
 * 48 × 24 × 2 in = 2,304 in³. 2,304 / 1,728 = 1.333… ft³.
 * With 10% waste that is 1.4666… ft³. One Chockfast Red unit is 1.6 ft³, so ceil is 1 unit.
 * A second 36 × 12 × 2 section is 864 in³. A 6 × 6 × 2 void is 72 in³.
 * Net = 3,096 in³ = 1.79166… ft³. With 10% waste, 1.97083 ft³, which is 2 units.
 */
describe('epoxy grout', () => {
  it('rounds a 48×24×2 in pour up to one Chockfast Red unit at 10% waste', () => {
    const result = epoxyGrout({
      productId: 'red',
      sections: [{ lengthIn: 48, widthIn: 24, depthIn: 2 }],
      voids: [],
      wastePercent: 10,
      ambientF: 70,
    });
    expect(result.netIn3).toBe(2304);
    expect(result.netFt3).toBeCloseTo(2304 / 1728, 4);
    expect(result.orderFt3).toBeCloseTo((2304 / 1728) * 1.1, 4);
    expect(result.unitCount).toBe(1);
    expect(result.sectionTakes).toEqual([{ index: 1, volumeFt3: result.netFt3, unitCount: 1 }]);
    expect(groutOrderLine(result)).toBe('1 resin pail · 1 hardener · 4 aggregate bags · 1.3333 ft³ net · 0.1333 ft³ left · 207 lb shipping');
    expect(result.resinPails).toBe(1);
    expect(result.aggregateBags).toBe(4);
    expect(result.shippingWeightLb).toBe(207);
    expect(result.materialWeightLb).toBe(207);
    expect(result.warnings).toContain(GROUT_615);
    expect(result.warnings.some((warning) => warning.includes('depth'))).toBe(false);
  });

  it('subtracts voids across sections and warns on depth, length, and temperature', () => {
    const result = epoxyGrout({
      productId: 'red',
      sections: [
        { lengthIn: 48, widthIn: 24, depthIn: 1 },
        { lengthIn: 96, widthIn: 12, depthIn: 2 },
      ],
      voids: [{ volumeIn3: null, lengthIn: 6, widthIn: 6, depthIn: 2 }],
      wastePercent: 10,
      ambientF: 40,
    });
    const net = 48 * 24 * 1 + 96 * 12 * 2 - 72;
    expect(result.netIn3).toBe(net);
    expect(result.unitCount).toBe(Math.ceil((net / 1728) * 1.1 / 1.6 - 1e-9));
    expect(result.sectionTakes.map((section) => section.unitCount)).toEqual([1, 1]);
    expect(result.warnings.some((warning) => warning.includes('depth'))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('7 ft'))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes('55–95'))).toBe(true);
  });

  it('uses the Versaflow unit volume and does not invent its packaging', () => {
    const result = epoxyGrout({
      productId: 'versaflow',
      sections: [{ lengthIn: 24, widthIn: 24, depthIn: 2 }],
      voids: [],
      wastePercent: 0,
      ambientF: 70,
    });
    expect(result.unitCount).toBe(1);
    expect(result.resinPails).toBeNull();
    expect(result.netL).toBeGreaterThan(0);
    expect(groutOrderLine(result)).toContain('shipping weight on the TDS');
  });

  it('counts each pour on its own and still orders the combined volume once', () => {
    const result = epoxyGrout({
      productId: 'red',
      sections: [
        { lengthIn: 24, widthIn: 12, depthIn: 2 },
        { lengthIn: 24, widthIn: 12, depthIn: 2 },
      ],
      voids: [],
      wastePercent: 0,
      ambientF: 70,
    });
    expect(result.sectionTakes.map((section) => section.unitCount)).toEqual([1, 1]);
    expect(result.unitCount).toBe(1);
    expect(result.shippingWeightLb).toBe(207);
  });
});

