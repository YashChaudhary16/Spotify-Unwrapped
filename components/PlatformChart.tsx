'use client';

import { MonitorSmartphone } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';

interface PlatformChartProps {
  data: { platform: string; hours: number }[];
}

export default function PlatformChart({ data }: PlatformChartProps) {
  return (
    <Section title="Platforms" icon={MonitorSmartphone} subtitle="Listening time by device type">
      <Card>
        <SimpleBarChart data={data} categoryKey="platform" orientation="bars" categoryWidth={110} />
      </Card>
    </Section>
  );
}
