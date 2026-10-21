import {
  DRILL_INDEX,
  FRACTION_DRILLS,
  LETTER_DRILLS,
  NUMBER_DRILLS,
  drillChartHtml,
  listDrills,
  searchDrills,
} from '@/src/domain/calculators/drills';

describe('drill index', () => {
  it('lists number, letter, and fractional drills with millimeters from the decimal inch', () => {
    expect(NUMBER_DRILLS).toHaveLength(80);
    expect(LETTER_DRILLS).toHaveLength(26);
    expect(FRACTION_DRILLS).toHaveLength(64);
    expect(NUMBER_DRILLS[0]).toMatchObject({ name: '#1', decimal: '0.2280', thousandths: '228', mmLabel: '5.791' });
    expect(NUMBER_DRILLS[6]).toMatchObject({ name: '#7', decimal: '0.2010', thousandths: '201', mmLabel: '5.105' });
    expect(NUMBER_DRILLS[28]).toMatchObject({ name: '#29', decimal: '0.1360', thousandths: '136' });
    expect(NUMBER_DRILLS[68]).toMatchObject({ name: '#69', decimal: '0.0292', thousandths: '29.2', mmLabel: '0.742' });
    expect(NUMBER_DRILLS[79]).toMatchObject({ name: '#80', decimal: '0.0135', thousandths: '13.5', mmLabel: '0.343' });
    expect(LETTER_DRILLS[0]).toMatchObject({ name: 'A', decimal: '0.2340', thousandths: '234', mmLabel: '5.944' });
    expect(LETTER_DRILLS[4]).toMatchObject({ name: 'E', decimal: '0.2500', thousandths: '250', mmLabel: '6.350' });
    expect(LETTER_DRILLS[25]).toMatchObject({ name: 'Z', decimal: '0.4130', thousandths: '413', mmLabel: '10.490' });
    expect(FRACTION_DRILLS[0]).toMatchObject({ name: '1/64', decimal: '0.0156', thousandths: '15.6', mmLabel: '0.396' });
    expect(FRACTION_DRILLS[31]).toMatchObject({ name: '1/2', decimal: '0.5000', thousandths: '500', mmLabel: '12.700' });
    expect(FRACTION_DRILLS[63]).toMatchObject({ name: '1', decimal: '1.0000', thousandths: '1000', mmLabel: '25.400' });

    for (const row of NUMBER_DRILLS.concat(LETTER_DRILLS)) {
      expect(Math.abs(row.mm - row.inches * 25.4)).toBeLessThanOrEqual(0.0005 + 1e-9);
      expect(row.inches).toBeCloseTo(Number(row.decimal), 8);
    }
    FRACTION_DRILLS.forEach((row, index) => {
      const steps = index + 1;
      expect(row.inches).toBeCloseTo(steps / 64, 12);
      expect(Math.abs(Number(row.decimal) - steps / 64)).toBeLessThanOrEqual(0.00005 + 1e-9);
      expect(Math.abs(row.mm - Number(row.decimal) * 25.4)).toBeLessThanOrEqual(0.0005 + 1e-9);
    });
  });

  it('filters by type and sorts every size together', () => {
    expect(listDrills('number').map((row) => row.name)).toEqual(NUMBER_DRILLS.map((row) => row.name));
    expect(listDrills('letter')[0]?.name).toBe('A');
    expect(listDrills('letter').at(-1)?.name).toBe('Z');
    expect(listDrills('fraction')[0]?.name).toBe('1/64');
    const sized = listDrills('size');
    expect(sized).toHaveLength(170);
    expect(sized[0]?.name).toBe('#80');
    expect(sized.at(-1)?.name).toBe('1');
    for (let index = 1; index < sized.length; index += 1) {
      const previous = sized[index - 1];
      const current = sized[index];
      if (!previous || !current) throw new Error('missing row');
      expect(current.tenThousandths).toBeGreaterThanOrEqual(previous.tenThousandths);
    }
    const quarter = sized.findIndex((row) => row.name === '1/4');
    expect(sized[quarter + 1]?.name).toBe('E');
  });

  it('searches by gauge, letter, fraction, and decimal', () => {
    expect(searchDrills(DRILL_INDEX, '#7').map((row) => row.name)).toEqual(['#7']);
    expect(searchDrills(DRILL_INDEX, 'A').map((row) => row.name)).toEqual(['A']);
    expect(searchDrills(DRILL_INDEX, '1/4').map((row) => row.name)).toEqual(['1/4']);
    expect(searchDrills(DRILL_INDEX, '0.201').map((row) => row.name)).toEqual(['#7']);
    expect(searchDrills(DRILL_INDEX, '5.105').map((row) => row.name)).toEqual(['#7']);
    expect(searchDrills(NUMBER_DRILLS, '80').map((row) => row.name)).toEqual(['#80']);
  });

  it('prints the full index in black and white', () => {
    const html = drillChartHtml();
    expect(html).toContain('#1');
    expect(html).toContain('#80');
    expect(html).toContain('>Z<');
    expect(html).toContain('1/64');
    expect(html).toContain('0.2280');
    expect(html).toContain('ANSI/ASME B94.11M');
    expect(html).toContain('color: #000');
    expect(html).toContain('background: #fff');
    expect(html).not.toMatch(/#A9773F|#1F3A5F|#F3EBDD/i);
    expect(html.match(/<tr>/g)).toHaveLength(NUMBER_DRILLS.length + LETTER_DRILLS.length + FRACTION_DRILLS.length + 3);
  });
});
