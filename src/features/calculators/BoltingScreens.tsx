import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { Banner, Button, Card, ChoiceRow, Field, Screen } from '@/src/components/ui';
import {
  ANCHOR_ABOUT,
  ANCHOR_DIAMETERS,
  ANCHOR_GRADES,
  ANCHOR_PRACTICE,
  coarseFastener,
  fastenerLoad,
  flangeThreadFastener,
  HOLD_ABOUT,
  clampedText,
  clampK,
  clampPercent,
  K_DEFAULT,
  K_DEFAULT_PRESET,
  K_MAX,
  K_MIN,
  K_PRESET_NOTE,
  K_PRESET_STORAGE_KEY,
  K_PRESETS,
  type KPresetId,
  HOLD_GRADES,
  HOLD_INCH_DIAMETERS,
  HOLD_METRIC_SIZES,
  HOLD_PRACTICE,
  metricFastener,
  PASS_EMPTY_HINT,
  passSchedule,
  PERCENT_DEFAULT,
  PERCENT_MAX,
  PERCENT_MIN,
  resolveKPreset,
  round,
  socketFor,
  TORQUE_FORMULA,
  torqueFromKdf,
  torqueInputs,
  washerNote,
  wrenchPair,
  type FastenerHead,
  type FastenerLoad,
} from '@/src/domain/calculators/boltHardware';
import {
  API_686_CITATION,
  FLANGE_ABOUT,
  FLANGE_CLASSES,
  FLANGE_PRACTICE,
  GASKET_TYPES,
  flangeSizesFor,
  flangeStud,
  type FlangeClass,
  type GasketType,
} from '@/src/domain/calculators/flangeChart';
import { starArtSvg } from '@/src/domain/calculators/starArt';
import { useAppTheme } from '@/src/theme/ThemeContext';

function Back() {
  const router = useRouter();
  const { theme } = useAppTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center', marginBottom: 4 }}>
      <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.medium, fontSize: 17 }}>Back</Text>
    </Pressable>
  );
}

function About({ text }: { text: string }) {
  const { theme } = useAppTheme();
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable accessibilityRole="button" accessibilityLabel="About this data" onPress={() => setOpen((value) => !value)} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.medium }}>About this data {open ? '▾' : 'ⓘ'}</Text>
      </Pressable>
      {open ? <Text style={{ color: theme.color.textMuted, lineHeight: 20, marginBottom: 12 }}>{text}</Text> : null}
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  return (
    <Text style={{ color: theme.color.text, lineHeight: 22, marginBottom: 4 }}>
      <Text style={{ fontFamily: theme.fontFamily.medium }}>{label}: </Text>
      {value}
    </Text>
  );
}

