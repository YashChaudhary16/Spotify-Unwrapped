'use client';

import { CalendarClock, CalendarDays, Clock, ListMusic, MicVocal, X } from 'lucide-react';
import { TopTrack } from '@/lib/analytics';
import { formatDuration, formatNumber } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
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
  /** Clears the selection (back to the artist picker). */
  onClear: () => void;
}

/** An artist "page", styled after the artist header in the Spotify app. */
export default function ArtistAnalytics({ artistName, analytics, topN, onClear }: ArtistAnalyticsProps) {
  const { unit } = useTimeUnit();

  return (
    <div>
      <header className="mb-10 rounded-2xl bg-gradient-to-b from-[#1ED760]/20 via-[#1ED760]/5 to-transparent px-6 pb-6 pt-10 md:px-8 md:pt-14">
        <p className="flex items-center gap-2 text-sm font-medium text-spotify-lightgray">
          <MicVocal className="h-4 w-4" aria-hidden />
          Artist
        </p>
        <h1 className="mt-2 break-words text-4xl font-extrabold tracking-tight text-white md:text-6xl">{artistName}</h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="tabular-nums text-spotify-lightgray">
            {formatDuration(analytics.totalHours, unit)} · {formatNumber(analytics.uniqueTracks)} tracks ·{' '}
            {formatNumber(analytics.uniqueDays)} listening days
          </p>
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-full border border-spotify-muted px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:border-white"
          >
            <X className="h-4 w-4" aria-hidden />
            Choose another artist
          </button>
        </div>
      </header>

      <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Clock} label="Total listening time" value={formatDuration(analytics.totalHours, unit)} />
        <StatCard icon={ListMusic} label="Unique tracks" value={formatNumber(analytics.uniqueTracks)} />
        <StatCard icon={CalendarDays} label="Listening days" value={formatNumber(analytics.uniqueDays)} />
        <StatCard
          icon={CalendarClock}
          label="Average per listening day"
          value={formatDuration(analytics.avgHoursPerDay, unit)}
        />
      </div>

      <TopTracks tracks={analytics.topTracks.slice(0, topN)} />

      <TimeSeriesChart data={analytics.timeSeries} />

      <TimeOfDayChart data={analytics.timeOfDay} />
    </div>
  );
}
