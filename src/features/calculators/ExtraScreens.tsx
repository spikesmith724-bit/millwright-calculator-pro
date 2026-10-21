import { useState } from 'react';
import { Text } from 'react-native';

import { Banner, Button, ChoiceRow, Field, Screen, SectionHeader } from '@/src/components/ui';
import { CALC_DISCLAIMER } from '@/src/domain/calculators/common';
import { fitResult, itToleranceMicrons } from '@/src/domain/extra/fits';
import { calculateGrout, type GroutResult } from '@/src/domain/extra/groutJob';
import { bendEfficiencyCheck, workingLoad } from '@/src/domain/extra/rigging';
import { CalcBack, parseNum, ResultBlock, useSaveShare, type Lines } from '@/src/features/calculators/CalculatorScreens';
import { useAppTheme } from '@/src/theme/ThemeContext';

function fmt(value: number | null, places = 4): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return String(Math.round(value * 10 ** places) / 10 ** places);
}

const IT_GRADES = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

export function IsoFitsScreen() {
  const { share } = useSaveShare();
  const [nominal, setNominal] = useState('25');
  const [holeGrade, setHoleGrade] = useState('7');
  const [shaftGrade, setShaftGrade] = useState('6');
  const [holeDev, setHoleDev] = useState('0');
  const [shaftDev, setShaftDev] = useState('0');
  const [lines, setLines] = useState<Lines>([]);
  const [error, setError] = useState<string | null>(null);
  const formula = 'i = 0.45·∛D + 0.001·D (µm). IT = i × grade factor. Clearance = hole − shaft at the limits.';
  const units = 'Nominal and limits in mm. Tolerances and deviations in µm.';
  function run() {
    setError(null);
    try {
      const d = parseNum(nominal, 'nominal size');
      if (d <= 0 || d > 500) throw new Error('Nominal size must be between 0 and 500 mm.');
      const holeTol = itToleranceMicrons(d, Number(holeGrade));
      const shaftTol = itToleranceMicrons(d, Number(shaftGrade));
      if (holeTol == null || shaftTol == null) throw new Error('Pick IT5 through IT16.');
      const fit = fitResult({
        nominalMm: d,
        holeToleranceMicrons: holeTol,
        shaftToleranceMicrons: shaftTol,
        holeDeviationMicrons: parseNum(holeDev, 'hole lower deviation'),
        shaftDeviationMicrons: parseNum(shaftDev, 'shaft upper deviation'),
      });
      const kind = fit.minClearanceMm >= 0 ? 'Clearance fit' : fit.maxClearanceMm <= 0 ? 'Interference fit' : 'Transition fit';
      setLines([
        { label: 'Hole tolerance', value: `IT${holeGrade} = ${fmt(holeTol, 1)} µm` },
        { label: 'Shaft tolerance', value: `IT${shaftGrade} = ${fmt(shaftTol, 1)} µm` },
        { label: 'Hole limits', value: `${fmt(fit.holeMin)} – ${fmt(fit.holeMax)} mm` },
        { label: 'Shaft limits', value: `${fmt(fit.shaftMin)} – ${fmt(fit.shaftMax)} mm` },
        { label: 'Max clearance', value: `${fmt(fit.maxClearanceMm)} mm` },
        { label: 'Min clearance', value: `${fmt(fit.minClearanceMm)} mm (negative = interference)` },
        { label: 'Fit', value: kind },
      ]);
    } catch (reason) {
      setLines([]);
      setError(reason instanceof Error ? reason.message : 'Check the inputs.');
    }
  }
  return (
    <Screen title="ISO fits" subtitle="IT grade tolerances from the ISO 286 formula, then hole and shaft limits. Check the ISO 286-2 table for the final figure.">
      <CalcBack />
      <Field label="Nominal size (mm)" value={nominal} onChangeText={setNominal} keyboardType="decimal-pad" />
      <ChoiceRow label="Hole IT grade" options={IT_GRADES.map((g) => ({ value: String(g), label: `IT${g}` }))} value={holeGrade} onChange={setHoleGrade} />
      <ChoiceRow label="Shaft IT grade" options={IT_GRADES.map((g) => ({ value: String(g), label: `IT${g}` }))} value={shaftGrade} onChange={setShaftGrade} />
      <Field label="Hole lower deviation (µm)" value={holeDev} onChangeText={setHoleDev} keyboardType="numbers-and-punctuation" hint="H hole = 0." />
      <Field label="Shaft upper deviation (µm)" value={shaftDev} onChangeText={setShaftDev} keyboardType="numbers-and-punctuation" hint="h shaft = 0. Negative for clearance shafts (g, f), positive for interference (p, s)." />
      <Button label="Calculate fit" onPress={run} />
      {error ? <Banner title="Input" tone="warning" body={error} /> : null}
      {lines.length > 0 ? (
        <>
          <ResultBlock lines={lines} extra={`${formula}\n${units}\n${CALC_DISCLAIMER}`} />
          <Button label="Share result" variant="secondary" onPress={() => void share('ISO fit', lines, formula, units)} />
        </>
      ) : null}
    </Screen>
  );
}

