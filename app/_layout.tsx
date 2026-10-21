import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { stackHeaderOptions } from '@/src/components/ui';
import { ThemeProvider } from '@/src/theme/ThemeContext';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => undefined);
  }, []);
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ ...stackHeaderOptions(), headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="calculators" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
