import { CALC_DISCLAIMER, FORMULA_VERSION, finiteNumber, roundTo } from '@/src/domain/calculators/common';

/**
 * Factors are exact where the definition is exact.
 * 1 in = 25.4 mm. 1 mil = 1 thou = 0.001 in. 1 μm = 10⁻⁶ m.
 * 1 lb = 0.45359237 kg. 1 ton = 2,000 lb (US short ton, not a metric tonne).
 * 1 lbf = 4.4482216152605 N, which is that pound under standard gravity 9.80665 m/s².
 * 1 ft·lbf = 1.3558179483314004 N·m. 1 hp = 550 ft·lbf/s.
 * 1 psi = 6894.757293168361 Pa. 1 bar = 100,000 Pa.
 * inHg is mercury at 0 °C (13,595.1 kg/m³). inH2O is water at 4 °C (999.972 kg/m³).
 * 1 US gallon = 3.785411784 L, so 1 gpm = 0.22712470704 m³/h.
 * Temperature uses the defined Fahrenheit, Celsius, and kelvin relations.
 */

export const IN_TO_MM = 25.4;
export const LB_TO_KG = 0.45359237;
export const STANDARD_G = 9.80665;
export const LBF_TO_N = 4.4482216152605;
export const FTLB_TO_NM = 1.3558179483314004;
export const PSI_TO_PA = 6894.757293168361;
export const GAL_TO_L = 3.785411784;
export const GPM_TO_M3H = 0.22712470704;

const IN_TO_M = IN_TO_MM / 1000;
/** Mercury at 0 °C, standard gravity. */
export const INHG_TO_PA = 13595.1 * STANDARD_G * IN_TO_M;
/** Water at 4 °C, standard gravity. */
export const INH2O_TO_PA = 999.972 * STANDARD_G * IN_TO_M;

type UnitDef = { id: string; label: string; toBase: number };

type Family = {
  id: string;
  label: string;
  note: string;
  units: UnitDef[];
};

const FAMILIES: Family[] = [
  {
    id: 'length',
    label: 'Length',
    note: '1 in = 25.4 mm exactly. 1 mil = 1 thou = 0.001 in. 1 μm = 0.001 mm.',
    units: [
      { id: 'in', label: 'in', toBase: 1 },
      { id: 'ft', label: 'ft', toBase: 12 },
      { id: 'mm', label: 'mm', toBase: 1 / IN_TO_MM },
      { id: 'm', label: 'm', toBase: 1000 / IN_TO_MM },
      { id: 'mil', label: 'mil', toBase: 0.001 },
      { id: 'thou', label: 'thou', toBase: 0.001 },
      { id: 'um', label: 'μm', toBase: 1 / 25400 },
    ],
  },
  {
    id: 'weight',
    label: 'Weight',
    note: '1 lb = 0.45359237 kg. 1 ton = 2,000 lb (US short ton). A metric tonne is 1,000 kg, not this ton. Newtons use standard gravity, so 1 kg weighs 9.80665 N.',
    units: [
      { id: 'lb', label: 'lb', toBase: LB_TO_KG },
      { id: 'kg', label: 'kg', toBase: 1 },
      { id: 'n', label: 'N', toBase: LB_TO_KG / LBF_TO_N },
      { id: 'ton', label: 'ton (2000 lb)', toBase: 2000 * LB_TO_KG },
    ],
  },
  {
    id: 'pressure',
    label: 'Pressure',
    note: '1 psi = 6894.757293168361 Pa. 1 bar = 100 kPa. inHg is mercury at 0 °C. inH2O is water at 4 °C. Both use standard gravity.',
    units: [
      { id: 'psi', label: 'psi', toBase: PSI_TO_PA },
      { id: 'bar', label: 'bar', toBase: 100000 },
      { id: 'kpa', label: 'kPa', toBase: 1000 },
      { id: 'mpa', label: 'MPa', toBase: 1e6 },
      { id: 'inhg', label: 'inHg', toBase: INHG_TO_PA },
      { id: 'inh2o', label: 'inH2O', toBase: INH2O_TO_PA },
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    note: '°C = (°F − 32) × 5/9. K = °C + 273.15.',
    units: [
      { id: 'f', label: '°F', toBase: 1 },
      { id: 'c', label: '°C', toBase: 1 },
      { id: 'k', label: 'K', toBase: 1 },
    ],
  },
  {
    id: 'volume',
    label: 'Volume',
    note: '1 US gallon = 3.785411784 L. 1 m³ = 1,000 L.',
    units: [
      { id: 'gal', label: 'gal (US)', toBase: GAL_TO_L },
      { id: 'l', label: 'L', toBase: 1 },
      { id: 'm3', label: 'm³', toBase: 1000 },
    ],
  },
  {
    id: 'flow',
    label: 'Flow',
    note: '1 US gpm = 0.22712470704 m³/h.',
    units: [
      { id: 'gpm', label: 'gpm (US)', toBase: GPM_TO_M3H },
      { id: 'm3h', label: 'm³/h', toBase: 1 },
    ],
  },
  {
    id: 'power',
    label: 'Power',
    note: '1 hp = 550 ft·lbf/s.',
    units: [
      { id: 'hp', label: 'hp', toBase: (550 * FTLB_TO_NM) / 1000 },
      { id: 'kw', label: 'kW', toBase: 1 },
    ],
  },
  {
    id: 'torque',
    label: 'Torque',
    note: '1 ft·lbf = 1.3558179483314004 N·m. 12 in·lb = 1 ft·lb.',
    units: [
      { id: 'ftlb', label: 'ft·lb', toBase: FTLB_TO_NM },
      { id: 'nm', label: 'N·m', toBase: 1 },
      { id: 'inlb', label: 'in·lb', toBase: FTLB_TO_NM / 12 },
    ],
  },
  {
    id: 'speed',
    label: 'Speed',
    note: 'Hz = rpm / 60.',
    units: [
      { id: 'rpm', label: 'rpm', toBase: 1 },
      { id: 'hz', label: 'Hz', toBase: 60 },
    ],
  },
];

export const UNIT_FAMILIES = FAMILIES.map((family) => ({
  id: family.id,
  label: family.label,
  note: family.note,
  units: family.units.map((unit) => ({ id: unit.id, label: unit.label })),
}));

export const TEMPERATURE_UNITS = UNIT_FAMILIES.find((family) => family.id === 'temperature')?.units ?? [];

export type UnitConversionResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  value: number;
  fromLabel: string;
  toLabel: string;
};

