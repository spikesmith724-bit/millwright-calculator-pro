import { spanDeflectionInches } from '@/src/domain/calculators/beltDriveRef';
import { beltChartHtml, decodeBeltCode } from '@/src/domain/calculators/beltSize';
import {
  FHP_NOTE,
  GAUGE_ROWS,
  RUN_IN_COPY,
  TENSION_LOOKUP_NOTE,
  beltSizeSummary,
  describeBeltStamp,
  deflectionDistance,
  exceedsPencilGauge,
  forcesForStamp,
  formatGaugePounds,
  parseBeltStamp,
  readyBeltStamp,
  sectionSize,
  suggestBeltStamps,
  tapeLengthLine,
  tensionCard,
} from '@/src/domain/calculators/beltTension';

describe('belt tension lookup', () => {
  it('parses classical, narrow, cogged, FHP, and banded stamps', () => {
    expect(parseBeltStamp('A42')).toMatchObject({
      code: 'A42',
      section: 'A',
      cogged: false,
      ribs: 1,
      banded: false,
      lengthInches: 42,
      lengthBasis: 'inside',
      outsideInches: 44,
      fhp: false,
    });
    expect(parseBeltStamp(' a42 ').outsideInches).toBe(decodeBeltCode('A42').outsideInches);
    expect(parseBeltStamp('B60')).toMatchObject({ section: 'B', lengthInches: 60, outsideInches: 63, lengthBasis: 'inside' });
    expect(parseBeltStamp('3L350')).toMatchObject({
      code: '3L350',
      section: '3L',
      fhp: true,
      cogged: false,
      lengthInches: 35,
      lengthBasis: 'outside',
      outsideInches: null,
    });
    expect(parseBeltStamp('5L')).toMatchObject({ section: '5L', fhp: true, lengthInches: null, lengthBasis: null });
    expect(parseBeltStamp('4L')).toMatchObject({ section: '4L', fhp: true, lengthInches: null });
    expect(parseBeltStamp('3V')).toMatchObject({ section: '3V', lengthInches: null, fhp: false, cogged: false });
    expect(parseBeltStamp('5V')).toMatchObject({ section: '5V', lengthBasis: null });
    expect(parseBeltStamp('8V')).toMatchObject({ section: '8V', lengthBasis: null });
    expect(parseBeltStamp('5V1000').lengthInches).toBe(decodeBeltCode('5V1000').inches);
    expect(parseBeltStamp('AX')).toMatchObject({ code: 'AX', section: 'A', cogged: true, lengthInches: null });
    expect(parseBeltStamp('BX')).toMatchObject({ code: 'BX', section: 'B', cogged: true, lengthInches: null });
    expect(parseBeltStamp('AX42')).toMatchObject({ section: 'A', cogged: true, lengthInches: 42, outsideInches: 44 });
    expect(parseBeltStamp('bx60')).toMatchObject({ code: 'BX60', section: 'B', cogged: true, lengthInches: 60, outsideInches: 63 });
    expect(parseBeltStamp('3/5V1000')).toMatchObject({
      code: '3/5V1000',
      section: '5V',
      ribs: 3,
      banded: true,
      cogged: false,
      lengthInches: 100,
      lengthBasis: 'effective',
    });
    expect(parseBeltStamp('3 / 5V1000').code).toBe('3/5V1000');
    expect(describeBeltStamp(parseBeltStamp('3L350'))).toMatch(/light-duty FHP/);
    expect(describeBeltStamp(parseBeltStamp('3L350'))).toMatch(/35\.0 in outside/);
    expect(FHP_NOTE).toMatch(/3L, 4L, and 5L/);
    expect(() => parseBeltStamp('9V100')).toThrow(/A42, 3L350, or 3\/5V1000/);
    expect(() => parseBeltStamp('0/A42')).toThrow(/A42, 3L350/);
  });

  it('uses the published used and new forces, and multiplies a band by its ribs', () => {
    const sectionA = forcesForStamp(parseBeltStamp('A42'));
    expect(sectionA[0]).toMatchObject({ sheave: '3.0–3.6', rpm: '1000–2500', listed: true, usedLb: 3.7, newLb: 5.5 });
    const coggedA = forcesForStamp(parseBeltStamp('AX'));
    expect(coggedA[0]).toMatchObject({ usedLb: 4.1, newLb: 6.1 });
    const wrappedB = forcesForStamp(parseBeltStamp('B60'));
    expect(wrappedB[0]).toMatchObject({ sheave: '3.4–4.2', listed: false });
    expect(wrappedB.find((row) => row.sheave === '4.4–5.6' && row.rpm === '860–2500')).toMatchObject({ usedLb: 5.3, newLb: 7.9 });
    const coggedB = forcesForStamp(parseBeltStamp('BX'));
    expect(coggedB[0]).toMatchObject({ listed: true, usedLb: 4.9, newLb: 7.2 });
    const band = forcesForStamp(parseBeltStamp('3/5V1000'));
    const listed = band.find((row) => row.sheave === '7.1–10.9' && row.rpm === '500–1740');
    expect(listed).toMatchObject({ usedLb: 38.1, newLb: 56.7 });
    expect(listed?.usedLb).toBeCloseTo(12.7 * 3, 10);
    expect(listed?.newLb).toBeCloseTo(18.9 * 3, 10);
    expect(band.find((row) => row.sheave === '4.4–6.7')?.listed).toBe(false);
    expect(exceedsPencilGauge(band)).toBe(true);
    const light = forcesForStamp(parseBeltStamp('3L350'));
    expect(light[0]).toMatchObject({ sheave: '1.25–1.75', usedLb: 0.375, newLb: 0.625 });
    expect(formatGaugePounds(light[0]!.usedLb, true)).toBe('3/8 lb');
    expect(formatGaugePounds(light[0]!.newLb, true)).toBe('5/8 lb');
    const four = forcesForStamp(parseBeltStamp('4L')).find((row) => row.sheave === '3.00–3.50');
    expect(formatGaugePounds(four!.usedLb, true)).toBe('1 5/8 lb');
    expect(formatGaugePounds(four!.newLb, true)).toBe('2 1/2 lb');
    const five = forcesForStamp(parseBeltStamp('5L'))[0];
    expect(formatGaugePounds(five!.usedLb, true)).toBe('1 1/2 lb');
    expect(formatGaugePounds(five!.newLb, true)).toBe('2 5/8 lb');
    const bandedLight = forcesForStamp(parseBeltStamp('3/3L350'))[0];
    expect(bandedLight).toMatchObject({ usedLb: 1.125, newLb: 1.875 });
    expect(formatGaugePounds(bandedLight!.usedLb, true)).toBe('1 1/8 lb');
    expect(GAUGE_ROWS.filter((row) => row.section === '8V').every((row) => row.cogged == null)).toBe(true);
    expect(TENSION_LOOKUP_NOTE).toMatch(/Typical, check the manufacturer/);
    expect(RUN_IN_COPY).toMatch(/24 to 48 hours/);
    expect(deflectionDistance(32)).toBe(0.5);
    expect(deflectionDistance(32)).toBe(spanDeflectionInches(32));
  });

  it('puts the size on the card and suggests the stamp as it is typed', () => {
    expect(sectionSize('3L')).toMatchObject({ topFraction: '3/8', depthFraction: '7/32' });
    expect(sectionSize('4L')).toMatchObject({ topFraction: '1/2', depthFraction: '5/16' });
    expect(sectionSize('5L')).toMatchObject({ topFraction: '21/32', depthFraction: '3/8' });
    expect(sectionSize('A')?.topFraction).toBe('1/2');
    expect(sectionSize('A')?.depthFraction).toBe(sectionSize('4L')?.depthFraction);
    const card = tensionCard(parseBeltStamp('A42'), 32);
    expect(card.headline).toBe('Push 2.8–8.0 lb at mid-span. The exact push depends on the small sheave. The belt should deflect 1/2 in.');
    expect(card.size).toMatch(/Top 1\/2 in\. Thickness 5\/16 in\./);
    expect(card.size).toMatch(/42 in inside, about 44 in outside/);
    expect(beltSizeSummary(parseBeltStamp('3/5V1000'))).toMatch(/Top 5\/8 in/);
    expect(beltSizeSummary(parseBeltStamp('3/5V1000'))).toMatch(/3 ribs/);
    expect(beltSizeSummary(parseBeltStamp('3/5V1000'))).toMatch(/100\.0 in effective/);
    expect(tensionCard(parseBeltStamp('3/5V1000'), 32).headline).toMatch(/Push 33\.6–70\.2 lb at mid-span/);
    expect(tensionCard(parseBeltStamp('3L350'), 64).headline).toMatch(/deflect 1 in/);
    expect(tapeLengthLine('A', 44)).toBe('44 in outside, about 42 in inside. Closest code A42.');
    expect(tapeLengthLine('3L', 35)).toMatch(/35\.0 in outside/);
    expect(suggestBeltStamps('A4')).toContain('A42');
    expect(suggestBeltStamps('3L35')).toContain('3L350');
    expect(suggestBeltStamps('3/5V100')).toContain('3/5V1000');
    expect(suggestBeltStamps('BX')[0]).toBe('BX');
    expect(readyBeltStamp('A4')).toBeNull();
    expect(readyBeltStamp('5L')?.section).toBe('5L');
  });

  it('prints the lookup in black and white', () => {
    const html = beltChartHtml();
    expect(html).toContain('3L350');
    expect(html).toContain('3/8 lb');
    expect(html).toContain('large O-ring');
    expect(html).toContain('24 to 48 hours');
    expect(html).toContain('light-duty fractional-horsepower');
    expect(html).toContain('Typical, check the manufacturer');
    expect(html).not.toMatch(/#A9773F|#1F3A5F|#F3EBDD/i);
  });
});
