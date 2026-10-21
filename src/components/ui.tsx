import { Ionicons } from '@expo/vector-icons';
import { Pressable, RefreshControl, ScrollView, Switch, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrushedMetal, MachinedBezel, MetalRule, plateColors, primaryBevel, Rivet, secondaryBevel } from '@/src/components/metal';
import { Motif } from '@/src/components/motif';
import { hapticTap } from '@/src/theme/haptics';
import { useAppTheme } from '@/src/theme/ThemeContext';
import { freeTheme, type ThemeTokens } from '@/src/theme/tokens';

function raisedShadow(theme: ThemeTokens, pressed: boolean) {
  const y = pressed ? 1 : theme.shadow.offsetY;
  const blur = pressed ? 4 : theme.shadow.radius;
  const alpha = pressed ? 0.08 : theme.shadow.opacity;
  return {
    boxShadow: `0px ${y}px ${blur}px rgba(26, 39, 68, ${alpha})`,
  };
}

export function Wordmark() {
  const { theme } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
      <MachinedBezel size={48} tone="bronze">
        <Motif name="gear" color={theme.color.accent} cutout={theme.color.highlight} size={26} />
      </MachinedBezel>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: theme.color.text,
            fontFamily: theme.fontFamily.bold,
            fontWeight: '700',
            fontSize: theme.font.headline,
            lineHeight: theme.line.headline,
          }}
        >
          Millwright
        </Text>
        <Text
          style={{
            color: theme.color.accentText,
            fontFamily: theme.fontFamily.medium,
            fontWeight: '500',
            fontSize: theme.font.label,
            lineHeight: 22,
          }}
        >
          Calculator Pro
        </Text>
      </View>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Motif name="bearing" color={theme.color.gunmetal} size={20} />
        <Motif name="bolt" color={theme.color.bronze} size={18} />
      </View>
    </View>
  );
}

export function Screen({
  children,
  title,
  byline,
  subtitle,
  includeTopInset = true,
  edge,
  hideTitle = false,
  refreshing = false,
  onRefresh,
}: {
  children: React.ReactNode;
  title: string;
  byline?: string;
  subtitle?: string;
  includeTopInset?: boolean;
  /** Full-bleed block above the padded body. */
  edge?: React.ReactNode;
  hideTitle?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const topPad = edge ? theme.space.lg : includeTopInset ? Math.max(insets.top, 16) : theme.space.lg;
  return (
    <ScrollView
      stickyHeaderIndices={edge ? [1] : [0]}
      style={{ flex: 1, backgroundColor: theme.color.background }}
      contentContainerStyle={{
        paddingBottom: theme.space.xxl,
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.color.accent} colors={[theme.color.accent]} />
        ) : undefined
      }
    >
      {edge}
      <View
        style={{
          backgroundColor: theme.color.background,
          paddingTop: topPad,
          paddingHorizontal: theme.space.lg,
          paddingBottom: theme.space.sm,
        }}
      >
        <Wordmark />
      </View>
      <View style={{ paddingHorizontal: theme.space.lg }}>
        {hideTitle ? null : (
          <ScreenHeader title={title} byline={byline} subtitle={subtitle} />
        )}
        <View style={{ marginTop: hideTitle ? 0 : theme.space.lg }}>{children}</View>
      </View>
    </ScrollView>
  );
}

