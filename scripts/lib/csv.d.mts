export type CsvRow = Record<string, string> & { _line: number };
export function parseCsv(text: string): CsvRow[];
