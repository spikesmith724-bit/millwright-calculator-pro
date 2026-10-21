import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Light tap for primary actions. No-ops on web, where Expo Go haptics are not available. */
export function hapticTap(): void {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}
