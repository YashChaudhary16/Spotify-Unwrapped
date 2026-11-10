'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock } from 'lucide-react';
import { barCursor, gridProps, xAxisProps, yAxisProps } from '@/lib/chartTheme';
import { formatDurationShort } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { ChartTooltip } from '@/components/ui/ChartTooltip';

interface TimeOfDayChartProps {
  data: { bucket: string; hours: number }[];
}

// TODO(Step 2): replace with a single ordered green ramp; Night is nearly invisible.
const COLORS: Record<string, string> = {
  'Morning (5-11)': '#1ED760',
  'Afternoon (12-17)': '#B3B3B3',
  'Evening (18-22)': '#535353',
  'Night (23-4)': '#191414',
};

export default function TimeOfDayChart({ data }: TimeOfDayChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { unit } = useTimeUnit();

  return (
    <Section title="Time of day" icon={Clock} subtitle="When you listen, in local time">
      <Card>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} dataKey="bucket" />
            <YAxis {...yAxisProps} tickFormatter={v => formatDurationShort(v, unit)} />
            <Tooltip cursor={barCursor} content={<ChartTooltip hideSwatch nameFormatter={() => 'Listening time'} />} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} activeBar={false}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.bucket] || '#1ED760'}
                  style={{
                    transform: activeIndex === index ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'transform 150ms ease, fill 150ms ease, filter 150ms ease',
                    filter: activeIndex === index ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' : 'none',
                    cursor: 'pointer',
                    opacity: activeIndex === index ? 0.95 : 1,
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
