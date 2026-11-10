'use client';

import { CalendarClock, Clock, ListMusic, BarChart3 } from 'lucide-react';
import { Analytics } from '@/lib/analytics';
import { formatDuration, formatNumber } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/StatCard';

interface MetricsProps {
  analytics: Analytics;
}

export default function Metrics({ analytics }: MetricsProps) {
  const { unit } = useTimeUnit();

  return (
    <Section title="Overview" icon={BarChart3}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={Clock} label="Total listening time" value={formatDuration(analytics.totalHours, unit)} />
        <StatCard icon={ListMusic} label="Tracks played" value={formatNumber(analytics.totalTracks)} />
        <StatCard
          icon={CalendarClock}
          label="Average per listening day"
          value={formatDuration(analytics.avgHoursPerDay, unit)}
        />
      </div>
    </Section>
  );
}
