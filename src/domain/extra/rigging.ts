/** Sling geometry. Capacities still come from the sling maker. */

export function twoLegTensionEach(load: number, angleFromHorizontalDeg: number): number | null {
  if (load <= 0) return null;
  const radians = (angleFromHorizontalDeg * Math.PI) / 180;
  const sine = Math.sin(radians);
  if (sine <= 0.05) return null;
  return load / 2 / sine;
}

export function workingLoad(breakingStrength: number, designFactor: number): number | null {
  if (breakingStrength <= 0 || designFactor <= 0) return null;
  return breakingStrength / designFactor;
}

/** Teaching check only. Do not replace the sling maker's D/d chart. */
export function bendEfficiencyCheck(pinDiameter: number, ropeDiameter: number): number | null {
  if (pinDiameter <= 0 || ropeDiameter <= 0) return null;
  const ratio = pinDiameter / ropeDiameter;
  return Math.max(0, Math.min(1, 1 - 0.5 / ratio));
}
