export const LAB_LIMIT_NOTE = 'Typical, follow your lab’s limits.';

export type OilGroup = 'Wear metals' | 'Contaminants' | 'Fluid condition';

export type OilAnalyte = {
  id: string;
  symbol: string;
  name: string;
  group: OilGroup;
  pointsTo: string;
  caution: string;
  critical: string;
};

/**
 * Field reading of a lab sheet. Numbers are typical flags, not a lab's limit and not a quoted standard.
 */
export const OIL_ANALYTES: OilAnalyte[] = [
  {
    id: 'fe',
    symbol: 'Fe',
    name: 'Iron',
    group: 'Wear metals',
    pointsTo: 'Gears, shafts, bearing races, housings, and rust. The spectrometer mostly sees particles under about 8 µm, so a quiet iron number can still hide large chunks.',
    caution: 'About 10 to 20 ppm, or a sharp rise off the trend.',
    critical: 'Above that band, or iron climbing with a filter full of glitter.',
  },
  {
    id: 'cu',
    symbol: 'Cu',
    name: 'Copper',
    group: 'Wear metals',
    pointsTo: 'Bearing and bushing overlays, thrust plates, oil-cooler tubes, and some pump parts. Copper with lead and tin is a bearing tell.',
    caution: 'About 10 to 20 ppm, or a rise off the new-oil and the trend.',
    critical: 'Above that band, especially with lead or tin moving too.',
  },
  {
    id: 'pb',
    symbol: 'Pb',
    name: 'Lead',
    group: 'Wear metals',
    pointsTo: 'Soft bearing overlay. It rarely shows up alone. Look at copper and tin on the same line.',
    caution: 'About 10 to 20 ppm.',
    critical: 'Above that band, or lead with copper and tin together.',
  },
  {
    id: 'sn',
    symbol: 'Sn',
    name: 'Tin',
    group: 'Wear metals',
    pointsTo: 'Bearing overlay and some bushings. With lead and copper, think the bearing surface, not the shaft.',
    caution: 'About 10 to 20 ppm.',
    critical: 'Above that band, especially in a set with lead and copper.',
  },
  {
    id: 'cr',
    symbol: 'Cr',
    name: 'Chromium',
    group: 'Wear metals',
    pointsTo: 'Roller bearings, rings, chrome surfaces, and some alloy shafts.',
    caution: 'About 5 to 10 ppm.',
    critical: 'Above that band, or chromium rising with iron.',
  },
  {
    id: 'al',
    symbol: 'Al',
    name: 'Aluminum',
    group: 'Wear metals',
    pointsTo: 'Some bearings and housings, and also dirt. Aluminum with silicon is often silica, not a metal part.',
    caution: 'About 10 to 20 ppm.',
    critical: 'Above that band. If silicon is up too, treat it as dirt until the sample says otherwise.',
  },
  {
    id: 'ni',
    symbol: 'Ni',
    name: 'Nickel',
    group: 'Wear metals',
    pointsTo: 'Alloy steels in shafts, gears, and some bearings.',
    caution: 'About 5 to 10 ppm.',
    critical: 'Above that band, or nickel rising with iron.',
  },
  {
    id: 'si',
    symbol: 'Si',
    name: 'Silicon',
    group: 'Contaminants',
    pointsTo: 'Dirt and sand. Silicone antifoam already in the new oil also reads as silicon, so compare with the new-oil certificate before you call it dirt.',
    caution: 'A rise of about 10 to 20 ppm above whatever silicon the new oil already had.',
    critical: 'Silicon still climbing, especially with aluminum, or the cleanliness code getting worse on the same sample.',
  },
  {
    id: 'na-k',
    symbol: 'Na / K',
    name: 'Sodium and potassium',
    group: 'Contaminants',
    pointsTo: 'The pair together points to glycol coolant. Sodium alone can be salt, process, or an additive. Do not call sodium by itself a cooler leak.',
    caution: 'Both sodium and potassium leaving the new-oil baseline.',
    critical: 'Both still climbing, especially when water is up on the same sample.',
  },
  {
    id: 'water',
    symbol: 'Water',
    name: 'Water, Karl Fischer',
    group: 'Contaminants',
    pointsTo: 'Dissolved and free water, reported in ppm by Karl Fischer. Water thins the film, feeds rust, and helps acids and varnish.',
    caution: 'About 250 to 500 ppm on a general industrial oil.',
    critical: 'Above about 500 ppm. Turbine and hydraulic specs are often tighter than this band.',
  },
  {
    id: 'viscosity',
    symbol: 'Viscosity',
    name: 'Viscosity at 40°C',
    group: 'Fluid condition',
    pointsTo: 'Compare centistokes with the new oil, not with a cleanliness code. Up points to oxidation, soot, water emulsion, or a heavier top-up. Down points to a lighter oil, shear of a viscosity-index improver, or fuel dilution on an engine.',
    caution: 'A change of 10 percent either way from the new-oil viscosity.',
    critical: 'A change of 20 percent either way.',
  },
  {
    id: 'tan',
    symbol: 'TAN',
    name: 'Acid number',
    group: 'Fluid condition',
    pointsTo: 'mg KOH/g. A rising number means acids from oxidation. Antiwear and EP additives can make a new oil start high, so the new-oil TAN is the baseline, not zero.',
    caution: 'A clear rise off the new oil. On an oil that started under about 0.1, watch closely from about 0.5.',
    critical: 'Above about 0.8 when the new oil started under about 0.1, or a rise toward about double the new-oil TAN when the new oil started higher.',
  },
  {
    id: 'oxidation',
    symbol: 'Oxidation',
    name: 'Oxidation',
    group: 'Fluid condition',
    pointsTo: 'An infrared number against the new oil. It supports acid number and viscosity. Alone, it is a weak reason to change the oil.',
    caution: 'A rise off the new-oil oxidation number.',
    critical: 'That rise together with viscosity or TAN already in a caution band.',
  },
  {
    id: 'mpc',
    symbol: 'MPC',
    name: 'Varnish potential',
    group: 'Fluid condition',
    pointsTo: 'Membrane patch color. Soft contaminants that plate out on valves, servo spools, and bearings. The patch getting darker is the clue, not a wear metal.',
    caution: 'About 15 to 30.',
    critical: 'Above about 40. The band between 30 and 40 is already abnormal on many lab sheets.',
  },
  {
    id: 'pq',
    symbol: 'PQ',
    name: 'PQ index',
    group: 'Fluid condition',
    pointsTo: 'Relative ferrous debris, including particles big enough that the spectrometer under-reads them. There is no single universal PQ number.',
    caution: 'PQ rising while iron ppm stays flat.',
    critical: 'A sharp PQ rise, or PQ up with vibration, noise, or visible metal in the filter.',
  },
  {
    id: 'additives',
    symbol: 'Zn, P, Ca',
    name: 'Additive depletion',
    group: 'Fluid condition',
    pointsTo: 'Zinc and phosphorus are common antiwear elements. Calcium, magnesium, and barium are common detergent elements. Read them against the new-oil certificate. An oil that never had zinc is not depleted when zinc is zero.',
    caution: 'An additive element about 25 percent below the new-oil number.',
    critical: 'A drop toward about half of the new-oil number.',
  },
];

export const OIL_GROUPS: OilGroup[] = ['Wear metals', 'Contaminants', 'Fluid condition'];
