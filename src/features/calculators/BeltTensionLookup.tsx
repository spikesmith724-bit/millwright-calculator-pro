import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Banner, Button, Field } from '@/src/components/ui';
import {
  BANDED_NOTE,
  FHP_NOTE,
  GAUGE_CAPACITY_NOTE,
  MEASURED_SECTIONS,
  PENCIL_GAUGE_STEPS,
  RUN_IN_COPY,
  STATIC_TENSION_COPY,
  TENSION_LOOKUP_NOTE,
  readyBeltStamp,
  sectionSize,
  suggestBeltStamps,
  tensionCard,
  type BeltStamp,
  type TensionSection,
} from '@/src/domain/calculators/beltTension';
import { useAppTheme } from '@/src/theme/ThemeContext';

type PathChoice = 'number' | 'measure' | null;

export function BeltTensionLookup() {
  const { theme } = useAppTheme();
  const [path, setPath] = useState<PathChoice>(null);
  const [belt, setBelt] = useState('');
  const [section, setSection] = useState<TensionSection | null>(null);
  const [tape, setTape] = useState('');
  const [span, setSpan] = useState('32');
  const stamp = useMemo(() => (path === 'number' ? readyBeltStamp(belt) : section ? readyBeltStamp(section) : null), [path, belt, section]);
  const spanInches = readSpan(span);
  const tapeInches = path === 'measure' ? readSpan(tape) : null;
  const card = stamp && spanInches ? tensionCard(stamp, spanInches, tapeInches) : null;
  const suggestions =
    path === 'number' && stamp?.lengthInches == null
      ? suggestBeltStamps(belt)
          .filter((code) => code !== stamp?.code)
          .slice(0, belt.trim() ? 8 : 6)
      : [];

  function reset() {
    setPath(null);
    setBelt('');
    setSection(null);
    setTape('');
  }

  if (!path) {
    return (
      <View>
        <Button label="I have the belt number" onPress={() => setPath('number')} />
        <Button label="No number, just the belt" variant="secondary" onPress={() => setPath('measure')} />
        <Text style={{ color: theme.color.textMuted, marginTop: theme.space.md, lineHeight: theme.line.body }}>{TENSION_LOOKUP_NOTE}</Text>
      </View>
    );
  }

  return (
    <View>
      <Button label="Start over" variant="text" onPress={reset} />
      {path === 'number' ? (
        <Field label="Belt number" value={belt} onChangeText={setBelt} autoCapitalize="characters" placeholder="A42, 3L350, or 3/5V1000" />
      ) : (
        <Text style={{ color: theme.color.text, marginBottom: theme.space.md, lineHeight: theme.line.body }}>
          Measure the top width with a tape. Pick the closest section.
        </Text>
      )}
      {suggestions.map((code) => (
        <Pressable
          key={code}
          accessibilityRole="button"
          accessibilityLabel={code}
          onPress={() => setBelt(code)}
          style={{
            minHeight: theme.control.minTouch,
            justifyContent: 'center',
            paddingHorizontal: theme.space.md,
            marginBottom: theme.space.sm,
            borderWidth: 1,
            borderColor: theme.color.border,
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.surface,
          }}
        >
          <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>{code}</Text>
        </Pressable>
      ))}
      {path === 'measure' && !section ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {MEASURED_SECTIONS.map((id) => (
            <SectionChoice key={id} id={id} onPress={() => setSection(id)} />
          ))}
        </View>
      ) : null}
      {card && stamp ? <AnswerCard stamp={stamp} card={card} path={path} tape={tape} span={span} onTape={setTape} onSpan={setSpan} /> : null}
    </View>
  );
}