export function ScreenHeader({
  title,
  byline,
  subtitle,
  action,
}: {
  title: string;
  byline?: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: theme.space.md }}>
        <View style={{ flex: 1 }}>
          <Text
            accessibilityRole="header"
            style={{
              color: theme.color.text,
              fontSize: theme.font.title,
              lineHeight: theme.line.title,
              fontFamily: theme.fontFamily.bold,
              fontWeight: '700',
            }}
          >
            {title}
          </Text>
          {byline ? (
            <Text
              style={{
                color: theme.color.text,
                fontSize: theme.font.subheading,
                lineHeight: theme.line.headline,
                fontFamily: theme.fontFamily.medium,
                fontWeight: '500',
                marginTop: 2,
              }}
            >
              {byline}
            </Text>
          ) : null}
        </View>
        {action}
      </View>
      <View style={{ marginTop: theme.space.sm }}>
        <MetalRule />
      </View>
      {subtitle ? (
        <Text
          style={{
            color: theme.color.textMuted,
            fontSize: theme.font.body,
            fontFamily: theme.fontFamily.regular,
            marginTop: theme.space.sm,
            lineHeight: theme.line.body,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  const { theme } = useAppTheme();
  const ink = theme.name === 'pro' ? theme.color.text : theme.color.accent;
  return (
    <BrushedMetal
      colors={plateColors(theme)}
      style={{
        marginTop: theme.space.lg,
        marginBottom: theme.space.md,
        borderRadius: theme.radius.sm,
        borderWidth: 1,
        borderTopColor: theme.color.steelLight,
        borderBottomColor: theme.color.bronzeDeep,
        borderLeftColor: theme.color.bronze,
        borderRightColor: theme.color.bronze,
        minHeight: theme.control.minTouch,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        boxShadow: '0px 2px 0px rgba(255,255,255,0.35), 0px 3px 6px rgba(26, 20, 15, 0.18)',
      }}
    >
      <Motif name="bolt" color={ink} size={16} />
      <Text
        style={{
          flex: 1,
          color: ink,
          fontSize: theme.font.label,
          lineHeight: 22,
          fontFamily: theme.fontFamily.bold,
          fontWeight: '700',
          letterSpacing: 0.6,
          textShadowColor: 'rgba(255,255,255,0.45)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 0,
        }}
      >
        {title}
      </Text>
      {action ? (
        <Text style={{ color: ink, fontSize: theme.font.caption, fontFamily: theme.fontFamily.medium }}>{action}</Text>
      ) : (
        <Motif name="bearing" color={theme.color.bronze} size={16} />
      )}
    </BrushedMetal>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  const { theme } = useAppTheme();
  return (
    <View
      style={{
        backgroundColor: theme.color.surface,
        borderWidth: 1,
        borderTopColor: theme.color.steelLight,
        borderLeftColor: theme.color.bronze,
        borderRightColor: theme.color.bronze,
        borderBottomColor: theme.color.bronzeDeep,
        borderRadius: theme.radius.lg,
        padding: theme.space.lg,
        paddingTop: theme.space.lg + 4,
        marginBottom: theme.space.md,
        ...raisedShadow(theme, false),
      }}
    >
      <Rivet style={{ position: 'absolute', top: 8, left: 8 }} />
      <Rivet style={{ position: 'absolute', top: 8, right: 8 }} />
      <Rivet style={{ position: 'absolute', bottom: 8, left: 8 }} />
      <Rivet style={{ position: 'absolute', bottom: 8, right: 8 }} />
      {children}
    </View>
  );
}

export function Banner({ title, body, tone = 'warning' }: { title: string; body: string; tone?: 'info' | 'warning' | 'danger' }) {
  const { theme } = useAppTheme();
  const palette = {
    info: { bg: theme.color.accentSoft, border: theme.color.accent, title: theme.color.accentText },
    warning: { bg: theme.color.warningSoft, border: theme.color.warningBorder, title: theme.color.warning },
    danger: { bg: theme.color.dangerSoft, border: theme.color.danger, title: theme.color.danger },
  }[tone];
  return (
    <View
      accessibilityRole="summary"
      style={{
        backgroundColor: palette.bg,
        borderColor: palette.border,
        borderWidth: 1,
        borderLeftWidth: 6,
        borderRadius: theme.radius.md,
        padding: theme.space.lg,
        marginBottom: theme.space.lg,
      }}
    >
      <Text style={{ color: palette.title, fontSize: theme.font.label, lineHeight: theme.line.caption, fontFamily: theme.fontFamily.bold, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: theme.color.text, fontSize: theme.font.body, fontFamily: theme.fontFamily.regular, lineHeight: theme.line.body, marginTop: theme.space.sm }}>
        {body}
      </Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  hint,
  lines,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'text';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  hint?: string;
  /** When set, the label stays on this many lines and truncates. */
  lines?: number;
}) {
  const { theme } = useAppTheme();
  const color = variant === 'primary' ? theme.color.textOnAccent : variant === 'danger' ? theme.color.danger : theme.color.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={() => {
        if (!disabled) hapticTap();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: variant === 'text' ? theme.control.minTouch : theme.control.buttonHeight,
        borderRadius: theme.radius.pill,
        marginTop: theme.space.lg,
        overflow: 'hidden',
        opacity: disabled ? 0.7 : 1,
        backgroundColor: variant === 'text' ? 'transparent' : disabled ? theme.color.surfaceMuted : variant === 'danger' ? theme.color.dangerSoft : undefined,
        borderWidth: variant === 'danger' ? 2 : variant === 'secondary' ? 1 : 0,
        borderColor: variant === 'danger' ? theme.color.danger : theme.color.bronze,
        ...(variant === 'text' || disabled ? {} : raisedShadow(theme, pressed)),
      })}
    >
      {({ pressed }) => {
        const face = (
          <>
            {icon ? <Ionicons name={icon} size={theme.icon.sm} color={disabled ? theme.color.locked : color} /> : null}
            <Text
              numberOfLines={lines}
              style={{
                color: disabled ? theme.color.locked : color,
                fontSize: theme.font.button,
                fontFamily: variant === 'primary' ? theme.fontFamily.bold : theme.fontFamily.medium,
                fontWeight: variant === 'primary' ? '700' : '500',
                flexShrink: lines ? 1 : undefined,
                maxWidth: lines ? '100%' : undefined,
                textAlign: lines && lines > 1 ? 'center' : undefined,
              }}
            >
              {label}
            </Text>
          </>
        );
        if (disabled || variant === 'text' || variant === 'danger') {
          return (
            <View
              style={{
                minHeight: variant === 'text' ? theme.control.minTouch : theme.control.buttonHeight,
                paddingHorizontal: theme.space.lg,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.space.sm,
              }}
            >
              {face}
            </View>
          );
        }
        return (
          <BrushedMetal
            colors={variant === 'primary' ? primaryBevel(theme, pressed) : secondaryBevel(theme, pressed)}
            vertical
            style={{
              minHeight: theme.control.buttonHeight,
              paddingHorizontal: theme.space.lg,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.space.sm,
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.55)',
              borderBottomWidth: 2,
              borderBottomColor: 'rgba(20, 16, 12, 0.35)',
            }}
          >
            {face}
          </BrushedMetal>
        );
      }}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  keyboardType,
  autoCapitalize = 'sentences',
  secureTextEntry,
  hint,
  autoFocus,
  multiline,
  hideLabel = false,
  onBlur,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  hint?: string;
  autoFocus?: boolean;
  multiline?: boolean;
  /** Keeps the accessible name and hides the visible label when the card title already says it. */
  hideLabel?: boolean;
  /** Called when the field loses focus, e.g. to snap a number into range. */
  onBlur?: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={{ marginBottom: theme.space.md }}>
      {hideLabel ? null : (
        <Text style={{ color: theme.color.text, fontSize: theme.font.label, fontFamily: theme.fontFamily.medium, fontWeight: '500', marginBottom: 6 }}>{label}</Text>
      )}
      {hint ? (
        <Text style={{ color: theme.color.textMuted, fontSize: theme.font.caption, marginBottom: 6, lineHeight: 20 }}>{hint}</Text>
      ) : null}
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={theme.color.locked}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        autoFocus={autoFocus}
        autoCorrect={false}
        multiline={multiline}
        style={{
          minHeight: multiline ? 120 : theme.control.inputHeight,
          textAlignVertical: multiline ? 'top' : 'auto',
          paddingVertical: multiline ? 12 : undefined,
          borderWidth: 1,
          borderColor: error ? theme.color.danger : theme.color.border,
          borderRadius: theme.radius.sm,
          paddingHorizontal: theme.space.md,
          color: theme.color.text,
          backgroundColor: theme.color.background,
          fontSize: theme.font.body,
          lineHeight: theme.line.body,
        }}
      />
      {error ? (
        <Text style={{ color: theme.color.danger, fontSize: theme.font.caption, marginTop: 6 }}>{error}</Text>
      ) : null}
    </View>
  );
}

export function ChoiceRow<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: string;
  onChange: (value: T) => void;
  error?: string;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={{ marginBottom: theme.space.md }}>
      <Text style={{ color: theme.color.text, fontSize: theme.font.label, fontFamily: theme.fontFamily.medium, fontWeight: '500', marginBottom: theme.space.sm }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => onChange(option.value)}
              style={{
                minHeight: theme.control.minTouch,
                paddingHorizontal: theme.space.md,
                borderRadius: theme.radius.pill,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? theme.color.accentSoft : theme.color.background,
                borderWidth: 1,
                borderColor: selected ? theme.color.accent : theme.color.border,
              }}
            >
              <Text style={{ color: selected ? theme.color.accentText : theme.color.text, fontSize: theme.font.label, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={{ color: theme.color.danger, marginTop: 6 }}>{error}</Text> : null}
    </View>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onValueChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md, marginBottom: theme.space.md }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.color.text, fontSize: theme.font.label, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>{label}</Text>
        {hint ? (
          <Text style={{ color: theme.color.textMuted, fontSize: theme.font.caption, marginTop: 4, lineHeight: 20 }}>{hint}</Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.color.accent, false: theme.color.border }}
      />
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        minHeight: theme.control.minTouch,
        paddingHorizontal: 14,
        borderRadius: theme.radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: selected ? theme.color.accentSoft : theme.color.background,
        borderWidth: 1,
        borderColor: selected ? theme.color.accent : theme.color.border,
        marginRight: 8,
      }}
    >
      <Text style={{ color: selected ? theme.color.accentText : theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
      {children}
    </ScrollView>
  );
}

