const CU_IN_PER_CU_FT = 1728;
const CU_FT_PER_CU_YD = 27;

export type GroutPad = {
  lengthFt: number;
  widthFt: number;
};

export type GroutInput = {
  shape: 'rectangular' | 'custom';
  lengthFt: number;
  widthFt: number;
  pads: GroutPad[];
  extraAreaSqFt: number;
  depthIn: number;
  shoulderIn: number;
  formIn: number;
  sleeveCount: number;
  sleeveDiameterIn: number;
  sleeveHeightIn: number;
  wastePercent: number;
  yieldCuFt: number | null;
  weightLbPerUnit: number | null;
  components: { name: string; weightLb: number | null; note?: string }[];
  formHoursPerCuYd: number;
  pourHoursPerCuYd: number;
  cureHoursPerCuYd: number;
};

export type GroutWeightLine = {
  name: string;
  pounds: number | null;
  perUnit: number | null;
  note: string;
};

export type GroutResult = {
  grossCuFt: number;
  voidCuFt: number;
  netCuFt: number;
  netCuYd: number;
  orderCuFt: number;
  orderCuYd: number;
  /** Exact units before rounding up. */
  unitsExact: number | null;
  /** Units to order, rounded up. */
  units: number | null;
  weightLbPerUnit: number | null;
  weightLb: number | null;
  weightTons: number | null;
  components: GroutWeightLine[];
  formHours: number;
  pourHours: number;
  cureHours: number;
  totalHours: number;
};

/** Footprint of one rectangle after shoulder and form are added on every side. */
export function padAreaSqIn(lengthFt: number, widthFt: number, shoulderIn: number, formIn: number): number {
  const extra = Math.max(0, shoulderIn) + Math.max(0, formIn);
  const lengthIn = lengthFt * 12 + extra * 2;
  const widthIn = widthFt * 12 + extra * 2;
  if (lengthIn <= 0 || widthIn <= 0) return 0;
  return lengthIn * widthIn;
}

export function sleeveVoidCuIn(count: number, diameterIn: number, heightIn: number): number {
  if (count <= 0 || diameterIn <= 0 || heightIn <= 0) return 0;
  const radius = diameterIn / 2;
  return count * Math.PI * radius * radius * heightIn;
}

export function calculateGrout(input: GroutInput): GroutResult {
  const depth = Math.max(0, input.depthIn);
  let grossCuIn = 0;

  if (input.shape === 'rectangular') {
    grossCuIn = padAreaSqIn(input.lengthFt, input.widthFt, input.shoulderIn, input.formIn) * depth;
  } else {
    for (const pad of input.pads) {
      grossCuIn += padAreaSqIn(pad.lengthFt, pad.widthFt, input.shoulderIn, input.formIn) * depth;
    }
    // Extra area is an irregular footprint. Shoulder and form are not applied
    // because there is no length and width to grow.
    grossCuIn += Math.max(0, input.extraAreaSqFt) * 144 * depth;
  }

  const voidCuIn = sleeveVoidCuIn(input.sleeveCount, input.sleeveDiameterIn, input.sleeveHeightIn);
  const netCuIn = Math.max(0, grossCuIn - voidCuIn);
  const netCuFt = netCuIn / CU_IN_PER_CU_FT;
  const netCuYd = netCuFt / CU_FT_PER_CU_YD;
  const waste = Math.max(0, input.wastePercent) / 100;
  const orderCuFt = netCuFt * (1 + waste);
  const orderCuYd = netCuYd * (1 + waste);
  const unitsExact = input.yieldCuFt != null && input.yieldCuFt > 0 ? orderCuFt / input.yieldCuFt : null;
  const units = orderUnits(unitsExact);
  const delivery = deliveryWeight(units, input.weightLbPerUnit, input.components);

  const formHours = Math.max(0, input.formHoursPerCuYd) * orderCuYd;
  const pourHours = Math.max(0, input.pourHoursPerCuYd) * orderCuYd;
  const cureHours = Math.max(0, input.cureHoursPerCuYd) * orderCuYd;

  return {
    grossCuFt: grossCuIn / CU_IN_PER_CU_FT,
    voidCuFt: voidCuIn / CU_IN_PER_CU_FT,
    netCuFt,
    netCuYd,
    orderCuFt,
    orderCuYd,
    unitsExact,
    units,
    weightLbPerUnit: delivery.perUnit,
    weightLb: delivery.pounds,
    weightTons: delivery.tons,
    components: delivery.lines,
    formHours,
    pourHours,
    cureHours,
    totalHours: formHours + pourHours + cureHours,
  };
}

/** Round up to a whole unit. Values within 1e-6 of an integer stay on that integer. */
export function orderUnits(exact: number | null): number | null {
  if (exact == null || !Number.isFinite(exact) || exact <= 0) return exact === 0 ? 0 : null;
  const snapped = Math.round(exact * 1e6) / 1e6;
  return Math.ceil(snapped);
}

export function deliveryWeight(
  units: number | null,
  weightLb: number | null,
  components: { name: string; weightLb: number | null; note?: string }[],
): { perUnit: number | null; pounds: number | null; tons: number | null; lines: GroutWeightLine[] } {
  const lines = components.map((component) => ({
    name: component.name,
    perUnit: component.weightLb,
    pounds: component.weightLb != null && units != null ? units * component.weightLb : null,
    note: component.note || '',
  }));
  const summed =
    components.length > 0 && components.every((component) => component.weightLb != null)
      ? components.reduce((sum, component) => sum + (component.weightLb ?? 0), 0)
      : null;
  const perUnit = weightLb != null && weightLb > 0 ? weightLb : summed;
  const pounds = units != null && perUnit != null ? units * perUnit : null;
  return { perUnit, pounds, tons: pounds == null ? null : pounds / 2000, lines };
}
