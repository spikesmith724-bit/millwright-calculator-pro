import { useState } from 'react';

import { Banner, Button, ChoiceRow, Field, Screen } from '@/src/components/ui';
import { pumpAffinity, type UnitSystem } from '@/src/domain/calculators/affinity';
import { bearingL10 } from '@/src/domain/calculators/bearingLife';
import { beltDrive } from '@/src/domain/calculators/belt';
import { roundTo } from '@/src/domain/calculators/common';
import { angularityFromFace, couplingAlignment } from '@/src/domain/calculators/couplingFit';
import { convertFieldUnits, FIELD_UNIT_CHOICES, FIELD_UNIT_PAIRS, FT_TO_M, GPM_TO_M3H, HP_TO_KW, PSI_TO_KPA, type FieldUnitKind } from '@/src/domain/calculators/fieldUnits';
import { machineFrequencies } from '@/src/domain/calculators/frequencies';
import { npshMargin } from '@/src/domain/calculators/npsh';
import { polytropicHead } from '@/src/domain/calculators/polytropic';
import type { CalculatorKind } from '@/src/domain/calculators/kinds';
import { CalcBack, footer, parseNum, ResultBlock, useSaveShare, type Lines } from '@/src/features/calculators/CalculatorScreens';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { Text } from 'react-native';

const LBF_TO_N = 4.4482216152605;

function show(value: number, places = 3): string {
  return String(roundTo(value, places));
}

function optionalNum(value: string, label: string): number | null {
  if (!value.trim()) return null;
  return parseNum(value, label);
}

function moved(value: string, convert: (n: number) => number): string {
  if (!value.trim()) return value;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return String(roundTo(convert(parsed), 6));
}

