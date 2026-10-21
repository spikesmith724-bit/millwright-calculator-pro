import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Banner, Button, ChoiceRow, Field, Screen } from '@/src/components/ui';
import { DRILL_NOTE, drillChartHtml, listDrills, searchDrills, type DrillRow, type DrillType, type DrillView } from '@/src/domain/calculators/drills';
import { CalcBack } from '@/src/features/calculators/CalculatorScreens';
import { printToolList } from '@/src/services/export';
import { useAppTheme } from '@/src/theme/ThemeContext';

const VIEWS: { value: DrillView; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'number', label: 'Number' },
  { value: 'letter', label: 'Letter' },
  { value: 'fraction', label: 'Fraction' },
  { value: 'size', label: 'By size' },
];

const SECTION: Record<DrillType, string> = {
  number: 'Number, #1 through #80',
  letter: 'Letter, A through Z',
  fraction: 'Fractional, 1/64 through 1',
};

export function DrillChartScreen() {
  const { theme } = useAppTheme();
  const [view, setView] = useState<DrillView>('all');
  const [query, setQuery] = useState('');
  const [printNote, setPrintNote] = useState<string | null>(null);
  const rows = useMemo(() => searchDrills(listDrills(view), query), [view, query]);

  async function printChart() {
    setPrintNote(null);
    setPrintNote(await printToolList(drillChartHtml()));
  }

  return (
    <Screen title="Drill index" subtitle="Number drills #1 to #80, letter drills A to Z, and fractional drills from 1/64 in through 1 in. Reference only.">
      <CalcBack />
      <ChoiceRow label="Show" options={VIEWS} value={view} onChange={setView} />
      <Field label="Search" value={query} onChangeText={setQuery} placeholder="#7, A, 1/4, or 0.201" autoCapitalize="none" />
      <Text style={{ color: theme.color.textMuted, marginBottom: theme.space.md, lineHeight: theme.line.body }}>{DRILL_NOTE}</Text>
      <Button label="Print chart" variant="secondary" icon="print-outline" onPress={() => void printChart()} />
      {printNote ? <Text style={{ color: theme.color.textMuted, marginBottom: theme.space.md, lineHeight: theme.line.body }}>{printNote}</Text> : null}
      <View style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: theme.color.bronze }}>
        <Text style={[headStyle(theme.color.accentText, theme.fontFamily.medium), { flex: 0.9 }]}>Size</Text>
        <Text style={[headStyle(theme.color.accentText, theme.fontFamily.medium), { textAlign: 'right' }]}>Decimal in</Text>
        <Text style={[headStyle(theme.color.accentText, theme.fontFamily.medium), { textAlign: 'right' }]}>Thou</Text>
        <Text style={[headStyle(theme.color.accentText, theme.fontFamily.medium), { textAlign: 'right' }]}>mm</Text>
      </View>
      {rows.length === 0 ? <Banner title="No match" body="Try #7, A, 1/4, or 0.201." /> : null}
      {rows.map((row, index) => (
        <View key={`${row.type}-${row.name}`}>
          {sectionTitle(view, row, rows[index - 1]) ? (
            <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.medium, fontWeight: '500', marginTop: 12, marginBottom: 4 }}>{SECTION[row.type]}</Text>
          ) : null}
          <View
            style={{
              flexDirection: 'row',
              minHeight: 36,
              alignItems: 'center',
              backgroundColor: index % 2 === 0 ? theme.color.surfaceMuted : theme.color.surface,
              borderBottomWidth: 1,
              borderBottomColor: theme.color.border,
              paddingHorizontal: 8,
            }}
          >
            <Text style={[cellStyle(theme.color.text, theme.fontFamily.medium, '500'), { flex: 0.9 }]}>{row.name}</Text>
            <Text style={[cellStyle(theme.color.text, theme.fontFamily.regular, '400'), { textAlign: 'right' }]}>{row.decimal}</Text>
            <Text style={[cellStyle(theme.color.text, theme.fontFamily.regular, '400'), { textAlign: 'right' }]}>{row.thousandths}</Text>
            <Text style={[cellStyle(theme.color.text, theme.fontFamily.regular, '400'), { textAlign: 'right' }]}>{row.mmLabel}</Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}

function sectionTitle(view: DrillView, row: DrillRow, previous: DrillRow | undefined): boolean {
  return view === 'all' && previous?.type !== row.type;
}

function headStyle(color: string, family: string) {
  return { flex: 1, color, fontFamily: family, fontWeight: '500' as const, fontSize: 13, fontVariant: ['tabular-nums' as const] };
}

function cellStyle(color: string, family: string, weight: '400' | '500') {
  return { flex: 1, color, fontFamily: family, fontWeight: weight, fontSize: 15, fontVariant: ['tabular-nums' as const] };
}
