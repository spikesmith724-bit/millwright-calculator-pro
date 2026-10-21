import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { Banner, Button, Card, ChoiceRow, Field, Screen, SectionHeader } from '@/src/components/ui';
import { FLUSH_LIMIT_NOTE, FLUSH_TARGETS, ISO_VG_GRADES, VISCOSITY_NOTE } from '@/src/domain/lubrication/flushTargets';
import { lubeOilHtml } from '@/src/domain/lubrication/lubeOilHtml';
import { NAS_RANGES, NAS_ROWS, classifyNas, iso4406Code, type NasVerdict } from '@/src/domain/lubrication/nas1638';
import { LAB_LIMIT_NOTE, OIL_ANALYTES, OIL_GROUPS } from '@/src/domain/lubrication/oilAnalysis';
import type { OilExplanation } from '@/src/domain/lubrication/oilTypes';
import { CalcBack, parseNum } from '@/src/features/calculators/CalculatorScreens';
import { printToolList } from '@/src/services/export';
import { useAppTheme } from '@/src/theme/ThemeContext';

type Part = 'analysis' | 'flush' | 'nas';

const PARTS: { value: Part; label: string }[] = [
  { value: 'analysis', label: 'Oil analysis' },
  { value: 'flush', label: 'Flush targets' },
  { value: 'nas', label: 'NAS 1638' },
];

const ZOOM_STEPS = [1, 1.5, 2] as const;

/** Drop a camera temp file or blob URL. The notebook never receives a copy. */
function dropTransientPhoto(uri: string): void {
  if (uri.startsWith('blob:')) {
    const revoke = (globalThis as { URL?: { revokeObjectURL?: (value: string) => void } }).URL?.revokeObjectURL;
    revoke?.(uri);
    return;
  }
  if (!uri.startsWith('file:')) return;
  void import('expo-file-system')
    .then(({ File }) => {
      try {
        const file = new File(uri);
        if (file.exists) file.delete();
      } catch {
        // The on-screen copy is already cleared.
      }
    })
    .catch(() => undefined);
}

