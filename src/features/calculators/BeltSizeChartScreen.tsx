import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Banner, Button, ChoiceRow, Field, Screen } from '@/src/components/ui';
import {
  ALIGNMENT_COPY,
  BELT_SPEED_FORMULA,
  BUSHINGS,
  CHAIN_SIZES,
  DEFLECTION_COPY,
  DRIVE_COPY,
  HP_CAPACITY_COPY,
  HP_COPY,
  HP_TORQUE_FORMULA,
  NEW_BELT_COPY,
  PULLEY_NOTES,
  SPEED_RATIO_FORMULA,
  TENSION_ROWS,
  formatForce,
  solveHorsepower,
  solveSpeedRatio,
  type ChainSize,
  type HorsepowerResult,
  type PulleyNote,
  type SpeedRatioResult,
  type TensionRow,
} from '@/src/domain/calculators/beltDriveRef';
import {
  BELT_FORMULA_COPY,
  BELT_LENGTH_FORMULA,
  BELT_NOTE,
  FLAT_BELT_COPY,
  GROOVE_COPY,
  LENGTH_RULE,
  MEASURE_STEPS,
  TIMING_COPY,
  TIMING_PITCHES,
  V_BELT_SECTIONS,
  beltChartHtml,
  beltLengthExample,
  beltQueryHits,
  lengthExamples,
  type BeltView,
  type TimingFamily,
  type TimingPitch,
  type VBeltSection,
} from '@/src/domain/calculators/beltSize';
import { BeltTensionLookup } from '@/src/features/calculators/BeltTensionLookup';
import { CalcBack } from '@/src/features/calculators/CalculatorScreens';
import { printToolList } from '@/src/services/export';
import { useAppTheme } from '@/src/theme/ThemeContext';

const VIEWS: { value: BeltView; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'v-belt', label: 'V-belts' },
  { value: 'timing', label: 'Timing' },
  { value: 'flat', label: 'Flat' },
  { value: 'measure', label: 'Measure' },
  { value: 'length', label: 'Lengths' },
  { value: 'formula', label: 'Formula' },
  { value: 'pulley', label: 'Pulleys' },
  { value: 'drive', label: 'Drive' },
  { value: 'tension', label: 'Tension' },
];

const TIMING_FAMILY: Record<TimingFamily, string> = {
  trapezoidal: 'Trapezoidal inch pitch',
  htd: 'HTD metric pitch',
  gt2: 'GT2',
};

