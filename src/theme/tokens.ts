export type ThemeName = 'free' | 'pro';

export const fontFamily = {
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  bold: 'Inter_700Bold',
} as const;

export type ThemeTokens = {
  name: ThemeName;
  color: {
    background: string;
    surface: string;
    surfaceMuted: string;
    border: string;
    text: string;
    textMuted: string;
    textOnAccent: string;
    accent: string;
    accentText: string;
    accentPressed: string;
    accentSoft: string;
    danger: string;
    dangerSoft: string;
    warning: string;
    warningSoft: string;
    warningBorder: string;
    success: string;
    successSoft: string;
    locked: string;
    highlight: string;
    highlightText: string;
    gunmetal: string;
    steel: string;
    steelLight: string;
    bronze: string;
    bronzeDeep: string;
  };
  space: { xs: number; sm: number; md: number; lg: number; xl: number; xxl: number };
  radius: { sm: number; md: number; lg: number; pill: number };
  shadow: { color: string; opacity: number; radius: number; offsetY: number; elevation: number };
  font: {
    display: number;
    title: number;
    headline: number;
    heading: number;
    subheading: number;
    body: number;
    label: number;
    caption: number;
    button: number;
  };
  line: {
    display: number;
    title: number;
    headline: number;
    body: number;
    caption: number;
  };
  icon: { sm: number; md: number; lg: number };
  fontFamily: typeof fontFamily;
  control: { buttonHeight: number; inputHeight: number; minTouch: number };
};

/** 4pt grid. md is 12 so existing screens stay on the same rhythm. */
const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
/** Rounded cards and pill buttons. */
const radius = { sm: 12, md: 14, lg: 16, pill: 999 };
/**
 * Type scale. display / title / headline / body / caption.
 * heading and subheading stay as aliases so existing screens keep their sizes.
 */
const font = {
  display: 32,
  title: 28,
  headline: 22,
  heading: 22,
  subheading: 18,
  body: 17,
  label: 16,
  caption: 14,
  button: 17,
};
const line = { display: 38, title: 34, headline: 28, body: 24, caption: 20 };
const icon = { sm: 18, md: 22, lg: 28 };
const control = { buttonHeight: 52, inputHeight: 48, minTouch: 44 };
const shadow = { color: '#1F1F1F', opacity: 0.12, radius: 10, offsetY: 4, elevation: 4 };

const semantic = {
  danger: '#B00020',
  dangerSoft: '#FDECEE',
  warning: '#6B4E00',
  warningSoft: '#FFF6DE',
  warningBorder: '#E0B000',
  success: '#0F6B45',
  successSoft: '#E5F6EE',
};

/**
 * Millwright Calculator Pro theme. Near-black, gold, and nickel/silver on white content areas.
 * Primary buttons are near-black with gold labels (about 8.6:1). Body text is #1F1F1F on white (about 16:1).
 * Gold #C9A227 is trim and fill only; gold-toned text uses the darker #7A5F0E (about 6:1 on white).
 */
export const freeTheme: ThemeTokens = {
  name: 'free',
  color: {
    background: '#F4F4F5',
    surface: '#FFFFFF',
    surfaceMuted: '#ECEDEF',
    border: '#B8BCC2',
    text: '#1F1F1F',
    textMuted: '#4F5359',
    textOnAccent: '#C9A227',
    accent: '#141414',
    accentText: '#7A5F0E',
    accentPressed: '#000000',
    accentSoft: '#F7EFD6',
    ...semantic,
    locked: '#4F5359',
    highlight: '#C9A227',
    highlightText: '#141414',
    gunmetal: '#3A3D42',
    steel: '#B8BCC2',
    steelLight: '#E6E8EB',
    bronze: '#B8BCC2',
    bronzeDeep: '#8E9399',
  },
  space,
  radius,
  font,
  line,
  icon,
  fontFamily,
  control,
  shadow,
};

/**
 * Pro is a darker gunmetal and navy plate with bronze trim. It turns on with the pro entitlement.
 * Buttons use antique bronze so the label stays dark and readable on the metal.
 */
export const proTheme: ThemeTokens = {
  name: 'pro',
  color: {
    background: '#1C2126',
    surface: '#2A3036',
    surfaceMuted: '#343A40',
    border: '#A9773F',
    text: '#F3EBDD',
    textMuted: '#C9CED3',
    textOnAccent: '#1A1208',
    accent: '#C4A06A',
    accentText: '#E7C98A',
    accentPressed: '#8C6230',
    accentSoft: '#3A3228',
    ...semantic,
    warning: '#E6C36A',
    warningSoft: '#3A3018',
    warningBorder: '#E0B000',
    success: '#7DCEA0',
    successSoft: '#163028',
    danger: '#FF8A80',
    dangerSoft: '#3A1818',
    locked: '#C9CED3',
    highlight: '#C4A06A',
    highlightText: '#1A1208',
    gunmetal: '#4A4F55',
    steel: '#C9CED3',
    steelLight: '#E8EBEE',
    bronze: '#A9773F',
    bronzeDeep: '#7A5528',
  },
  space,
  radius,
  font,
  line,
  icon,
  fontFamily,
  control,
  shadow,
};

export const themes: Record<ThemeName, ThemeTokens> = {
  free: freeTheme,
  pro: proTheme,
};
