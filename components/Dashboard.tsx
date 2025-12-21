'use client';

import { useState, useMemo } from 'react';
import { ProcessedRecord } from '@/lib/preprocessing';
import { calculateAnalytics, getArtistAnalytics, Analytics } from '@/lib/analytics';
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
      <div className="bg-spotify-dark border-b border-spotify-gray sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-spotify-green rounded-full flex items-center justify-center">
              <span className="text-2xl">🎧</span>
            </div>
            <h1 className="text-2xl font-bold text-spotify-green">Spotify Analytics</h1>
          </div>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-spotify-gray hover:bg-spotify-lightgray rounded-lg transition-colors"
          >
            Upload New Data
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Sidebar Filters */}
        <div className="mb-8 bg-spotify-gray/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-spotify-green">📅 Filters</h2>
          
          <div className="mb-6">
            <label className="block mb-2 text-spotify-lightgray">Time Range (Years):</label>
            <div className="flex flex-wrap gap-3">
              {availableYears.map(year => (
                <label key={year} className="flex items-center gap-2 cursor-pointer">
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
                    className="w-4 h-4 text-spotify-green bg-spotify-dark border-spotify-gray rounded focus:ring-spotify-green"
                  />
                  <span>{year}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-spotify-lightgray">
              Number of Top Tracks: {topN}
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block mb-2 text-spotify-lightgray">Artist Analysis:</label>
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="w-full bg-spotify-dark border border-spotify-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-spotify-green"
            >
              <option value="(All Artists)">(All Artists)</option>
              {artists.map(artist => (
                <option key={artist} value={artist}>{artist}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Metrics */}
        <Metrics analytics={analytics} />

        {/* Top Tracks */}
        <TopTracks tracks={analytics.topTracks.slice(0, topN)} />

        {/* Albums */}
        <AlbumAnalytics
          albums={analytics.albumStats}
          artistCoverage={analytics.artistAlbumCoverage}
        />

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

        {/* Artist Analytics */}
        {artistAnalytics && selectedArtist !== '(All Artists)' && (
          <ArtistAnalytics
            artistName={selectedArtist}
            analytics={artistAnalytics}
            topN={topN}
          />
        )}

        {/* Privacy Notice */}
        <div className="mt-12 p-4 bg-spotify-gray/30 rounded-lg border border-spotify-green/30">
          <p className="text-sm text-spotify-lightgray">
            <strong className="text-spotify-green">🔒 Privacy Notice:</strong> Your data is processed entirely in-memory and never saved to disk. 
            IP addresses are automatically removed for your privacy. When you close this page, your data is completely removed.
          </p>
        </div>
      </div>
    </main>
  );
}