export function EmptyState({
  title,
  body,
  icon = 'file-tray-outline',
  action,
}: {
  title: string;
  body: string;
  icon?: keyof typeof Ionicons.glyphMap;
  action?: React.ReactNode;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={{ paddingVertical: theme.space.xl, alignItems: 'flex-start' }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: theme.radius.md,
          backgroundColor: theme.color.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.space.md,
        }}
      >
        <Ionicons name={icon} size={theme.icon.lg} color={theme.color.accent} />
      </View>
      <Text style={{ color: theme.color.text, fontSize: theme.font.headline, lineHeight: theme.line.headline, fontFamily: theme.fontFamily.medium, fontWeight: '500' }}>{title}</Text>
      <Text style={{ color: theme.color.textMuted, fontSize: theme.font.body, fontFamily: theme.fontFamily.regular, marginTop: theme.space.sm, lineHeight: theme.line.body }}>{body}</Text>
      {action ? <View style={{ marginTop: theme.space.md, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export function Badge({ label, tone }: { label: string; tone?: 'accent' | 'highlight' }) {
  const { theme } = useAppTheme();
  const highlight = tone === 'highlight' || label.trim().toLowerCase() === 'pro';
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: highlight ? theme.color.highlight : theme.color.accentSoft,
        borderRadius: theme.radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          color: highlight ? theme.color.highlightText : theme.color.accentText,
          fontFamily: theme.fontFamily.bold,
          fontWeight: '700',
          fontSize: theme.font.caption,
          lineHeight: theme.line.caption,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  const { theme } = useAppTheme();
  return (
    <View
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: theme.color.border,
        borderRadius: theme.radius.lg,
        padding: theme.space.md,
        backgroundColor: theme.color.surface,
        ...raisedShadow(theme, false),
      }}
    >
      <Text style={{ color: theme.color.textMuted, fontFamily: theme.fontFamily.regular, fontSize: theme.font.caption, lineHeight: theme.line.caption }}>{label}</Text>
      <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.bold, fontWeight: '700', fontSize: theme.font.headline, lineHeight: theme.line.headline, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

export function ListRow({
  label,
  detail,
  icon,
  onPress,
}: {
  label: string;
  detail?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { theme } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        hapticTap();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: theme.control.minTouch,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.md,
        paddingVertical: 10,
        paddingHorizontal: theme.space.md,
        backgroundColor: pressed ? theme.color.accentSoft : theme.color.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.color.border,
      })}
    >
      {icon ? <Ionicons name={icon} size={theme.icon.md} color={theme.color.accent} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500', fontSize: theme.font.body, lineHeight: theme.line.body }}>{label}</Text>
        {detail ? <Text style={{ color: theme.color.textMuted, fontFamily: theme.fontFamily.regular, fontSize: theme.font.caption, lineHeight: theme.line.caption }}>{detail}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={theme.icon.sm} color={theme.color.textMuted} />
    </Pressable>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  lines = 1,
}: {
  options: readonly { value: T; label: string }[];
  value: T | '';
  onChange: (value: T) => void;
  lines?: number;
}) {
  const { theme } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: theme.color.border, borderRadius: theme.radius.md, overflow: 'hidden', marginBottom: theme.space.md }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            style={{ flex: 1, minHeight: theme.control.minTouch, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, paddingVertical: 6, backgroundColor: selected ? theme.color.accent : theme.color.background }}
          >
            <Text style={{ color: selected ? theme.color.textOnAccent : theme.color.text, fontFamily: theme.fontFamily.medium, fontWeight: '500', fontSize: lines > 1 ? theme.font.body : theme.font.caption, textAlign: 'center' }} numberOfLines={lines}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Skeleton({ height = 72 }: { height?: number }) {
  const { theme } = useAppTheme();
  return <View accessibilityLabel="Loading" style={{ height, borderRadius: theme.radius.md, backgroundColor: theme.color.surfaceMuted, marginBottom: theme.space.md }} />;
}

export function TextButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Button label={label} onPress={onPress} variant="text" />;
}

export function PrimaryButton(props: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean }) {
  return <Button {...props} variant="primary" />;
}

export function SecondaryButton(props: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean }) {
  return <Button {...props} variant="secondary" />;
}

