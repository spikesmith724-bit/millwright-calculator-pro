import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, Button, Card, ChoiceRow, Field, Screen, SectionHeader } from '@/src/components/ui';
import { ALIGNMENT_SIGN, reverseDial, rimAndFace, type AlignmentResult, type DialSet } from '@/src/domain/calculators/alignment';
import { AnchorChartScreen, FlangeChartScreen, HoldDownChartScreen } from '@/src/features/calculators/BoltingScreens';
import { boltCircle } from '@/src/domain/calculators/boltCircle';
import { CALC_DISCLAIMER, FORMULA_VERSION } from '@/src/domain/calculators/common';
import { epoxyGrout, GROUT_615, GROUT_ITW_NOTE, GROUT_PRODUCTS, groutOrderLine, GROUT_WASTE_NOTE, lengthToInches, type GroutProductId, type GroutResult } from '@/src/domain/calculators/grout';
import { groutTakeoffHtml } from '@/src/domain/calculators/report';
import type { CalculatorKind } from '@/src/domain/calculators/kinds';
import { slingTension } from '@/src/domain/calculators/sling';
import { machineThermal, simpleThermal, THERMAL_ESTIMATE_LABEL, THERMAL_MATERIALS } from '@/src/domain/calculators/thermal';
import { ConversionChartScreen } from '@/src/features/calculators/ConversionChartScreen';
import { convertUnits, UNIT_FAMILIES, formatUnitValue } from '@/src/domain/calculators/units';
import {
  AffinityCalculatorScreen,
  BearingLifeCalculatorScreen,
  BeltCalculatorScreen,
  CouplingCalculatorScreen,
  FieldUnitsCalculatorScreen,
  FrequencyCalculatorScreen,
  NpshCalculatorScreen,
  PolytropicCalculatorScreen,
} from '@/src/features/calculators/FieldCalculatorScreens';
import { FractionChartScreen } from '@/src/features/calculators/FractionChartScreen';
import { SocketChartScreen } from '@/src/features/calculators/SocketChartScreen';
import { DrillChartScreen } from '@/src/features/calculators/DrillChartScreen';
import { BeltSizeChartScreen } from '@/src/features/calculators/BeltSizeChartScreen';
import { AgitatorCalculatorScreen } from '@/src/features/calculators/AgitatorCalculatorScreen';
import { LubeOilScreen } from '@/src/features/calculators/LubeOilScreen';
import { GroutJobScreen, IsoFitsScreen, RiggingScreen } from '@/src/features/calculators/ExtraScreens';
import { printToolList } from '@/src/services/export';
import { useAppTheme } from '@/src/theme/ThemeContext';

export type Lines = { label: string; value: string }[];

export function parseNum(value: string, label: string): number {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) throw new Error(`Enter a number for ${label}.`);
  return parsed;
}

export function CalcBack() {
  const router = useRouter();
  const { theme } = useAppTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center', marginBottom: 4 }}>
      <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.medium, fontSize: 17 }}>Back</Text>
    </Pressable>
  );
}

export function footer(formula: string, units: string) {
  return `${formula}\n${units}\nFormula ${FORMULA_VERSION}.\n${CALC_DISCLAIMER}`;
}

