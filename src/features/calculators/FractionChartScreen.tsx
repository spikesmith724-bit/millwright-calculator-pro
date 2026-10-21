import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Banner, Button, Card, Field, Screen } from '@/src/components/ui';
import { fractionChartHtml, nearestSixtyFourth, searchFractions, type FractionMatch } from '@/src/domain/calculators/fractions';
import { CalcBack, footer, ResultBlock, useSaveShare, type Lines } from '@/src/features/calculators/CalculatorScreens';
import { printToolList } from '@/src/services/export';
import { useAppTheme } from '@/src/theme/ThemeContext';

export function FractionChartScreen() {
  const { theme } = useAppTheme();
  const { note, setNote, share } = useSaveShare();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<FractionMatch | null>(null);
  const [printNote, setPrintNote] = useState<string | null>(null);
  const rows = useMemo(() => searchFractions(query), [query]);
  const lines: Lines = match
    ? [
        { label: 'Nearest 64th', value: match.fraction },
        { label: 'Decimal inches', value: match.decimalIn },
        { label: 'Millimeters', value: match.mmLabel },
        { label: 'Fit', value: match.exact ? 'Exact' : `${match.deltaIn > 0 ? '+' : ''}${match.deltaIn} in from the 64th` },
      ]
    : [];

  function run() {
    setError(null);
    setNote(null);
    try {
      setMatch(nearestSixtyFourth(draft));
    } catch (reason) {
      setMatch(null);
      setError(reason instanceof Error ? reason.message : 'Check the length.');
    }
  }

  async function printChart() {
    setPrintNote(null);
    const lead = match ? `Nearest 64th for ${draft.trim() || 'the length'} is ${match.fraction} (${match.decimalIn} in, ${match.mmLabel} mm).` : '';
    setPrintNote(await printToolList(fractionChartHtml(lead)));
  }

  return (
    <Screen title="Fraction chart" subtitle="1/64 through 1 inch. Fractions are in lowest terms. Decimal inches are shown to 4 places.">
      <CalcBack />
      <Field label="Search" value={query} onChangeText={setQuery} placeholder="1/2, 0.25, or 12.7" autoCapitalize="none" />
      <Card>
        <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500', marginBottom: 8 }}>Nearest 64th</Text>
        <Field label="Fraction or decimal" value={draft} onChangeText={setDraft} placeholder="3/8 or 0.375" autoCapitalize="none" />
        <Button label="Find nearest" onPress={run} />
        {error ? <Banner title="Input" tone="warning" body={error} /> : null}
        {match ? (
          <>
            <ResultBlock lines={lines} extra={footer(match.formula, match.units)} />
            <Button label="Share result" variant="secondary" onPress={() => void share('Fraction chart', lines, match.formula, match.units)} />
          </>
        ) : null}
      </Card>
      <Button label="Print chart" variant="secondary" icon="print-outline" onPress={() => void printChart()} />
      {printNote ? <Text style={{ color: theme.color.textMuted, marginBottom: theme.space.md, lineHeight: theme.line.body }}>{printNote}</Text> : null}
      {note ? <Banner title="Saved" body={note} /> : null}
      <View style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: theme.color.bronze }}>
        <Text style={headStyle(theme.color.accentText, theme.fontFamily.medium)}>Fraction</Text>
        <Text style={[headStyle(theme.color.accentText, theme.fontFamily.medium), { textAlign: 'right' }]}>Decimal in</Text>
        <Text style={[headStyle(theme.color.accentText, theme.fontFamily.medium), { textAlign: 'right' }]}>mm</Text>
      </View>
      {rows.length === 0 ? <Banner title="No match" body="Try 1/2, 0.5, or 12.7." /> : null}
      {rows.map((row) => {
        const marked = match != null && Math.round(match.inches * 64) === row.steps;
        const strong = row.steps % 8 === 0;
        return (
          <View
            key={row.steps}
            style={{
              flexDirection: 'row',
              minHeight: 36,
              alignItems: 'center',
              backgroundColor: marked ? theme.color.accentSoft : row.steps % 2 === 0 ? theme.color.surfaceMuted : theme.color.surface,
              borderLeftWidth: 3,
              borderLeftColor: marked ? theme.color.bronze : 'transparent',
              borderBottomWidth: 1,
              borderBottomColor: theme.color.border,
              paddingHorizontal: 8,
            }}
          >
            <Text style={cellStyle(theme.color.text, strong ? theme.fontFamily.bold : theme.fontFamily.regular, strong)}>{row.fraction}</Text>
            <Text style={[cellStyle(theme.color.text, theme.fontFamily.regular, strong), { textAlign: 'right' }]}>{row.decimalIn}</Text>
            <Text style={[cellStyle(theme.color.text, theme.fontFamily.regular, strong), { textAlign: 'right' }]}>{row.mmLabel}</Text>
          </View>
        );
      })}
    </Screen>
  );
}

function headStyle(color: string, family: string) {
  return { flex: 1, color, fontFamily: family, fontWeight: '500' as const, fontVariant: ['tabular-nums' as const] };
}

function cellStyle(color: string, family: string, strong: boolean) {
  return { flex: 1, color, fontFamily: family, fontWeight: strong ? ('700' as const) : ('400' as const), fontSize: 16, fontVariant: ['tabular-nums' as const] };
}