function UnitToggle({ value, onChange }: { value: UnitSystem; onChange: (next: UnitSystem) => void }) {
  return (
    <ChoiceRow
      label="Units"
      options={[
        { value: 'us', label: 'US' },
        { value: 'metric', label: 'Metric' },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

function BasisLine({ basis }: { basis: string }) {
  const { theme } = useAppTheme();
  if (!basis) return null;
  return <Text style={{ color: theme.color.textMuted, fontSize: theme.font.caption, lineHeight: theme.line.caption, marginBottom: 8 }}>{basis}</Text>;
}

function Outcome({
  kind,
  title,
  lines,
  formula,
  units,
  basis,
  note,
  warning,
}: {
  kind: CalculatorKind;
  title: string;
  lines: Lines;
  formula: string;
  units: string;
  basis: string;
  note: string;
  warning: string | null;
}) {
  const save = useSaveShare();
  if (lines.length === 0 && !warning) return null;
  const shareUnits = [units, basis, note].filter(Boolean).join('\n');
  return (
    <>
      {warning ? <Banner title="Check" tone="warning" body={warning} /> : null}
      {save.note ? <Banner title="Saved" body={save.note} /> : null}
      {lines.length > 0 ? (
        <>
          <BasisLine basis={basis} />
          <ResultBlock lines={lines} extra={[note, footer(formula, units)].filter(Boolean).join('\n\n')} />
          <Button label="Share result" variant="secondary" onPress={() => void save.share(title, lines, formula, shareUnits)} />
        </>
      ) : null}
    </>
  );
}

export function AffinityCalculatorScreen() {
  const [system, setSystem] = useState<UnitSystem>('us');
  const [flow, setFlow] = useState('100');
  const [head, setHead] = useState('80');
  const [power, setPower] = useState('10');
  const [speed1, setSpeed1] = useState('1800');
  const [speed2, setSpeed2] = useState('3600');
  const [diameter1, setDiameter1] = useState('10');
  const [diameter2, setDiameter2] = useState('10');
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeState | null>(null);
  const flowLabel = system === 'metric' ? 'Present flow (m³/h)' : 'Present flow (gpm)';
  const headLabel = system === 'metric' ? 'Present head (m)' : 'Present head (ft)';
  const powerLabel = system === 'metric' ? 'Present power (kW)' : 'Present power (hp)';
  const diameterLabel = system === 'metric' ? 'mm' : 'in';

  function switchUnits(next: UnitSystem) {
    if (next === system) return;
    const toMetric = next === 'metric';
    const flowFactor = toMetric ? (n: number) => n * GPM_TO_M3H : (n: number) => n / GPM_TO_M3H;
    const headFactor = toMetric ? (n: number) => n * FT_TO_M : (n: number) => n / FT_TO_M;
    const powerFactor = toMetric ? (n: number) => n * HP_TO_KW : (n: number) => n / HP_TO_KW;
    const sizeFactor = toMetric ? (n: number) => n * 25.4 : (n: number) => n / 25.4;
    setFlow(moved(flow, flowFactor));
    setHead(moved(head, headFactor));
    setPower(moved(power, powerFactor));
    setDiameter1(moved(diameter1, sizeFactor));
    setDiameter2(moved(diameter2, sizeFactor));
    setSystem(next);
    setOutcome(null);
  }

  function run() {
    setError(null);
    try {
      const result = pumpAffinity({
        flow: parseNum(flow, 'Flow'),
        head: parseNum(head, 'Head'),
        power: parseNum(power, 'Power'),
        speed1: parseNum(speed1, 'Present speed'),
        speed2: parseNum(speed2, 'New speed'),
        diameter1: parseNum(diameter1, 'Present diameter'),
        diameter2: parseNum(diameter2, 'New diameter'),
        system,
      });
      setOutcome({
        lines: [
          { label: 'New flow', value: show(result.flow) },
          { label: 'New head', value: show(result.head) },
          { label: 'New power', value: show(result.power) },
          { label: 'Speed ratio', value: show(result.speedRatio) },
          { label: 'Diameter ratio', value: show(result.diameterRatio) },
        ],
        formula: result.formula,
        units: result.units,
        basis: result.basis,
        note: '',
        warning: result.warnings[0] ?? null,
      });
    } catch (reason) {
      setOutcome(null);
      setError(reason instanceof Error ? reason.message : 'Check the inputs.');
    }
  }

  return (
    <Screen title="Pump affinity laws" subtitle="Flow, head, and power when you change speed or impeller diameter. Same fluid. Efficiency is assumed to hold.">
      <CalcBack />
      <UnitToggle value={system} onChange={switchUnits} />
      <Field label={flowLabel} value={flow} onChangeText={setFlow} keyboardType="decimal-pad" />
      <Field label={headLabel} value={head} onChangeText={setHead} keyboardType="decimal-pad" />
      <Field label={powerLabel} value={power} onChangeText={setPower} keyboardType="decimal-pad" />
      <Field label="Present speed (rpm)" value={speed1} onChangeText={setSpeed1} keyboardType="decimal-pad" />
      <Field label="New speed (rpm)" value={speed2} onChangeText={setSpeed2} keyboardType="decimal-pad" />
      <Field label={`Present diameter (${diameterLabel})`} value={diameter1} onChangeText={setDiameter1} keyboardType="decimal-pad" />
      <Field label={`New diameter (${diameterLabel})`} value={diameter2} onChangeText={setDiameter2} keyboardType="decimal-pad" />
      <Button label="Calculate affinity" onPress={run} />
      {error ? <Banner title="Input" tone="warning" body={error} /> : null}
      {outcome ? <Outcome kind="affinity" title="Pump affinity laws" {...outcome} /> : null}
    </Screen>
  );
}

export function NpshCalculatorScreen() {
  const [system, setSystem] = useState<UnitSystem>('us');
  const [available, setAvailable] = useState('24');
  const [required, setRequired] = useState('16');
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeState | null>(null);
  const unit = system === 'metric' ? 'm' : 'ft';

  function switchUnits(next: UnitSystem) {
    if (next === system) return;
    const convert = next === 'metric' ? (n: number) => n * FT_TO_M : (n: number) => n / FT_TO_M;
    setAvailable(moved(available, convert));
    setRequired(moved(required, convert));
    setSystem(next);
    setOutcome(null);
  }

  function run() {
    setError(null);
    try {
      const result = npshMargin(parseNum(available, 'NPSHa'), parseNum(required, 'NPSHr'), system);
      setOutcome({
        lines: [
          { label: 'Margin', value: `${show(result.margin)} ${unit}` },
          { label: 'Ratio', value: show(result.ratio) },
        ],
        formula: result.formula,
        units: result.units,
        basis: result.basis,
        note: result.note,
        warning: result.warnings[0] ?? null,
      });
    } catch (reason) {
      setOutcome(null);
      setError(reason instanceof Error ? reason.message : 'Check the inputs.');
    }
  }

  return (
    <Screen title="NPSH margin" subtitle="Compare available NPSH with the vendor figure. Both numbers have to be head of the same liquid.">
      <CalcBack />
      <UnitToggle value={system} onChange={switchUnits} />
      <Field label={`NPSHa (${unit})`} value={available} onChangeText={setAvailable} keyboardType="numbers-and-punctuation" />
      <Field label={`NPSHr or NPSH3 (${unit})`} value={required} onChangeText={setRequired} keyboardType="decimal-pad" />
      <Button label="Check margin" onPress={run} />
      {error ? <Banner title="Input" tone="warning" body={error} /> : null}
      {outcome ? <Outcome kind="npsh" title="NPSH margin" {...outcome} /> : null}
    </Screen>
  );
}

export function PolytropicCalculatorScreen() {
  const [system, setSystem] = useState<UnitSystem>('us');
  const [p1, setP1] = useState('14.7');
  const [p2, setP2] = useState('29.4');
  const [t1, setT1] = useState('80');
  const [t2, setT2] = useState('200');
  const [k, setK] = useState('1.4');
  const [mw, setMw] = useState('28.96');
  const [z, setZ] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeState | null>(null);
  const pressure = system === 'metric' ? 'bar absolute' : 'psia';
  const temperature = system === 'metric' ? '°C' : '°F';

  function switchUnits(next: UnitSystem) {
    if (next === system) return;
    const toMetric = next === 'metric';
    const pressureFactor = toMetric ? (n: number) => (n * PSI_TO_KPA) / 100 : (n: number) => (n * 100) / PSI_TO_KPA;
    const temperatureFactor = toMetric ? (n: number) => ((n - 32) * 5) / 9 : (n: number) => (n * 9) / 5 + 32;
    setP1(moved(p1, pressureFactor));
    setP2(moved(p2, pressureFactor));
    setT1(moved(t1, temperatureFactor));
    setT2(moved(t2, temperatureFactor));
    setSystem(next);
    setOutcome(null);
  }

  function run() {
    setError(null);
    try {
      const result = polytropicHead({
        system,
        suctionPressure: parseNum(p1, 'Suction pressure'),
        dischargePressure: parseNum(p2, 'Discharge pressure'),
        suctionTemperature: parseNum(t1, 'Suction temperature'),
        dischargeTemperature: parseNum(t2, 'Discharge temperature'),
        specificHeatRatio: parseNum(k, 'Specific-heat ratio'),
        molecularWeight: parseNum(mw, 'Molecular weight'),
        compressibility: parseNum(z, 'Compressibility'),
      });
      setOutcome({
        lines: [
          { label: 'Polytropic head', value: system === 'metric' ? `${show(result.head, 2)} kJ/kg` : `${show(result.head, 1)} ft` },
          { label: 'Polytropic efficiency', value: `${show(result.efficiency * 100, 2)}%` },
          { label: 'Pressure ratio', value: show(result.pressureRatio) },
        ],
        formula: result.formula,
        units: result.units,
        basis: result.basis,
        note: result.note,
        warning: result.warnings[0] ?? null,
      });
    } catch (reason) {
      setOutcome(null);
      setError(reason instanceof Error ? reason.message : 'Check the inputs.');
    }
  }

  return (
    <Screen title="Polytropic head" subtitle="Suction and discharge have to be absolute. The exponent comes from the two temperatures.">
      <CalcBack />
      <UnitToggle value={system} onChange={switchUnits} />
      <Field label={`Suction pressure (${pressure})`} value={p1} onChangeText={setP1} keyboardType="decimal-pad" />
      <Field label={`Discharge pressure (${pressure})`} value={p2} onChangeText={setP2} keyboardType="decimal-pad" />
      <Field label={`Suction temperature (${temperature})`} value={t1} onChangeText={setT1} keyboardType="numbers-and-punctuation" />
      <Field label={`Discharge temperature (${temperature})`} value={t2} onChangeText={setT2} keyboardType="numbers-and-punctuation" />
      <Field label="Specific-heat ratio k" value={k} onChangeText={setK} keyboardType="decimal-pad" />
      <Field label="Molecular weight" value={mw} onChangeText={setMw} keyboardType="decimal-pad" />
      <Field label="Average compressibility Z" value={z} onChangeText={setZ} keyboardType="decimal-pad" />
      <Button label="Calculate head" onPress={run} />
      {error ? <Banner title="Input" tone="warning" body={error} /> : null}
      {outcome ? <Outcome kind="polytropic" title="Polytropic head" {...outcome} /> : null}
    </Screen>
  );
}

export function FrequencyCalculatorScreen() {
  const [system, setSystem] = useState<UnitSystem>('us');
  const [rpm, setRpm] = useState('1800');
  const [teeth, setTeeth] = useState('20');
  const [count, setCount] = useState('8');
  const [ball, setBall] = useState('0.5');
  const [pitch, setPitch] = useState('2');
  const [angle, setAngle] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeState | null>(null);
  const size = system === 'metric' ? 'mm' : 'in';

  function switchUnits(next: UnitSystem) {
    if (next === system) return;
    const convert = next === 'metric' ? (n: number) => n * 25.4 : (n: number) => n / 25.4;
    setBall(moved(ball, convert));
    setPitch(moved(pitch, convert));
    setSystem(next);
    setOutcome(null);
  }

  function run() {
    setError(null);
    try {
      const result = machineFrequencies({
        rpm: parseNum(rpm, 'Speed'),
        teeth: parseNum(teeth, 'Gear teeth'),
        rollingElements: optionalNum(count, 'Rolling elements'),
        ballDiameter: optionalNum(ball, 'Ball diameter'),
        pitchDiameter: optionalNum(pitch, 'Pitch diameter'),
        contactAngleDeg: optionalNum(angle, 'Contact angle'),
      });
      const lines: Lines = [
        { label: 'Shaft', value: `${show(result.shaftHz)} Hz` },
        { label: 'Gear mesh', value: `${show(result.gearMeshHz)} Hz` },
      ];
      if (result.bearing) {
        lines.push(
          { label: 'BPFO', value: `${show(result.bearing.bpfo)} Hz` },
          { label: 'BPFI', value: `${show(result.bearing.bpfi)} Hz` },
          { label: 'BSF', value: `${show(result.bearing.bsf)} Hz` },
          { label: 'FTF', value: `${show(result.bearing.ftf)} Hz` },
        );
      }
      setOutcome({ lines, formula: result.formula, units: result.units, basis: result.basis, note: result.note, warning: null });
    } catch (reason) {
      setOutcome(null);
      setError(reason instanceof Error ? reason.message : 'Check the inputs.');
    }
  }

  return (
    <Screen title="Gear mesh and bearings" subtitle="Mesh frequency from the tooth count. Bearing tones from the geometry, with the inner race turning.">
      <CalcBack />
      <UnitToggle value={system} onChange={switchUnits} />
      <Field label="Shaft speed (rpm)" value={rpm} onChangeText={setRpm} keyboardType="decimal-pad" />
      <Field label="Gear teeth" value={teeth} onChangeText={setTeeth} keyboardType="number-pad" />
      <Field label="Rolling elements" value={count} onChangeText={setCount} keyboardType="number-pad" />
      <Field label={`Ball or roller diameter (${size})`} value={ball} onChangeText={setBall} keyboardType="decimal-pad" />
      <Field label={`Pitch diameter (${size})`} value={pitch} onChangeText={setPitch} keyboardType="decimal-pad" />
      <Field label="Contact angle (degrees)" value={angle} onChangeText={setAngle} keyboardType="decimal-pad" />
      <Button label="Calculate frequencies" onPress={run} />
      {error ? <Banner title="Input" tone="warning" body={error} /> : null}
      {outcome ? <Outcome kind="frequencies" title="Gear mesh and bearings" {...outcome} /> : null}
    </Screen>
  );
}

export function CouplingCalculatorScreen() {
  const [system, setSystem] = useState<UnitSystem>('us');
  const [rpm, setRpm] = useState('3600');
  const [offset, setOffset] = useState('0.5');
  const [angularity, setAngularity] = useState('0.1');
  const [face, setFace] = useState('');
  const [faceDiameter, setFaceDiameter] = useState('');
  const [makerOffset, setMakerOffset] = useState('');
  const [makerAngular, setMakerAngular] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeState | null>(null);
  const offsetUnit = system === 'metric' ? 'mm' : 'mils';
  const angleUnit = system === 'metric' ? 'mm/100 mm' : 'mils/in';

  function switchUnits(next: UnitSystem) {
    if (next === system) return;
    const offsetFactor = next === 'metric' ? (n: number) => n * 0.0254 : (n: number) => n / 0.0254;
    const angleFactor = next === 'metric' ? (n: number) => n * 0.1 : (n: number) => n / 0.1;
    const sizeFactor = next === 'metric' ? (n: number) => n * 25.4 : (n: number) => n / 25.4;
    setOffset(moved(offset, offsetFactor));
    setAngularity(moved(angularity, angleFactor));
    setFace(moved(face, offsetFactor));
    setFaceDiameter(moved(faceDiameter, sizeFactor));
    setMakerOffset(moved(makerOffset, offsetFactor));
    setMakerAngular(moved(makerAngular, angleFactor));
    setSystem(next);
    setOutcome(null);
  }

  function run() {
    setError(null);
    try {
      const faceValue = optionalNum(face, 'Face reading');
      const faceSize = optionalNum(faceDiameter, 'Face diameter');
      const angle = faceValue != null && faceSize != null ? angularityFromFace(faceValue, faceSize) : parseNum(angularity, 'Angularity');
      const result = couplingAlignment({
        system,
        rpm: parseNum(rpm, 'Speed'),
        offset: parseNum(offset, 'Offset'),
        angularity: angle,
        makerOffset: optionalNum(makerOffset, 'Offset limit'),
        makerAngularity: optionalNum(makerAngular, 'Angularity limit'),
      });
      setOutcome({
        lines: [
          { label: 'Offset', value: `${show(result.offset)} ${offsetUnit}` },
          { label: 'Offset limit', value: `${show(result.offsetLimit)} ${offsetUnit}` },
          { label: 'Angularity', value: `${show(result.angularity)} ${angleUnit}` },
          { label: 'Angularity limit', value: `${show(result.angularLimit)} ${angleUnit}` },
          { label: 'Check', value: result.within ? 'Within the limit in use' : 'Over the limit in use' },
          { label: 'Limit source', value: result.limitSource === 'maker' ? 'Limits you entered' : result.limitSource === 'mixed' ? 'Maker limit on one axis, speed screen on the other' : 'Speed screen' },
        ],
        formula: result.formula,
        units: result.units,
        basis: result.basis,
        note: result.note,
        warning: result.warnings[0] ?? null,
      });
    } catch (reason) {
      setOutcome(null);
      setError(reason instanceof Error ? reason.message : 'Check the inputs.');
    }
  }

  return (
    <Screen title="Coupling alignment" subtitle="Offset and angularity against speed. Leave the maker limits blank to use the field screen.">
      <CalcBack />
      <UnitToggle value={system} onChange={switchUnits} />
      <Field label="Speed (rpm)" value={rpm} onChangeText={setRpm} keyboardType="decimal-pad" />
      <Field label={`Parallel offset (${offsetUnit})`} value={offset} onChangeText={setOffset} keyboardType="decimal-pad" />
      <Field label={`Angularity (${angleUnit})`} value={angularity} onChangeText={setAngularity} keyboardType="decimal-pad" />
      <Field label={`Face reading, total (${offsetUnit})`} value={face} onChangeText={setFace} keyboardType="decimal-pad" hint="Optional. With a face diameter, this replaces the angularity box." />
      <Field label={`Face diameter (${system === 'metric' ? 'mm' : 'in'})`} value={faceDiameter} onChangeText={setFaceDiameter} keyboardType="decimal-pad" />
      <Field label={`Maker offset limit (${offsetUnit})`} value={makerOffset} onChangeText={setMakerOffset} keyboardType="decimal-pad" />
      <Field label={`Maker angularity limit (${angleUnit})`} value={makerAngular} onChangeText={setMakerAngular} keyboardType="decimal-pad" />
      <Button label="Check alignment" onPress={run} />
      {error ? <Banner title="Input" tone="warning" body={error} /> : null}
      {outcome ? <Outcome kind="coupling" title="Coupling alignment" {...outcome} /> : null}
    </Screen>
  );
}

export function BeltCalculatorScreen() {
  const [system, setSystem] = useState<UnitSystem>('us');
  const [kind, setKind] = useState<'belt' | 'chain'>('belt');
  const [driver, setDriver] = useState('6');
  const [driven, setDriven] = useState('12');
  const [rpm, setRpm] = useState('1800');
  const [pitch, setPitch] = useState('');
  const [power, setPower] = useState('10');
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeState | null>(null);
  const size = system === 'metric' ? 'mm' : 'in';
  const powerUnit = system === 'metric' ? 'kW' : 'hp';

  function switchUnits(next: UnitSystem) {
    if (next === system) return;
    const sizeFactor = next === 'metric' ? (n: number) => n * 25.4 : (n: number) => n / 25.4;
    const powerFactor = next === 'metric' ? (n: number) => n * HP_TO_KW : (n: number) => n / HP_TO_KW;
    setDriver(moved(driver, sizeFactor));
    setDriven(moved(driven, sizeFactor));
    setPitch(moved(pitch, sizeFactor));
    setPower(moved(power, powerFactor));
    setSystem(next);
    setOutcome(null);
  }

  function run() {
    setError(null);
    try {
      const result = beltDrive({
        system,
        kind,
        driverSize: parseNum(driver, kind === 'chain' ? 'Driver teeth or diameter' : 'Driver diameter'),
        drivenSize: parseNum(driven, kind === 'chain' ? 'Driven teeth or diameter' : 'Driven diameter'),
        driverRpm: parseNum(rpm, 'Driver speed'),
        pitchDiameter: optionalNum(pitch, 'Pitch diameter'),
        power: optionalNum(power, 'Power'),
      });
      const speedUnit = system === 'metric' ? 'm/s' : 'ft/min';
      const tensionUnit = system === 'metric' ? 'N' : 'lbf';
      const lines: Lines = [
        { label: 'Speed ratio', value: show(result.ratio) },
        { label: 'Driven speed', value: `${show(result.drivenRpm, 1)} rpm` },
      ];
      if (result.linearSpeed != null) lines.push({ label: 'Linear speed', value: `${show(result.linearSpeed)} ${speedUnit}` });
      if (result.effectiveTension != null) lines.push({ label: 'Effective tension', value: `${show(result.effectiveTension)} ${tensionUnit}` });
      setOutcome({
        lines,
        formula: result.formula,
        units: result.units,
        basis: '',
        note: '',
        warning: result.warnings[0] ?? null,
      });
    } catch (reason) {
      setOutcome(null);
      setError(reason instanceof Error ? reason.message : 'Check the inputs.');
    }
  }

  return (
    <Screen title="Belt and chain" subtitle="Ratio from the two sizes. Tension is the effective pull from power and speed, not the installation tension on the tag.">
      <CalcBack />
      <UnitToggle value={system} onChange={switchUnits} />
      <ChoiceRow
        label="Drive"
        options={[
          { value: 'belt', label: 'Belt' },
          { value: 'chain', label: 'Chain' },
        ]}
        value={kind}
        onChange={setKind}
      />
      <Field label={kind === 'chain' ? 'Driver teeth or diameter' : `Driver diameter (${size})`} value={driver} onChangeText={setDriver} keyboardType="decimal-pad" />
      <Field label={kind === 'chain' ? 'Driven teeth or diameter' : `Driven diameter (${size})`} value={driven} onChangeText={setDriven} keyboardType="decimal-pad" />
      <Field label="Driver speed (rpm)" value={rpm} onChangeText={setRpm} keyboardType="decimal-pad" />
      <Field label={`Pitch diameter (${size})`} value={pitch} onChangeText={setPitch} keyboardType="decimal-pad" hint="For a chain, enter this to get speed and tension. A belt uses the driver diameter when this is blank." />
      <Field label={`Power (${powerUnit})`} value={power} onChangeText={setPower} keyboardType="decimal-pad" />
      <Button label="Calculate drive" onPress={run} />
      {error ? <Banner title="Input" tone="warning" body={error} /> : null}
      {outcome ? <Outcome kind="belt" title="Belt and chain" {...outcome} /> : null}
    </Screen>
  );
}

export function FieldUnitsCalculatorScreen() {
  const [system, setSystem] = useState<UnitSystem>('us');
  const [kind, setKind] = useState<FieldUnitKind>('head');
  const [from, setFrom] = useState('psi');
  const [to, setTo] = useState('ft');
  const [value, setValue] = useState('10');
  const [sg, setSg] = useState('1');
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeState | null>(null);
  const choices = FIELD_UNIT_CHOICES[kind];

  function applyKind(nextKind: FieldUnitKind, nextSystem: UnitSystem) {
    const pair = FIELD_UNIT_PAIRS[nextKind][nextSystem];
    setKind(nextKind);
    setFrom(pair[0]);
    setTo(pair[1]);
    setOutcome(null);
  }

  function run() {
    setError(null);
    try {
      const fromPressure = ['psi', 'kpa', 'bar'].includes(from);
      const toPressure = ['psi', 'kpa', 'bar'].includes(to);
      const crosses = kind === 'head' && fromPressure !== toPressure;
      const result = convertFieldUnits({
        kind,
        value: parseNum(value, 'Value'),
        from,
        to,
        sg: crosses ? parseNum(sg, 'Specific gravity') : optionalNum(sg, 'Specific gravity'),
      });
      const label = choices.find((item) => item.id === to)?.label ?? to;
      setOutcome({
        lines: [{ label: 'Result', value: `${show(result.value, 4)} ${label}` }],
        formula: result.formula,
        units: result.units,
        basis: '',
        note: '',
        warning: null,
      });
    } catch (reason) {
      setOutcome(null);
      setError(reason instanceof Error ? reason.message : 'Check the inputs.');
    }
  }

  return (
    <Screen title="Field units" subtitle="Flow, pressure, head of fluid, and power. Head uses the specific gravity you enter.">
      <CalcBack />
      <UnitToggle value={system} onChange={(next) => { setSystem(next); applyKind(kind, next); }} />
      <ChoiceRow
        label="Quantity"
        options={[
          { value: 'flow', label: 'Flow' },
          { value: 'pressure', label: 'Pressure' },
          { value: 'head', label: 'Head' },
          { value: 'power', label: 'Power' },
        ]}
        value={kind}
        onChange={(next) => applyKind(next, system)}
      />
      <ChoiceRow label="From" options={choices.map((item) => ({ value: item.id, label: item.label }))} value={from} onChange={setFrom} />
      <ChoiceRow label="To" options={choices.map((item) => ({ value: item.id, label: item.label }))} value={to} onChange={setTo} />
      <Field label="Value" value={value} onChangeText={setValue} keyboardType="numbers-and-punctuation" />
      {kind === 'head' ? <Field label="Specific gravity" value={sg} onChangeText={setSg} keyboardType="decimal-pad" hint="Water is 1. Needed when you cross pressure and head." /> : null}
      <Button label="Convert" onPress={run} />
      {error ? <Banner title="Input" tone="warning" body={error} /> : null}
      {outcome ? <Outcome kind="field-units" title="Field units" {...outcome} /> : null}
    </Screen>
  );
}

export function BearingLifeCalculatorScreen() {
  const [system, setSystem] = useState<UnitSystem>('us');
  const [kind, setKind] = useState<'ball' | 'roller'>('ball');
  const [capacity, setCapacity] = useState('10000');
  const [load, setLoad] = useState('2000');
  const [rpm, setRpm] = useState('1800');
  const [required, setRequired] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<OutcomeState | null>(null);
  const force = system === 'metric' ? 'N' : 'lbf';

  function switchUnits(next: UnitSystem) {
    if (next === system) return;
    const convert = next === 'metric' ? (n: number) => n * LBF_TO_N : (n: number) => n / LBF_TO_N;
    setCapacity(moved(capacity, convert));
    setLoad(moved(load, convert));
    setSystem(next);
    setOutcome(null);
  }

  function run() {
    setError(null);
    try {
      const result = bearingL10({
        system,
        kind,
        capacity: parseNum(capacity, 'Dynamic capacity'),
        load: parseNum(load, 'Equivalent load'),
        rpm: parseNum(rpm, 'Speed'),
        requiredHours: optionalNum(required, 'Life to compare'),
      });
      setOutcome({
        lines: [
          { label: 'L10 life', value: `${show(result.hours, 1)} h` },
          { label: 'Exponent', value: kind === 'ball' ? '3' : '10/3' },
        ],
        formula: result.formula,
        units: result.units,
        basis: result.basis,
        note: result.note,
        warning: result.warnings[0] ?? null,
      });
    } catch (reason) {
      setOutcome(null);
      setError(reason instanceof Error ? reason.message : 'Check the inputs.');
    }
  }

  return (
    <Screen title="Bearing L10" subtitle="Basic rating life from dynamic capacity and equivalent load. Capacity and load have to use the same force unit.">
      <CalcBack />
      <UnitToggle value={system} onChange={switchUnits} />
      <ChoiceRow
        label="Bearing"
        options={[
          { value: 'ball', label: 'Ball' },
          { value: 'roller', label: 'Roller' },
        ]}
        value={kind}
        onChange={setKind}
      />
      <Field label={`Dynamic capacity C (${force})`} value={capacity} onChangeText={setCapacity} keyboardType="decimal-pad" />
      <Field label={`Equivalent load P (${force})`} value={load} onChangeText={setLoad} keyboardType="decimal-pad" />
      <Field label="Speed (rpm)" value={rpm} onChangeText={setRpm} keyboardType="decimal-pad" />
      <Field label="Life to compare (hours)" value={required} onChangeText={setRequired} keyboardType="decimal-pad" hint="Optional. Leave blank to skip the comparison." />
      <Button label="Calculate L10" onPress={run} />
      {error ? <Banner title="Input" tone="warning" body={error} /> : null}
      {outcome ? <Outcome kind="bearing-life" title="Bearing L10" {...outcome} /> : null}
    </Screen>
  );
}

type OutcomeState = {
  lines: Lines;
  formula: string;
  units: string;
  basis: string;
  note: string;
  warning: string | null;
};
