'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format } from 'date-fns';
import { CHART_COLORS, gridProps, xAxisProps, yAxisProps } from '@/lib/chartTheme';
import { formatDurationShort } from '@/lib/format';
import {
  GRANULARITIES,
  Granularity,
  aggregateSeries,
  bucketLabel,
  defaultGranularity,
  timeTicks,
} from '@/lib/timeSeries';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { ChartTooltip } from '@/components/ui/ChartTooltip';
import { ChipGroup } from '@/components/ui/ChipGroup';

interface TrendChartProps {
  /** Daily totals (yyyy-MM-dd, hours). */
  data: { date: string; hours: number }[];
  /** Optional heading rendered to the left of the Day/Week/Month toggle. */
  title?: React.ReactNode;
  height?: number;
}

const SUBTITLE: Record<Granularity, string> = {
  day: 'Listening time per day',
  week: 'Listening time per week',
  month: 'Listening time per month',
};

/** Listening-over-time area chart with a Day / Week / Month toggle. */
export function TrendChart({ data, title, height = 320 }: TrendChartProps) {
  const { unit } = useTimeUnit();
  const gradientId = `trend-${useId().replace(/:/g, '')}`;

  // Reset to a sensible granularity whenever the date range changes (e.g. year filter).
  const suggested = useMemo(() => defaultGranularity(data), [data]);
  const [granularity, setGranularity] = useState<Granularity>(suggested);
  useEffect(() => setGranularity(suggested), [suggested]);

  const series = useMemo(() => aggregateSeries(data, granularity), [data, granularity]);
  const { ticks, pattern } = useMemo(
    () => (series.length ? timeTicks(series[0].t, series[series.length - 1].t) : { ticks: [], pattern: 'MMM d' }),
    [series]
  );

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {title}
          <p className="text-sm text-spotify-lightgray">{SUBTITLE[granularity]}</p>
        </div>
        <ChipGroup
          size="sm"
          ariaLabel="Group by"
          options={GRANULARITIES}
          value={granularity}
          onChange={setGranularity}
        />
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={series} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            {...xAxisProps}
            dataKey="t"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            ticks={ticks}
            tickFormatter={t => format(t, pattern)}
          />
          <YAxis {...yAxisProps} tickFormatter={v => formatDurationShort(v, unit)} />
          <Tooltip
            cursor={{ stroke: CHART_COLORS.tick, strokeWidth: 1, strokeDasharray: '3 3' }}
            content={
              <ChartTooltip
                hideSwatch
                nameFormatter={() => 'Listening time'}
                labelFormatter={label => (typeof label === 'number' ? bucketLabel(label, granularity) : label)}
              />
            }
          />
          <Area
            type="monotone"
            dataKey="hours"
            stroke={CHART_COLORS.accent}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={series.length === 1}
            activeDot={{ r: 4, fill: CHART_COLORS.accent, stroke: CHART_COLORS.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