export function ResultBlock({ lines, extra }: { lines: Lines; extra?: string }) {
  const { theme } = useAppTheme();
  return (
    <Card>
      {lines.map((line) => (
        <Text key={line.label} style={{ color: theme.color.text, fontFamily: theme.fontFamily.regular, lineHeight: theme.line.body, marginBottom: 6 }}>
          <Text style={{ fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>{line.label}: </Text>
          {line.value}
        </Text>
      ))}
      {extra ? <Text style={{ color: theme.color.textMuted, marginTop: 8, lineHeight: theme.line.body }}>{extra}</Text> : null}
    </Card>
  );
}

export function useSaveShare() {
  const [note, setNote] = useState<string | null>(null);
  async function share(title: string, lines: Lines, formula: string, units: string) {
    const message = `${title}\n${lines.map((line) => `${line.label}: ${line.value}`).join('\n')}\n${footer(formula, units)}`;
    await Share.share({ message });
  }
  return { note, setNote, share, username: 'Millwright' };
}


const ZERO_DIAL = { top: '0', bottom: '0', left: '0', right: '0' };

function dial(values: typeof ZERO_DIAL): DialSet {
  return {
    top: parseNum(values.top, 'top'),
    bottom: parseNum(values.bottom, 'bottom'),
    left: parseNum(values.left, 'left'),
    right: parseNum(values.right, 'right'),
  };
}

function alignmentLines(result: AlignmentResult): Lines {
  return [
    { label: 'Front vertical', value: `${result.front.verticalMils} mils` },
    { label: 'Back vertical', value: `${result.back.verticalMils} mils` },
    { label: 'Front horizontal', value: `${result.front.horizontalMils} mils` },
    { label: 'Back horizontal', value: `${result.back.horizontalMils} mils` },
  ];
}

export function AlignmentCalculatorScreen() {
  const { theme } = useAppTheme();
  const { note, setNote, share } = useSaveShare();
  const [method, setMethod] = useState<'rim-face' | 'reverse-dial'>('rim-face');
  const [span, setSpan] = useState('4');
  const [front, setFront] = useState('8');
  const [back, setBack] = useState('20');
  const [sag, setSag] = useState('0');
  const [sagFar, setSagFar] = useState('0');
  const [rim, setRim] = useState(ZERO_DIAL);
  const [face, setFace] = useState(ZERO_DIAL);
  const [result, setResult] = useState<AlignmentResult | null>(null);

  function run() {
    setNote(null);
    try {
      const next =
        method === 'rim-face'
          ? rimAndFace({
              faceDiameterIn: parseNum(span, 'face diameter'),
              frontFootIn: parseNum(front, 'front foot'),
              backFootIn: parseNum(back, 'back foot'),
              sagMils: parseNum(sag, 'sag'),
              rim: dial(rim),
              face: dial(face),
            })
          : reverseDial({
              indicatorSpanIn: parseNum(span, 'indicator span'),
              frontFootFromNearIn: parseNum(front, 'front foot'),
              backFootFromNearIn: parseNum(back, 'back foot'),
              sagNearMils: parseNum(sag, 'near sag'),
              sagFarMils: parseNum(sagFar, 'far sag'),
              near: dial(rim),
              far: dial(face),
            });
      setResult(next);
    } catch (error) {
      setResult(null);
      setNote(error instanceof Error ? error.message : 'Check the inputs.');
    }
  }

  const lines = result ? alignmentLines(result) : [];
  return (
    <Screen title="Shaft alignment" subtitle="Moves are for the movable machine. Readings are mils. Distances are inches." >
      <CalcBack />
      <Card>
        <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500', marginBottom: 8 }}>Sign convention</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
          <View style={{ width: 72, height: 36, backgroundColor: theme.color.surfaceMuted, borderWidth: 1, borderColor: theme.color.border, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 12 }}>Fixed</Text>
          </View>
          <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: theme.color.accent }} />
          <View style={{ flex: 1, height: 36, backgroundColor: theme.color.accentSoft, borderWidth: 1, borderColor: theme.color.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 }}>
            <Text style={{ fontSize: 12 }}>Front</Text>
            <Text style={{ fontSize: 12 }}>Back</Text>
          </View>
        </View>
        <Text style={{ color: theme.color.text, lineHeight: theme.line.body }}>{ALIGNMENT_SIGN}</Text>
      </Card>
      <ChoiceRow label="Method" options={[{ value: 'rim-face', label: 'Rim and face' }, { value: 'reverse-dial', label: 'Reverse dial' }]} value={method} onChange={setMethod} />
      <Field label={method === 'rim-face' ? 'Face diameter (in)' : 'Indicator span (in)'} value={span} onChangeText={setSpan} keyboardType="decimal-pad" />
      <Field label="Front foot distance (in)" value={front} onChangeText={setFront} keyboardType="decimal-pad" />
      <Field label="Back foot distance (in)" value={back} onChangeText={setBack} keyboardType="decimal-pad" />
      <Field label="Sag, near or rim (mils)" value={sag} onChangeText={setSag} keyboardType="decimal-pad" />
      {method === 'reverse-dial' ? <Field label="Sag, far indicator (mils)" value={sagFar} onChangeText={setSagFar} keyboardType="decimal-pad" /> : null}
      <SectionHeader title={method === 'rim-face' ? 'Rim readings (mils)' : 'Near indicator (mils)'} />
      {(['top', 'bottom', 'left', 'right'] as const).map((key) => (
        <Field key={`rim-${key}`} label={key} value={rim[key]} onChangeText={(value) => setRim({ ...rim, [key]: value })} keyboardType="numbers-and-punctuation" />
      ))}
      <SectionHeader title={method === 'rim-face' ? 'Face readings (mils)' : 'Far indicator (mils)'} />
      {(['top', 'bottom', 'left', 'right'] as const).map((key) => (
        <Field key={`face-${key}`} label={key} value={face[key]} onChangeText={(value) => setFace({ ...face, [key]: value })} keyboardType="numbers-and-punctuation" />
      ))}
      <Button label="Calculate moves" onPress={run} />
      {note ? <Text style={{ color: theme.color.accentText, marginBottom: 8 }}>{note}</Text> : null}
      {result ? (
        <>
          <ResultBlock lines={lines} extra={footer(result.formula, result.units)} />
          <Button label="Share result" variant="secondary" onPress={() => void share('Shaft alignment', lines, result.formula, result.units)} />
        </>
      ) : null}
    </Screen>
  );
}

