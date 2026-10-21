import { Stack, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';

import { titleFor } from '@/src/domain/calculators/catalog';
import { CalculatorKindScreen } from '@/src/features/calculators/CalculatorScreens';

export default function CalculatorKindRoute() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const key = Array.isArray(kind) ? kind[0] : kind;
  const title = titleFor(key ?? '');
  return (
    <>
      <Head><title>{`${title} · Millwright Calculator Pro`}</title></Head>
      <Stack.Screen options={{ title }} />
      <CalculatorKindScreen />
    </>
  );
}
