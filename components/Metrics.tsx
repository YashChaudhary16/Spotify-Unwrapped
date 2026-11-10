'use client';

import { BarChart3, CalendarCheck, CalendarClock, Clock, Disc, ListMusic, MicVocal, Music, Users } from 'lucide-react';
import { Analytics } from '@/lib/analytics';
import { formatDate, formatDuration, formatNumber, formatPercent } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/StatCard';

interface MetricsProps {
  analytics: Analytics;
}

export default function Metrics({ analytics }: MetricsProps) {
  const { unit } = useTimeUnit();
  const topTrack = analytics.topTracks[0];
  const activeShare = analytics.daysInRange > 0 ? analytics.uniqueDays / analytics.daysInRange : 0;

  return (
    <Section
      title="At a glance"
      icon={BarChart3}
      subtitle={
        analytics.firstDate
          ? `${formatDate(analytics.firstDate)} – ${formatDate(analytics.lastDate)}`
          : undefined
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} label="Total listening time" value={formatDuration(analytics.totalHours, unit)} />
        <StatCard icon={ListMusic} label="Plays" value={formatNumber(analytics.totalTracks)} />
        <StatCard
          icon={CalendarCheck}
          label="Days active"
          value={formatNumber(analytics.uniqueDays)}
          detail={`${formatPercent(activeShare)} of ${formatNumber(analytics.daysInRange)} days`}
        />
        <StatCard
          icon={CalendarClock}
          label="Average per listening day"
          value={formatDuration(analytics.avgHoursPerDay, unit)}
        />
        <StatCard icon={Disc} label="Unique tracks" value={formatNumber(analytics.uniqueTracks)} />
        <StatCard icon={Users} label="Unique artists" value={formatNumber(analytics.uniqueArtists)} />
        <StatCard
          icon={MicVocal}
          label="Top artist"
          size="md"
          value={<span className="line-clamp-2">{analytics.topArtist?.name ?? '—'}</span>}
          detail={analytics.topArtist ? formatDuration(analytics.topArtist.hours, unit) : undefined}
        />
        <StatCard
          icon={Music}
          label="Top track"
          size="md"
          value={<span className="line-clamp-2">{topTrack?.track ?? '—'}</span>}
          detail={
            topTrack
              ? `${topTrack.artist ? `${topTrack.artist} · ` : ''}${formatDuration(topTrack.hours, unit)}`
              : undefined
          }
        />
      </div>
    </Section>
  );
}