export function GroutJobScreen() {
  const { theme } = useAppTheme();
  const { share } = useSaveShare();
  const [length, setLength] = useState('6');
  const [width, setWidth] = useState('3');
  const [depth, setDepth] = useState('2');
  const [shoulder, setShoulder] = useState('2');
  const [form, setForm] = useState('1');
  const [sleeveCount, setSleeveCount] = useState('4');
  const [sleeveDia, setSleeveDia] = useState('3');
  const [sleeveHeight, setSleeveHeight] = useState('2');
  const [waste, setWaste] = useState('10');
  const [yieldCuFt, setYield] = useState('');
  const [weight, setWeight] = useState('');
  const [formHrs, setFormHrs] = useState('0');
  const [pourHrs, setPourHrs] = useState('0');
  const [result, setResult] = useState<GroutResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formula = 'Pad = (L + 2·(shoulder + form)) × (W + 2·(shoulder + form)) × depth. Net = gross − sleeves (n·π·r²·h). Order = net × (1 + waste). Units = ceil(order / yield).';
  const units = 'Pad in feet, depth and sleeves in inches, volume in ft³ and yd³, weight in lb.';
  const optional = (value: string, label: string) => (value.trim() ? parseNum(value, label) : null);
  function run() {
    setError(null);
    try {
      setResult(
        calculateGrout({
          shape: 'rectangular',
          lengthFt: parseNum(length, 'length'),
          widthFt: parseNum(width, 'width'),
          pads: [],
          extraAreaSqFt: 0,
          depthIn: parseNum(depth, 'depth'),
          shoulderIn: parseNum(shoulder, 'shoulder'),
          formIn: parseNum(form, 'form'),
          sleeveCount: parseNum(sleeveCount, 'sleeve count'),
          sleeveDiameterIn: parseNum(sleeveDia, 'sleeve diameter'),
          sleeveHeightIn: parseNum(sleeveHeight, 'sleeve height'),
          wastePercent: parseNum(waste, 'waste'),
          yieldCuFt: optional(yieldCuFt, 'yield'),
          weightLbPerUnit: optional(weight, 'weight'),
          components: [],
          formHoursPerCuYd: parseNum(formHrs, 'form hours'),
          pourHoursPerCuYd: parseNum(pourHrs, 'pour hours'),
          cureHoursPerCuYd: 0,
        }),
      );
    } catch (reason) {
      setResult(null);
      setError(reason instanceof Error ? reason.message : 'Check the inputs.');
    }
  }
  const lines: Lines = result
    ? [
        { label: 'Gross volume', value: `${fmt(result.grossCuFt, 3)} ft³` },
        { label: 'Sleeve voids', value: `${fmt(result.voidCuFt, 3)} ft³` },
        { label: 'Net volume', value: `${fmt(result.netCuFt, 3)} ft³ (${fmt(result.netCuYd, 3)} yd³)` },
        { label: 'Order volume', value: `${fmt(result.orderCuFt, 3)} ft³ (${fmt(result.orderCuYd, 3)} yd³)` },
        { label: 'Units to order', value: result.units == null ? 'Enter the product yield' : String(result.units) },
        { label: 'Delivery weight', value: result.weightLb == null ? 'Enter weight per unit' : `${fmt(result.weightLb, 0)} lb (${fmt(result.weightTons, 2)} tons)` },
        { label: 'Crew hours', value: `${fmt(result.formHours + result.pourHours, 1)} h (form ${fmt(result.formHours, 1)}, pour ${fmt(result.pourHours, 1)})` },
      ]
    : [];
  return (
    <Screen title="Grout job estimator" subtitle="Any grout product. Pad with shoulder and form allowance, sleeve voids, waste, yield, weight, and crew hours.">
      <CalcBack />
      <SectionHeader title="Pad" />
      <Field label="Length (ft)" value={length} onChangeText={setLength} keyboardType="decimal-pad" />
      <Field label="Width (ft)" value={width} onChangeText={setWidth} keyboardType="decimal-pad" />
      <Field label="Depth (in)" value={depth} onChangeText={setDepth} keyboardType="decimal-pad" />
      <Field label="Shoulder each side (in)" value={shoulder} onChangeText={setShoulder} keyboardType="decimal-pad" />
      <Field label="Form allowance each side (in)" value={form} onChangeText={setForm} keyboardType="decimal-pad" />
      <SectionHeader title="Sleeves and blockouts" />
      <Field label="Sleeve count" value={sleeveCount} onChangeText={setSleeveCount} keyboardType="number-pad" />
      <Field label="Sleeve diameter (in)" value={sleeveDia} onChangeText={setSleeveDia} keyboardType="decimal-pad" />
      <Field label="Sleeve height in grout (in)" value={sleeveHeight} onChangeText={setSleeveHeight} keyboardType="decimal-pad" />
      <SectionHeader title="Product and labor" />
      <Field label="Waste %" value={waste} onChangeText={setWaste} keyboardType="decimal-pad" />
      <Field label="Yield per unit (ft³, optional)" value={yieldCuFt} onChangeText={setYield} keyboardType="decimal-pad" hint="From the product data sheet." />
      <Field label="Weight per unit (lb, optional)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
      <Field label="Form hours per yd³" value={formHrs} onChangeText={setFormHrs} keyboardType="decimal-pad" />
      <Field label="Pour hours per yd³" value={pourHrs} onChangeText={setPourHrs} keyboardType="decimal-pad" />
      <Button label="Estimate grout" onPress={run} />
      {error ? <Banner title="Input" tone="warning" body={error} /> : null}
      {result ? (
        <>
          <ResultBlock lines={lines} extra={`${formula}\n${units}\n${CALC_DISCLAIMER}`} />
          <Button label="Share result" variant="secondary" onPress={() => void share('Grout job estimate', lines, formula, units)} />
        </>
      ) : null}
      <Text style={{ color: theme.color.textMuted, marginTop: 8 }}>For Chockfast takeoffs by unit, use the Epoxy grout calculator.</Text>
    </Screen>
  );
}

