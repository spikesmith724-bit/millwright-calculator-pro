// Extracted from Millwright Handbook src/domain/forms (sheetArt.ts + math.ts).
const font = 'Inter, Helvetica, sans-serif';
function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function text(x: number, y: number, value: string, anchor: 'start' | 'middle' | 'end' = 'start', size = 12): string {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" font-family="${font}" fill="#111">${escapeXml(value)}</text>`;
}
export function starSequence(count: number): number[] {
  if (!Number.isInteger(count) || count < 2 || count > 64) throw new Error('Use between 2 and 64 bolts.');
  if (count % 2 === 1) {
    const step = Math.floor(count / 2);
    const sequence: number[] = [];
    let index = 0;
    for (let n = 0; n < count; n += 1) {
      sequence.push(index + 1);
      index = (index + step) % count;
    }
    return sequence;
  }
  const half = count / 2;
  const quarter = Math.max(1, Math.floor(count / 4));
  const used = new Set<number>();
  const sequence: number[] = [];
  const opposite = (bolt: number) => ((bolt - 1 + half) % count) + 1;
  let bolt = 1;
  let guard = 0;
  while (sequence.length < count && guard < count * 8) {
    guard += 1;
    if (!used.has(bolt)) {
      sequence.push(bolt);
      used.add(bolt);
      const across = opposite(bolt);
      if (!used.has(across)) {
        sequence.push(across);
        used.add(across);
      }
    }
    const stepped = ((bolt - 1 + quarter) % count) + 1;
    if (!used.has(stepped)) {
      bolt = stepped;
      continue;
    }
    bolt = 1;
    while (bolt <= count && used.has(bolt)) bolt += 1;
  }
  if (sequence.length !== count) throw new Error('Could not build a star sequence for that bolt count.');
  return sequence;
}

export function starArtSvg(count = 8, size = '78mm', numberSize = 14): string {
  const order = starSequence(count);
  const cx = 150;
  const cy = 150;
  const r = 108;
  const markR = Math.max(12, Math.min(20, numberSize * 0.85));
  const points = Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return { bolt: index + 1, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const byBolt = new Map(points.map((point) => [point.bolt, point]));
  const lines = order
    .map((bolt, index) => {
      const next = order[index + 1];
      if (!next) return '';
      const a = byBolt.get(bolt);
      const b = byBolt.get(next);
      if (!a || !b) return '';
      return `<line class="star-rule" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#141414" stroke-width="1.3"/>`;
    })
    .join('');
  const marks = points
    .map((point) => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="${markR}" fill="#fff" stroke="#111" stroke-width="1.4"/>${text(point.x, point.y + numberSize * 0.35, String(point.bolt), 'middle', numberSize)}`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="${size}" height="${size}">${lines}${marks}</svg>`;
}