function TorqueCard({
  diameterIn,
  load,
  specTorque,
  onSpec,
  percent,
  onPercent,
  kFactor,
  onK,
  metricNote,
}: {
  diameterIn: number | null;
  load: FastenerLoad | null;
  specTorque: string;
  onSpec: (value: string) => void;
  percent: string;
  onPercent: (value: string) => void;
  kFactor: string;
  onK: (value: string) => void;
  metricNote?: string;
}) {
  const { theme } = useAppTheme();
  const [kPreset, setKPreset] = useState<KPresetId>(K_DEFAULT_PRESET);
  useEffect(() => {
    let live = true;
    AsyncStorage.getItem(K_PRESET_STORAGE_KEY).then((saved) => {
      if (!live || saved == null) return;
      // Unknown stored ids fall back to Dry steel.
      const preset = resolveKPreset(saved);
      setKPreset(preset.id);
      if (preset.k != null) onK(String(preset.k));
    }).catch(() => {});
    return () => { live = false; };
    // Load the remembered choice once per card.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function chooseK(id: KPresetId) {
    setKPreset(id);
    AsyncStorage.setItem(K_PRESET_STORAGE_KEY, id).catch(() => {});
    const preset = K_PRESETS.find((item) => item.id === id);
    if (preset?.k != null) onK(String(preset.k));
  }
  const inputs = torqueInputs(percent, kFactor);
  const calculated = diameterIn != null && load && load.load > 0
    ? torqueFromKdf({ diameterIn, proofOrYieldLb: load.load, ...inputs })
    : null;
  const footLb = specTorque.trim() ? Number(specTorque) : calculated ? calculated.footLb : null;
  const passes = passSchedule(footLb != null && Number.isFinite(footLb) ? footLb : null);
  return (
    <Card>
      <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, marginBottom: 6 }}>Torque</Text>
      <Text style={{ color: theme.color.textMuted, lineHeight: 20, marginBottom: 8 }}>
        Torque comes from your spec, or from {TORQUE_FORMULA}. D is nominal inches. F is the target load in pounds. The percent starts at {PERCENT_DEFAULT}% and K starts at Dry steel {K_DEFAULT.toFixed(2)}, so a starting torque shows right away. Change them to match your spec. This chart does not remember a torque.
      </Text>
      <Field label="Torque from your spec (ft-lb)" value={specTorque} onChangeText={onSpec} keyboardType="decimal-pad" hint="Leave blank to use the formula." />
      <Field label="Target, percent of proof or yield" value={percent} onChangeText={onPercent} onBlur={() => onPercent(clampedText(clampPercent(percent)))} keyboardType="decimal-pad" hint={`${PERCENT_MIN} to ${PERCENT_MAX}%. Starts at ${PERCENT_DEFAULT}%.`} />
      <ChoiceRow label="K (nut factor)" value={kPreset} onChange={chooseK} options={K_PRESETS.map((item) => ({ value: item.id, label: item.k != null ? `${item.label} ${item.k.toFixed(2)}` : item.label }))} />
      <Text style={{ color: theme.color.textMuted, lineHeight: 20, marginBottom: 8 }}>{K_PRESET_NOTE}</Text>
      {kPreset === 'custom' ? <Field label="K factor" value={kFactor} onChangeText={onK} onBlur={() => onK(clampedText(clampK(kFactor)))} keyboardType="decimal-pad" hint={`${K_MIN.toFixed(2)} to ${K_MAX.toFixed(2)}. Use your spec K.`} /> : null}
      <Text style={{ color: theme.color.text, lineHeight: 22 }}>
        {TORQUE_FORMULA}
        {calculated ? ` = ${round(calculated.inchLb, 0)} in-lb (${round(calculated.footLb, 1)} ft-lb) at ${clampedText(calculated.targetPercent)}%, K ${calculated.k.toFixed(2)}` : ' — no formula value for this size and grade. Enter your spec torque.'}
      </Text>
      {metricNote ? <Text style={{ color: theme.color.textMuted, lineHeight: 20, marginTop: 6 }}>{metricNote}</Text> : null}
      <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, marginTop: 8 }}>Passes</Text>
      {footLb == null ? <Text style={{ color: theme.color.textMuted, lineHeight: 20 }}>{PASS_EMPTY_HINT}</Text> : null}
      {passes.map((step) => (
        <Text key={step.name} style={{ color: theme.color.text, lineHeight: 22 }}>
          {step.name}{step.torque ? `: ${step.torque}` : ''}
        </Text>
      ))}
    </Card>
  );
}

function loadFigure(load: FastenerLoad): string {
  if (load.load <= 0) return 'Not listed';
  return load.loadLabel.replace(/ (proof|yield)$/, '');
}

export function resolvedTorque(specTorque: string, calculatedFootLb: number | null): string {
  if (specTorque.trim()) return specTorque.trim();
  if (calculatedFootLb == null) return '';
  return String(round(calculatedFootLb, 1));
}