export function RiggingScreen() {
  const { share } = useSaveShare();
  const [mbs, setMbs] = useState('10000');
  const [factor, setFactor] = useState('5');
  const [pin, setPin] = useState('2');
  const [rope, setRope] = useState('0.5');
  const [lines, setLines] = useState<Lines>([]);
  const [error, setError] = useState<string | null>(null);
  const formula = 'WLL = minimum breaking strength / design factor. Bend efficiency ≈ 1 − 0.5 / (D/d).';
  const units = 'Strength and WLL in the same unit you entered. D and d in the same length unit.';
  function run() {
    setError(null);
    const wll = workingLoad(parseNum(mbs, 'breaking strength'), parseNum(factor, 'design factor'));
    const eff = bendEfficiencyCheck(parseNum(pin, 'pin diameter'), parseNum(rope, 'rope diameter'));
    if (wll == null || eff == null) {
      setLines([]);
      setError('All values must be greater than zero.');
      return;
    }
    const ratio = parseNum(pin, 'pin diameter') / parseNum(rope, 'rope diameter');
    setLines([
      { label: 'Working load limit', value: fmt(wll, 1) },
      { label: 'D/d ratio', value: fmt(ratio, 2) },
      { label: 'Bend efficiency', value: `${fmt(eff * 100, 1)} %` },
      { label: 'WLL at the bend', value: fmt(wll * eff, 1) },
    ]);
  }
  return (
    <Screen title="Rigging WLL" subtitle="Working load from breaking strength and design factor, and a D/d bend efficiency estimate. The rigging tag and the manufacturer's chart govern.">
      <CalcBack />
      <Field label="Minimum breaking strength" value={mbs} onChangeText={setMbs} keyboardType="decimal-pad" />
      <Field label="Design factor" value={factor} onChangeText={setFactor} keyboardType="decimal-pad" hint="Wire rope is commonly 5:1." />
      <Field label="Pin or bend diameter D" value={pin} onChangeText={setPin} keyboardType="decimal-pad" />
      <Field label="Rope diameter d" value={rope} onChangeText={setRope} keyboardType="decimal-pad" />
      <Button label="Calculate WLL" onPress={run} />
      {error ? <Banner title="Input" tone="warning" body={error} /> : null}
      {lines.length > 0 ? (
        <>
          <ResultBlock lines={lines} extra={`${formula}\n${units}\n${CALC_DISCLAIMER}`} />
          <Button label="Share result" variant="secondary" onPress={() => void share('Rigging WLL', lines, formula, units)} />
        </>
      ) : null}
    </Screen>
  );
}
