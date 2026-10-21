import { FLUSH_TARGETS, ISO_VG_GRADES, VISCOSITY_NOTE } from '@/src/domain/lubrication/flushTargets';
import { lubeOilHtml } from '@/src/domain/lubrication/lubeOilHtml';
import { NAS_ROWS, classifyNas, iso4406Code, isoScaleNumber } from '@/src/domain/lubrication/nas1638';
import { LAB_LIMIT_NOTE, OIL_ANALYTES } from '@/src/domain/lubrication/oilAnalysis';

describe('NAS 1638', () => {
  it('uses the published differential limits, including the counts other sheets round wrong', () => {
    expect(NAS_ROWS.map((row) => row.className)).toEqual(['00', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    expect(NAS_ROWS.find((row) => row.className === '00')?.counts).toEqual([125, 22, 4, 1, 0]);
    expect(NAS_ROWS.find((row) => row.className === '5')?.counts).toEqual([8000, 1425, 253, 45, 8]);
    expect(NAS_ROWS.find((row) => row.className === '2')?.counts[4]).toBe(1);
    expect(NAS_ROWS.find((row) => row.className === '7')?.counts[3]).toBe(180);
    expect(NAS_ROWS.find((row) => row.className === '11')?.counts[1]).toBe(91200);
    expect(NAS_ROWS.find((row) => row.className === '12')?.counts).toEqual([1024000, 182400, 32400, 5760, 1024]);
    expect(NAS_ROWS.find((row) => row.className === '5')?.approximateIso).toBe('16/14/11');
    expect(NAS_ROWS.find((row) => row.className === '12')?.approximateIso).toBe('23/21/18');
    expect(NAS_ROWS.find((row) => row.className === '00')?.approximateIso).toBeNull();
  });

  it('takes the worst range as the class and maps the upper edge of each limit', () => {
    expect(classifyNas([0, 0, 0, 0, 0])).toMatchObject({ overall: '00', approximateIso: null });
    expect(classifyNas([8000, 1425, 253, 45, 8])).toMatchObject({ overall: '5', approximateIso: '16/14/11' });
    expect(classifyNas([8001, 0, 0, 0, 0])).toMatchObject({ overall: '6', drivers: ['5–15 µm'] });
    expect(classifyNas([0, 0, 0, 0, 1])).toMatchObject({ overall: '1', approximateIso: '12/10/7' });
    expect(classifyNas([0, 0, 0, 0, 2])).toMatchObject({ overall: '3', drivers: ['>100 µm'] });
    expect(classifyNas([0, 0, 0, 0, 1024])).toMatchObject({ overall: '12' });
    expect(classifyNas([0, 0, 0, 0, 1025]).overall).toBe('dirtier than 12');
    expect(() => classifyNas([-1, 0, 0, 0, 0])).toThrow(/zero or greater/);
  });

  it('assigns ISO 4406 scale numbers from the published per-millilitre bounds', () => {
    expect(isoScaleNumber(0)).toBe('0');
    expect(isoScaleNumber(0.01)).toBe('0');
    expect(isoScaleNumber(320)).toBe('15');
    expect(isoScaleNumber(321)).toBe('16');
    expect(isoScaleNumber(640)).toBe('16');
    expect(isoScaleNumber(641)).toBe('17');
    expect(isoScaleNumber(1300)).toBe('17');
    expect(isoScaleNumber(2500)).toBe('18');
    expect(isoScaleNumber(40000)).toBe('22');
    expect(isoScaleNumber(80000)).toBe('23');
    expect(isoScaleNumber(2500000)).toBe('28');
    expect(isoScaleNumber(2500001)).toBe('>28');
    expect(iso4406Code(40000, 2500, 80)).toBe('22/18/13');
  });
});

describe('lube oil notes', () => {
  it('keeps viscosity flags and the VG versus cleanliness distinction', () => {
    const viscosity = OIL_ANALYTES.find((item) => item.id === 'viscosity');
    expect(viscosity?.caution).toMatch(/10 percent/);
    expect(viscosity?.critical).toMatch(/20 percent/);
    expect(LAB_LIMIT_NOTE).toMatch(/follow your lab/i);
    expect(VISCOSITY_NOTE).toMatch(/not a cleanliness code/i);
    expect(VISCOSITY_NOTE).toContain('16/14/11');
    expect(ISO_VG_GRADES).toEqual([32, 46, 68, 100, 150, 220, 320]);
    expect(FLUSH_TARGETS.map((item) => item.id)).toEqual(['turbine', 'hydraulic', 'gearbox', 'journal']);
    expect(FLUSH_TARGETS.find((item) => item.id === 'turbine')?.grades).toContain('32');
    expect(FLUSH_TARGETS.find((item) => item.id === 'gearbox')?.grades).toContain('320');
    const html = lubeOilHtml();
    expect(html).toContain('font-family: Georgia');
    expect(html).toContain('1,024,000');
    expect(html).toContain('180');
    expect(html).not.toMatch(/#A9773F|#1F3A5F|#F3EBDD/i);
  });
});
