import { freeTheme, proTheme } from '@/src/theme/tokens';

function contrast(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map((index) => {
      const value = parseInt(hex.slice(index, index + 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('theme tokens', () => {
  it('uses near-black, gold, and nickel on white and keeps danger distinct', () => {
    expect(freeTheme.color.surface).toBe('#FFFFFF');
    expect(freeTheme.color.text).toBe('#1F1F1F');
    expect(freeTheme.color.accent).toBe('#141414');
    expect(freeTheme.color.highlight).toBe('#C9A227');
    expect(freeTheme.color.border).toBe('#B8BCC2');
    expect(freeTheme.font.body).toBeGreaterThanOrEqual(14);
    expect(freeTheme.control.minTouch).toBeGreaterThanOrEqual(44);
    expect(freeTheme.color.danger).not.toBe(freeTheme.color.accent);
    expect(contrast(freeTheme.color.accent, freeTheme.color.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(freeTheme.color.text, freeTheme.color.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(freeTheme.color.textMuted, freeTheme.color.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(freeTheme.color.textOnAccent, freeTheme.color.accent)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(freeTheme.color.highlightText, freeTheme.color.highlight)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(freeTheme.color.accentText, freeTheme.color.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(proTheme.color.accentText, proTheme.color.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(proTheme.color.text, proTheme.color.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(proTheme.color.textOnAccent, proTheme.color.accent)).toBeGreaterThanOrEqual(4.5);
    expect(proTheme.color.background).toBe('#1C2126');
    expect(proTheme.color.bronze).toBe('#A9773F');
    expect(proTheme.color.danger).not.toBe(proTheme.color.accent);
  });
});
