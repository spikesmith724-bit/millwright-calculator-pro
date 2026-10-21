import { LinearGradient } from 'expo-linear-gradient';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { Motif } from '@/src/components/motif';
import { useAppTheme } from '@/src/theme/ThemeContext';
import type { ThemeTokens } from '@/src/theme/tokens';

/** Brushed plate. Many close stops stand in for a texture image so Expo Go stays light. */
export function BrushedMetal({
  children,
  colors,
  style,
  vertical = false,
}: {
  children?: React.ReactNode;
  colors: readonly [string, string, ...string[]];
  style?: StyleProp<ViewStyle>;
  vertical?: boolean;
}) {
  return (
    <LinearGradient
      colors={colors as unknown as [string, string, ...string[]]}
      start={vertical ? { x: 0.5, y: 0 } : { x: 0, y: 0.5 }}
      end={vertical ? { x: 0.5, y: 1 } : { x: 1, y: 0.5 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}

export function plateColors(theme: ThemeTokens): [string, string, ...string[]] {
  if (theme.name === 'pro') {
    return [theme.color.surfaceMuted, theme.color.gunmetal, theme.color.surface, theme.color.gunmetal];
  }
  return ['#FFFFFF', '#FFFFFF', '#F6F6F6'];
}

export function primaryBevel(theme: ThemeTokens, pressed: boolean): [string, string, ...string[]] {
  if (pressed) return [theme.color.accentPressed, theme.color.accentPressed, theme.color.accentPressed];
  if (theme.name === 'pro') return ['#E2C48A', theme.color.accent, theme.color.accentPressed];
  return ['#2E2E2E', theme.color.accent, theme.color.accentPressed];
}

export function secondaryBevel(theme: ThemeTokens, pressed: boolean): [string, string, ...string[]] {
  if (theme.name === 'pro') {
    // Pro: dark gunmetal face so the gold/bronze label (accentText) stays readable.
    if (pressed) return [theme.color.background, theme.color.background, theme.color.background];
    return ['#3A4046', theme.color.surfaceMuted, theme.color.surface, '#22272C'];
  }
  if (pressed) return [theme.color.accentSoft, theme.color.accentSoft, theme.color.accentSoft];
  return ['#FFFFFF', '#FFFFFF', '#F6F6F6'];
}

export function Rivet({ style }: { style?: StyleProp<ViewStyle> }) {
  const { theme } = useAppTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: theme.color.steel,
          borderWidth: 1,
          borderTopColor: theme.color.steelLight,
          borderLeftColor: theme.color.steelLight,
          borderRightColor: theme.color.gunmetal,
          borderBottomColor: theme.color.gunmetal,
        },
        style,
      ]}
    />
  );
}

export function MachinedBezel({
  children,
  size = 76,
  pressed = false,
  tone = 'steel',
}: {
  children: React.ReactNode;
  size?: number;
  pressed?: boolean;
  tone?: 'steel' | 'bronze';
}) {
  const { theme } = useAppTheme();
  const ring: [string, string, ...string[]] =
    tone === 'bronze'
      ? ['#E3C766', '#C9A227', '#8F7318', '#C9A227', '#E3C766']
      : [theme.color.steelLight, theme.color.steel, theme.color.gunmetal, theme.color.steel, theme.color.steelLight];
  return (
    <BrushedMetal
      colors={ring}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        padding: 4,
        boxShadow: pressed ? '0px 1px 2px rgba(26, 20, 15, 0.2)' : '0px 4px 8px rgba(26, 20, 15, 0.28)',
      }}
    >
      <View
        style={{
          flex: 1,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: theme.color.bronze,
          backgroundColor: pressed ? theme.color.accentPressed : theme.color.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    </BrushedMetal>
  );
}

/** Gear or bolt sitting on a rule, never under body copy. */
export function MetalRule() {
  const { theme } = useAppTheme();
  const colors: [string, string, ...string[]] = [theme.color.steelLight, theme.color.gunmetal, theme.color.bronze];
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <BrushedMetal colors={colors} style={{ flex: 1, height: 3, borderRadius: 2 }} />
      <Motif name="gear" color={theme.color.bronze} size={16} />
      <BrushedMetal colors={[...colors].reverse() as [string, string, ...string[]]} style={{ flex: 1, height: 3, borderRadius: 2 }} />
    </View>
  );
}
