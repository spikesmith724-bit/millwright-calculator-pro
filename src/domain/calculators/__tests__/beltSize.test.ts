import {
  BELT_LENGTH_FORMULA,
  MEASURE_STEPS,
  OPEN_BELT_FACTOR,
  TIMING_PITCHES,
  V_BELT_SECTIONS,
  beltChartHtml,
  beltLengthExample,
  beltQueryHits,
  classicalLengths,
  decodeBeltCode,
  lengthExamples,
  narrowEffectiveInches,
  openBeltLength,
} from '@/src/domain/calculators/beltSize';

describe('belt sizing chart', () => {
  it('uses the published RMA section widths and depths', () => {
    expect(V_BELT_SECTIONS.map((section) => section.id)).toEqual(['A', 'B', 'C', 'D', '3V', '5V', '8V']);
    const section = Object.fromEntries(V_BELT_SECTIONS.map((row) => [row.id, row]));
    expect(section.A).toMatchObject({
      family: 'classical',
      topFraction: '1/2',
      depthFraction: '5/16',
      topDecimal: '0.500',
      depthDecimal: '0.3125',
      topMmLabel: '12.700',
      depthMmLabel: '7.938',
      outsideAddInches: 2,
    });
    expect(section.B).toMatchObject({ topFraction: '21/32', topDecimal: '0.65625', depthFraction: '13/32', depthDecimal: '0.40625', topMmLabel: '16.669', depthMmLabel: '10.319', outsideAddInches: 3 });
    expect(section.C).toMatchObject({ topFraction: '7/8', depthFraction: '17/32', topDecimal: '0.875', depthDecimal: '0.53125', topMmLabel: '22.225', depthMmLabel: '13.494', outsideAddInches: 4 });
    expect(section.D).toMatchObject({ topFraction: '1 1/4', depthFraction: '3/4', topDecimal: '1.250', depthDecimal: '0.750', topMmLabel: '31.750', depthMmLabel: '19.050', outsideAddInches: 5 });
    expect(section['3V']).toMatchObject({ family: 'narrow', topFraction: '3/8', depthFraction: '21/64', topDecimal: '0.375', depthDecimal: '0.328125', topMmLabel: '9.525', depthMmLabel: '8.334', outsideAddInches: null });
    expect(section['5V']).toMatchObject({ topFraction: '5/8', depthFraction: '35/64', topDecimal: '0.625', depthDecimal: '0.546875', topMmLabel: '15.875', depthMmLabel: '13.891' });
    expect(section['8V']).toMatchObject({ topFraction: '1', depthFraction: '7/8', topDecimal: '1.000', depthDecimal: '0.875', topMmLabel: '25.400', depthMmLabel: '22.225' });

    for (const row of V_BELT_SECTIONS) {
      expect(row.topInches).toBeCloseTo(row.topSixtyFourths / 64, 12);
      expect(row.depthInches).toBeCloseTo(row.depthSixtyFourths / 64, 12);
      expect(Math.abs(Number(row.topMmLabel) - row.topInches * 25.4)).toBeLessThanOrEqual(0.0005 + 1e-9);
      expect(Math.abs(Number(row.depthMmLabel) - row.depthInches * 25.4)).toBeLessThanOrEqual(0.0005 + 1e-9);
    }
  });

  it('reads classical inside length and narrow effective length', () => {
    expect(decodeBeltCode('A42')).toMatchObject({ code: 'A42', section: 'A', basis: 'inside', inches: 42, outsideInches: 44 });
    expect(decodeBeltCode('a42').outsideInches).toBe(44);
    expect(classicalLengths('B', 60)).toEqual({ insideInches: 60, outsideInches: 63 });
    expect(classicalLengths('C', 80).outsideInches).toBe(84);
    expect(classicalLengths('D', 120).outsideInches).toBe(125);
    expect(decodeBeltCode('5V1000')).toMatchObject({ code: '5V1000', section: '5V', basis: 'effective', inches: 100, outsideInches: null });
    expect(narrowEffectiveInches(1000)).toBe(100);
    expect(decodeBeltCode('3V500').inches).toBe(50);
    expect(lengthExamples().map((item) => item.code)).toEqual(['A42', '5V1000']);
    expect(() => decodeBeltCode('9V100')).toThrow(/A42 or 5V1000/);
    expect(() => narrowEffectiveInches(10.5)).toThrow(/tenths/);
    expect(() => classicalLengths('A', 0)).toThrow(/greater than zero/);
  });

  it('evaluates the open-belt length with the factor 1.57', () => {
    const expected = 2 * 24 + OPEN_BELT_FACTOR * (12 + 6) + (6 * 6) / (4 * 24);
    expect(OPEN_BELT_FACTOR).toBe(1.57);
    expect(openBeltLength(12, 6, 24)).toBe(expected);
    expect(openBeltLength(6, 12, 24)).toBe(expected);
    expect(expected).toBeCloseTo(76.635, 9);
    expect(beltLengthExample()).toMatchObject({ large: 12, small: 6, center: 24, label: '76.635' });
    expect(beltLengthExample().inches).toBe(expected);
    const equal = openBeltLength(10, 10, 20);
    expect(equal).toBe(2 * 20 + OPEN_BELT_FACTOR * 20);
    expect(equal).toBeLessThan(2 * 20 + Math.PI * 10);
    expect(() => openBeltLength(12, 6, 8)).toThrow('Center distance is shorter than half the sum of the diameters.');
    expect(openBeltLength(12, 6, 9)).toBe(2 * 9 + OPEN_BELT_FACTOR * 18 + 1);
    expect(() => openBeltLength(12, 6, 0)).toThrow(/Center distance must be greater than zero/);
    expect(() => openBeltLength(-4, 6, 24)).toThrow(/Diameter must be greater than zero/);
  });

  it('lists timing pitches, including distinct MXL and GT2', () => {
    expect(TIMING_PITCHES.map((pitch) => pitch.id)).toEqual(['MXL', 'XL', 'L', 'H', 'HTD 3M', 'HTD 5M', 'HTD 8M', 'HTD 14M', 'GT2']);
    const pitch = Object.fromEntries(TIMING_PITCHES.map((row) => [row.id, row]));
    expect(pitch.MXL).toMatchObject({ pitchInchLabel: '0.080', pitchMmLabel: '2.032', family: 'trapezoidal' });
    expect(pitch.XL).toMatchObject({ pitchInchLabel: '0.200', pitchMmLabel: '5.080' });
    expect(pitch.L).toMatchObject({ pitchInchLabel: '0.375', pitchMmLabel: '9.525' });
    expect(pitch.H).toMatchObject({ pitchInchLabel: '0.500', pitchMmLabel: '12.700' });
    expect(pitch['HTD 3M']).toMatchObject({ pitchMm: 3, pitchMmLabel: '3', pitchInchLabel: '0.1181' });
    expect(pitch['HTD 5M']).toMatchObject({ pitchMm: 5, pitchInchLabel: '0.1969' });
    expect(pitch['HTD 8M']).toMatchObject({ pitchMm: 8, pitchInchLabel: '0.3150' });
    expect(pitch['HTD 14M']).toMatchObject({ pitchMm: 14, pitchInchLabel: '0.5512' });
    expect(pitch.GT2).toMatchObject({ pitchMm: 2, pitchMmLabel: '2', pitchInchLabel: '0.0787', family: 'gt2' });
    expect(pitch.MXL?.pitchMm).not.toBe(pitch.GT2?.pitchMm);
    for (const row of TIMING_PITCHES) {
      if (row.family === 'trapezoidal') expect(Math.abs(row.pitchInches * 25.4 - row.pitchMm)).toBeLessThanOrEqual(0.0005 + 1e-9);
    }
    expect(MEASURE_STEPS.map((step) => step.title)).toEqual(['Belt section', 'Sheave groove', 'Pulley diameter', 'Center distance', 'Timing pitch']);
  });

  it('searches section codes and length codes separately', () => {
    expect(V_BELT_SECTIONS.filter((section) => beltQueryHits('A42', section.haystack, { sectionId: section.id }))).toEqual([]);
    expect(lengthExamples().filter((item) => beltQueryHits('A42', `${item.code} ${item.basis}`, { sectionId: item.section, code: item.code })).map((item) => item.code)).toEqual(['A42']);
    expect(V_BELT_SECTIONS.filter((section) => beltQueryHits('5V', section.haystack, { sectionId: section.id })).map((section) => section.id)).toEqual(['5V']);
    expect(TIMING_PITCHES.filter((pitch) => beltQueryHits('MXL', pitch.haystack)).map((pitch) => pitch.id)).toEqual(['MXL']);
    expect(beltQueryHits('1/2', V_BELT_SECTIONS[0]?.haystack ?? '')).toBe(true);
  });

  it('prints the full chart in black and white', () => {
    const html = beltChartHtml();
    expect(html).toContain('A42');
    expect(html).toContain('5V1000');
    expect(html).toContain('42 in inside, about 44 in outside');
    expect(html).toContain('100.0 in effective');
    expect(html).toContain(BELT_LENGTH_FORMULA);
    expect(html).toContain('L = 76.635 in');
    expect(html).toContain('MXL');
    expect(html).toContain('GT2');
    expect(html).toContain('2.032 mm');
    expect(html).toContain('RMA/MPTA');
    expect(html).toContain('color: #000');
    expect(html).toContain('background: #fff');
    expect(html).not.toMatch(/#A9773F|#1F3A5F|#F3EBDD/i);
    expect(html.match(/<tr>/g)?.length).toBeGreaterThan(V_BELT_SECTIONS.length + TIMING_PITCHES.length);
  });
});