export function FlangeChartScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [nps, setNps] = useState('4');
  const [classRating, setClassRating] = useState<FlangeClass>(150);
  const [gasket, setGasket] = useState<GasketType>('spiral-wound');
  const [grade, setGrade] = useState('B7');
  const [specTorque, setSpecTorque] = useState('');
  const [percent, setPercent] = useState(String(PERCENT_DEFAULT));
  const [kFactor, setKFactor] = useState(String(K_DEFAULT));
  const sizes = flangeSizesFor(classRating);
  const activeNps = sizes.includes(nps) ? nps : (sizes[0] ?? '4');
  const row = flangeStud(activeNps, classRating, gasket);
  const fastener = row ? flangeThreadFastener(row.diameter) : null;
  const load = fastener ? fastenerLoad(grade, fastener, null) : null;
  const calculated = fastener && load
    ? torqueFromKdf({
      diameterIn: fastener.decimalIn,
      proofOrYieldLb: load.load,
      ...torqueInputs(percent, kFactor),
    })
    : null;

  return (
    <Screen title="Flange bolt-up" subtitle="ASME B16.5 studs, NPS 1/2 through 24. Torque starts at 75% of proof/yield with Dry steel K 0.20 until you enter your spec.">
      <Back />
      <ChoiceRow label="Class" value={String(classRating)} onChange={(value) => setClassRating(Number(value) as FlangeClass)} options={FLANGE_CLASSES.map((item) => ({ value: String(item), label: String(item) }))} />
      <ChoiceRow label="NPS" value={activeNps} onChange={setNps} options={sizes.map((item) => ({ value: item, label: item }))} />
      <ChoiceRow label="Gasket" value={gasket} onChange={setGasket} options={GASKET_TYPES.map((item) => ({ value: item.id, label: item.label }))} />
      <ChoiceRow label="Stud grade for the formula" value={grade} onChange={setGrade} options={[{ value: 'B7', label: 'B7' }, { value: 'SAE 5', label: 'SAE 5' }, { value: 'SAE 8', label: 'SAE 8' }]} />
      {row ? (
        <Card>
          <Line label="Studs" value={`${row.count} × ${row.diameter}`} />
          <Line label="Thread" value={row.thread} />
          <Line label={`${row.lengthFacing} stud length`} value={row.studLength ? `${row.studLength} in` : 'Not listed'} />
          <Line label="2H heavy hex, across flats" value={row.wrenchUncertain ? `${row.wrench} (confirm)` : `${row.wrench} in`} />
          {load ? <Line label={load.loadKind === 'yield' ? 'Yield load' : 'Proof load'} value={loadFigure(load)} /> : null}
          {row.lengthNote ? <Banner title="Length not listed" body={row.lengthNote} /> : null}
          {row.wrenchUncertain ? <Banner title="Wrench size needs a check" body="This across-flats figure is flagged. Confirm it on the nut before you pull a wrench." /> : null}
          <Text style={{ color: theme.color.textMuted, marginTop: 8, lineHeight: 20 }}>{FLANGE_PRACTICE}</Text>
          <Text style={{ color: theme.color.text, marginTop: 8 }}>{API_686_CITATION}</Text>
        </Card>
      ) : (
        <Banner title="Not on this chart" body="That NPS and class pair is not listed. Class 2500 stops at NPS 12, and NPS 3-1/2 is only listed for classes 150 through 600." />
      )}
      {row && row.count <= 24 ? (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <SvgXml xml={starArtSvg(row.count, '90mm', row.count > 16 ? 16 : 22)} width={340} height={340} />
          <Text style={{ color: theme.color.textMuted, textAlign: 'center' }}>Star order. Number the studs, then follow the line.</Text>
        </View>
      ) : null}
      <TorqueCard
        diameterIn={fastener?.decimalIn ?? null}
        load={load}
        specTorque={specTorque}
        onSpec={setSpecTorque}
        percent={percent}
        onPercent={setPercent}
        kFactor={kFactor}
        onK={setKFactor}
      />
      <Text style={{ color: theme.color.textMuted, lineHeight: 20 }}>The pipe-strain sheet opens blank. Write the movement limit you were given.</Text>
      <About text={`${FLANGE_ABOUT} ${API_686_CITATION}.`} />
    </Screen>
  );
}

