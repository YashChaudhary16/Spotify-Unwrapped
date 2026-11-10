'use client';

import { Clock } from 'lucide-react';
import { CHART_COLORS, TIME_OF_DAY_COLORS } from '@/lib/chartTheme';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';

interface TimeOfDayChartProps {
  data: { bucket: string; hours: number }[];
}

export default function TimeOfDayChart({ data }: TimeOfDayChartProps) {
  return (
    <Section title="Time of day" icon={Clock} subtitle="When you listen, in local time">
      <Card>
        <SimpleBarChart
          data={data}
          categoryKey="bucket"
          height={260}
          colorFor={row => TIME_OF_DAY_COLORS[row.bucket] ?? CHART_COLORS.accent}
        />
      </Card>
    </Section>
  );
}