export function BeltSizeChartScreen() {
  const { theme } = useAppTheme();
  const [view, setView] = useState<BeltView>('all');
  const [query, setQuery] = useState('');
  const [printNote, setPrintNote] = useState<string | null>(null);
  const example = useMemo(() => beltLengthExample(), []);
  const show = (group: BeltView) => view === 'all' || view === group;
  const sections = show('v-belt') ? V_BELT_SECTIONS.filter((section) => beltQueryHits(query, section.haystack, { sectionId: section.id })) : [];
  const pitches = show('timing') ? TIMING_PITCHES.filter((pitch) => beltQueryHits(query, pitch.haystack)) : [];
  const steps = show('measure') ? MEASURE_STEPS.filter((step) => beltQueryHits(query, step.haystack)) : [];
  const codes = show('length')
    ? lengthExamples().filter((item) => beltQueryHits(query, `${item.code} ${item.inches} ${item.basis} ${item.outsideInches ?? ''}`, { sectionId: item.section, code: item.code }))
    : [];
  const showGroove = show('v-belt') && beltQueryHits(query, GROOVE_COPY);
  const showTimingNote = show('timing') && beltQueryHits(query, TIMING_COPY);
  const showFlat = show('flat') && beltQueryHits(query, FLAT_BELT_COPY);
  const showLengthRule = show('length') && beltQueryHits(query, LENGTH_RULE);
  const showFormula = show('formula') && beltQueryHits(query, `${BELT_LENGTH_FORMULA} ${BELT_FORMULA_COPY} ${example.label}`);
  const pulleys = show('pulley') ? PULLEY_NOTES.filter((item) => beltQueryHits(query, item.haystack)) : [];
  const bushings = show('pulley') ? BUSHINGS.filter((item) => beltQueryHits(query, item.haystack)) : [];
  const chains = show('pulley') ? CHAIN_SIZES.filter((item) => beltQueryHits(query, item.haystack)) : [];
  const driveText = `${SPEED_RATIO_FORMULA} ${BELT_SPEED_FORMULA} ${DRIVE_COPY} ${HP_TORQUE_FORMULA} ${HP_COPY} ${HP_CAPACITY_COPY}`;
  const showDrive = show('drive') && beltQueryHits(query, driveText);
  const tensionRows = show('tension') ? TENSION_ROWS.filter((item) => beltQueryHits(query, item.haystack, { sectionId: item.section })) : [];
  const tensionText = `${DEFLECTION_COPY} ${NEW_BELT_COPY} ${ALIGNMENT_COPY}`;
  const showTensionNotes = show('tension') && beltQueryHits(query, tensionText);
  const any =
    sections.length + pitches.length + steps.length + codes.length + pulleys.length + bushings.length + chains.length + tensionRows.length > 0 ||
    showGroove ||
    showTimingNote ||
    showFlat ||
    showLengthRule ||
    showFormula ||
    showDrive ||
    showTensionNotes;

  async function printChart() {
    setPrintNote(null);
    setPrintNote(await printToolList(beltChartHtml()));
  }

  return (
    <Screen title="Belt sizing" subtitle="V-belt sections, pulley types, speed ratio, and installation tension. Reference only.">
      <CalcBack />
      <ChoiceRow label="Show" options={VIEWS} value={view} onChange={setView} />
      <Field label="Search" value={query} onChangeText={setQuery} placeholder="A42, QD, 5252, or MXL" autoCapitalize="none" />
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.space.md, lineHeight: theme.line.body }}>{BELT_NOTE}</Text>
      <Button label="Print chart" variant="secondary" icon="print-outline" onPress={() => void printChart()} />
      {printNote ? <Text style={{ color: theme.color.textMuted, marginBottom: theme.space.md, lineHeight: theme.line.body }}>{printNote}</Text> : null}
      {any ? null : <Banner title="No match" body="Try A42, QD, 5252, or MXL." />}
      {sections.length > 0 ? <SectionHeading title="V-belt sections" /> : null}
      {sections.map((section, index) => (
        <SectionBlock key={section.id} section={section} index={index} />
      ))}
      {showGroove ? <CopyBlock body={GROOVE_COPY} /> : null}
      {pitches.length > 0 ? <SectionHeading title="Timing belt pitch" /> : null}
      {pitches.map((pitch, index) => (
        <PitchBlock key={pitch.id} pitch={pitch} previous={pitches[index - 1]} />
      ))}
      {showTimingNote ? <CopyBlock body={TIMING_COPY} /> : null}
      {showFlat ? (
        <>
          <SectionHeading title="Flat belts" />
          <CopyBlock body={FLAT_BELT_COPY} />
        </>
      ) : null}
      {steps.length > 0 ? <SectionHeading title="How to measure" /> : null}
      {steps.map((step, index) => (
        <CopyBlock key={step.title} title={`${index + 1}. ${step.title}`} body={step.body} />
      ))}
      {showLengthRule || codes.length > 0 ? <SectionHeading title="Length codes" /> : null}
      {showLengthRule ? <CopyBlock body={LENGTH_RULE} /> : null}
      {codes.map((item) => (
        <CopyBlock
          key={item.code}
          title={item.code}
          body={item.basis === 'inside' ? `${item.inches} in inside, about ${item.outsideInches} in outside` : `${item.inches.toFixed(1)} in effective`}
        />
      ))}
      {showFormula ? (
        <>
          <SectionHeading title="Open-belt length" />
          <CopyBlock title={BELT_LENGTH_FORMULA} body={BELT_FORMULA_COPY} />
          <CopyBlock body={`Example: D = ${example.large} in, d = ${example.small} in, C = ${example.center} in, L = ${example.label} in.`} />
        </>
      ) : null}
      {pulleys.map((item) => (
        <PulleyBlock key={item.id} item={item} />
      ))}
      {bushings.length > 0 ? <SectionHeading title="QD and taper-lock" /> : null}
      {bushings.map((item) => (
        <CopyBlock key={item.id} title={item.name} body={item.body} />
      ))}
      {chains.length > 0 ? <SectionHeading title="Sprocket pitch" /> : null}
      {chains.map((item) => (
        <ChainBlock key={item.number} item={item} />
      ))}
      {showDrive ? <DriveHelper /> : null}
      {showTensionNotes ? <TensionHelper /> : null}
      {tensionRows.length > 0 ? <SectionHeading title="Deflection force" /> : null}
      {tensionRows.map((item) => (
        <TensionBlock key={`${item.section}-${item.sheave}`} item={item} />
      ))}
    </Screen>
  );
}

