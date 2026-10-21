import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Banner, Button, ChoiceRow, Field, Screen } from '@/src/components/ui';
import { searchSockets, SOCKET_NOTE, socketChartHtml, socketRows, type SocketDirection, type SocketFit, type SocketRow } from '@/src/domain/calculators/sockets';
import { CalcBack } from '@/src/features/calculators/CalculatorScreens';
import { printToolList } from '@/src/services/export';
import { useAppTheme } from '@/src/theme/ThemeContext';

const DIRECTIONS: { value: SocketDirection; label: string }[] = [
  { value: 'inch-to-metric', label: 'Inch to metric' },
  { value: 'metric-to-inch', label: 'Metric to inch' },
];

export function SocketChartScreen() {
  const { theme } = useAppTheme();
  const [direction, setDirection] = useState<SocketDirection>('inch-to-metric');
  const [query, setQuery] = useState('');
  const [printNote, setPrintNote] = useState<string | null>(null);
  const rows = useMemo(() => searchSockets(socketRows(direction), query), [direction, query]);
  const inchToMetric = direction === 'inch-to-metric';

  async function printChart() {
    setPrintNote(null);
    setPrintNote(await printToolList(socketChartHtml()));
  }

  return (
    <Screen title="Socket cross-reference" subtitle="1/4 in through 2 in, in 1/16 steps, and the metric sockets across that span. Reference only.">
      <CalcBack />
      <ChoiceRow label="Direction" options={DIRECTIONS} value={direction} onChange={setDirection} />
      <Field label="Search" value={query} onChangeText={setQuery} placeholder="1/2, 13, or 19.05" autoCapitalize="none" />
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.space.md, lineHeight: theme.line.body }}>{SOCKET_NOTE}</Text>
      <Button label="Print chart" variant="secondary" icon="print-outline" onPress={() => void printChart()} />
      {printNote ? <Text style={{ color: theme.color.textMuted, marginBottom: theme.space.md, lineHeight: theme.line.body }}>{printNote}</Text> : null}
      <View style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: theme.color.bronze }}>
        <Text style={headStyle(theme.color.accentText, theme.fontFamily.medium)}>{inchToMetric ? 'Inch' : 'mm'}</Text>
        <Text style={[headStyle(theme.color.accentText, theme.fontFamily.medium), { textAlign: 'right' }]}>{inchToMetric ? 'Exact mm' : 'Exact in'}</Text>
        <Text style={[headStyle(theme.color.accentText, theme.fontFamily.medium), { textAlign: 'right' }]}>{inchToMetric ? 'Metric' : 'Inch'}</Text>
        <Text style={[headStyle(theme.color.accentText, theme.fontFamily.medium), { textAlign: 'right' }]}>Δ mm</Text>
      </View>
      {rows.length === 0 ? <Banner title="No match" body="Try 1/2, 13, or 19.05." /> : null}
      {rows.map((row) => (
        <View key={`${row.direction}-${row.nominal}`} style={{ borderBottomWidth: 1, borderBottomColor: theme.color.border, backgroundColor: band(row, theme.color.surface, theme.color.surfaceMuted), paddingHorizontal: 8, paddingVertical: 6 }}>
          <View style={{ flexDirection: 'row', minHeight: 28, alignItems: 'center' }}>
            <Text style={cellStyle(theme.color.text, theme.fontFamily.medium, '500')}>{row.nominal}</Text>
            <Text style={[cellStyle(theme.color.text, theme.fontFamily.regular, '400'), { textAlign: 'right' }]}>{row.exactLabel}</Text>
            <Text style={[cellStyle(theme.color.text, theme.fontFamily.regular, '400'), { textAlign: 'right' }]}>{row.nearest}</Text>
            <Text style={[cellStyle(theme.color.text, theme.fontFamily.regular, '400'), { textAlign: 'right' }]}>{row.diffLabel}</Text>
          </View>
          <Text style={{ color: fitColor(row.fit, theme.color), fontFamily: theme.fontFamily.medium, fontWeight: '500', marginTop: 2 }}>{row.fit}</Text>
        </View>
      ))}
    </Screen>
  );
}

function band(row: SocketRow, surface: string, muted: string): string {
  const index = row.direction === 'inch-to-metric' ? Math.round(row.inches * 16) : Number(row.nominal);
  return index % 2 === 0 ? muted : surface;
}

function fitColor(fit: SocketFit, color: { success: string; warning: string; danger: string; text: string }): string {
  if (fit === 'interchangeable') return color.success;
  if (fit === 'snug/loose - use caution') return color.warning;
  if (fit === 'no good match') return color.danger;
  return color.text;
}

function headStyle(color: string, family: string) {
  return { flex: 1, color, fontFamily: family, fontWeight: '500' as const, fontSize: 13, fontVariant: ['tabular-nums' as const] };
}

function cellStyle(color: string, family: string, weight: '400' | '500') {
  return { flex: 1, color, fontFamily: family, fontWeight: weight, fontSize: 15, fontVariant: ['tabular-nums' as const] };
}