export function AnchorChartScreen() {
  const { theme } = useAppTheme();
  const [diameter, setDiameter] = useState('3/4');
  const [grade, setGrade] = useState<(typeof ANCHOR_GRADES)[number]>('F1554 Gr 36');
  const [specTorque, setSpecTorque] = useState('');
  const [percent, setPercent] = useState(String(PERCENT_DEFAULT));
  const [kFactor, setKFactor] = useState(String(K_DEFAULT));
  const fastener = coarseFastener(diameter);
  const load = fastener ? fastenerLoad(grade, fastener, null) : null;
  const washer = washerNote(grade, fastener?.decimalIn ?? null);
  return (
    <Screen title="Anchor bolts" subtitle="F1554 Grades 36, 55, and 105, and B7. Torque starts at 75% of yield with Dry steel K 0.20 until you enter your spec.">
      <Back />
      <ChoiceRow label="Diameter" value={diameter} onChange={setDiameter} options={ANCHOR_DIAMETERS.map((item) => ({ value: item, label: item }))} />
      <ChoiceRow label="Grade" value={grade} onChange={setGrade} options={ANCHOR_GRADES.map((item) => ({ value: item, label: item }))} />
      {fastener && load ? (
        <Card>
          <Line label="Thread" value={fastener.thread} />
          <Line label="Tensile stress area" value={`${round(fastener.stressAreaIn2, 4)} in²`} />
          <Line label="Heavy hex, across flats" value={fastener.wrenchUncertain ? `${fastener.wrench} (confirm)` : `${fastener.wrench} in`} />
          <Line label="Washer" value={washer.washer} />
          <Line label={load.loadKind === 'yield' ? 'Minimum yield' : 'Proof'} value={loadFigure(load)} />
          <Text style={{ color: theme.color.textMuted, lineHeight: 20, marginTop: 6 }}>{washer.note}</Text>
          <Text style={{ color: theme.color.text, marginTop: 8, lineHeight: 20 }}>{ANCHOR_PRACTICE}</Text>
          <Text style={{ color: theme.color.text, marginTop: 8 }}>{API_686_CITATION}</Text>
        </Card>
      ) : null}
      {washer.uncertain ? <Banner title="Confirm this row" body={washer.note} /> : null}
      <TorqueCard
        diameterIn={fastener?.decimalIn ?? null}
        load={load}
        specTorque={specTorque}
        onSpec={setSpecTorque}
        percent={percent}
        onPercent={setPercent}
        kFactor={kFactor}
        onK={setKFactor}
      />
      <About text={`${ANCHOR_ABOUT} ${API_686_CITATION}.`} />
    </Screen>
  );
}