export function ThermalCalculatorScreen() {
  const { note, setNote, share } = useSaveShare();
  const [mode, setMode] = useState<'simple' | 'machine'>('machine');
  const [material, setMaterial] = useState('steel');
  const [alpha, setAlpha] = useState('0.0000065');
  const [length, setLength] = useState('20');
  const [delta, setDelta] = useState('100');
  const [height, setHeight] = useState('20');
  const [ambient, setAmbient] = useState('70');
  const [front, setFront] = useState('170');
  const [back, setBack] = useState('170');
  const [drivenHeight, setDrivenHeight] = useState('10');
  const [drivenAlpha, setDrivenAlpha] = useState('0.0000065');
  const [drivenAmbient, setDrivenAmbient] = useState('70');
  const [drivenFront, setDrivenFront] = useState('70');
  const [drivenBack, setDrivenBack] = useState('70');
  const [span, setSpan] = useState('20');
  const [lateral, setLateral] = useState('');
  const [lateralTemp, setLateralTemp] = useState('');
  const [lines, setLines] = useState<Lines>([]);
  const [formula, setFormula] = useState('');
  const [units, setUnits] = useState('');
  const [payload, setPayload] = useState<Record<string, unknown>>({});

  function applyMaterial(id: string) {
    setMaterial(id);
    const found = THERMAL_MATERIALS.find((item) => item.id === id);
    if (found && id !== 'custom') setAlpha(String(found.alphaPerF));
  }

  function run() {
    setNote(null);
    try {
      if (mode === 'simple') {
        const result = simpleThermal({ alphaPerF: parseNum(alpha, 'coefficient'), lengthIn: parseNum(length, 'length'), deltaTF: parseNum(delta, 'temperature change') });
        const next = [
          { label: 'Growth', value: `${result.deltaIn} in (${result.deltaMils} mils)` },
          { label: 'Label', value: result.estimateLabel },
        ];
        setLines(next);
        setFormula(result.formula);
        setUnits(result.units);
        setPayload({ deltaIn: result.deltaIn });
        return;
      }
      const result = machineThermal(
        {
          centerlineHeightIn: parseNum(height, 'driver height'),
          alphaPerF: parseNum(alpha, 'driver coefficient'),
          ambientF: parseNum(ambient, 'driver ambient'),
          frontFootF: parseNum(front, 'driver front'),
          backFootF: parseNum(back, 'driver back'),
          footSpanIn: span.trim() ? parseNum(span, 'foot span') : null,
          lateralIn: lateral.trim() ? parseNum(lateral, 'lateral distance') : null,
          lateralTempF: lateralTemp.trim() ? parseNum(lateralTemp, 'lateral temperature') : null,
        },
        {
          centerlineHeightIn: parseNum(drivenHeight, 'driven height'),
          alphaPerF: parseNum(drivenAlpha, 'driven coefficient'),
          ambientF: parseNum(drivenAmbient, 'driven ambient'),
          frontFootF: parseNum(drivenFront, 'driven front'),
          backFootF: parseNum(drivenBack, 'driven back'),
          footSpanIn: null,
          lateralIn: null,
          lateralTempF: null,
        },
      );
      const next = [
        { label: 'Driver front / back', value: `${result.driver.frontIn} in / ${result.driver.backIn} in` },
        { label: 'Driver centerline', value: `${result.driver.centerlineIn} in` },
        { label: 'Driven front / back', value: `${result.driven.frontIn} in / ${result.driven.backIn} in` },
        { label: 'Relative front', value: `${result.relative.frontIn} in (driven − driver)` },
        { label: 'Cold target front', value: `${result.coldTargets.frontMils} mils (positive = set driven higher)` },
        { label: 'Cold target back', value: `${result.coldTargets.backMils} mils` },
        { label: 'Angle', value: result.coldTargets.angleDeg == null ? 'Enter a foot span' : `${result.coldTargets.angleDeg}° (${result.coldTargets.angleMilsPerIn} mils/in)` },
        { label: 'Horizontal', value: result.relative.horizontalIn == null ? 'Not entered' : `${result.relative.horizontalIn} in` },
        { label: 'Label', value: result.estimateLabel },
      ];
      setLines(next);
      setFormula(result.formula);
      setUnits(result.units);
      setPayload({ frontMils: result.coldTargets.frontMils, backMils: result.coldTargets.backMils });
    } catch (error) {
      setLines([]);
      setNote(error instanceof Error ? error.message : 'Check the inputs.');
    }
  }

  return (
    <Screen title="Thermal growth" subtitle={THERMAL_ESTIMATE_LABEL} >
      <CalcBack />
      <ChoiceRow label="Mode" options={[{ value: 'machine', label: 'Two machines' }, { value: 'simple', label: 'Simple ΔL' }]} value={mode} onChange={setMode} />
      <ChoiceRow label="Driver material" options={THERMAL_MATERIALS.map((item) => ({ value: item.id, label: item.label }))} value={material} onChange={applyMaterial} />
      <Text style={{ marginBottom: 8 }}>{THERMAL_MATERIALS.find((item) => item.id === material)?.source}</Text>
      <Field label="α (in/in/°F)" value={alpha} onChangeText={setAlpha} keyboardType="decimal-pad" hint="Override any published coefficient." />
      {mode === 'simple' ? (
        <>
          <Field label="Length (in)" value={length} onChangeText={setLength} keyboardType="decimal-pad" />
          <Field label="ΔT (°F)" value={delta} onChangeText={setDelta} keyboardType="numbers-and-punctuation" />
        </>
      ) : (
        <>
          <Field label="Driver centerline height (in)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" />
          <Field label="Driver ambient (°F)" value={ambient} onChangeText={setAmbient} keyboardType="numbers-and-punctuation" />
          <Field label="Driver front foot (°F)" value={front} onChangeText={setFront} keyboardType="numbers-and-punctuation" />
          <Field label="Driver back foot (°F)" value={back} onChangeText={setBack} keyboardType="numbers-and-punctuation" />
          <Field label="Foot span (in)" value={span} onChangeText={setSpan} keyboardType="decimal-pad" hint="Used for the coupling angle." />
          <Field label="Lateral distance (in, optional)" value={lateral} onChangeText={setLateral} keyboardType="decimal-pad" />
          <Field label="Lateral temperature (°F)" value={lateralTemp} onChangeText={setLateralTemp} keyboardType="numbers-and-punctuation" />
          <SectionHeader title="Driven machine" />
          <Field label="Driven α" value={drivenAlpha} onChangeText={setDrivenAlpha} keyboardType="decimal-pad" />
          <Field label="Driven centerline height (in)" value={drivenHeight} onChangeText={setDrivenHeight} keyboardType="decimal-pad" />
          <Field label="Driven ambient (°F)" value={drivenAmbient} onChangeText={setDrivenAmbient} keyboardType="numbers-and-punctuation" />
          <Field label="Driven front foot (°F)" value={drivenFront} onChangeText={setDrivenFront} keyboardType="numbers-and-punctuation" />
          <Field label="Driven back foot (°F)" value={drivenBack} onChangeText={setDrivenBack} keyboardType="numbers-and-punctuation" />
        </>
      )}
      <Button label="Calculate growth" onPress={run} />
      {note ? <Text style={{ marginBottom: 8 }}>{note}</Text> : null}
      {lines.length > 0 ? (
        <>
          <ResultBlock lines={lines} extra={footer(formula, units)} />
          <Button label="Share result" variant="secondary" onPress={() => void share('Thermal growth', lines, formula, units)} />
        </>
      ) : null}
    </Screen>
  );
}

