'use client';

import { TrendingUp } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { TrendChart } from '@/components/charts/TrendChart';

interface TimeSeriesChartProps {
  data: { date: string; hours: number }[];
}

export default function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  return (
    <Section title="Listening over time" icon={TrendingUp}>
      <Card>
        <TrendChart data={data} />
      </Card>
    </Section>
  );
}