export function convertUnits(familyId: string, value: number, fromId: string, toId: string): UnitConversionResult {
  finiteNumber(value, 'Value');
  const family = FAMILIES.find((item) => item.id === familyId);
  if (!family) throw new Error('Choose a unit family.');
  const from = family.units.find((unit) => unit.id === fromId);
  const to = family.units.find((unit) => unit.id === toId);
  if (!from || !to) throw new Error('Choose both units.');
  if (family.id === 'temperature') return convertTemperature(value, from, to, family.note);
  const converted = fromId === toId ? value : (value * from.toBase) / to.toBase;
  return finish(converted, from.label, to.label, family.note, `${family.label}: ${from.label} to ${to.label}.`);
}

/** Six significant figures, enough for a pocket card and the converter line. */
export function formatUnitValue(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  const power = Math.floor(Math.log10(abs));
  const places = Math.min(10, Math.max(0, 6 - power - 1));
  const rounded = roundTo(value, places);
  return String(rounded);
}

export type ConversionChartGroup = {
  title: string;
  notes: string[];
  rows: { left: string; right: string }[];
};

const CHART_GROUPS: { title: string; families: string[] }[] = [
  { title: 'Length', families: ['length'] },
  { title: 'Weight and force', families: ['weight'] },
  { title: 'Pressure', families: ['pressure'] },
  { title: 'Temperature', families: ['temperature'] },
  { title: 'Volume and flow', families: ['volume', 'flow'] },
  { title: 'Power and torque', families: ['power', 'torque'] },
  { title: 'Speed', families: ['speed'] },
];

const CHART_PAIRS: { family: string; value: number; from: string; to: string }[] = [
  { family: 'length', value: 1, from: 'in', to: 'mm' },
  { family: 'length', value: 1, from: 'mm', to: 'in' },
  { family: 'length', value: 1, from: 'ft', to: 'm' },
  { family: 'length', value: 1, from: 'm', to: 'ft' },
  { family: 'length', value: 1, from: 'ft', to: 'in' },
  { family: 'length', value: 1, from: 'mil', to: 'in' },
  { family: 'length', value: 1, from: 'mil', to: 'um' },
  { family: 'length', value: 1, from: 'mm', to: 'mil' },
  { family: 'weight', value: 1, from: 'lb', to: 'kg' },
  { family: 'weight', value: 1, from: 'kg', to: 'lb' },
  { family: 'weight', value: 1, from: 'lb', to: 'n' },
  { family: 'weight', value: 1, from: 'n', to: 'lb' },
  { family: 'weight', value: 1, from: 'ton', to: 'lb' },
  { family: 'weight', value: 1, from: 'ton', to: 'kg' },
  { family: 'pressure', value: 1, from: 'psi', to: 'kpa' },
  { family: 'pressure', value: 1, from: 'kpa', to: 'psi' },
  { family: 'pressure', value: 1, from: 'bar', to: 'psi' },
  { family: 'pressure', value: 1, from: 'bar', to: 'kpa' },
  { family: 'pressure', value: 1, from: 'mpa', to: 'psi' },
  { family: 'pressure', value: 1, from: 'mpa', to: 'bar' },
  { family: 'pressure', value: 1, from: 'psi', to: 'inhg' },
  { family: 'pressure', value: 1, from: 'psi', to: 'inh2o' },
  { family: 'pressure', value: 1, from: 'inhg', to: 'kpa' },
  { family: 'pressure', value: 1, from: 'inh2o', to: 'psi' },
  { family: 'temperature', value: 32, from: 'f', to: 'c' },
  { family: 'temperature', value: 212, from: 'f', to: 'c' },
  { family: 'temperature', value: 0, from: 'c', to: 'k' },
  { family: 'temperature', value: -40, from: 'f', to: 'c' },
  { family: 'temperature', value: 0, from: 'k', to: 'c' },
  { family: 'volume', value: 1, from: 'gal', to: 'l' },
  { family: 'volume', value: 1, from: 'l', to: 'gal' },
  { family: 'volume', value: 1, from: 'm3', to: 'l' },
  { family: 'volume', value: 1, from: 'm3', to: 'gal' },
  { family: 'flow', value: 1, from: 'gpm', to: 'm3h' },
  { family: 'flow', value: 1, from: 'm3h', to: 'gpm' },
  { family: 'power', value: 1, from: 'hp', to: 'kw' },
  { family: 'power', value: 1, from: 'kw', to: 'hp' },
  { family: 'torque', value: 1, from: 'ftlb', to: 'nm' },
  { family: 'torque', value: 1, from: 'nm', to: 'ftlb' },
  { family: 'torque', value: 12, from: 'inlb', to: 'ftlb' },
  { family: 'speed', value: 1, from: 'hz', to: 'rpm' },
  { family: 'speed', value: 1800, from: 'rpm', to: 'hz' },
];