function AnswerCard({
  stamp,
  card,
  path,
  tape,
  span,
  onTape,
  onSpan,
}: {
  stamp: BeltStamp;
  card: ReturnType<typeof tensionCard>;
  path: PathChoice;
  tape: string;
  span: string;
  onTape: (value: string) => void;
  onSpan: (value: string) => void;
}) {
  const { theme } = useAppTheme();
  return (
    <View
      style={{
        marginTop: theme.space.md,
        padding: theme.space.md,
        borderWidth: 1,
        borderColor: theme.color.bronze,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.color.surface,
      }}
    >
      <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500', fontSize: theme.font.headline, lineHeight: theme.line.headline, marginBottom: theme.space.sm }}>
        {card.headline}
      </Text>
      <Text style={{ color: theme.color.text, lineHeight: theme.line.body, marginBottom: theme.space.md }}>{card.size}</Text>
      {path === 'measure' ? (
        <Field label="Tape around the belt" value={tape} onChangeText={onTape} keyboardType="decimal-pad" autoCapitalize="none" hint="Inches around the outside. Or leave this and set the span." />
      ) : null}
      <Field label="Span" value={span} onChangeText={onSpan} keyboardType="decimal-pad" autoCapitalize="none" hint="Inches from shaft to shaft along the belt. Deflection is 1/64 in per inch." />
      <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.medium, fontWeight: '500', marginBottom: theme.space.sm }}>By small sheave</Text>
      {card.rows.map((row) => (
        <View key={row.key} style={{ marginBottom: theme.space.sm, paddingBottom: theme.space.sm, borderBottomWidth: 1, borderBottomColor: theme.color.border }}>
          <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>{row.title}</Text>
          <Text style={{ color: theme.color.text, fontVariant: ['tabular-nums'] }}>{row.body}</Text>
        </View>
      ))}
      {card.overGauge ? <Banner title="Above the pencil gauge" body={GAUGE_CAPACITY_NOTE} /> : null}
      {stamp.fhp ? <Detail body={FHP_NOTE} /> : null}
      {stamp.banded ? <Detail body={BANDED_NOTE} /> : null}
      <Detail title="Static tension" body={STATIC_TENSION_COPY} />
      <Detail body={RUN_IN_COPY} />
      {PENCIL_GAUGE_STEPS.map((step, index) => (
        <Detail key={step} title={`${index + 1}.`} body={step} />
      ))}
    </View>
  );
}

function SectionChoice({ id, onPress }: { id: (typeof MEASURED_SECTIONS)[number]; onPress: () => void }) {
  const { theme } = useAppTheme();
  const size = sectionSize(id);
  const top = size?.topFraction ?? '';
  const depth = size?.depthFraction ?? '';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Section ${id}, top ${top} in`}
      onPress={onPress}
      style={{
        width: '48%',
        minHeight: 132,
        marginBottom: theme.space.sm,
        padding: theme.space.sm,
        borderWidth: 1,
        borderColor: theme.color.bronze,
        borderRadius: theme.radius.md,
        backgroundColor: theme.color.surface,
        alignItems: 'center',
      }}
    >
      {size ? <BeltSectionFigure topInches={size.topInches} depthInches={size.depthInches} color={theme.color.bronze} /> : null}
      <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>{id}</Text>
      <Text style={{ color: theme.color.text, textAlign: 'center' }}>
        {top} × {depth} in
      </Text>
      {id.endsWith('L') ? <Text style={{ color: theme.color.textMuted, textAlign: 'center' }}>Light-duty</Text> : null}
    </Pressable>
  );
}

function BeltSectionFigure({ topInches, depthInches, color }: { topInches: number; depthInches: number; color: string }) {
  const canvasW = 76;
  const canvasH = 48;
  const topPx = Math.max(16, (topInches / 1.25) * 68);
  const depthPx = Math.max(10, (depthInches / 0.875) * 32);
  const inset = Math.min(topPx / 2 - 3, depthPx * Math.tan(Math.PI / 9));
  const x = (canvasW - topPx) / 2;
  const y = 4;
  const d = `M ${x} ${y} L ${x + topPx} ${y} L ${x + topPx - inset} ${y + depthPx} L ${x + inset} ${y + depthPx} Z`;
  return (
    <Svg width={canvasW} height={canvasH}>
      <Path d={d} fill={color} />
    </Svg>
  );
}

function Detail({ title, body }: { title?: string; body: string }) {
  const { theme } = useAppTheme();
  return (
    <View style={{ marginBottom: theme.space.sm }}>
      {title ? <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>{title}</Text> : null}
      <Text style={{ color: theme.color.text, lineHeight: theme.line.body }}>{body}</Text>
    </View>
  );
}

function readSpan(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}
