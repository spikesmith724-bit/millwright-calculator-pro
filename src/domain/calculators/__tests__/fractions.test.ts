import { FRACTION_CHART, fractionChartHtml, nearestSixtyFourth, searchFractions } from '@/src/domain/calculators/fractions';

describe('fraction chart', () => {
  it('lists 1/64 through 1 inch in lowest terms', () => {
    expect(FRACTION_CHART).toHaveLength(64);
    expect(FRACTION_CHART[0]).toMatchObject({ fraction: '1/64', decimalIn: '0.0156', mmLabel: '0.397' });
    expect(FRACTION_CHART[1]).toMatchObject({ fraction: '1/32', decimalIn: '0.0313', mmLabel: '0.794' });
    expect(FRACTION_CHART[31]).toMatchObject({ fraction: '1/2', decimalIn: '0.5000', mmLabel: '12.700' });
    expect(FRACTION_CHART[63]).toMatchObject({ fraction: '1', decimalIn: '1.0000', mmLabel: '25.400' });
    expect(FRACTION_CHART.map((row) => row.fraction)).toContain('3/8');
    expect(FRACTION_CHART.map((row) => row.fraction)).not.toContain('2/64');
  });

  it('searches by fraction, decimal inches, and millimeters', () => {
    expect(searchFractions('1/2').map((row) => row.fraction)).toEqual(['1/2']);
    expect(searchFractions('32/64').map((row) => row.fraction)).toEqual(['1/2']);
    expect(searchFractions('0.25').map((row) => row.fraction)).toEqual(['1/4']);
    expect(searchFractions('.5').map((row) => row.fraction)).toEqual(['1/2']);
    expect(searchFractions('12.7').map((row) => row.fraction)).toEqual(['1/2']);
    expect(searchFractions('16').map((row) => row.fraction)).toEqual(['1/16', '3/16', '1/4', '5/16', '7/16', '9/16', '11/16', '13/16', '15/16']);
    expect(searchFractions('')).toHaveLength(64);
    expect(searchFractions('nope')).toHaveLength(0);
  });

  it('snaps a fraction or a decimal to the nearest 64th and reports millimeters', () => {
    const eighth = nearestSixtyFourth('3/8');
    expect(eighth.exact).toBe(true);
    expect(eighth.fraction).toBe('3/8');
    expect(eighth.decimalIn).toBe('0.3750');
    expect(eighth.mmLabel).toBe('9.525');
    const off = nearestSixtyFourth('0.376');
    expect(off.fraction).toBe('3/8');
    expect(off.exact).toBe(false);
    expect(off.deltaIn).toBeCloseTo(0.001, 6);
    expect(nearestSixtyFourth('1 1/2').fraction).toBe('1 1/2');
    expect(nearestSixtyFourth('1-1/2').mmLabel).toBe('38.100');
    expect(nearestSixtyFourth('1/3').fraction).toBe('21/64');
    expect(nearestSixtyFourth('0').fraction).toBe('0');
    expect(() => nearestSixtyFourth('-1/2')).toThrow(/negative/);
    expect(() => nearestSixtyFourth('1/0')).toThrow(/denominator/);
    expect(() => nearestSixtyFourth('abc')).toThrow(/fraction/);
  });

  it('prints the full chart in black and white', () => {
    const html = fractionChartHtml('Nearest 64th for 0.376 in is 3/8.');
    expect(html).toContain('1/64');
    expect(html).toContain('25.400');
    expect(html).toContain('color: #000');
    expect(html).toContain('background: #fff');
    expect(html).not.toMatch(/#A9773F|#1F3A5F|#F3EBDD/i);
    expect((html.match(/<tr>/g) ?? []).length).toBe(65);
  });
});
