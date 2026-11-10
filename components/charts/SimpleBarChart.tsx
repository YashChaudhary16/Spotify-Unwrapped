'use client';

import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  CHART_COLORS,
  DIMMED_OPACITY,
  gridProps,
  gridPropsHorizontalBars,
  xAxisProps,
  yAxisProps,
} from '@/lib/chartTheme';
import { formatDurationShort } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { ChartTooltip } from '@/components/ui/ChartTooltip';

interface SimpleBarChartProps<T extends Record<string, any>> {
  data: T[];
  /** Field holding the category label (x for columns, y for horizontal bars). */
  categoryKey: string;
  /** Field holding the value. Values are hours unless `valueFormatter`/`tickFormatter` say otherwise. */
  valueKey?: string;
  /** 'columns' = vertical bars; 'bars' = horizontal bars (best for ranked lists with long labels). */
  orientation?: 'columns' | 'bars';
  /** Fixed height. For horizontal bars, defaults to a height that fits the number of rows. */
  height?: number;
  colorFor?: (row: T, index: number) => string;
  /** Name shown in the tooltip next to the value. */
  seriesName?: string;
  valueFormatter?: (value: number) => string;
  tickFormatter?: (value: number) => string;
  categoryTickFormatter?: (value: string) => string;
  /** Width reserved for category labels on horizontal bars. */
  categoryWidth?: number;
}

/**
 * The single bar chart used across the dashboard.
 * Hovering a bar dims the others (no movement, no shadows).
 */
export function SimpleBarChart<T extends Record<string, any>>({
  data,
  categoryKey,
  valueKey = 'hours',
  orientation = 'columns',
  height,
  colorFor,
  seriesName = 'Listening time',
  valueFormatter,
  tickFormatter,
  categoryTickFormatter,
  categoryWidth = 120,
}: SimpleBarChartProps<T>) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { unit } = useTimeUnit();
  const horizontal = orientation === 'bars';
  const valueTicks = tickFormatter ?? ((v: number) => formatDurationShort(v, unit));
  const chartHeight = height ?? (horizontal ? Math.max(160, data.length * 36 + 40) : 280);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
        onMouseMove={(state: any) =>
          setActiveIndex(state?.isTooltipActive && typeof state.activeTooltipIndex === 'number' ? state.activeTooltipIndex : null)
        }
        onMouseLeave={() => setActiveIndex(null)}
      >
        {horizontal ? <CartesianGrid {...gridPropsHorizontalBars} /> : <CartesianGrid {...gridProps} />}
        {horizontal ? (
          <>
            <XAxis {...xAxisProps} type="number" tickFormatter={valueTicks} />
            <YAxis
              {...yAxisProps}
              type="category"
              dataKey={categoryKey}
              width={categoryWidth}
              tick={{ ...yAxisProps.tick, fill: '#FFFFFF', fontSize: 13 }}
              tickFormatter={categoryTickFormatter}
              interval={0}
            />
          </>
        ) : (
          <>
            <XAxis {...xAxisProps} dataKey={categoryKey} tickFormatter={categoryTickFormatter} interval={0} />
            <YAxis {...yAxisProps} tickFormatter={valueTicks} />
          </>
        )}
        <Tooltip
          cursor={false}
          content={<ChartTooltip hideSwatch nameFormatter={() => seriesName} valueFormatter={valueFormatter} />}
        />
        <Bar
          dataKey={valueKey}
          radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          maxBarSize={horizontal ? 24 : 56}
          activeBar={false}
        >
          {data.map((row, idx) => (
            <Cell
              key={idx}
              fill={colorFor ? colorFor(row, idx) : CHART_COLORS.accent}
              fillOpacity={activeIndex === null || activeIndex === idx ? 1 : DIMMED_OPACITY}
              style={{ transition: 'fill-opacity 150ms ease' }}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
