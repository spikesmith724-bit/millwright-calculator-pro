import { CALC_DISCLAIMER, FORMULA_VERSION, requirePositive, roundTo } from '@/src/domain/calculators/common';

/**
 * Sign convention, used by both methods.
 * The movable machine is the one whose feet you shim and shift.
 * Distances are measured from the coupling (rim-and-face) or from the near indicator (reverse dial), toward the movable feet.
 * Vertical: a positive result is shim to ADD under that foot (raise it). A negative result is shim to REMOVE.
 * Horizontal: a positive result moves that foot to the right when you stand behind the movable machine and look toward the fixed machine.
 * Sag is a positive amount, in the same units as the readings, added to each bottom rim reading before the math. Face readings are not sag-corrected.
 */

export const ALIGNMENT_SIGN =
  'Positive vertical is shim added (raise the foot). Positive horizontal moves the foot to the right when you look from the movable machine toward the fixed machine. Sag is added to the bottom rim reading.';

export type DialSet = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};

export type FootCorrection = {
  verticalMils: number;
  horizontalMils: number;
};

export type AlignmentResult = {
  formulaVersion: string;
  formula: string;
  units: string;
  disclaimer: string;
  signConvention: string;
  front: FootCorrection;
  back: FootCorrection;
};

export type RimFaceInput = {
  /** Diameter of the circle the face indicator sweeps, inches. */
  faceDiameterIn: number;
  frontFootIn: number;
  backFootIn: number;
  /** Positive sag added to the bottom rim reading, mils. */
  sagMils: number;
  rim: DialSet;
  face: DialSet;
};

export type ReverseDialInput = {
  /** Distance between the two rim indicators, inches. */
  indicatorSpanIn: number;
  /** Front and back feet measured from the near indicator, toward the movable feet. */
  frontFootFromNearIn: number;
  backFootFromNearIn: number;
  sagNearMils: number;
  sagFarMils: number;
  /** Indicator on the fixed side, reading the movable rim. */
  near: DialSet;
  /** Indicator on the movable side, reading the fixed rim. Its sign is reversed. */
  far: DialSet;
};

function move(vertical: number, horizontal: number): FootCorrection {
  return { verticalMils: roundTo(vertical, 3), horizontalMils: roundTo(horizontal, 3) };
}

/**
 * Rim-and-face.
 * Rim TIR vertical = (bottom + sag) − top. The parallel offset of the shaft is half of that.
 * Face TIR vertical = bottom − top. Over the face diameter that is the slope, mils per inch.
 * Foot = slope × distance from the coupling + parallel offset.
 * The same relations use right − left for the horizontal plane. Sag is not applied horizontally.
 */
export function rimAndFace(input: RimFaceInput): AlignmentResult {
  const diameter = requirePositive(input.faceDiameterIn, 'Face diameter');
  const front = requirePositive(input.frontFootIn, 'Front foot distance');
  const back = requirePositive(input.backFootIn, 'Back foot distance');
  if (back <= front) throw new Error('The back foot must be farther from the coupling than the front foot.');
  const rimVertical = input.rim.bottom + input.sagMils - input.rim.top;
  const faceVertical = input.face.bottom - input.face.top;
  const rimHorizontal = input.rim.right - input.rim.left;
  const faceHorizontal = input.face.right - input.face.left;
  const at = (distance: number, faceTir: number, rimTir: number) => (faceTir * distance) / diameter + rimTir / 2;
  return {
    formulaVersion: FORMULA_VERSION,
    formula: 'Foot = (face TIR × distance / face diameter) + (rim TIR / 2). Rim TIR vertical = (bottom + sag) − top.',
    units: 'Distances in inches. Readings and results in mils (0.001 in).',
    disclaimer: CALC_DISCLAIMER,
    signConvention: ALIGNMENT_SIGN,
    front: move(at(front, faceVertical, rimVertical), at(front, faceHorizontal, rimHorizontal)),
    back: move(at(back, faceVertical, rimVertical), at(back, faceHorizontal, rimHorizontal)),
  };
}

/**
 * Reverse dial.
 * Both indicators are zeroed at the top (or left) and read opposite.
 * Offset of the movable centerline relative to the fixed centerline, positive when the movable shaft is high or to the right:
 *   near = correctedNear / 2
 *   far = −correctedFar / 2
 * The far indicator faces the other way, so its sign flips.
 * Corrected bottom = bottom + sag − top.
 * Offset at a foot = near + (far − near) × (distance from the near indicator / span).
 * Shim added = −offset, so a low foot gets a positive shim.
 */
export function reverseDial(input: ReverseDialInput): AlignmentResult {
  const span = requirePositive(input.indicatorSpanIn, 'Indicator span');
  const front = requirePositive(input.frontFootFromNearIn, 'Front foot distance');
  const back = requirePositive(input.backFootFromNearIn, 'Back foot distance');
  if (back <= front) throw new Error('The back foot must be farther from the near indicator than the front foot.');
  const project = (nearReading: number, farReading: number, distance: number) => {
    const nearOffset = nearReading / 2;
    const farOffset = -farReading / 2;
    const offset = nearOffset + ((farOffset - nearOffset) * distance) / span;
    return -offset;
  };
  const nearVertical = input.near.bottom + input.sagNearMils - input.near.top;
  const farVertical = input.far.bottom + input.sagFarMils - input.far.top;
  const nearHorizontal = input.near.right - input.near.left;
  const farHorizontal = input.far.right - input.far.left;
  return {
    formulaVersion: FORMULA_VERSION,
    formula:
      'Offset = near/2 + ((−far/2 − near/2) × distance / span). Shim or move = −offset. Bottom readings include sag. The far indicator is sign-reversed.',
    units: 'Distances in inches. Readings and results in mils (0.001 in).',
    disclaimer: CALC_DISCLAIMER,
    signConvention: ALIGNMENT_SIGN,
    front: move(project(nearVertical, farVertical, front), project(nearHorizontal, farHorizontal, front)),
    back: move(project(nearVertical, farVertical, back), project(nearHorizontal, farHorizontal, back)),
  };
}
