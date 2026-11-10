'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { CHART_COLORS, gridProps, xAxisProps, yAxisProps } from '@/lib/chartTheme';
import { formatDate, formatDurationShort } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { ChartTooltip } from '@/components/ui/ChartTooltip';

interface TimeSeriesChartProps {
  data: { date: string; hours: number }[];
}

export default function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const { unit } = useTimeUnit();
  const formattedData = data.map(d => ({
    ...d,
    dateFormatted: formatDate(d.date, 'MMM dd, yyyy'),
  }));

  return (
    <Section title="Listening over time" icon={TrendingUp} subtitle="Daily listening time">
      <Card>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={formattedData}>
            <CartesianGrid {...gridProps} />
            <XAxis
              {...xAxisProps}
              dataKey="dateFormatted"
              angle={-45}
              textAnchor="end"
              height={100}
              interval="preserveStartEnd"
            />
            <YAxis {...yAxisProps} tickFormatter={v => formatDurationShort(v, unit)} />
            <Tooltip
              cursor={{ stroke: CHART_COLORS.tick, strokeWidth: 1 }}
              content={<ChartTooltip hideSwatch nameFormatter={() => 'Listening time'} />}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke={CHART_COLORS.accent}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.accent, r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </Section>
  );
}
