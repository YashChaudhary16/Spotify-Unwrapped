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

/** Opacity of the non-hovered bars while one bar is hovered. */
export const DIMMED_OPACITY = 0.35;

/**
 * Ordered single-hue ramp for the four time-of-day buckets (morning → night = light → deep).
 * Every step has ≥ 3:1 contrast on the card surface.
 */
export const TIME_OF_DAY_COLORS: Record<string, string> = {
  'Morning (5-11)': '#B4F5CC',
  'Afternoon (12-17)': '#1ED760',
  'Evening (18-22)': '#14A84A',
  'Night (23-4)': '#0E7A36',
};

/**
 * Album rank colors for stacked bars: top album, 2nd album, everything else.
 * Validated (scripts/validate_palette.js, dark, #181818): CVD and normal-vision separation pass,
 * all ≥ 3:1. A 3rd green step fails separation, so the remaining albums fold into gray.
 */
export const RANK_COLORS = ['#1ED760', '#0E7A36', '#7C7C7C'] as const;

/** Heatmap: five green steps, dim → bright (more listening = brighter), plus a distinct empty cell. */
export const HEAT_STEPS = ['#1B3A26', '#1D5A33', '#1C8042', '#1EAB52', '#1ED760'] as const;
export const HEAT_EMPTY = '#242424';
/** Text color that stays readable on each heat step. */
export const HEAT_TEXT = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#000000', '#000000'] as const;