export function LubeOilScreen() {
  const [part, setPart] = useState<Part>('analysis');
  const [counts, setCounts] = useState(['', '', '', '', '']);
  const [cumulative, setCumulative] = useState(['', '', '']);
  const [verdict, setVerdict] = useState<NasVerdict | null>(null);
  const [isoCode, setIsoCode] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [printNote, setPrintNote] = useState<string | null>(null);
  const [shot, setShot] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<OilExplanation | null>(null);
  const [busy, setBusy] = useState(false);

  function setCount(index: number, value: string) {
    setCounts((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function setCumulativeCount(index: number, value: string) {
    setCumulative((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  }

  function classify() {
    setNote(null);
    setVerdict(null);
    setIsoCode(null);
    try {
      setVerdict(classifyNas(counts.map((value, index) => parseNum(value, NAS_RANGES[index] ?? 'count'))));
      const filled = cumulative.filter((value) => value.trim());
      if (filled.length > 0) {
        setIsoCode(iso4406Code(parseNum(cumulative[0] ?? '', '≥4 µm'), parseNum(cumulative[1] ?? '', '≥6 µm'), parseNum(cumulative[2] ?? '', '≥14 µm')));
      }
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Check the counts.');
    }
  }

  async function photograph() {
    if (busy) return;
    setBusy(true);
    setNote(null);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setNote('Camera permission is off. You can turn it on in Settings. Nothing is kept.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.6, exif: false });
      if (result.canceled || !result.assets[0]) return;
      const next = result.assets[0].uri;
      setExplanation(null);
      setShot((current) => {
        if (current && current !== next) dropTransientPhoto(current);
        return next;
      });
    } catch (error) {
      setNote(error instanceof Error ? error.message : 'Could not open the camera.');
    } finally {
      setBusy(false);
    }
  }

  function dismiss() {
    setExplanation(null);
    setShot((current) => {
      if (current) dropTransientPhoto(current);
      return null;
    });
  }

  const reference = part === 'analysis' || part === 'nas';

  return (
    <Screen title="Lube oil" subtitle="What a lab sheet is pointing at, flush cleanliness, and the NAS 1638 table. A photo stays on screen until you dismiss it.">
      <CalcBack />
      <ChoiceRow label="Part" options={PARTS} value={part} onChange={setPart} />
      {reference ? (
        <OilReference shot={shot} busy={busy} note={note} explanation={explanation} onSnap={() => photograph()} onExplain={() => undefined} onDismiss={dismiss} />
      ) : null}
      <Button
        label="Print lube oil section"
        variant="secondary"
        icon="print-outline"
        onPress={() => {
          void printToolList(lubeOilHtml())
            .then((message) => setPrintNote(message))
            .catch(() => setPrintNote('Could not open the print dialog.'));
        }}
      />
      {printNote ? <PrintNote message={printNote} /> : null}
      {part === 'analysis' ? <AnalysisPart /> : null}
      {part === 'flush' ? <FlushPart /> : null}
      {part === 'nas' ? (
        <NasPart
          counts={counts}
          cumulative={cumulative}
          verdict={verdict}
          isoCode={isoCode}
          onCount={setCount}
          onCumulative={setCumulativeCount}
          onClassify={classify}
        />
      ) : null}
    </Screen>
  );
}

function PrintNote({ message }: { message: string }) {
  const { theme } = useAppTheme();
  return <Text style={{ color: theme.color.textMuted, marginBottom: theme.space.md, lineHeight: theme.line.body }}>{message}</Text>;
}

function OilReference({
  shot,
  busy,
  note,
  explanation,
  onSnap,
  onExplain,
  onDismiss,
}: {
  shot: string | null;
  busy: boolean;
  note: string | null;
  explanation: OilExplanation | null;
  onSnap: () => void;
  onExplain: () => void;
  onDismiss: () => void;
}) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const [zoom, setZoom] = useState(1);
  const frame = Math.max(220, width - 48);
  return (
    <View style={{ marginBottom: theme.space.md }}>
      {shot ? (
        <>
          <Text style={{ color: theme.color.text, lineHeight: theme.line.body, marginBottom: theme.space.sm }}>
            On screen only. Dismiss it and it is gone. Nothing is uploaded or saved.
          </Text>
          <ScrollView horizontal={zoom > 1} style={{ marginBottom: theme.space.sm }}>
            <Image
              source={{ uri: shot }}
              accessibilityLabel="Oil report photo"
              resizeMode="contain"
              style={{ width: frame * zoom, height: 220 * zoom, backgroundColor: theme.color.surfaceMuted, borderRadius: 8 }}
            />
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: theme.space.sm }}>
            {ZOOM_STEPS.map((step) => (
              <Pressable
                key={step}
                accessibilityRole="button"
                accessibilityLabel={`Zoom ${step} times`}
                accessibilityState={{ selected: zoom === step }}
                onPress={() => setZoom(step)}
                style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: zoom === step ? theme.color.accent : theme.color.border, borderRadius: theme.radius.sm }}
              >
                <Text style={{ color: theme.color.text }}>{step === 1 ? 'Fit' : `${step}×`}</Text>
              </Pressable>
            ))}
          </View>
          <Button label="Retake" variant="secondary" icon="camera-outline" onPress={onSnap} disabled={busy} />
          {explanation ? <ExplanationCard explanation={explanation} /> : null}
          <Button label="Dismiss photo" variant="secondary" onPress={onDismiss} />
        </>
      ) : (
        <Button label={busy ? 'Opening the camera…' : 'Photograph the report'} icon="camera-outline" onPress={onSnap} disabled={busy} />
      )}
      {note ? <Text style={{ color: theme.color.text, lineHeight: theme.line.body, marginBottom: theme.space.md }}>{note}</Text> : null}
    </View>
  );
}

