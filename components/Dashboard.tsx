'use client';

import { useState, useMemo } from 'react';
import { ShieldCheck, SlidersHorizontal, Upload } from 'lucide-react';
import { ProcessedRecord } from '@/lib/preprocessing';
import { calculateAnalytics, getArtistAnalytics } from '@/lib/analytics';
import { Brand } from '@/components/ui/Brand';
import { Card, CardTitle } from '@/components/ui/Card';
import { TimeUnitToggle } from '@/components/ui/TimeUnitToggle';
import Metrics from './Metrics';
import TopTracks from './TopTracks';
import PlatformChart from './PlatformChart';
import ShuffleOfflineCharts from './ShuffleOfflineCharts';
import CountryMap from './CountryMap';
import TimeSeriesChart from './TimeSeriesChart';
import StreaksMilestones from './StreaksMilestones';
import TimeOfDayChart from './TimeOfDayChart';
import SkipsReplays from './SkipsReplays';
import MonthlyWeekdayCharts from './MonthlyWeekdayCharts';
import ArtistAnalytics from './ArtistAnalytics';
import AlbumAnalytics from './AlbumAnalytics';

interface DashboardProps {
  data: ProcessedRecord[];
  onReset: () => void;
}

export default function Dashboard({ data, onReset }: DashboardProps) {
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [topN, setTopN] = useState(10);
  const [selectedArtist, setSelectedArtist] = useState<string>('(All Artists)');

  // Get unique years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(data.map(r => r.Year))).sort((a, b) => b - a);
    if (selectedYears.length === 0) {
      setSelectedYears(years);
    }
    return years;
  }, [data, selectedYears.length]);

  // Filter data by selected years
  const filteredData = useMemo(() => {
    if (selectedYears.length === 0) return data;
    return data.filter(r => selectedYears.includes(r.Year));
  }, [data, selectedYears]);

  // Calculate analytics
  const analytics = useMemo(() => {
    return calculateAnalytics(filteredData);
  }, [filteredData]);

  // Get unique artists
  const artists = useMemo(() => {
    return Array.from(new Set(filteredData.map(r => r.master_metadata_album_artist_name).filter((name): name is string => Boolean(name)))).sort();
  }, [filteredData]);

  // Artist analytics
  const artistAnalytics = useMemo(() => {
    if (selectedArtist === '(All Artists)') return null;
    return getArtistAnalytics(filteredData, selectedArtist);
  }, [filteredData, selectedArtist]);

  return (
    <main className="min-h-screen bg-spotify-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-spotify-border bg-spotify-black/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Brand />
          <div className="flex flex-wrap items-center gap-3">
            <TimeUnitToggle />
            <button
              onClick={onReset}
              className="flex items-center gap-2 rounded-full border border-spotify-muted px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:border-white"
            >
              <Upload className="h-4 w-4" aria-hidden />
              Upload new data
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Filters — TODO(Step 3): move into a compact header bar */}
        <Card className="mb-12">
          <CardTitle icon={SlidersHorizontal}>Filters</CardTitle>

          <div className="mb-6">
            <span className="mb-2 block text-sm font-medium text-spotify-lightgray">Years</span>
            <div className="flex flex-wrap gap-3">
              {availableYears.map(year => (
                <label key={year} className="flex cursor-pointer items-center gap-2 tabular-nums">
                  <input
                    type="checkbox"
                    checked={selectedYears.includes(year)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedYears([...selectedYears, year]);
                      } else {
                        setSelectedYears(selectedYears.filter(y => y !== year));
                      }
                    }}
                    className="h-4 w-4"
                  />
                  <span>{year}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="top-n" className="mb-2 block text-sm font-medium text-spotify-lightgray">
              Number of top tracks: <span className="tabular-nums text-white">{topN}</span>
            </label>
            <input
              id="top-n"
              type="range"
              min="5"
              max="50"
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="artist" className="mb-2 block text-sm font-medium text-spotify-lightgray">Artist analysis</label>
            <select
              id="artist"
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="w-full rounded-lg border border-spotify-border bg-spotify-gray px-4 py-2 text-white focus:border-spotify-green focus:outline-none"
            >
              <option value="(All Artists)">(All Artists)</option>
              {artists.map(artist => (
                <option key={artist} value={artist}>{artist}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Main Metrics */}
        <Metrics analytics={analytics} />

        {/* Top Tracks */}
        <TopTracks tracks={analytics.topTracks.slice(0, topN)} />

        {/* Platform Usage */}
        <PlatformChart data={analytics.platformUsage} />

        {/* Shuffle & Offline */}
        <ShuffleOfflineCharts
          shuffleStats={analytics.shuffleStats}
          offlineStats={analytics.offlineStats}
        />

        {/* Country Map */}
        <CountryMap data={analytics.countryStats} />

        {/* Time Series */}
        <TimeSeriesChart data={analytics.timeSeries} />

        {/* Streaks & Milestones */}
        <StreaksMilestones
          longestStreak={analytics.longestStreak}
          maxDay={analytics.maxDay}
          firstSong={analytics.firstSong}
          milestones={analytics.milestones}
          mostListenedTrack={analytics.mostListenedTrack}
        />

        {/* Time of Day */}
        <TimeOfDayChart data={analytics.timeOfDay} />

        {/* Skips & Replays */}
        <SkipsReplays
          skippedTracks={analytics.skippedTracks}
          topPlayedTracks={analytics.topPlayedTracks}
        />

        {/* Monthly & Weekday */}
        <MonthlyWeekdayCharts
          monthlyHours={analytics.monthlyHours}
          weekdayHours={analytics.weekdayHours}
          heatmapData={analytics.heatmapData}
        />

        {/* Albums */}
        <AlbumAnalytics
          albums={analytics.albumStats}
          artistCoverage={analytics.artistAlbumCoverage}
        />

        {/* Artist Analytics */}
        {artistAnalytics && selectedArtist !== '(All Artists)' && (
          <ArtistAnalytics
            artistName={selectedArtist}
            analytics={artistAnalytics}
            topN={topN}
          />
        )}

        {/* Privacy Notice */}
        <div className="mt-12 flex items-start gap-3 rounded-xl border border-spotify-border bg-spotify-dark p-4 text-sm text-spotify-lightgray">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-spotify-green" aria-hidden />
          <p>
            <strong className="font-semibold text-white">Private by design.</strong> Your data is processed entirely
            in your browser and never uploaded or saved. IP addresses are removed automatically, and closing this page
            clears everything.
          </p>
        </div>
      </div>
    </main>
  );
}