export function conversionChart(): ConversionChartGroup[] {
  return CHART_GROUPS.map((group) => ({
    title: group.title,
    notes: group.families.map((id) => familyNote(id)),
    rows: CHART_PAIRS.filter((pair) => group.families.includes(pair.family)).map((pair) => {
      const result = convertUnits(pair.family, pair.value, pair.from, pair.to);
      return {
        left: `${formatUnitValue(pair.value)} ${result.fromLabel}`,
        right: `${formatUnitValue(result.value)} ${result.toLabel}`,
      };
    }),
  }));
}

export function conversionChartHtml(): string {
  const sections = conversionChart()
    .map((group) => {
      const notes = group.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join('');
      const rows = group.rows.map((row) => `<tr><td>${escapeHtml(row.left)}</td><td>${escapeHtml(row.right)}</td></tr>`).join('');
      return `<h2>${escapeHtml(group.title)}</h2>${notes}<table><thead><tr><th>From</th><th>Equals</th></tr></thead><tbody>${rows}</tbody></table>`;
    })
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Conversion chart</title><style>
    body { font-family: Georgia, "Times New Roman", serif; color: #000; background: #fff; margin: 24px; }
    h1 { font-size: 18px; font-weight: 500; margin: 0 0 8px; }
    h2 { font-size: 14px; font-weight: 600; margin: 16px 0 4px; }
    p { font-size: 11px; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #000; padding: 3px 8px; font-size: 11px; color: #000; background: #fff; }
    th { font-weight: 600; text-align: left; }
    td:nth-child(2), th:nth-child(2) { text-align: right; }
  </style></head><body>
  <h1>Conversion chart</h1>
  <p>Common metric and imperial factors, both directions. Figures on this card are rounded to six significant figures. ${escapeHtml(CALC_DISCLAIMER)}</p>
  ${sections}
  </body></html>`;
}

function familyNote(id: string): string {
  return FAMILIES.find((family) => family.id === id)?.note ?? '';
}

function convertTemperature(value: number, from: UnitDef, to: UnitDef, note: string): UnitConversionResult {
  if (from.id === to.id) return finish(value, from.label, to.label, note, 'Temperature.');
  const kelvin = toKelvin(from.id, value);
  if (kelvin < -1e-6) throw new Error('Temperature is below absolute zero.');
  return finish(fromKelvin(to.id, Math.max(0, kelvin)), from.label, to.label, note, 'Temperature.');
}

function toKelvin(id: string, input: number): number {
  if (id === 'f') return ((input - 32) * 5) / 9 + 273.15;
  if (id === 'c') return input + 273.15;
  if (id === 'k') return input;
  throw new Error('Choose a temperature unit.');
}

function fromKelvin(id: string, kelvin: number): number {
  if (id === 'f') return ((kelvin - 273.15) * 9) / 5 + 32;
  if (id === 'c') return kelvin - 273.15;
  if (id === 'k') return kelvin;
  throw new Error('Choose a temperature unit.');
}

function finish(value: number, fromLabel: string, toLabel: string, formula: string, units: string): UnitConversionResult {
  return {
    formulaVersion: FORMULA_VERSION,
    formula,
    units,
    disclaimer: CALC_DISCLAIMER,
    value,
    fromLabel,
    toLabel,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
