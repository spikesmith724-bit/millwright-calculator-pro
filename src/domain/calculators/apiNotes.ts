/** Short lines for a calculator result. Topics only. No clause numbers and no quoted standard text. */

export const API_610_PUMPS = 'Based on API 610, centrifugal pumps';

export const API_617_COMPRESSORS = 'Based on API 617, centrifugal compressors';

export const API_670_VIBRATION = 'Based on API 670, machinery protection and vibration';

export const API_COUPLING_ALIGNMENT = 'Based on API 671, couplings; API 686, installation, alignment, and grouting';

export const API_BEARING_LIFE = 'Based on API 610, centrifugal pumps; API 613, gears';

export const NPSH_NOTE =
  'API 610 centrifugal-pump practice compares available NPSH with the vendor NPSH3 figure, the test point where developed head has fallen off by about 3 percent. The margin and the ratio are that comparison. Confirm them on the OEM curve. This note does not set a fixed acceptance limit.';

export const POLYTROPIC_NOTE =
  'API 617 centrifugal-compressor practice rates a machine with polytropic head and polytropic efficiency. This result uses the pressures and temperatures you entered. It does not apply a shop-test tolerance.';

export const FREQUENCY_NOTE =
  'API 670 machinery-protection practice is how a monitor reads vibration. Gear-mesh and bearing orders are the tones to look for in the spectrum. Setpoints stay on the project drawing. The formulas assume the inner race is the one turning.';

export const COUPLING_NOTE =
  'API 671 covers couplings and API 686 covers installation, alignment, and grouting. The speed screen is a first look when the coupling drawing is not in hand. It is not a limit copied from either standard. The maker limits win when you enter them.';

export const BEARING_NOTE =
  'API 610 centrifugal-pump practice and API 613 gear practice both expect the vendor to rate bearing L10 for the service. This is the basic rating life from the capacity and the load you entered. Compare it with the datasheet.';
