import { useState } from 'react';
import { Text } from 'react-native';

import { Banner, Button, ChoiceRow, Field, Screen } from '@/src/components/ui';
import type { UnitSystem } from '@/src/domain/calculators/affinity';
import { agitatorCritical, agitatorDeflection, agitatorPower, agitatorTipSpeed, STEEL_E_GPA, STEEL_E_PSI } from '@/src/domain/calculators/agitator';
import { CalcBack, footer, parseNum, ResultBlock, useSaveShare, type Lines } from '@/src/features/calculators/CalculatorScreens';

type Mode = 'deflection' | 'critical' | 'tip' | 'power';

const MODES: { value: Mode; label: string }[] = [
  { value: 'deflection', label: 'Deflection at the seal' },
  { value: 'critical', label: 'First critical speed' },
  { value: 'tip', label: 'Tip speed' },
  { value: 'power', label: 'Power number' },
];

function show(value: number, places = 4): string {
  return value.toFixed(places).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

export function AgitatorCalculatorScreen() {
  const [mode, setMode] = useState<Mode>('deflection');
  const [system, setSystem] = useState<UnitSystem>('us');
  const [load, setLoad] = useState('');
  const [diameter, setDiameter] = useState('');
  const [lengthToImpeller, setLengthToImpeller] = useState('');
  const [lengthToSeal, setLengthToSeal] = useState('');
  const [modulus, setModulus] = useState(String(STEEL_E_PSI));
  const [running, setRunning] = useState('');
  const [deflection, setDeflection] = useState('');
  const [impeller, setImpeller] = useState('');
  const [rpm, setRpm] = useState('');
  const [powerNumber, setPowerNumber] = useState('');
  const [gravity, setGravity] = useState('1');
  const [lines, setLines] = useState<Lines>([]);
  const [extra, setExtra] = useState('');
  const [formula, setFormula] = useState('');
  const [units, setUnits] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const { note: saved, share } = useSaveShare();

  function applySystem(next: UnitSystem) {
    setSystem(next);
    setModulus(next === 'metric' ? String(STEEL_E_GPA * 1000) : String(STEEL_E_PSI));
    setLines([]);
  }

  function run() {
    setNote(null);
    try {
      const rpmValue = running.trim() ? parseNum(running, 'running speed') : null;
      if (mode === 'deflection') {
        const result = agitatorDeflection({
          system,
          load: parseNum(load, 'load'),
          diameter: parseNum(diameter, 'shaft diameter'),
          lengthToImpeller: parseNum(lengthToImpeller, 'length to the impeller'),
          lengthToSeal: parseNum(lengthToSeal, 'length to the seal'),
          modulus: parseNum(modulus, 'modulus'),
          runningRpm: rpmValue,
        });
        const unit = system === 'metric' ? 'mm' : 'in';
        setLines([
          { label: 'Deflection at the seal', value: `${show(result.atSeal, 5)} ${unit}` },
          { label: 'Deflection at the impeller', value: `${show(result.atImpeller, 5)} ${unit}` },
          { label: 'First critical speed', value: `${show(result.criticalRpm, 1)} rpm` },
          ...(result.margin == null ? [] : [{ label: 'Margin', value: show(result.margin, 2) }]),
          ...(result.warnings[0] ? [{ label: 'Watch', value: result.warnings[0] }] : []),
        ]);
        setExtra(`${result.basis}\n${result.note}`);
        setFormula(result.formula);
        setUnits(result.units);
      } else if (mode === 'critical') {
        const result = agitatorCritical({ system, deflection: parseNum(deflection, 'static deflection'), runningRpm: rpmValue });
        setLines([
          { label: 'First critical speed', value: `${show(result.criticalRpm, 1)} rpm` },
          ...(result.margin == null ? [] : [{ label: 'Margin', value: show(result.margin, 2) }]),
          ...(result.warnings[0] ? [{ label: 'Watch', value: result.warnings[0] }] : []),
        ]);
        setExtra(`${result.basis}\n${result.note}`);
        setFormula(result.formula);
        setUnits(result.units);
      } else if (mode === 'tip') {
        const result = agitatorTipSpeed({ system, diameter: parseNum(impeller, 'impeller diameter'), rpm: parseNum(rpm, 'speed') });
        setLines([{ label: 'Tip speed', value: system === 'metric' ? `${show(result.tipSpeed, 3)} m/s` : `${show(result.tipSpeed, 1)} ft/min` }]);
        setExtra(result.note);
        setFormula(result.formula);
        setUnits(result.units);
      } else {
        const result = agitatorPower({
          system,
          powerNumber: parseNum(powerNumber, 'power number'),
          specificGravity: parseNum(gravity, 'specific gravity'),
          rpm: parseNum(rpm, 'speed'),
          diameter: parseNum(impeller, 'impeller diameter'),
        });
        setLines([
          { label: 'Horsepower', value: `${show(result.horsepower, 3)} hp` },
          { label: 'Kilowatts', value: `${show(result.kilowatts, 3)} kW` },
        ]);
        setExtra(result.note);
        setFormula(result.formula);
        setUnits(result.units);
      }
    } catch (error) {
      setLines([]);
      setNote(error instanceof Error ? error.message : 'Check the inputs.');
    }
  }

  const lengthUnit = system === 'metric' ? 'mm' : 'in';
  const loadUnit = system === 'metric' ? 'N' : 'lbf';
  const modulusUnit = system === 'metric' ? 'N/mm²' : 'psi';
  return (
    <Screen title="Agitator" subtitle="Cantilever shaft, critical speed, tip speed, and power. Field estimates. The mixer maker and the seal maker set the limits.">
      <CalcBack />
      <ChoiceRow label="Calculation" options={MODES} value={mode} onChange={setMode} />
      <ChoiceRow
        label="Units"
        options={[
          { value: 'us', label: 'US' },
          { value: 'metric', label: 'Metric' },
        ]}
        value={system}
        onChange={applySystem}
      />
      {mode === 'deflection' ? (
        <>
          <Field label={`Hydraulic load at the impeller (${loadUnit})`} value={load} onChangeText={setLoad} keyboardType="decimal-pad" />
          <Field label={`Shaft diameter (${lengthUnit})`} value={diameter} onChangeText={setDiameter} keyboardType="decimal-pad" />
          <Field label={`Bearing to impeller (${lengthUnit})`} value={lengthToImpeller} onChangeText={setLengthToImpeller} keyboardType="decimal-pad" />
          <Field label={`Bearing to seal (${lengthUnit})`} value={lengthToSeal} onChangeText={setLengthToSeal} keyboardType="decimal-pad" />
          <Field label={`Modulus (${modulusUnit})`} value={modulus} onChangeText={setModulus} keyboardType="decimal-pad" />
          <Field label="Running speed (rpm, optional)" value={running} onChangeText={setRunning} keyboardType="decimal-pad" />
        </>
      ) : null}
      {mode === 'critical' ? (
        <>
          <Field label={`Static deflection at the impeller (${lengthUnit})`} value={deflection} onChangeText={setDeflection} keyboardType="decimal-pad" />
          <Field label="Running speed (rpm, optional)" value={running} onChangeText={setRunning} keyboardType="decimal-pad" />
        </>
      ) : null}
      {mode === 'tip' || mode === 'power' ? (
        <>
          <Field label={`Impeller diameter (${lengthUnit})`} value={impeller} onChangeText={setImpeller} keyboardType="decimal-pad" />
          <Field label="Speed (rpm)" value={rpm} onChangeText={setRpm} keyboardType="decimal-pad" />
        </>
      ) : null}
      {mode === 'power' ? (
        <>
          <Field label="Power number" value={powerNumber} onChangeText={setPowerNumber} keyboardType="decimal-pad" />
          <Field label="Specific gravity" value={gravity} onChangeText={setGravity} keyboardType="decimal-pad" />
        </>
      ) : null}
      <Button label="Calculate" onPress={run} />
      {note ? <Text>{note}</Text> : null}
      {saved ? <Banner title="Saved" body={saved} /> : null}
      {lines.length > 0 ? (
        <>
          <ResultBlock lines={lines} extra={`${extra}\n${footer(formula, units)}`} />
          <Button label="Share result" variant="secondary" onPress={() => void share('Agitator', lines, formula, units)} />
        </>
      ) : null}
    </Screen>
  );
}
