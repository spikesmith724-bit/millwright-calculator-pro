import { CALC_DISCLAIMER } from '@/src/domain/calculators/common';
import { FLUSH_LIMIT_NOTE, FLUSH_TARGETS, ISO_VG_GRADES, VISCOSITY_NOTE } from '@/src/domain/lubrication/flushTargets';
import { NAS_RANGES, NAS_ROWS } from '@/src/domain/lubrication/nas1638';
import { LAB_LIMIT_NOTE, OIL_ANALYTES, OIL_GROUPS } from '@/src/domain/lubrication/oilAnalysis';

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function table(headers: string[], rows: string[][]): string {
  const head = headers.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('');
  const body = rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

export function lubeOilHtml(): string {
  const analysis = OIL_GROUPS.map((group) => {
    const rows = OIL_ANALYTES.filter((item) => item.group === group).map((item) => [
      item.symbol,
      item.name,
      item.pointsTo,
      item.caution,
      item.critical,
    ]);
    return `<h2>${escapeHtml(group)}</h2>${table(['Result', 'Name', 'What it points to', 'Typical caution', 'Typical critical'], rows)}`;
  }).join('');
  const flush = table(
    ['Equipment', 'Typical ISO 4406', 'Approx. NAS', 'Typical ISO VG', 'Note'],
    FLUSH_TARGETS.map((item) => [item.equipment, item.isoCode, item.nas, item.grades, item.note]),
  );
  const nas = table(
    ['Class', ...NAS_RANGES, 'Approx. ISO 4406'],
    NAS_ROWS.map((row) => [row.className, ...row.counts.map((count) => count.toLocaleString('en-US')), row.approximateIso ?? '—']),
  );
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lube oil</title><style>
    body { font-family: Georgia, "Times New Roman", serif; color: #000; background: #fff; margin: 24px; }
    h1 { font-size: 18px; font-weight: 500; margin: 0 0 8px; }
    h2 { font-size: 14px; font-weight: 600; margin: 16px 0 4px; }
    p { font-size: 11px; margin: 0 0 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th, td { border: 1px solid #000; padding: 3px 6px; font-size: 11px; color: #000; background: #fff; text-align: left; }
    th { font-weight: 600; }
  </style></head><body>
  <h1>Lube oil</h1>
  <p>${escapeHtml(LAB_LIMIT_NOTE)} ${escapeHtml(CALC_DISCLAIMER)}</p>
  <h2>Oil analysis</h2>
  ${analysis}
  <h2>Flush targets</h2>
  <p>${escapeHtml(VISCOSITY_NOTE)}</p>
  <p>${escapeHtml(FLUSH_LIMIT_NOTE)} Grades in this note: ${ISO_VG_GRADES.join(', ')}.</p>
  ${flush}
  <h2>NAS 1638, particles per 100 mL</h2>
  <p>Differential counts. The class of the sample is the worst range. The ISO 4406 column is approximate because the two methods do not count the same way. Classes 00 and 0 are cleaner than the class 1 approximation.</p>
  ${nas}
  </body></html>`;
}
