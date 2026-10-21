import type { CalculatorKind } from '@/src/domain/calculators/kinds';

export type CategoryId = 'alignment' | 'bolting' | 'rotating' | 'belts' | 'rigging-grout' | 'conversions';

export const CATEGORIES: { id: CategoryId; title: string }[] = [
  { id: 'alignment', title: 'Alignment' },
  { id: 'bolting', title: 'Bolting' },
  { id: 'rotating', title: 'Rotating Equipment / Pumps' },
  { id: 'belts', title: 'Belts & Drives' },
  { id: 'rigging-grout', title: 'Rigging & Grout' },
  { id: 'conversions', title: 'Conversions & References' },
];

export type CalculatorEntry = { kind: CalculatorKind; title: string; body: string; category: CategoryId; keywords?: string };

export const CALCULATORS: CalculatorEntry[] = [
  { kind: 'alignment', category: 'alignment', title: 'Shaft alignment', body: 'Rim-and-face and reverse-dial. Shim changes and horizontal moves at each foot.', keywords: 'dial indicator sag shim' },
  { kind: 'thermal', category: 'alignment', title: 'Thermal growth', body: 'Simple ΔL, or a driver and driven machine with cold-alignment targets.', keywords: 'expansion cold offset' },
  { kind: 'coupling', category: 'alignment', title: 'Coupling alignment', body: 'Offset and angularity against speed. API 671 couplings and API 686 alignment.', keywords: 'tolerance rpm' },
  { kind: 'flange', category: 'bolting', title: 'Flange bolt-up', body: 'ASME B16.5 stud count, size, length, wrench, star order, and K·D·F torque.', keywords: 'torque stud gasket star pattern' },
  { kind: 'anchor', category: 'bolting', title: 'Anchor bolts', body: 'F1554 and B7 stress area, wrench, washer, and torque.', keywords: 'torque foundation' },
  { kind: 'hold-down', category: 'bolting', title: 'Hold-down bolts', body: 'SAE, B7, and metric proof or yield, sockets, and torque passes.', keywords: 'torque soft foot' },
  { kind: 'bolt-circle', category: 'bolting', title: 'Bolt circle', body: 'Hole coordinates from diameter, count, and a start angle.', keywords: 'pcd layout' },
  { kind: 'affinity', category: 'rotating', title: 'Pump affinity laws', body: 'Flow, head, and power when speed or impeller diameter changes.', keywords: 'impeller trim' },
  { kind: 'npsh', category: 'rotating', title: 'NPSH margin', body: 'NPSHa against the vendor figure. Margin and ratio.', keywords: 'cavitation suction' },
  { kind: 'polytropic', category: 'rotating', title: 'Polytropic head', body: 'Compressor head and efficiency from pressures and temperatures.', keywords: 'compressor' },
  { kind: 'frequencies', category: 'rotating', title: 'Gear mesh and bearings', body: 'Mesh frequency plus BPFO, BPFI, BSF, and FTF.', keywords: 'vibration' },
  { kind: 'bearing-life', category: 'rotating', title: 'Bearing L10', body: 'Basic rating life from capacity and load.', keywords: 'life hours' },
  { kind: 'agitator', category: 'rotating', title: 'Agitator', body: 'Shaft deflection, first critical speed, tip speed, and power.', keywords: 'mixer critical speed' },
  { kind: 'lube-oil', category: 'rotating', title: 'Lube oil', body: 'Oil-analysis flags, flush cleanliness targets, and the NAS 1638 table.', keywords: 'iso 4406 nas viscosity' },
  { kind: 'belt', category: 'belts', title: 'Belt and chain', body: 'Speed ratio, linear speed, and effective tension.', keywords: 'pulley sprocket rpm' },
  { kind: 'belt-size', category: 'belts', title: 'Belt sizing', body: 'V-belt sections, timing pitches, belt length, and a belt-number tension lookup.', keywords: 'v-belt length tension deflection' },
  { kind: 'sling', category: 'rigging-grout', title: 'Sling angle', body: 'Tension per leg from the angle.', keywords: 'rigging lift' },
  { kind: 'rigging', category: 'rigging-grout', title: 'Rigging WLL', body: 'Working load limit from breaking strength and design factor, plus D/d bend efficiency.', keywords: 'wire rope sling' },
  { kind: 'grout', category: 'rigging-grout', title: 'Epoxy grout', body: 'Chockfast material takeoff from pour sections, voids, and waste.', keywords: 'chockfast' },
  { kind: 'grout-job', category: 'rigging-grout', title: 'Grout job estimator', body: 'Pad volume with shoulders and sleeves, order units, weight, and crew hours.', keywords: 'volume yards' },
  { kind: 'units', category: 'conversions', title: 'Unit conversions', body: 'Length, weight, pressure, temperature, volume, flow, power, torque, and speed.', keywords: 'convert metric imperial' },
  { kind: 'field-units', category: 'conversions', title: 'Field units', body: 'gpm, psi, feet of head with specific gravity, kW and hp.', keywords: 'head pressure' },
  { kind: 'conversion-chart', category: 'conversions', title: 'Conversion chart', body: 'Pocket card of common metric and imperial factors.', keywords: 'table' },
  { kind: 'fractions', category: 'conversions', title: 'Fraction chart', body: '1/64 through 1 inch in decimal inches and millimeters, nearest 64th.', keywords: 'decimal mm' },
  { kind: 'sockets', category: 'conversions', title: 'Socket cross-reference', body: 'Inch and metric sockets with fit notes.', keywords: 'wrench' },
  { kind: 'drills', category: 'conversions', title: 'Drill index', body: 'Number, letter, and fractional drills in decimal inch and mm.', keywords: 'tap' },
  { kind: 'iso-fits', category: 'conversions', title: 'ISO fits', body: 'IT grade tolerances, hole and shaft limits, and clearance or interference.', keywords: 'iso 286 tolerance bearing fit' },
];

export function searchCalculators(query: string): CalculatorEntry[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return CALCULATORS;
  return CALCULATORS.filter((entry) => {
    const category = CATEGORIES.find((item) => item.id === entry.category)?.title ?? '';
    const hay = `${entry.title} ${entry.body} ${entry.keywords ?? ''} ${category}`.toLowerCase();
    return words.every((word) => hay.includes(word));
  });
}

export function titleFor(kind: string): string {
  return CALCULATORS.find((entry) => entry.kind === kind)?.title ?? 'Calculator';
}
