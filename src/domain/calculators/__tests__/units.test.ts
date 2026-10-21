import { GPM_TO_M3H, HP_TO_KW, PSI_TO_KPA } from '@/src/domain/calculators/fieldUnits';
import {
  INHG_TO_PA,
  INH2O_TO_PA,
  UNIT_FAMILIES,
  conversionChart,
  conversionChartHtml,
  convertUnits,
  formatUnitValue,
} from '@/src/domain/calculators/units';

describe('unit conversions', () => {
  it('converts length, including mils, thou, and microns, in both directions', () => {
    expect(convertUnits('length', 1, 'in', 'mm').value).toBeCloseTo(25.4, 8);
    expect(convertUnits('length', 25.4, 'mm', 'in').value).toBeCloseTo(1, 8);
    expect(convertUnits('length', 1, 'ft', 'm').value).toBeCloseTo(0.3048, 8);
    expect(convertUnits('length', 1, 'm', 'ft').value).toBeCloseTo(1 / 0.3048, 8);
    expect(convertUnits('length', 1, 'mil', 'thou').value).toBe(1);
    expect(convertUnits('length', 1, 'in', 'um').value).toBeCloseTo(25400, 6);
    expect(convertUnits('length', 1, 'mil', 'um').value).toBeCloseTo(25.4, 8);
  });

  it('treats pounds, kilograms, newtons, and the US short ton as one weight', () => {
    expect(convertUnits('weight', 1, 'lb', 'kg').value).toBeCloseTo(0.45359237, 8);
    expect(convertUnits('weight', 1, 'kg', 'lb').value).toBeCloseTo(1 / 0.45359237, 8);
    expect(convertUnits('weight', 1, 'lb', 'n').value).toBeCloseTo(4.4482216152605, 8);
    expect(convertUnits('weight', 1, 'kg', 'n').value).toBeCloseTo(9.80665, 8);
    expect(convertUnits('weight', 1, 'ton', 'lb').value).toBeCloseTo(2000, 8);
    expect(convertUnits('weight', 1, 'n', 'lb').value).toBeCloseTo(1 / 4.4482216152605, 8);
    expect(convertUnits('weight', 1, 'ton', 'kg').formula).toMatch(/short ton/);
  });

  it('converts pressure through pascals, including inHg and inH2O', () => {
    expect(convertUnits('pressure', 1, 'psi', 'kpa').value).toBeCloseTo(PSI_TO_KPA, 8);
    expect(convertUnits('pressure', 1, 'kpa', 'psi').value).toBeCloseTo(1 / PSI_TO_KPA, 8);
    expect(convertUnits('pressure', 1, 'bar', 'kpa').value).toBeCloseTo(100, 8);
    expect(convertUnits('pressure', 1, 'mpa', 'bar').value).toBeCloseTo(10, 8);
    expect(convertUnits('pressure', 1, 'mpa', 'psi').value).toBeCloseTo(1e6 / (PSI_TO_KPA * 1000), 8);
    expect(convertUnits('pressure', 1, 'inhg', 'kpa').value).toBeCloseTo(INHG_TO_PA / 1000, 8);
    expect(convertUnits('pressure', 1, 'inh2o', 'psi').value).toBeCloseTo(INH2O_TO_PA / (PSI_TO_KPA * 1000), 8);
    expect(convertUnits('pressure', 1, 'psi', 'inhg').value).toBeCloseTo((PSI_TO_KPA * 1000) / INHG_TO_PA, 8);
    expect(convertUnits('pressure', 1, 'psi', 'inh2o').value).toBeCloseTo((PSI_TO_KPA * 1000) / INH2O_TO_PA, 8);
  });

  it('converts temperature both ways and refuses absolute zero', () => {
    expect(convertUnits('temperature', 212, 'f', 'c').value).toBeCloseTo(100, 8);
    expect(convertUnits('temperature', 100, 'c', 'f').value).toBeCloseTo(212, 8);
    expect(convertUnits('temperature', 0, 'c', 'k').value).toBeCloseTo(273.15, 8);
    expect(convertUnits('temperature', 0, 'k', 'c').value).toBeCloseTo(-273.15, 8);
    expect(convertUnits('temperature', -40, 'f', 'c').value).toBeCloseTo(-40, 8);
    expect(convertUnits('temperature', 32, 'f', 'f').value).toBe(32);
    expect(() => convertUnits('temperature', -1, 'k', 'c')).toThrow(/absolute zero/);
  });

  it('keeps volume and flow as separate families, and power separate from torque', () => {
    expect(convertUnits('volume', 1, 'gal', 'l').value).toBeCloseTo(3.785411784, 8);
    expect(convertUnits('volume', 1, 'l', 'gal').value).toBeCloseTo(1 / 3.785411784, 8);
    expect(convertUnits('volume', 1, 'm3', 'l').value).toBeCloseTo(1000, 8);
    expect(convertUnits('volume', 1, 'm3', 'gal').value).toBeCloseTo(1000 / 3.785411784, 6);
    expect(convertUnits('flow', 1, 'gpm', 'm3h').value).toBeCloseTo(GPM_TO_M3H, 10);
    expect(convertUnits('flow', 1, 'm3h', 'gpm').value).toBeCloseTo(1 / GPM_TO_M3H, 6);
    expect(() => convertUnits('volume', 1, 'gal', 'gpm')).toThrow(/both units/);
    expect(convertUnits('power', 1, 'hp', 'kw').value).toBeCloseTo(HP_TO_KW, 10);
    expect(convertUnits('power', 1, 'kw', 'hp').value).toBeCloseTo(1 / HP_TO_KW, 8);
    expect(convertUnits('torque', 1, 'ftlb', 'nm').value).toBeCloseTo(1.3558179483314004, 8);
    expect(convertUnits('torque', 1, 'nm', 'ftlb').value).toBeCloseTo(1 / 1.3558179483314004, 8);
    expect(convertUnits('torque', 12, 'inlb', 'ftlb').value).toBeCloseTo(1, 8);
    expect(() => convertUnits('power', 1, 'hp', 'ftlb')).toThrow(/both units/);
  });

  it('round-trips every unit back to the first unit in its family', () => {
    for (const family of UNIT_FAMILIES) {
      const origin = family.units[0];
      if (!origin) throw new Error(family.id);
      const sample = family.id === 'temperature' ? 68 : 3;
      for (const unit of family.units) {
        const forward = convertUnits(family.id, sample, origin.id, unit.id);
        const back = convertUnits(family.id, forward.value, unit.id, origin.id);
        expect(back.value).toBeCloseTo(sample, 5);
      }
    }
  });

  it('prints a black-and-white card from the same factors', () => {
    const groups = conversionChart();
    const weight = groups.find((group) => group.title === 'Weight and force');
    expect(weight?.rows).toEqual(
      expect.arrayContaining([
        { left: '1 lb', right: '0.453592 kg' },
        { left: '1 kg', right: '2.20462 lb' },
        { left: '1 lb', right: '4.44822 N' },
        { left: '1 ton (2000 lb)', right: '2000 lb' },
      ]),
    );
    expect(groups.find((group) => group.title === 'Length')?.rows).toEqual(
      expect.arrayContaining([
        { left: '1 in', right: '25.4 mm' },
        { left: '1 mm', right: '0.0393701 in' },
      ]),
    );
    expect(formatUnitValue(0.001)).toBe('0.001');
    expect(formatUnitValue(-40)).toBe('-40');
    const html = conversionChartHtml();
    const rows = groups.reduce((count, group) => count + group.rows.length, 0);
    expect(html.match(/<tr>/g)).toHaveLength(rows + groups.length);
    expect(html).toContain('25.4 mm');
    expect(html).toContain('inHg');
    expect(html).toContain('inH2O');
    expect(html).toContain('m³/h');
    expect(html).toContain('color: #000');
    expect(html).toContain('background: #fff');
    expect(html).not.toMatch(/#A9773F|#1F3A5F|#F3EBDD/i);
  });
});