function SectionBlock({ section, index }: { section: VBeltSection; index: number }) {
  const { theme } = useAppTheme();
  return (
    <View
      style={{
        marginBottom: 8,
        padding: 10,
        backgroundColor: index % 2 === 0 ? theme.color.surfaceMuted : theme.color.surface,
        borderWidth: 1,
        borderColor: theme.color.border,
        borderRadius: theme.radius.sm,
      }}
    >
      <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.medium, fontWeight: '500', marginBottom: 4 }}>
        {section.id} · {section.family === 'classical' ? 'Classical' : 'Narrow'}
      </Text>
      <Text style={{ color: theme.color.text, fontVariant: ['tabular-nums'], marginBottom: 2 }}>
        Top {section.topFraction} in ({section.topDecimal} in, {section.topMmLabel} mm)
      </Text>
      <Text style={{ color: theme.color.text, fontVariant: ['tabular-nums'], marginBottom: 2 }}>
        Depth {section.depthFraction} in ({section.depthDecimal} in, {section.depthMmLabel} mm)
      </Text>
      <Text style={{ color: theme.color.textMuted, lineHeight: theme.line.body }}>
        {section.outsideAddInches == null ? 'Effective length, in tenths of an inch' : `Outside about inside + ${section.outsideAddInches} in`}
      </Text>
    </View>
  );
}

