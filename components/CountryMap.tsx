'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Globe } from 'lucide-react';
import { CHART_COLORS, barCursor, gridProps, xAxisProps, yAxisProps } from '@/lib/chartTheme';
import { formatDurationShort } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { ChartTooltip } from '@/components/ui/ChartTooltip';

interface CountryMapProps {
  data: { country: string; hours: number }[];
}

export default function CountryMap({ data }: CountryMapProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { unit } = useTimeUnit();

  return (
    <Section title="Countries" icon={Globe} subtitle="Where you were connected while listening">
      <Card>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} dataKey="country" angle={-45} textAnchor="end" height={100} />
            <YAxis {...yAxisProps} tickFormatter={v => formatDurationShort(v, unit)} />
            <Tooltip cursor={barCursor} content={<ChartTooltip hideSwatch nameFormatter={() => 'Listening time'} />} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} activeBar={false}>
              {data.map((entry, idx) => (
                <Cell
                  key={entry.country}
                  fill={CHART_COLORS.accent}
                  style={{
                    transform: activeIndex === idx ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'transform 150ms ease, fill 150ms ease, filter 150ms ease',
                    filter: activeIndex === idx ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
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
