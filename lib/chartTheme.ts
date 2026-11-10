/**
 * Shared Recharts styling in the Spotify dark palette.
 * Spread the prop objects into the matching Recharts element, e.g. <XAxis {...xAxisProps} dataKey="x" />.
 */

export const CHART_COLORS = {
  /** Primary data series. */
  accent: '#1ED760',
  /** "The rest" in two-part splits (passes 3:1 contrast on the card surface). */
  neutral: '#7C7C7C',
  grid: '#2A2A2A',
  tick: '#A7A7A7',
  surface: '#181818',
  tooltipBg: '#282828',
} as const;

const tick = { fill: CHART_COLORS.tick, fontSize: 12 };

export const xAxisProps = {
  tick,
  tickLine: false,
  axisLine: { stroke: CHART_COLORS.grid },
  tickMargin: 8,
} as const;

export const yAxisProps = {
  tick,
  tickLine: false,
  axisLine: false,
  width: 56,
} as const;

/** Faint, solid, horizontal-only gridlines. */
export const gridProps = {
  stroke: CHART_COLORS.grid,
  vertical: false,
} as const;

/** Same as gridProps but for horizontal bar charts (vertical lines only). */
export const gridPropsHorizontalBars = {
  stroke: CHART_COLORS.grid,
  horizontal: false,
} as const;

/** Bar hover background: a faint band instead of Recharts' light-gray default. */
export const barCursor = { fill: 'rgba(255, 255, 255, 0.04)' };
