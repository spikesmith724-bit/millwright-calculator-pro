import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Field, Screen, SectionHeader } from '@/src/components/ui';
import { CATEGORIES, searchCalculators } from '@/src/domain/calculators/catalog';
import { useAppTheme } from '@/src/theme/ThemeContext';

export function HomeScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const [query, setQuery] = useState('');
  const hits = useMemo(() => searchCalculators(query), [query]);
  return (
    <Screen title="Calculators" subtitle="Field math for millwrights. Works offline. Every result names its formula. Verify against OEM specs and site procedures.">
      <Field label="Search calculators" value={query} onChangeText={setQuery} placeholder="torque, alignment, belt, grout…" autoCapitalize="none" />
      {hits.length === 0 ? <Text style={{ color: theme.color.textMuted, marginBottom: 12 }}>No calculator matches “{query}”.</Text> : null}
      {CATEGORIES.map((category) => {
        const items = hits.filter((entry) => entry.category === category.id);
        if (items.length === 0) return null;
        return (
          <View key={category.id}>
            <SectionHeader title={category.title} action={String(items.length)} />
            {items.map((item) => (
              <Pressable
                key={item.kind}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.title}`}
                onPress={() => router.push(`/calculators/${item.kind}`)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? theme.color.accentSoft : theme.color.surface,
                  borderWidth: 1,
                  borderColor: theme.color.border,
                  borderLeftWidth: 4,
                  borderLeftColor: theme.color.highlight,
                  borderRadius: theme.radius.md,
                  padding: theme.space.lg,
                  marginBottom: theme.space.sm,
                  minHeight: theme.control.minTouch,
                })}
              >
                <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.bold, fontWeight: '700', fontSize: theme.font.subheading }}>{item.title}</Text>
                <Text style={{ color: theme.color.textMuted, marginTop: 4, lineHeight: theme.line.caption, fontSize: theme.font.caption }}>{item.body}</Text>
              </Pressable>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}