type PourDraft = { key: string; length: string; width: string; depth: string };

function pourDraft(partial: Partial<PourDraft> = {}): PourDraft {
  return { key: `${Date.now()}-${Math.random()}`, length: '', width: '', depth: '', ...partial };
}

function unitWord(count: number): string {
  return count === 1 ? 'unit' : 'units';
}

function groutLines(result: GroutResult): Lines {
  const lines: Lines = [
    { label: 'Units needed', value: `${result.unitCount} ${unitWord(result.unitCount)}` },
    { label: 'Product', value: result.productLabel },
    { label: 'Takeoff', value: groutOrderLine(result) },
    { label: 'Net volume', value: `${result.netFt3} ft³ · ${result.netIn3} in³ · ${result.netGal} gal · ${result.netL} L` },
    { label: 'Order volume', value: `${result.orderFt3} ft³` },
    { label: 'Leftover', value: `${result.leftoverFt3} ft³` },
  ];
  if (result.sectionTakes.length > 1) {
    result.sectionTakes.forEach((section) => {
      lines.push({ label: `Pour ${section.index}`, value: `${section.unitCount} ${unitWord(section.unitCount)}` });
    });
    lines.push({ label: 'Total', value: `${result.unitCount} ${unitWord(result.unitCount)}` });
  }
  return lines;
}

