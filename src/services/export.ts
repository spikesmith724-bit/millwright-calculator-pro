import { Platform } from 'react-native';

export async function printToolList(html: string, paper?: { width: number; height: number }): Promise<string> {
  const Print = await import('expo-print');
  await Print.printAsync(paper ? { html, width: paper.width, height: paper.height } : { html });
  return Platform.OS === 'web'
    ? 'The browser print dialog is open. You can save a PDF from there. Millwright Calculator Pro does not upload this list.'
    : 'AirPrint is open. Millwright Calculator Pro does not upload this list.';
}

