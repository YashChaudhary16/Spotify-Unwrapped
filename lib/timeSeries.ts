import {
  differenceInCalendarDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachQuarterOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

export type Granularity = 'day' | 'week' | 'month';

export const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export interface SeriesPoint {
  /** Bucket start as epoch ms (x value). */
  t: number;
  /** Bucket start as yyyy-MM-dd. */
  date: string;
  hours: number;
}

const WEEK_OPTS = { weekStartsOn: 1 as const };

const bucketStart = (date: Date, g: Granularity) =>
  g === 'day' ? date : g === 'week' ? startOfWeek(date, WEEK_OPTS) : startOfMonth(date);

const range = (data: { date: string }[]) => {
  let min = data[0].date;
  let max = data[0].date;
  for (const d of data) {
    if (d.date < min) min = d.date;
    if (d.date > max) max = d.date;
  }
  return { start: parseISO(min), end: parseISO(max) };
};

/**
 * Sums daily hours into day / week (Mon-start) / month buckets.
 * Gaps are filled with zeros so quiet periods show as dips instead of being skipped.
 */
export function aggregateSeries(data: { date: string; hours: number }[], g: Granularity): SeriesPoint[] {
  if (data.length === 0) return [];

  const sums = new Map<string, number>();
  for (const d of data) {
    const key = format(bucketStart(parseISO(d.date), g), 'yyyy-MM-dd');
    sums.set(key, (sums.get(key) || 0) + d.hours);
  }

  const interval = range(data);
  const starts =
    g === 'day'
      ? eachDayOfInterval(interval)
      : g === 'week'
        ? eachWeekOfInterval(interval, WEEK_OPTS)
        : eachMonthOfInterval(interval);

  return starts.map(start => {
    const key = format(start, 'yyyy-MM-dd');
    return { t: start.getTime(), date: key, hours: sums.get(key) || 0 };
  });
}

/** Sensible default: daily for short ranges, weekly up to ~3 years, monthly beyond. */
export function defaultGranularity(data: { date: string }[]): Granularity {
  if (data.length === 0) return 'day';
  const { start, end } = range(data);
  const span = differenceInCalendarDays(end, start);
  if (span <= 90) return 'day';
  if (span <= 3 * 365) return 'week';
  return 'month';
}

/**
 * Picks readable, unrotated x-axis ticks for a time range:
 * years for long ranges, quarters / months for medium, weeks for short.
 */
export function timeTicks(minT: number, maxT: number): { ticks: number[]; pattern: string } {
  const start = new Date(minT);
  const end = new Date(maxT);
  const span = differenceInCalendarDays(end, start);

  let dates: Date[];
  let pattern: string;
  if (span > 3 * 365) {
    dates = eachYearOfInterval({ start, end });
    pattern = 'yyyy';
  } else if (span > 365) {
    dates = eachQuarterOfInterval({ start, end });
    pattern = "MMM ''yy";
  } else if (span > 90) {
    dates = eachMonthOfInterval({ start, end });
    pattern = start.getFullYear() === end.getFullYear() ? 'MMM' : "MMM ''yy";
  } else {
    dates = eachWeekOfInterval({ start, end }, WEEK_OPTS);
    pattern = 'MMM d';
  }

  const ticks = dates.map(d => d.getTime()).filter(t => t >= minT && t <= maxT);
  return { ticks: ticks.length >= 2 ? ticks : [minT, maxT], pattern };
}

/** Tooltip heading for a bucket. */
export function bucketLabel(t: number, g: Granularity): string {
  if (g === 'day') return format(t, 'EEE, MMM d, yyyy');
  if (g === 'week') return `Week of ${format(t, 'MMM d, yyyy')}`;
  return format(t, 'MMMM yyyy');
}