function UnitsNeededCard({ result, message, productLabel }: { result: GroutResult | null; message: string | null; productLabel: string }) {
  const { theme } = useAppTheme();
  const count = result ? String(result.unitCount) : '—';
  const product = result?.productLabel ?? productLabel;
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={result ? `Units needed: ${result.unitCount}. ${product}. ${groutOrderLine(result)}` : message ?? 'Enter the pour.'}
      style={{
        backgroundColor: theme.color.accentSoft,
        borderColor: theme.color.accent,
        borderWidth: 1,
        borderLeftWidth: 6,
        borderRadius: theme.radius.md,
        padding: theme.space.lg,
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 10, rowGap: 2 }}>
        <Text style={{ color: theme.color.accent, fontFamily: theme.fontFamily.bold, fontWeight: '700', fontSize: theme.font.title, lineHeight: theme.line.title }}>
          UNITS NEEDED: {count}
        </Text>
        <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500', fontSize: theme.font.subheading }}>{product}</Text>
      </View>
      <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.regular, fontSize: theme.font.body, lineHeight: theme.line.body, marginTop: theme.space.sm }}>
        {result ? groutOrderLine(result) : message}
      </Text>
      {result && result.sectionTakes.length > 1 ? (
        <View style={{ marginTop: theme.space.sm }}>
          {result.sectionTakes.map((section) => (
            <Text key={section.index} style={{ color: theme.color.text, fontFamily: theme.fontFamily.regular, fontSize: theme.font.body, lineHeight: theme.line.body }}>
              Pour {section.index}: {section.unitCount} {unitWord(section.unitCount)}
            </Text>
          ))}
          <Text style={{ color: theme.color.accent, fontFamily: theme.fontFamily.bold, fontWeight: '700', fontSize: theme.font.body, lineHeight: theme.line.body }}>
            Total: {result.unitCount} {unitWord(result.unitCount)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export function GroutCalculatorScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { note, share, username } = useSaveShare();
  const [product, setProduct] = useState<GroutProductId>('red');
  const [unit, setUnit] = useState<'in' | 'ft' | 'mm'>('in');
  const [pours, setPours] = useState<PourDraft[]>([pourDraft({ length: '48', width: '24', depth: '2' })]);
  const [voidVolume, setVoidVolume] = useState('0');
  const [waste, setWaste] = useState('10');
  const [temp, setTemp] = useState('70');
  const [aboutOpen, setAboutOpen] = useState(false);

  const live = useMemo(() => {
    const active = pours.filter((pour) => pour.length.trim() || pour.width.trim() || pour.depth.trim());
    if (active.length === 0) return { result: null as GroutResult | null, message: 'Enter a length, width, and depth.' };
    try {
      const toIn = (value: string, label: string) => lengthToInches(parseNum(value, label), unit);
      const rawVoid = voidVolume.trim() === '' ? 0 : parseNum(voidVolume, 'void');
      const side = lengthToInches(1, unit);
      const voidIn3 = unit === 'in' ? rawVoid : rawVoid * side * side * side;
      const result = epoxyGrout({
        productId: product,
        sections: active.map((pour) => ({
          lengthIn: toIn(pour.length, 'length'),
          widthIn: toIn(pour.width, 'width'),
          depthIn: toIn(pour.depth, 'depth'),
        })),
        voids: voidIn3 === 0 ? [] : [{ volumeIn3: voidIn3, lengthIn: null, widthIn: null, depthIn: null }],
        wastePercent: parseNum(waste, 'waste'),
        ambientF: parseNum(temp, 'temperature'),
      });
      return { result, message: null as string | null };
    } catch (error) {
      return { result: null as GroutResult | null, message: error instanceof Error ? error.message : 'Check the inputs.' };
    }
  }, [pours, product, temp, unit, voidVolume, waste]);

  const checks = (live.result?.warnings ?? []).filter((warning) => warning !== GROUT_615);
  const lines = live.result ? groutLines(live.result) : [];

  function updatePour(key: string, patch: Partial<PourDraft>) {
    setPours((current) => current.map((pour) => (pour.key === key ? { ...pour, ...patch } : pour)));
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.color.background }}>
      <View style={{ paddingHorizontal: theme.space.lg, paddingTop: Math.max(insets.top, 16), paddingBottom: theme.space.md, backgroundColor: theme.color.background }}>
        <CalcBack />
        <Text accessibilityRole="header" style={{ color: theme.color.text, fontFamily: theme.fontFamily.bold, fontWeight: '700', fontSize: theme.font.title, marginBottom: 8 }}>Epoxy Grout</Text>
        <UnitsNeededCard result={live.result} message={live.message} productLabel={GROUT_PRODUCTS.find((item) => item.id === product)?.label ?? 'Chockfast'} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: theme.space.lg, paddingBottom: Math.max(insets.bottom, theme.space.xl) }}>
        <ChoiceRow label="Product" options={GROUT_PRODUCTS.map((item) => ({ value: item.id, label: item.label }))} value={product} onChange={setProduct} />
        <ChoiceRow label="Dimension unit" options={[{ value: 'in', label: 'in' }, { value: 'ft', label: 'ft' }, { value: 'mm', label: 'mm' }]} value={unit} onChange={setUnit} />
        {pours.map((pour, index) => (
          <View key={pour.key}>
            <SectionHeader title={pours.length > 1 ? `Pour ${index + 1}` : 'Pour'} />
            <Field label="Length" value={pour.length} onChangeText={(value) => updatePour(pour.key, { length: value })} keyboardType="decimal-pad" />
            <Field label="Width" value={pour.width} onChangeText={(value) => updatePour(pour.key, { width: value })} keyboardType="decimal-pad" />
            <Field label="Depth" value={pour.depth} onChangeText={(value) => updatePour(pour.key, { depth: value })} keyboardType="decimal-pad" />
            {pours.length > 1 ? (
              <Button label={`Remove pour ${index + 1}`} variant="text" onPress={() => setPours((current) => current.filter((item) => item.key !== pour.key))} />
            ) : null}
          </View>
        ))}
        <Button label="Add pour section" variant="secondary" onPress={() => setPours((current) => [...current, pourDraft()])} />
        <Field label={`Void volume (${unit}³)`} value={voidVolume} onChangeText={setVoidVolume} keyboardType="decimal-pad" hint="Soleplates, sleeves, or blockouts." />
        <Field label="Waste %" value={waste} onChangeText={setWaste} keyboardType="decimal-pad" />
        <Field label="Temperature (°F)" value={temp} onChangeText={setTemp} keyboardType="numbers-and-punctuation" />
        {checks.length > 0 ? <Banner title="Check these" tone="warning" body={checks.join(' ')} /> : null}
        {note ? <Text style={{ marginBottom: 8, color: theme.color.text }}>{note}</Text> : null}
        <Button
          label="Share result"
          variant="secondary"
          disabled={!live.result}
          onPress={() => {
            if (!live.result) return;
            void share('Epoxy grout', lines, live.result.formula, live.result.units);
          }}
        />
        <Button
          label="Print material takeoff"
          variant="secondary"
          disabled={!live.result}
          onPress={() => {
            if (!live.result) return;
            void printToolList(groutTakeoffHtml(live.result, username));
          }}
        />
        <Text style={{ color: theme.color.textMuted, fontSize: theme.font.caption, lineHeight: theme.line.caption, marginTop: theme.space.md }}>
          Product names are descriptive. This is not an ITW partnership.
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="About this data"
          onPress={() => setAboutOpen((open) => !open)}
          style={{ minHeight: theme.control.minTouch, justifyContent: 'center', marginTop: theme.space.sm }}
        >
          <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.medium, fontWeight: '500', fontSize: theme.font.body }}>
            About this data {aboutOpen ? '▾' : 'ⓘ'}
          </Text>
        </Pressable>
        {aboutOpen ? (
          <Text style={{ color: theme.color.textMuted, fontSize: theme.font.caption, lineHeight: theme.line.caption, marginBottom: theme.space.lg }}>
            {GROUT_ITW_NOTE} Source: Chockfast Red Technical Bulletin #617, and the ITW Precision Grouts brochure (NA, Dec 2025). One Red unit is 1.6 ft³ (2,765 in³, 11.97 gal, 45.3 L): resin 1.6 gal, hardener 0.9 gal, aggregate 4 bags. Typical depth 2–18 in. Typical temperature 55–95 °F. {GROUT_615} {GROUT_WASTE_NOTE} Red SG is 1.6 ft³ per unit, depth 1–4 in. Versaflow is 2.2 ft³ (61.7 L), depth 1–4 in. Packaging counts are shown for Chockfast Red only.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

export function SlingCalculatorScreen() {
  const { note, setNote, share } = useSaveShare();
  const [load, setLoad] = useState('1000');
  const [legs, setLegs] = useState('2');
  const [angle, setAngle] = useState('60');
  const [lines, setLines] = useState<Lines>([]);
  const [formula, setFormula] = useState('');
  const [units, setUnits] = useState('');
  function run() {
    setNote(null);
    try {
      const result = slingTension(parseNum(load, 'load'), parseNum(legs, 'legs'), parseNum(angle, 'angle'));
      setLines([
        { label: 'Share before angle', value: String(result.sharePerLeg) },
        { label: 'Angle factor', value: String(result.angleFactor) },
        { label: 'Tension per leg', value: String(result.tensionPerLeg) },
      ]);
      setFormula(result.formula);
      setUnits(result.units);
      if (result.warnings[0]) setNote(result.warnings[0]);
    } catch (error) {
      setLines([]);
      setNote(error instanceof Error ? error.message : 'Check the inputs.');
    }
  }
  return (
    <Screen title="Sling angle" subtitle="Geometry only. Working-load limits stay on the manufacturer’s tag and chart." >
      <CalcBack />
      <Field label="Load" value={load} onChangeText={setLoad} keyboardType="decimal-pad" />
      <Field label="Number of legs" value={legs} onChangeText={setLegs} keyboardType="number-pad" />
      <Field label="Angle from horizontal (degrees)" value={angle} onChangeText={setAngle} keyboardType="decimal-pad" />
      <Button label="Calculate tension" onPress={run} />
      {note ? <Banner title="Angle" tone="warning" body={note} /> : null}
      {lines.length > 0 ? (
        <>
          <ResultBlock lines={lines} extra={footer(formula, units)} />
          <Button label="Share result" variant="secondary" onPress={() => void share('Sling angle', lines, formula, units)} />
        </>
      ) : null}
    </Screen>
  );
}

const DEFAULT_UNIT_PAIR: Record<string, [string, string]> = {
  length: ['in', 'mm'],
  weight: ['lb', 'kg'],
  pressure: ['psi', 'kpa'],
  temperature: ['f', 'c'],
  volume: ['gal', 'l'],
  flow: ['gpm', 'm3h'],
  power: ['hp', 'kw'],
  torque: ['ftlb', 'nm'],
  speed: ['rpm', 'hz'],
};

export function UnitsCalculatorScreen() {
  const { theme } = useAppTheme();
  const { note, setNote, share } = useSaveShare();
  const [family, setFamily] = useState('length');
  const [from, setFrom] = useState('in');
  const [to, setTo] = useState('mm');
  const [value, setValue] = useState('1');
  const [lines, setLines] = useState<Lines>([]);
  const [formula, setFormula] = useState('');
  const [unitNote, setUnitNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const selected = UNIT_FAMILIES.find((item) => item.id === family);
  const units = selected?.units ?? [];
  function run() {
    setNote(null);
    setError(null);
    try {
      const result = convertUnits(family, parseNum(value, 'value'), from, to);
      setFormula(result.formula);
      setUnitNote(result.units);
      setLines([{ label: 'Result', value: `${formatUnitValue(result.value)} ${result.toLabel}` }]);
    } catch (reason) {
      setLines([]);
      setError(reason instanceof Error ? reason.message : 'Check the inputs.');
    }
  }
  return (
    <Screen title="Unit conversions" subtitle="Metric and imperial, either direction. Pick the family, then the two units." >
      <CalcBack />
      <ChoiceRow
        label="Family"
        options={UNIT_FAMILIES.map((item) => ({ value: item.id, label: item.label }))}
        value={family}
        onChange={(next) => {
          setFamily(next);
          const nextUnits = UNIT_FAMILIES.find((item) => item.id === next)?.units ?? [];
          const preferred = DEFAULT_UNIT_PAIR[next];
          const fromId = preferred && nextUnits.some((item) => item.id === preferred[0]) ? preferred[0] : nextUnits[0]?.id ?? '';
          const toId = preferred && nextUnits.some((item) => item.id === preferred[1]) ? preferred[1] : nextUnits[1]?.id ?? fromId;
          setFrom(fromId);
          setTo(toId);
          setLines([]);
          setError(null);
        }}
      />
      {selected ? <Text style={{ color: theme.color.textMuted, marginBottom: theme.space.md, lineHeight: theme.line.body }}>{selected.note}</Text> : null}
      <ChoiceRow label="From" options={units.map((item) => ({ value: item.id, label: item.label }))} value={from} onChange={setFrom} />
      <ChoiceRow label="To" options={units.map((item) => ({ value: item.id, label: item.label }))} value={to} onChange={setTo} />
      <Button
        label="Swap direction"
        variant="secondary"
        onPress={() => {
          setFrom(to);
          setTo(from);
          setLines([]);
        }}
      />
      <Field label="Value" value={value} onChangeText={setValue} keyboardType="numbers-and-punctuation" />
      <Button label="Convert" onPress={run} />
      {error ? <Banner title="Input" tone="warning" body={error} /> : null}
      {note ? <Banner title="Saved" body={note} /> : null}
      {lines.length > 0 ? (
        <>
          <ResultBlock lines={lines} extra={footer(formula, unitNote)} />
          <Button label="Share result" variant="secondary" onPress={() => void share('Unit conversion', lines, formula, unitNote)} />
        </>
      ) : null}
    </Screen>
  );
}

export function BoltCalculatorScreen() {
  const { note, setNote, share } = useSaveShare();
  const [diameter, setDiameter] = useState('10');
  const [count, setCount] = useState('4');
  const [start, setStart] = useState('0');
  const [lines, setLines] = useState<Lines>([]);
  function run() {
    setNote(null);
    try {
      const result = boltCircle(parseNum(diameter, 'diameter'), parseNum(count, 'count'), parseNum(start, 'start angle'));
      setLines(result.holes.map((hole) => ({ label: `Hole ${hole.index} (${hole.angleDeg}°)`, value: `x ${hole.x}, y ${hole.y}` })));
    } catch (error) {
      setLines([]);
      setNote(error instanceof Error ? error.message : 'Check the inputs.');
    }
  }
  return (
    <Screen title="Bolt circle" subtitle="0° is 12 o’clock. Angles increase clockwise. X is to the right and Y is up." >
      <CalcBack />
      <Field label="Bolt circle diameter" value={diameter} onChangeText={setDiameter} keyboardType="decimal-pad" />
      <Field label="Hole count" value={count} onChangeText={setCount} keyboardType="number-pad" />
      <Field label="Start angle (degrees)" value={start} onChangeText={setStart} keyboardType="numbers-and-punctuation" />
      <Button label="Calculate holes" onPress={run} />
      {note ? <Text>{note}</Text> : null}
      {lines.length > 0 ? (
        <>
          <ResultBlock lines={lines} extra={footer('x = (D/2) · sin(θ), y = (D/2) · cos(θ).', 'Same unit as the diameter.')} />
          <Button label="Share result" variant="secondary" onPress={() => void share('Bolt circle', lines, 'x = (D/2) · sin(θ), y = (D/2) · cos(θ).', 'Same unit as the diameter.')} />
        </>
      ) : null}
    </Screen>
  );
}

export function CalculatorKindScreen() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  if (kind === 'alignment') return <AlignmentCalculatorScreen />;
  if (kind === 'thermal') return <ThermalCalculatorScreen />;
  if (kind === 'grout') return <GroutCalculatorScreen />;
  if (kind === 'sling') return <SlingCalculatorScreen />;
  if (kind === 'units') return <UnitsCalculatorScreen />;
  if (kind === 'bolt-circle') return <BoltCalculatorScreen />;
  if (kind === 'flange') return <FlangeChartScreen />;
  if (kind === 'anchor') return <AnchorChartScreen />;
  if (kind === 'hold-down') return <HoldDownChartScreen />;
  if (kind === 'affinity') return <AffinityCalculatorScreen />;
  if (kind === 'npsh') return <NpshCalculatorScreen />;
  if (kind === 'polytropic') return <PolytropicCalculatorScreen />;
  if (kind === 'frequencies') return <FrequencyCalculatorScreen />;
  if (kind === 'coupling') return <CouplingCalculatorScreen />;
  if (kind === 'belt') return <BeltCalculatorScreen />;
  if (kind === 'field-units') return <FieldUnitsCalculatorScreen />;
  if (kind === 'bearing-life') return <BearingLifeCalculatorScreen />;
  if (kind === 'fractions') return <FractionChartScreen />;
  if (kind === 'conversion-chart') return <ConversionChartScreen />;
  if (kind === 'sockets') return <SocketChartScreen />;
  if (kind === 'drills') return <DrillChartScreen />;
  if (kind === 'belt-size') return <BeltSizeChartScreen />;
  if (kind === 'agitator') return <AgitatorCalculatorScreen />;
  if (kind === 'lube-oil') return <LubeOilScreen />;
  if (kind === 'iso-fits') return <IsoFitsScreen />;
  if (kind === 'grout-job') return <GroutJobScreen />;
  if (kind === 'rigging') return <RiggingScreen />;
  return (
    <Screen title="Calculator" >
      <CalcBack />
      <Banner title="Not found" body="That calculator is not in this build." />
    </Screen>
  );
}
