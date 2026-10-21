export type OilBand = 'in range' | 'caution' | 'critical' | 'unclear';
export type OilFinding = { id: string; label: string; value: string; band: OilBand; pointsTo: string; watch: string; confirm: string | null };
export type OilExplanation = { findings: OilFinding[]; confirms: string[]; note: string };