function PitchBlock({ pitch, previous }: { pitch: TimingPitch; previous: TimingPitch | undefined }) {
  const { theme } = useAppTheme();
  return (
    <View>
      {previous?.family !== pitch.family ? (
        <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.medium, fontWeight: '500', marginTop: 8, marginBottom: 4 }}>{TIMING_FAMILY[pitch.family]}</Text>
      ) : null}
      <View style={{ flexDirection: 'row', minHeight: 36, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.color.border, paddingHorizontal: 8 }}>
        <Text style={{ flex: 1, color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>{pitch.id}</Text>
        <Text style={{ flex: 1, color: theme.color.text, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{pitch.pitchInchLabel} in</Text>
        <Text style={{ flex: 1, color: theme.color.text, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{pitch.pitchMmLabel} mm</Text>
      </View>
    </View>
  );
}

function SectionHeading({ title }: { title: string }) {
  const { theme } = useAppTheme();
  return <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.medium, fontWeight: '500', fontSize: 16, marginTop: 16, marginBottom: 8 }}>{title}</Text>;
}

function PulleyBlock({ item }: { item: PulleyNote }) {
  return (
    <>
      <SectionHeading title={item.title} />
      <CopyBlock body={item.body} />
    </>
  );
}

function ChainBlock({ item }: { item: ChainSize }) {
  const { theme } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', minHeight: 36, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.color.border, paddingHorizontal: 8 }}>
      <Text style={{ flex: 1, color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>{item.number}</Text>
      <Text style={{ flex: 1, color: theme.color.text, textAlign: 'right', fontVariant: ['tabular-nums'] }}>{trimNumber(item.pitchInches)} in</Text>
    </View>
  );
}

function TensionBlock({ item }: { item: TensionRow }) {
  const { theme } = useAppTheme();
  return (
    <View style={{ marginBottom: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.color.border }}>
      <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>
        {item.section} · {item.sheave} in{item.rpm ? ` · ${item.rpm} rpm` : ''}
      </Text>
      <Text style={{ color: theme.color.text, fontVariant: ['tabular-nums'] }}>Wrapped {formatForce(item.wrapped)}</Text>
      <Text style={{ color: theme.color.text, fontVariant: ['tabular-nums'] }}>Cogged {formatForce(item.cogged)}</Text>
    </View>
  );
}

function DriveHelper() {
  const { theme } = useAppTheme();
  const [n1, setN1] = useState('1750');
  const [d1, setD1] = useState('4');
  const [n2, setN2] = useState('');
  const [d2, setD2] = useState('8');
  const [hp, setHp] = useState('');
  const [torque, setTorque] = useState('');
  const [rpm, setRpm] = useState('1750');
  const [ratio, setRatio] = useState<SpeedRatioResult | null>(null);
  const [power, setPower] = useState<HorsepowerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function solveRatio() {
    setError(null);
    setPower(null);
    try {
      setRatio(solveSpeedRatio({ n1: readOptional(n1, 'Driver speed'), d1: readOptional(d1, 'Driver diameter'), n2: readOptional(n2, 'Driven speed'), d2: readOptional(d2, 'Driven diameter') }));
    } catch (reason) {
      setRatio(null);
      setError(reason instanceof Error ? reason.message : 'Check the drive.');
    }
  }

  function solvePower() {
    setError(null);
    setRatio(null);
    try {
      setPower(solveHorsepower({ hp: readOptional(hp, 'Horsepower'), torqueFtLb: readOptional(torque, 'Torque'), rpm: readOptional(rpm, 'Speed') }));
    } catch (reason) {
      setPower(null);
      setError(reason instanceof Error ? reason.message : 'Check the horsepower.');
    }
  }

  return (
    <View>
      <SectionHeading title="Speed ratio" />
      <CopyBlock title={SPEED_RATIO_FORMULA} body={DRIVE_COPY} />
      <CopyBlock title={BELT_SPEED_FORMULA} body="V is feet per minute. D is inches. N is rpm." />
      <Field label="Driver rpm" value={n1} onChangeText={setN1} keyboardType="decimal-pad" autoCapitalize="none" />
      <Field label="Driver diameter" value={d1} onChangeText={setD1} keyboardType="decimal-pad" autoCapitalize="none" hint="Inches. Pitch diameter, or outside diameter on a flat belt." />
      <Field label="Driven rpm" value={n2} onChangeText={setN2} keyboardType="decimal-pad" autoCapitalize="none" />
      <Field label="Driven diameter" value={d2} onChangeText={setD2} keyboardType="decimal-pad" autoCapitalize="none" />
      <Button label="Solve ratio" icon="calculator-outline" onPress={solveRatio} />
      {ratio ? (
        <View style={{ marginBottom: theme.space.md }}>
          <Text style={{ color: theme.color.text, fontVariant: ['tabular-nums'] }}>Driven speed {trimNumber(ratio.n2)} rpm</Text>
          <Text style={{ color: theme.color.text, fontVariant: ['tabular-nums'] }}>Ratio {trimNumber(ratio.speedRatio)}</Text>
          <Text style={{ color: theme.color.text, fontVariant: ['tabular-nums'] }}>Belt speed {trimNumber(roundFpm(ratio.driverFpm))} fpm</Text>
        </View>
      ) : null}
      <SectionHeading title="Horsepower and torque" />
      <CopyBlock title={HP_TORQUE_FORMULA} body={HP_COPY} />
      <CopyBlock title="Typical, check the manufacturer's rating" body={HP_CAPACITY_COPY.replace(/^Typical, check the manufacturer's rating\. /, '')} />
      <Field label="Horsepower" value={hp} onChangeText={setHp} keyboardType="decimal-pad" autoCapitalize="none" />
      <Field label="Torque" value={torque} onChangeText={setTorque} keyboardType="decimal-pad" autoCapitalize="none" hint="Pound-feet." />
      <Field label="Shaft rpm" value={rpm} onChangeText={setRpm} keyboardType="decimal-pad" autoCapitalize="none" />
      <Button label="Solve horsepower" variant="secondary" icon="calculator-outline" onPress={solvePower} />
      {power ? (
        <Text style={{ color: theme.color.text, marginBottom: theme.space.md, fontVariant: ['tabular-nums'] }}>
          {trimNumber(power.hp)} hp at {trimNumber(power.torqueFtLb)} lb-ft and {trimNumber(power.rpm)} rpm
        </Text>
      ) : null}
      {error ? <Banner title="Check the numbers" body={error} /> : null}
    </View>
  );
}

function TensionHelper() {
  return (
    <View>
      <BeltTensionLookup />
      <SectionHeading title="Other published sheet" />
      <CopyBlock body={DEFLECTION_COPY} />
      <CopyBlock body={NEW_BELT_COPY} />
      <CopyBlock body={ALIGNMENT_COPY} />
    </View>
  );
}

function readOptional(raw: string, label: string): number | null {
  const text = raw.trim();
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value)) throw new Error(`${label} must be a number.`);
  return value;
}

function roundFpm(value: number): number {
  return Math.round(value * 10) / 10;
}

function trimNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 10000) / 10000);
}

function CopyBlock({ title, body }: { title?: string; body: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={{ marginBottom: theme.space.md }}>
      {title ? <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500', marginBottom: 4 }}>{title}</Text> : null}
      <Text style={{ color: theme.color.text, lineHeight: theme.line.body }}>{body}</Text>
    </View>
  );
}