function ExplanationCard({ explanation }: { explanation: OilExplanation }) {
  const { theme } = useAppTheme();
  return (
    <View style={{ marginBottom: theme.space.md }}>
      <Text style={{ color: theme.color.text, lineHeight: theme.line.body, marginBottom: theme.space.sm }}>{explanation.note}</Text>
      {explanation.findings.map((finding) => (
        <Card key={`${finding.id}-${finding.value}`}>
          <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>{finding.label} · {finding.value}</Text>
          <Text style={{ color: theme.color.text, marginTop: 6, lineHeight: theme.line.body }}>{bandLabel(finding.band)}</Text>
          {finding.pointsTo ? <Text style={{ color: theme.color.text, marginTop: 6, lineHeight: theme.line.body }}>{finding.pointsTo}</Text> : null}
          {finding.watch ? <Text style={{ color: theme.color.text, marginTop: 6, lineHeight: theme.line.body }}>{finding.watch}</Text> : null}
          {finding.confirm ? <Text style={{ color: theme.color.text, marginTop: 6, lineHeight: theme.line.body }}>{finding.confirm}</Text> : null}
        </Card>
      ))}
      {explanation.confirms.map((item) => (
        <Text key={item} style={{ color: theme.color.text, lineHeight: theme.line.body, marginBottom: 6 }}>{item}</Text>
      ))}
    </View>
  );
}

function bandLabel(band: OilExplanation['findings'][number]['band']): string {
  if (band === 'in range') return 'In range';
  if (band === 'caution') return 'Caution';
  if (band === 'critical') return 'Critical';
  return 'Confirm this reading';
}

function AnalysisPart() {
  const { theme } = useAppTheme();
  return (
    <View>
      <Text style={{ color: theme.color.text, lineHeight: theme.line.body, marginBottom: theme.space.md }}>{LAB_LIMIT_NOTE}</Text>
      {OIL_GROUPS.map((group) => (
        <View key={group}>
          <SectionHeader title={group} />
          {OIL_ANALYTES.filter((item) => item.group === group).map((item) => (
            <Card key={item.id}>
              <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500', fontSize: theme.font.headline }}>{item.symbol} · {item.name}</Text>
              <Text style={{ color: theme.color.text, marginTop: 6, lineHeight: theme.line.body }}>{item.pointsTo}</Text>
              <Text style={{ color: theme.color.text, marginTop: 8, lineHeight: theme.line.body }}>Caution: {item.caution}</Text>
              <Text style={{ color: theme.color.text, marginTop: 4, lineHeight: theme.line.body }}>Critical: {item.critical}</Text>
            </Card>
          ))}
        </View>
      ))}
    </View>
  );
}

function FlushPart() {
  const { theme } = useAppTheme();
  return (
    <View>
      <Banner title="ISO VG is not cleanliness" body={VISCOSITY_NOTE} />
      <Text style={{ color: theme.color.textMuted, lineHeight: theme.line.body, marginBottom: theme.space.md }}>{FLUSH_LIMIT_NOTE}</Text>
      <SectionHeader title="Grades you will see" action={ISO_VG_GRADES.join(' · ')} />
      {FLUSH_TARGETS.map((item) => (
        <Card key={item.id}>
          <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>{item.equipment}</Text>
          <Text style={{ color: theme.color.text, marginTop: 6, lineHeight: theme.line.body }}>ISO 4406: {item.isoCode}</Text>
          <Text style={{ color: theme.color.text, marginTop: 4, lineHeight: theme.line.body }}>NAS: {item.nas}</Text>
          <Text style={{ color: theme.color.text, marginTop: 4, lineHeight: theme.line.body }}>ISO VG: {item.grades}</Text>
          <Text style={{ color: theme.color.textMuted, marginTop: 6, lineHeight: theme.line.body }}>{item.note}</Text>
        </Card>
      ))}
    </View>
  );
}

