import { CALC_DISCLAIMER, FORMULA_VERSION, finiteNumber, roundTo } from '@/src/domain/calculators/common';

/**
 * Chockfast product data used by the epoxy grout calculator.
 * Checked 2026-10-08/10.
 * Source: Chockfast Red Technical Bulletin #617 (TDS), plus the ITW
 * "Precision Grouts for Foundation Systems" brochure (NA, Dec 2025,
 * https://itwperformancepolymers.com/wp-content/uploads/Chockfast-Escoweld-Brochure-NA-1-Dec-2025.pdf).
 * Product names are used descriptively. This is not a partnership with ITW and not an ITW endorsement.
 *
 * Chockfast Red unit: 1.6 ft³ = 2,765 in³ = 11.97 gal = 45.3 L.
 * Packaging: resin 1.6 gal (6.1 L) in a 3-gal pail; hardener 0.9 gal (3.5 L); aggregate 4 × 46 lb (21 kg).
 * Weights: resin 15.4 lb (7 kg), hardener 7.6 lb (3.4 kg), aggregate 184 lb (84 kg). Shipping 207 lb (94 kg).
 * Typical pour depth 2–18 in (50–457 mm). A pour should generally not exceed 18 in thick and 7 ft (about 2.2 m) long.
 * For critically aligned coupled machinery, the final leveling pour should follow ITW Bulletin No. 615.
 * Typical application temperature 55–95 °F (13–35 °C). Approximate cure 54 hours at 60 °F (16 °C).
 *
 * Chockfast Red SG: 1.6 ft³ per unit, pour depth 1–4 in. Component counts are not taken from Bulletin 617; confirm the SG TDS.
 * Chockfast Red Versaflow: 2.2 ft³ (61.7 L) per unit, pour depth 1–4 in. Confirm that TDS before ordering components.
 */

export const GROUT_ITW_NOTE =
  "Based on ITW's published Chockfast Red data. Follow the current ITW technical bulletin, installation instructions, and site engineering requirements.";

export const GROUT_WASTE_NOTE = "Waste percent is the user's choice. It is not an ITW figure.";

export const GROUT_615 =
  'For the final leveling pour under coupled machinery, follow ITW Bulletin No. 615.';

const IN3_PER_FT3 = 1728;
const LONG_POUR_IN = 7 * 12;

export type GroutProductId = 'red' | 'sg' | 'versaflow';

export type GroutProduct = {
  id: GroutProductId;
  label: string;
  unitFt3: number;
  /** Published cubic inches per unit. Null when the bulletin figure was not recorded here. */
  unitIn3: number | null;
  unitGal: number | null;
  unitL: number | null;
  depthMinIn: number;
  depthMaxIn: number;
  /** True only for Chockfast Red, where Bulletin 617 states the component pack. */
  hasRedPackaging: boolean;
};

export const GROUT_PRODUCTS: readonly GroutProduct[] = [
  {
    id: 'red',
    label: 'Chockfast Red',
    unitFt3: 1.6,
    unitIn3: 2765,
    unitGal: 11.97,
    unitL: 45.3,
    depthMinIn: 2,
    depthMaxIn: 18,
    hasRedPackaging: true,
  },
  {
    id: 'sg',
    label: 'Chockfast Red SG',
    unitFt3: 1.6,
    unitIn3: null,
    unitGal: null,
    unitL: null,
    depthMinIn: 1,
    depthMaxIn: 4,
    hasRedPackaging: false,
  },
  {
    id: 'versaflow',
    label: 'Chockfast Red Versaflow',
    unitFt3: 2.2,
    unitIn3: null,
    unitGal: null,
    unitL: 61.7,
    depthMinIn: 1,
    depthMaxIn: 4,
    hasRedPackaging: false,
  },
];

export type GroutSection = {
  lengthIn: number;
  widthIn: number;
  depthIn: number;
};

export type GroutVoid = {
  /** Direct volume, cubic inches. Use this or the three dimensions. */
  volumeIn3: number | null;
  lengthIn: number | null;
  widthIn: number | null;
  depthIn: number | null;
};

export type GroutInput = {
  productId: GroutProductId;
  sections: GroutSection[];
  voids: GroutVoid[];
  /** User-chosen overage. 10 means 10%. Not an ITW number. */
  wastePercent: number;
  ambientF: number;
};

/** One pour section counted on its own, before voids and before combining with the other pours. */
export type GroutSectionTake = {
  index: number;
  volumeFt3: number;
  unitCount: number;
};

export type GroutResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  itwNote: string;
  wasteNote: string;
  productLabel: string;
  netIn3: number;
  netFt3: number;
  netGal: number;
  netL: number;
  orderFt3: number;
  unitCount: number;
  /** Units each pour would take by itself. The job total is unitCount, after voids. */
  sectionTakes: GroutSectionTake[];
  resinPails: number | null;
  hardenerUnits: number | null;
  aggregateBags: number | null;
  materialWeightLb: number | null;
  shippingWeightLb: number | null;
  leftoverFt3: number;
  leftoverIn3: number;
  warnings: string[];
};

function inchesToFt3(cubicInches: number): number {
  return cubicInches / IN3_PER_FT3;
}

function voidIn3(voidSpace: GroutVoid): number {
  if (voidSpace.volumeIn3 != null) {
    const volume = finiteNumber(voidSpace.volumeIn3, 'Void volume');
    if (volume < 0) throw new Error('Void volume cannot be negative.');
    return volume;
  }
  const length = finiteNumber(voidSpace.lengthIn ?? Number.NaN, 'Void length');
  const width = finiteNumber(voidSpace.widthIn ?? Number.NaN, 'Void width');
  const depth = finiteNumber(voidSpace.depthIn ?? Number.NaN, 'Void depth');
  if (length < 0 || width < 0 || depth < 0) throw new Error('Void dimensions cannot be negative.');
  return length * width * depth;
}

