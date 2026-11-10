'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MonitorSmartphone } from 'lucide-react';
import { CHART_COLORS, barCursor, gridProps, xAxisProps, yAxisProps } from '@/lib/chartTheme';
import { formatDurationShort } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { ChartTooltip } from '@/components/ui/ChartTooltip';

interface PlatformChartProps {
  data: { platform: string; hours: number }[];
}

export default function PlatformChart({ data }: PlatformChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { unit } = useTimeUnit();

  return (
    <Section title="Platforms" icon={MonitorSmartphone} subtitle="Listening time by device type">
      <Card>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} dataKey="platform" />
            <YAxis {...yAxisProps} tickFormatter={v => formatDurationShort(v, unit)} />
            <Tooltip cursor={barCursor} content={<ChartTooltip hideSwatch nameFormatter={() => 'Listening time'} />} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} activeBar={false}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.platform}`}
                  fill={CHART_COLORS.accent}
                  style={{
                    transform: activeIndex === index ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'transform 150ms ease, fill 150ms ease, filter 150ms ease',
                    filter: activeIndex === index ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </Section>
  );
}
