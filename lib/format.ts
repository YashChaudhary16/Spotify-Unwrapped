import { format, isValid, parseISO } from 'date-fns';

/** Unit the user picked for displaying listening time. All analytics values are stored in hours. */
export type TimeUnit = 'minutes' | 'hours' | 'days';

export const TIME_UNITS: { value: TimeUnit; label: string }[] = [
  { value: 'minutes', label: 'Minutes' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
];

const nfCache = new Map<number, Intl.NumberFormat>();
const nf = (digits: number) => {
  if (!nfCache.has(digits)) {
    nfCache.set(digits, new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }));
  }
  return nfCache.get(digits)!;
};

const compactNf = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

/** 12345.6 -> "12,346" (or with `digits` decimals). */
export const formatNumber = (value: number, digits = 0): string =>
  nf(digits).format(Number.isFinite(value) ? value : 0);

/** 0.723 -> "72%". */
export const formatPercent = (fraction: number, digits = 0): string =>
  `${formatNumber((Number.isFinite(fraction) ? fraction : 0) * 100, digits)}%`;

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/**
 * Formats a duration given in hours in the selected unit:
 *   minutes -> "1,234 minutes"
 *   hours   -> "1,234 hrs"   (one decimal below 10 hrs, e.g. "3.4 hrs")
 *   days    -> "51 days 10 hrs" (falls back to hrs below one day)
 */
export const formatDuration = (hours: number, unit: TimeUnit): string => {
  const h = Number.isFinite(hours) ? Math.max(hours, 0) : 0;

  if (unit === 'minutes') {
    const m = Math.round(h * 60);
    return `${formatNumber(m)} ${plural(m, 'minute', 'minutes')}`;
  }

  if (unit === 'days' && h >= 24) {
    const totalHours = Math.round(h);
    const d = Math.floor(totalHours / 24);
    const r = totalHours % 24;
    const daysPart = `${formatNumber(d)} ${plural(d, 'day', 'days')}`;
    return r > 0 ? `${daysPart} ${r} ${plural(r, 'hr', 'hrs')}` : daysPart;
  }

  const digits = h < 10 ? 1 : 0;
  const rounded = Number(h.toFixed(digits));
  return `${formatNumber(rounded, digits)} ${plural(rounded, 'hr', 'hrs')}`;
};

/** Converts hours into the numeric value for the selected unit (for chart axes). */
export const convertHours = (hours: number, unit: TimeUnit): number => {
  if (unit === 'minutes') return hours * 60;
  if (unit === 'days') return hours / 24;
  return hours;
};

/** Short axis-tick label, e.g. "300m", "6h", "1.5d". */
export const formatDurationShort = (hours: number, unit: TimeUnit): string => {
  const suffix = unit === 'minutes' ? 'm' : unit === 'days' ? 'd' : 'h';
  return `${compactNf.format(convertHours(hours, unit))}${suffix}`;
};

/** "2023-05-01" -> "May 1, 2023". Returns the input unchanged if it can't be parsed. */
export const formatDate = (value: string | Date | null | undefined, pattern = 'MMM d, yyyy'): string => {
  if (!value) return '—';
  const date = typeof value === 'string' ? parseISO(value) : value;
  return isValid(date) ? format(date, pattern) : String(value);
};
