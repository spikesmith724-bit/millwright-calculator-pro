import {
  CAUTION_MM,
  FIT_CAUTION,
  FIT_INTERCHANGEABLE,
  FIT_NONE,
  INCH_SOCKETS,
  INTERCHANGE_MM,
  METRIC_SOCKETS,
  MM_PER_INCH,
  searchSockets,
  socketChartHtml,
} from '@/src/domain/calculators/sockets';

describe('socket cross-reference', () => {
  it('lists 1/4 through 2 inches in 1/16 steps and checks millimeters as inch × 25.4', () => {
    expect(INCH_SOCKETS).toHaveLength(29);
    expect(INCH_SOCKETS[0]).toMatchObject({ fraction: '1/4', exactLabel: '6.35', nearest: '6', diffLabel: '+0.35', fit: FIT_CAUTION });
    expect(INCH_SOCKETS.at(-1)).toMatchObject({ fraction: '2', exactLabel: '50.80', nearest: '51', diffLabel: '-0.20', fit: FIT_INTERCHANGEABLE });
    const half = INCH_SOCKETS.find((row) => row.fraction === '1/2');
    const threeQuarter = INCH_SOCKETS.find((row) => row.fraction === '3/4');
    const threeEighth = INCH_SOCKETS.find((row) => row.fraction === '3/8');
    expect(half).toMatchObject({ exactLabel: '12.70', nearest: '13', diffLabel: '-0.30', fit: FIT_CAUTION });
    expect(threeQuarter).toMatchObject({ exactLabel: '19.05', nearest: '19', diffLabel: '+0.05', fit: FIT_INTERCHANGEABLE });
    expect(threeEighth).toMatchObject({ exactLabel: '9.53', nearest: '10', fit: FIT_NONE });

    for (const row of INCH_SOCKETS) {
      expect(row.exactMm).toBeCloseTo(row.inches * MM_PER_INCH, 8);
      expect(row.inches * MM_PER_INCH).toBeCloseTo(row.inches * 25.4, 8);
      expect(row.exactLabel).toMatch(/^\d+\.\d{2}$/);
      expect(Math.abs(Number(row.exactLabel) - row.inches * 25.4)).toBeLessThanOrEqual(0.005 + 1e-6);
      const gap = Math.abs(row.exactMm - row.nearestMm);
      expect(gap).toBeLessThanOrEqual(0.5 + 1e-9);
      expect(Math.abs(row.exactMm - (row.nearestMm - 1))).toBeGreaterThanOrEqual(gap - 1e-9);
      expect(row.diffMm).toBeCloseTo(row.exactMm - row.nearestMm, 8);
      expect(row.fit).toBe(expectedFit(gap));
    }
    expect(new Set(INCH_SOCKETS.map((row) => row.fit))).toEqual(new Set([FIT_INTERCHANGEABLE, FIT_CAUTION, FIT_NONE]));
  });

  it('matches metric sockets back to the nearest inch size', () => {
    expect(METRIC_SOCKETS).toHaveLength(46);
    expect(METRIC_SOCKETS[0]?.nominal).toBe('6');
    expect(METRIC_SOCKETS.at(-1)?.nominal).toBe('51');
    const nineteen = METRIC_SOCKETS.find((row) => row.nominal === '19');
    const thirteen = METRIC_SOCKETS.find((row) => row.nominal === '13');
    const ten = METRIC_SOCKETS.find((row) => row.nominal === '10');
    expect(nineteen).toMatchObject({ nearest: '3/4', exactLabel: '0.7480', diffLabel: '-0.05', fit: FIT_INTERCHANGEABLE });
    expect(thirteen).toMatchObject({ nearest: '1/2', fit: FIT_CAUTION });
    expect(ten).toMatchObject({ nearest: '3/8', fit: FIT_NONE });
    if (!nineteen) throw new Error('missing 19 mm');
    expect(nineteen.nearestMm).toBeCloseTo(0.75 * 25.4, 8);
    expect(19 - nineteen.nearestMm).toBeCloseTo(nineteen.diffMm, 8);

    for (const row of METRIC_SOCKETS) {
      expect(row.exactMm).toBeCloseTo(row.inches * 25.4, 8);
      expect(row.exactLabel).toMatch(/^\d+\.\d{4}$/);
      expect(Math.abs(Number(row.exactLabel) - Number(row.nominal) / 25.4)).toBeLessThanOrEqual(0.00005 + 1e-8);
      const gap = Math.abs(row.diffMm);
      expect(row.fit).toBe(expectedFit(gap));
    }
  });

  it('searches by fraction, millimeter, and fit', () => {
    expect(searchSockets(INCH_SOCKETS, '1/2').map((row) => row.fraction)).toEqual(['1/2']);
    expect(searchSockets(INCH_SOCKETS, '13').map((row) => row.fraction).sort()).toEqual(['1/2', '13/16']);
    expect(searchSockets(INCH_SOCKETS, '19.05').map((row) => row.fraction)).toEqual(['3/4']);
    expect(searchSockets(INCH_SOCKETS, 'no good').every((row) => row.fit === FIT_NONE)).toBe(true);
    expect(searchSockets(METRIC_SOCKETS, '3/4').map((row) => row.nominal)).toEqual(['19']);
    expect(searchSockets(INCH_SOCKETS, '')).toHaveLength(29);
  });

  it('prints both directions in black and white', () => {
    const html = socketChartHtml();
    expect(html).toContain('6.35');
    expect(html).toContain('50.80');
    expect(html).toContain('Inch to metric');
    expect(html).toContain('Metric to inch');
    expect(html).toContain(FIT_INTERCHANGEABLE);
    expect(html).toContain(FIT_CAUTION);
    expect(html).toContain(FIT_NONE);
    expect(html).toContain('color: #000');
    expect(html).toContain('background: #fff');
    expect(html).not.toMatch(/#A9773F|#1F3A5F|#F3EBDD/i);
    expect(html.match(/<tr>/g)).toHaveLength(INCH_SOCKETS.length + METRIC_SOCKETS.length + 2);
  });
});

function expectedFit(gap: number): string {
  if (gap <= INTERCHANGE_MM + 1e-9) return FIT_INTERCHANGEABLE;
  if (gap <= CAUTION_MM + 1e-9) return FIT_CAUTION;
  return FIT_NONE;
}
