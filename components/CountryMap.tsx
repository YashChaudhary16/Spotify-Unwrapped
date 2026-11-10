'use client';

import { useMemo } from 'react';
import { Globe } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Card } from '@/components/ui/Card';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';

interface CountryMapProps {
  data: { country: string; hours: number }[];
}

/** Countries beyond this many fold into a single "Other countries" bar. */
const MAX_COUNTRIES = 10;

export default function CountryMap({ data }: CountryMapProps) {
  const rows = useMemo(() => {
    const sorted = [...data]
      .map(d => ({ country: d.country || 'Unknown', hours: d.hours }))
      .sort((a, b) => b.hours - a.hours);
    if (sorted.length <= MAX_COUNTRIES) return sorted;
    const rest = sorted.slice(MAX_COUNTRIES - 1);
    return [
      ...sorted.slice(0, MAX_COUNTRIES - 1),
      { country: `Other (${rest.length})`, hours: rest.reduce((sum, d) => sum + d.hours, 0) },
    ];
  }, [data]);

  return (
    <Section title="Countries" icon={Globe} subtitle="Where you were connected while listening">
      <Card>
        <SimpleBarChart
          data={rows}
          categoryKey="country"
          orientation="bars"
          categoryWidth={150}
          categoryTickFormatter={name => (name.length > 20 ? `${name.slice(0, 19)}…` : name)}
        />
      </Card>
    </Section>
  );
}