export function ComingSoon({
  phase,
  title,
  points,
}: {
  phase: string;
  title: string;
  points: string[];
}) {
  const { theme } = useAppTheme();
  return (
    <Screen title={title} subtitle={`${phase}. Nothing here diagnoses equipment or messages other people yet.`}>
      <View
        style={{
          alignSelf: 'flex-start',
          backgroundColor: theme.color.accentSoft,
          borderRadius: theme.radius.pill,
          paddingHorizontal: 12,
          paddingVertical: 6,
          marginBottom: theme.space.lg,
        }}
      >
        <Text style={{ color: theme.color.accentText, fontFamily: theme.fontFamily.bold, fontWeight: '700' }}>Coming soon</Text>
      </View>
      {points.map((point) => (
        <Text key={point} style={{ color: theme.color.text, fontSize: theme.font.body, lineHeight: 24, marginBottom: theme.space.md }}>
          {point}
        </Text>
      ))}
    </Screen>
  );
}

export function stackHeaderOptions() {
  return {
    headerStyle: { backgroundColor: freeTheme.color.background },
    headerTintColor: freeTheme.color.accentText,
    headerTitleStyle: {
      fontWeight: '700' as const,
      fontFamily: freeTheme.fontFamily.bold,
      color: freeTheme.color.text,
    },
    headerShadowVisible: false,
    contentStyle: { backgroundColor: freeTheme.color.background },
  };
}
