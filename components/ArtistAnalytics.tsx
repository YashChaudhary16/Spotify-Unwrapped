'use client';

import { CalendarClock, Clock, ListMusic, MicVocal } from 'lucide-react';
import { TopTrack } from '@/lib/analytics';
import { formatDuration, formatNumber } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { StatCard } from '@/components/ui/StatCard';
import TimeOfDayChart from './TimeOfDayChart';
import TimeSeriesChart from './TimeSeriesChart';
import TopTracks from './TopTracks';

interface ArtistAnalyticsProps {
  artistName: string;
  analytics: {
    totalHours: number;
    uniqueTracks: number;
    uniqueDays: number;
    avgHoursPerDay: number;
    topTracks: TopTrack[];
    timeOfDay: { bucket: string; hours: number }[];
    timeSeries: { date: string; hours: number }[];
  };
  topN: number;
}

export default function ArtistAnalytics({ artistName, analytics, topN }: ArtistAnalyticsProps) {
  const { unit } = useTimeUnit();

  return (
    <Section title={artistName} icon={MicVocal} subtitle="Artist analytics">
      <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={Clock} label="Total listening time" value={formatDuration(analytics.totalHours, unit)} />
        <StatCard icon={ListMusic} label="Unique tracks" value={formatNumber(analytics.uniqueTracks)} />
        <StatCard
          icon={CalendarClock}
          label="Average per listening day"
          value={formatDuration(analytics.avgHoursPerDay, unit)}
        />
      </div>

      <TopTracks tracks={analytics.topTracks.slice(0, topN)} />

      <TimeOfDayChart data={analytics.timeOfDay} />

      <TimeSeriesChart data={analytics.timeSeries} />
    </Section>
  );
}
