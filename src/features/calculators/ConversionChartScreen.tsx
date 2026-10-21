import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, Screen } from '@/src/components/ui';
import { conversionChart, conversionChartHtml } from '@/src/domain/calculators/units';
import { CalcBack } from '@/src/features/calculators/CalculatorScreens';
import { printToolList } from '@/src/services/export';
import { useAppTheme } from '@/src/theme/ThemeContext';

export function ConversionChartScreen() {
  const { theme } = useAppTheme();
  const [printNote, setPrintNote] = useState<string | null>(null);
  const groups = conversionChart();

  async function printChart() {
    setPrintNote(null);
    setPrintNote(await printToolList(conversionChartHtml()));
  }

  return (
    <Screen title="Conversion chart" subtitle="Common metric and imperial factors, both directions. The card rounds to six significant figures. The converter keeps the full factor.">
      <CalcBack />
      <Button label="Print chart" variant="secondary" icon="print-outline" onPress={() => void printChart()} />
      {printNote ? <Text style={{ color: theme.color.textMuted, marginBottom: theme.space.md, lineHeight: theme.line.body }}>{printNote}</Text> : null}
      {groups.map((group) => (
        <View key={group.title} style={{ marginBottom: theme.space.lg }}>
          <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.medium, fontWeight: '500', fontSize: theme.font.headline, marginBottom: 4 }}>{group.title}</Text>
          {group.notes.map((note) => (
            <Text key={note} style={{ color: theme.color.textMuted, marginBottom: 8, lineHeight: theme.line.body }}>
              {note}
            </Text>
          ))}
          <View style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: theme.color.bronze }}>
            <Text style={headStyle(theme.color.accentText, theme.fontFamily.medium)}>From</Text>
            <Text style={[headStyle(theme.color.accentText, theme.fontFamily.medium), { textAlign: 'right' }]}>Equals</Text>
          </View>
          {group.rows.map((row, index) => (
            <View
              key={`${row.left}-${row.right}`}
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
              <Text style={cellStyle(theme.color.text, theme.fontFamily.regular)}>{row.left}</Text>
              <Text style={[cellStyle(theme.color.text, theme.fontFamily.regular), { textAlign: 'right' }]}>{row.right}</Text>
            </View>
          ))}
        </View>
      ))}
    </Screen>
  );
}

function headStyle(color: string, family: string) {
  return { flex: 1, color, fontFamily: family, fontWeight: '500' as const, fontVariant: ['tabular-nums' as const] };
}

function cellStyle(color: string, family: string) {
  return { flex: 1, color, fontFamily: family, fontWeight: '400' as const, fontSize: 16, fontVariant: ['tabular-nums' as const] };
}
