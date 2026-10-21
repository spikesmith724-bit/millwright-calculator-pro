import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { Text, TextInput } from 'react-native';

import { fontFamily, themes, type ThemeName, type ThemeTokens } from '@/src/theme/tokens';

type ThemeContextValue = {
  theme: ThemeTokens;
  proLockedMessage: string | null;
  requestTheme: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

let defaultsApplied = false;

function applyDefaultFont() {
  if (defaultsApplied) return;
  defaultsApplied = true;
  const style = { fontFamily: fontFamily.regular };
  const text = Text as unknown as { defaultProps?: { style?: object } };
  const input = TextInput as unknown as { defaultProps?: { style?: object } };
  text.defaultProps = { ...text.defaultProps, style };
  input.defaultProps = { ...input.defaultProps, style };
}

/** No accounts or billing: the red-and-white theme is always on. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState<ThemeName>('free');
  const [loaded, error] = useFonts({ Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_700Bold });
  const value = useMemo<ThemeContextValue>(() => ({ theme: themes[name], proLockedMessage: null, requestTheme: setName }), [name]);
  if (!loaded && !error) return null;
  applyDefaultFont();
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme must be used within ThemeProvider');
  return value;
}