export function HoldDownChartScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [system, setSystem] = useState<'inch' | 'metric'>('inch');
  const [diameter, setDiameter] = useState('5/8');
  const [metricSize, setMetricSize] = useState('M16');
  const [grade, setGrade] = useState('SAE 5');
  const [head, setHead] = useState<FastenerHead>('hex-cap');
  const [specTorque, setSpecTorque] = useState('');
  const [percent, setPercent] = useState(String(PERCENT_DEFAULT));
  const [kFactor, setKFactor] = useState(String(K_DEFAULT));
  const inch = system === 'inch' ? coarseFastener(diameter) : null;
  const metricRow = system === 'metric' ? metricFastener(metricSize) : null;
  const inchGrades = HOLD_GRADES.filter((item) => item === 'SAE 5' || item === 'SAE 8' || item === 'B7');
  const metricGrades = HOLD_GRADES.filter((item) => item === '8.8' || item === '10.9');
  const activeGrade = system === 'metric'
    ? (grade === '8.8' || grade === '10.9' ? grade : '8.8')
    : (grade === 'SAE 5' || grade === 'SAE 8' || grade === 'B7' ? grade : 'SAE 5');
  const load = fastenerLoad(activeGrade, inch, metricRow);
  const calculated = inch && load
    ? torqueFromKdf({
      diameterIn: inch.decimalIn,
      proofOrYieldLb: load.load,
      ...torqueInputs(percent, kFactor),
    })
    : null;
  const pair = wrenchPair(diameter);
  const chosen = socketFor(diameter, head);
  const sizeLabel = inch ? `${inch.diameter} (${inch.thread})` : metricRow?.size ?? '';

  return (
    <Screen title="Hold-down bolts" subtitle="SAE 5 and 8, B7, and metric 8.8 and 10.9. Torque starts at 75% of proof/yield with Dry steel K 0.20 until you enter your spec.">
      <Back />
      <ChoiceRow
        label="Units"
        value={system}
        onChange={(value) => {
          setSystem(value);
          setGrade(value === 'metric' ? '8.8' : 'SAE 5');
        }}
        options={[{ value: 'inch', label: 'Inch' }, { value: 'metric', label: 'Metric' }]}
      />
      {system === 'inch' ? (
        <ChoiceRow label="Diameter" value={diameter} onChange={setDiameter} options={HOLD_INCH_DIAMETERS.map((item) => ({ value: item, label: item }))} />
      ) : (
        <ChoiceRow label="Size" value={metricSize} onChange={setMetricSize} options={HOLD_METRIC_SIZES.map((item) => ({ value: item, label: item }))} />
      )}
      <ChoiceRow
        label="Grade"
        value={activeGrade}
        onChange={setGrade}
        options={(system === 'inch' ? inchGrades : metricGrades).map((item) => ({ value: item, label: item }))}
      />
      {system === 'inch' ? (
        <ChoiceRow
          label="Fastener"
          value={head}
          onChange={setHead}
          options={[
            { value: 'hex-cap', label: 'Hex cap screw' },
            { value: 'heavy-hex', label: 'Heavy hex nut' },
          ]}
        />
      ) : null}
      {load ? (
        <Card>
          {system === 'inch' && pair && chosen ? (
            <>
              <Line label="Hex cap screw / nut, across flats" value={`${pair.hex} in`} />
              <Line label="Heavy hex nut, across flats" value={pair.heavyUncertain ? `${pair.heavy} in (confirm)` : `${pair.heavy} in`} />
              <Line label="Socket" value={chosen.uncertain ? `${chosen.across} in (confirm)` : `${chosen.across} in`} />
            </>
          ) : (
            <Line label="Socket" value={metricRow ? `${metricRow.socketMm} mm` : ''} />
          )}
          <Line label="Stress area" value={inch ? `${round(inch.stressAreaIn2, 4)} in²` : metricRow ? `${metricRow.stressAreaMm2} mm²` : ''} />
          <Line label={load.loadKind === 'yield' ? 'Yield load' : 'Proof load'} value={loadFigure(load)} />
          {load.load === 0 && load.note ? <Banner title="Outside the published range" body={load.note} /> : null}
          {load.note && load.load > 0 ? <Text style={{ color: theme.color.textMuted, lineHeight: 20 }}>{load.note}</Text> : null}
          <Text style={{ color: theme.color.text, marginTop: 8, lineHeight: 20 }}>{HOLD_PRACTICE}</Text>
          <Text style={{ color: theme.color.text, marginTop: 8 }}>{API_686_CITATION}</Text>
        </Card>
      ) : null}
      <TorqueCard
        diameterIn={inch?.decimalIn ?? null}
        load={system === 'inch' ? load : null}
        specTorque={specTorque}
        onSpec={setSpecTorque}
        percent={percent}
        onPercent={setPercent}
        kFactor={kFactor}
        onK={setKFactor}
        metricNote={system === 'metric' ? 'For a metric bolt, type the spec torque or convert D to inches and F to pounds yourself. This chart does not invent a metric K.' : undefined}
      />
      <About text={`${HOLD_ABOUT} ${API_686_CITATION}.`} />
    </Screen>
  );
}