function NasPart({
  counts,
  cumulative,
  verdict,
  isoCode,
  onCount,
  onCumulative,
  onClassify,
}: {
  counts: string[];
  cumulative: string[];
  verdict: NasVerdict | null;
  isoCode: string | null;
  onCount: (index: number, value: string) => void;
  onCumulative: (index: number, value: string) => void;
  onClassify: () => void;
}) {
  const { theme } = useAppTheme();
  const cumulativeLabels = ['≥4 µm per mL', '≥6 µm per mL', '≥14 µm per mL'];
  return (
    <View>
      <Text style={{ color: theme.color.text, lineHeight: theme.line.body, marginBottom: theme.space.md }}>
        Maximum particles per 100 mL. The class of a sample is the worst range. The ISO column is approximate.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={{ flexDirection: 'row' }}>
            <Text style={head(theme.color.text)}>Class</Text>
            {NAS_RANGES.map((range) => (
              <Text key={range} style={head(theme.color.text)}>{range}</Text>
            ))}
            <Text style={head(theme.color.text)}>Approx. ISO</Text>
          </View>
          {NAS_ROWS.map((row) => (
            <View key={row.className} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: theme.color.border }}>
              <Text style={cell(theme.color.text, theme.fontFamily.medium)}>{row.className}</Text>
              {row.counts.map((count, index) => (
                <Text key={`${row.className}-${NAS_RANGES[index]}`} style={cell(theme.color.text, theme.fontFamily.regular)}>{count.toLocaleString('en-US')}</Text>
              ))}
              <Text style={cell(theme.color.text, theme.fontFamily.regular)}>{row.approximateIso ?? '—'}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <SectionHeader title="Counts to a class" />
      <Text style={{ color: theme.color.textMuted, lineHeight: theme.line.body, marginBottom: theme.space.md }}>
        Enter the five differential counts per 100 mL. Classes 00 and 0 are cleaner than the class 1 approximation of 12/10/7.
      </Text>
      {NAS_RANGES.map((range, index) => (
        <Field key={range} label={`${range} per 100 mL`} value={counts[index] ?? ''} onChangeText={(value) => onCount(index, value)} keyboardType="decimal-pad" />
      ))}
      <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, marginBottom: 8 }}>Cumulative counts, if you have them</Text>
      {cumulativeLabels.map((label, index) => (
        <Field key={label} label={label} value={cumulative[index] ?? ''} onChangeText={(value) => onCumulative(index, value)} keyboardType="decimal-pad" />
      ))}
      <Button label="Get the class" onPress={onClassify} />
      {verdict ? (
        <Card>
          <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500', fontSize: theme.font.headline }}>NAS {verdict.overall}</Text>
          <Text style={{ color: theme.color.text, marginTop: 6, lineHeight: theme.line.body }}>
            Set by {verdict.drivers.join(', ')}.
          </Text>
          <Text style={{ color: theme.color.text, marginTop: 6, lineHeight: theme.line.body }}>
            {verdict.approximateIso ? `Approximate ISO 4406: ${verdict.approximateIso}` : 'Cleaner than the class 1 approximation of 12/10/7. No approximate ISO code is listed for this class.'}
          </Text>
          {isoCode ? <Text style={{ color: theme.color.text, marginTop: 6, lineHeight: theme.line.body }}>ISO 4406 from the cumulative counts: {isoCode}</Text> : null}
          <Text style={{ color: theme.color.textMuted, marginTop: 8, lineHeight: theme.line.body }}>
            The approximate code is a crosswalk, not a count. The cumulative line is the ISO 4406 scale for particles per millilitre.
          </Text>
        </Card>
      ) : null}
    </View>
  );
}

function head(color: string) {
  return { width: 88, color, fontFamily: 'Inter_500Medium', fontWeight: '500' as const, fontSize: 12, paddingVertical: 6, paddingRight: 8 };
}

function cell(color: string, family: string) {
  return { width: 88, color, fontFamily: family, fontSize: 14, paddingVertical: 6, paddingRight: 8 };
}
