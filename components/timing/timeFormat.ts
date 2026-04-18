/**
 * Format a duration in seconds as a human-readable string, showing at most two units.
 * @param seconds - The duration in seconds.
 * @returns A string like "4m 30s", "1h 20m", or "0s".
 */
export function secondsToString(seconds: number): string {
  const abs = Math.abs(seconds);
  const sign = seconds < 0 ? '-' : '';
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = Math.round(abs % 60);
  const parts = [
    h > 0 ? h + 'h' : '',
    m > 0 ? m + 'm' : '',
    s > 0 ? s + 's' : '',
  ].filter(Boolean);
  return sign + (parts.slice(0, 2).join(' ') || '0s');
}

/**
 * Parse a duration string into minutes.
 *
 * Supports formats like "4m30s", "1h 20m", "90s", or a bare number (treated as minutes).
 * @param input - The duration string to parse.
 * @returns The duration in minutes, or `null` if the input is invalid.
 */
export function parseDuration(input: string): number | null {
  const n = String.raw`[\d][\d_,]*(?:\.[\d_,]+)?`;
  const re = new RegExp(
    String.raw`^\s*` +
      String.raw`(?:(?<h>${n})\s*h\s*)?` +
      String.raw`(?:(?<m>${n})\s*(?:m|min)\s*)?` +
      String.raw`(?:(?<s>${n})\s*(?:s|sec)\s*)?` +
      String.raw`(?:(?<rest>${n})\s*)?$`,
  );
  const match = String(input).match(re);
  if (!match || !match[0].trim()) return null;
  const p = (v?: string) => (v ? parseFloat(v.replace(/[_,]/g, '')) : 0);
  const g = match.groups!;
  const lastExplicit = g.s ? 's' : g.m ? 'm' : g.h ? 'h' : undefined;
  const restUnit: Record<string, number> = { h: 60, m: 1, s: 1 / 60 };
  const restFactor = lastExplicit ? restUnit[lastExplicit] : 1; // bare number alone = minutes
  return p(g.h) * 60 + p(g.m) + p(g.s) / 60 + p(g.rest) * restFactor;
}

/**
 * Parse a clock time string in "HH:MM" format to seconds since midnight.
 * @param s - The clock time string, e.g. "14:30".
 * @returns Seconds since midnight, or `null` if the format is invalid.
 */
export function parseClockTime(s: string): number | null {
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  return m ? parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 : null;
}

/**
 * Format seconds since midnight as a clock time string.
 * @param seconds - Seconds since midnight (wraps at 24h).
 * @returns A string in "H:MM" format.
 */
export function formatClockTime(seconds: number): string {
  const h = Math.floor((((seconds % 86400) + 86400) % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}
