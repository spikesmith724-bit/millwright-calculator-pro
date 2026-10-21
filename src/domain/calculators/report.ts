import type { GroutResult } from '@/src/domain/calculators/grout';

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export function groutTakeoffHtml(result: GroutResult, username: string): string {
  const rows = [
    ['Product', result.productLabel],
    ['Net volume', `${result.netFt3} ft³ · ${result.netIn3} in³ · ${result.netGal} gal · ${result.netL} L`],
    ['Order volume', `${result.orderFt3} ft³`],
    ['Units (rounded up)', String(result.unitCount)],
    ...(result.sectionTakes.length > 1
      ? result.sectionTakes.map((section) => [`Pour ${section.index}`, `${section.unitCount} unit${section.unitCount === 1 ? '' : 's'} · ${section.volumeFt3} ft³`] as [string, string])
      : []),
    ['Resin pails', result.resinPails == null ? 'Confirm the product TDS' : String(result.resinPails)],
    ['Hardener', result.hardenerUnits == null ? 'Confirm the product TDS' : String(result.hardenerUnits)],
    ['Aggregate bags', result.aggregateBags == null ? 'Confirm the product TDS' : String(result.aggregateBags)],
    ['Material weight', result.materialWeightLb == null ? '—' : `${result.materialWeightLb} lb`],
    ['Shipping weight', result.shippingWeightLb == null ? '—' : `${result.shippingWeightLb} lb`],
    ['Leftover', `${result.leftoverFt3} ft³`],
  ];
  const body = rows
    .map(([label, value]) => `<tr><td>${escapeHtml(label ?? '')}</td><td>${escapeHtml(value ?? '')}</td></tr>`)
    .join('');
  const warnings = result.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Grout takeoff</title>
<style>body{font-family:Inter,sans-serif;color:#000;padding:24px}h1{color:#141414;font-size:22px}table{border-collapse:collapse;width:100%}td{border:1px solid #d9d9d9;padding:8px} .note{margin-top:16px;font-size:14px}</style>
</head><body>
<h1>Millwright Calculator Pro</h1>
<p>${escapeHtml(username)} · epoxy grout material takeoff</p>
<table>${body}</table>
<ul>${warnings}</ul>
<p class="note">${escapeHtml(result.itwNote)}</p>
<p class="note">${escapeHtml(result.wasteNote)}</p>
<p class="note">${escapeHtml(result.formula)} ${escapeHtml(result.formulaVersion)}. ${escapeHtml(result.disclaimer)}</p>
</body></html>`;
}