export function epoxyGrout(input: GroutInput): GroutResult {
  const product = GROUT_PRODUCTS.find((item) => item.id === input.productId);
  if (!product) throw new Error('Choose a Chockfast product.');
  if (input.sections.length === 0) throw new Error('Add at least one pour section.');
  const waste = finiteNumber(input.wastePercent, 'Waste percent');
  if (waste < 0 || waste > 100) throw new Error('Waste percent must be from 0 to 100.');
  const ambient = finiteNumber(input.ambientF, 'Temperature');

  let gross = 0;
  const warnings: string[] = [];
  input.sections.forEach((section, index) => {
    const length = finiteNumber(section.lengthIn, 'Length');
    const width = finiteNumber(section.widthIn, 'Width');
    const depth = finiteNumber(section.depthIn, 'Depth');
    if (length <= 0 || width <= 0 || depth <= 0) throw new Error('Each pour section needs a length, width, and depth greater than zero.');
    gross += length * width * depth;
    const label = `Section ${index + 1}`;
    if (depth < product.depthMinIn || depth > product.depthMaxIn) {
      warnings.push(`${label} depth is outside the typical ${product.depthMinIn}–${product.depthMaxIn} in range for ${product.label}.`);
    }
    if (length > LONG_POUR_IN || width > LONG_POUR_IN) {
      warnings.push(`${label} is longer than 7 ft. ITW guidance is to use multiple pours or expansion joints.`);
    }
  });
  const voidTotal = input.voids.reduce((sum, item) => sum + voidIn3(item), 0);
  if (voidTotal > gross) throw new Error('Voids are larger than the pour sections.');
  const netIn3 = gross - voidTotal;
  const netFt3 = inchesToFt3(netIn3);
  const orderFt3 = netFt3 * (1 + waste / 100);
  const unitsFor = (cubicFeet: number) => Math.ceil((cubicFeet * (1 + waste / 100)) / product.unitFt3 - 1e-9);
  const unitCount = unitsFor(netFt3);
  const sectionTakes: GroutSectionTake[] = input.sections.map((section, index) => {
    const volumeFt3 = inchesToFt3(section.lengthIn * section.widthIn * section.depthIn);
    return { index: index + 1, volumeFt3: roundTo(volumeFt3, 4), unitCount: unitsFor(volumeFt3) };
  });
  const packagedFt3 = unitCount * product.unitFt3;
  const leftoverFt3 = packagedFt3 - orderFt3;
  if (ambient < 55 || ambient > 95) {
    warnings.push('Temperature is outside the typical 55–95 °F application range.');
  }
  warnings.push(GROUT_615);

  const galPerFt3 = product.unitGal != null ? product.unitGal / product.unitFt3 : 7.48051948;
  const litersPerFt3 = product.unitL != null ? product.unitL / product.unitFt3 : 28.316846592;
  const packaging = product.hasRedPackaging
    ? {
        resinPails: unitCount,
        hardenerUnits: unitCount,
        aggregateBags: unitCount * 4,
        materialWeightLb: roundTo(unitCount * (15.4 + 7.6 + 184), 1),
        shippingWeightLb: roundTo(unitCount * 207, 1),
      }
    : {
        resinPails: null,
        hardenerUnits: null,
        aggregateBags: null,
        materialWeightLb: null,
        shippingWeightLb: null,
      };

  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'Units = ceil(net volume × (1 + waste) / published unit volume). Net volume subtracts voids.',
    units: 'Section dimensions in inches. Volume reported in ft³, in³, L, and US gal.',
    disclaimer: CALC_DISCLAIMER,
    itwNote: GROUT_ITW_NOTE,
    wasteNote: GROUT_WASTE_NOTE,
    productLabel: product.label,
    netIn3: roundTo(netIn3, 3),
    netFt3: roundTo(netFt3, 4),
    netGal: roundTo(netFt3 * galPerFt3, 3),
    netL: roundTo(netFt3 * litersPerFt3, 3),
    orderFt3: roundTo(orderFt3, 4),
    unitCount,
    sectionTakes,
    ...packaging,
    leftoverFt3: roundTo(leftoverFt3, 4),
    leftoverIn3: roundTo(leftoverFt3 * (product.unitIn3 != null ? product.unitIn3 / product.unitFt3 : IN3_PER_FT3), 1),
    warnings,
  };
}

function countPhrase(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** One line under the unit count: packs, net volume, leftover, and shipping weight. */
export function groutOrderLine(result: GroutResult): string {
  const resin = result.resinPails == null ? 'resin on the TDS' : countPhrase(result.resinPails, 'resin pail', 'resin pails');
  const hardener = result.hardenerUnits == null ? 'hardener on the TDS' : countPhrase(result.hardenerUnits, 'hardener', 'hardeners');
  const bags = result.aggregateBags == null ? 'aggregate on the TDS' : countPhrase(result.aggregateBags, 'aggregate bag', 'aggregate bags');
  const shipping = result.shippingWeightLb == null ? 'shipping weight on the TDS' : `${result.shippingWeightLb} lb shipping`;
  return `${resin} · ${hardener} · ${bags} · ${result.netFt3} ft³ net · ${result.leftoverFt3} ft³ left · ${shipping}`;
}

export function lengthToInches(value: number, unit: 'in' | 'ft' | 'mm'): number {
  if (unit === 'ft') return value * 12;
  if (unit === 'mm') return value / 25.4;
  return value;
}
