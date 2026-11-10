'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Disc3, LayoutDashboard, ListMusic, MicVocal, ShieldCheck, Sun, Upload, type LucideIcon } from 'lucide-react';
import { ProcessedRecord } from '@/lib/preprocessing';
import { calculateAnalytics, getArtistAnalytics } from '@/lib/analytics';
import { formatDuration, formatNumber } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Brand } from '@/components/ui/Brand';
import { ChipGroup, chipClassName } from '@/components/ui/ChipGroup';
import { SearchOption, SearchSelect } from '@/components/ui/SearchSelect';
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
import ArtistPicker from './ArtistPicker';
import AlbumAnalytics from './AlbumAnalytics';

interface DashboardProps {
  data: ProcessedRecord[];
  onReset: () => void;
}

type TabId = 'overview' | 'tracks' | 'habits' | 'albums' | 'artist';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'tracks', label: 'Tracks', icon: ListMusic },
  { id: 'habits', label: 'Habits', icon: Sun },
  { id: 'albums', label: 'Albums', icon: Disc3 },
  { id: 'artist', label: 'Artist', icon: MicVocal },
];

const isTab = (value: string): value is TabId => TABS.some(t => t.id === value);

const TOP_N_OPTIONS = [
  { value: '10', label: '10' },
  { value: '25', label: '25' },
  { value: '50', label: '50' },
];

export default function Dashboard({ data, onReset }: DashboardProps) {
  const { unit } = useTimeUnit();
  const [tab, setTab] = useState<TabId>('overview');
  /** Selected years; an empty list means "All years". */
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [topN, setTopN] = useState('10');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  // Tabs are linkable via the URL hash (#tracks, #albums, …).
  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (isTab(fromHash)) setTab(fromHash);
  }, []);

  const goToTab = useCallback((next: TabId) => {
    setTab(next);
    try {
      window.history.replaceState(null, '', `#${next}`);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0 });
  }, []);

  const availableYears = useMemo(
    () => Array.from(new Set(data.map(r => r.Year))).sort((a, b) => b - a),
    [data]
  );

  const toggleYear = (year: number) =>
    setSelectedYears(prev => {
      const next = prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year];
      // Selecting every year (or none) is the same as "All".
      return next.length === availableYears.length ? [] : next;
    });

  const filteredData = useMemo(
    () => (selectedYears.length === 0 ? data : data.filter(r => selectedYears.includes(r.Year))),
    [data, selectedYears]
  );

  const analytics = useMemo(() => calculateAnalytics(filteredData), [filteredData]);

  // Artists ranked by listening time in the selected years.
  const artistHours = useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach(r => {
      const name = r.master_metadata_album_artist_name;
      if (name && r.hours > 0) map.set(name, (map.get(name) || 0) + r.hours);
    });
    return map;
  }, [filteredData]);

  const artistOptions: SearchOption[] = useMemo(
    () =>
      Array.from(artistHours.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, hours]) => ({ value: name, label: name, meta: formatDuration(hours, unit) })),
    [artistHours, unit]
  );

  const artistAnalytics = useMemo(
    () => (selectedArtist && artistHours.has(selectedArtist) ? getArtistAnalytics(filteredData, selectedArtist) : null),
    [filteredData, selectedArtist, artistHours]
  );

  const selectArtist = (artist: string) => {
    setSelectedArtist(artist);
    goToTab('artist');
  };

  const yearSummary =
    selectedYears.length === 0
      ? 'All years'
      : [...selectedYears].sort((a, b) => a - b).join(', ');

  return (
    <main className="min-h-screen bg-spotify-black text-white">
      {/* Sticky header: brand, artist search, tabs, filters */}
      <header className="sticky top-0 z-40 border-b border-spotify-border bg-spotify-black/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3 pt-3">
            <Brand />
            <SearchSelect
              ariaLabel="Search artists"
              placeholder="Search artists"
              options={artistOptions}
              value={selectedArtist}
              onChange={selectArtist}
              onClear={() => setSelectedArtist(null)}
              align="right"
              className="ml-auto w-full max-w-[16rem] sm:max-w-xs"
            />
            <button
              onClick={onReset}
              title="Upload new data"
              className="flex shrink-0 items-center gap-2 rounded-full border border-spotify-muted px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:border-white sm:px-4"
            >
              <Upload className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Upload new data</span>
            </button>
          </div>

          {/* Tabs */}
          <nav aria-label="Dashboard sections" className="-mb-px mt-2 flex gap-1 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = id === tab;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => goToTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-spotify-green text-white'
                      : 'border-transparent text-spotify-lightgray hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filter bar */}
        <div className="border-t border-spotify-border">
          <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2.5">
            <div className="flex shrink-0 items-center gap-2" role="group" aria-label="Years">
              <span className="text-xs font-medium uppercase tracking-wider text-spotify-muted">Years</span>
              <button
                type="button"
                aria-pressed={selectedYears.length === 0}
                onClick={() => setSelectedYears([])}
                className={chipClassName(selectedYears.length === 0, 'sm')}
              >
                All
              </button>
              {availableYears.map(year => (
                <button
                  key={year}
                  type="button"
                  aria-pressed={selectedYears.includes(year)}
                  onClick={() => toggleYear(year)}
                  className={chipClassName(selectedYears.includes(year), 'sm')}
                >
                  {year}
                </button>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wider text-spotify-muted">Show</span>
              <TimeUnitToggle />
            </div>

            {(tab === 'tracks' || tab === 'artist') && (
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-spotify-muted">Top</span>
                <ChipGroup ariaLabel="Number of top tracks" size="sm" options={TOP_N_OPTIONS} value={topN} onChange={setTopN} />
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <p className="mb-8 text-sm text-spotify-lightgray">
          <span className="font-semibold text-white">{yearSummary}</span> · {formatNumber(filteredData.length)} plays
        </p>

        {tab === 'overview' && (
          <>
            <Metrics analytics={analytics} />
            <TimeSeriesChart data={analytics.timeSeries} />
            <StreaksMilestones
              longestStreak={analytics.longestStreak}
              maxDay={analytics.maxDay}
              firstSong={analytics.firstSong}
              milestones={analytics.milestones}
              mostListenedTrack={analytics.mostListenedTrack}
            />
            <ShuffleOfflineCharts shuffleStats={analytics.shuffleStats} offlineStats={analytics.offlineStats} />
          </>
        )}

        {tab === 'tracks' && (
          <>
            <TopTracks tracks={analytics.topTracks.slice(0, Number(topN))} />
            <SkipsReplays skippedTracks={analytics.skippedTracks} topPlayedTracks={analytics.topPlayedTracks} />
          </>
        )}

        {tab === 'habits' && (
          <>
            <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-2">
              <TimeOfDayChart data={analytics.timeOfDay} />
              <PlatformChart data={analytics.platformUsage} />
            </div>
            <MonthlyWeekdayCharts
              monthlyHours={analytics.monthlyHours}
              weekdayHours={analytics.weekdayHours}
              heatmapData={analytics.heatmapData}
            />
            <CountryMap data={analytics.countryStats} />
          </>
        )}

        {tab === 'albums' && (
          <AlbumAnalytics albums={analytics.albumStats} artistCoverage={analytics.artistAlbumCoverage} />
        )}

        {tab === 'artist' &&
          (selectedArtist && artistAnalytics ? (
            <ArtistAnalytics
              artistName={selectedArtist}
              analytics={artistAnalytics}
              topN={Number(topN)}
              onClear={() => setSelectedArtist(null)}
            />
          ) : (
            <ArtistPicker
              options={artistOptions}
              onSelect={selectArtist}
              notice={
                selectedArtist ? (
                  <>
                    No plays from <span className="font-semibold text-white">{selectedArtist}</span> in the selected
                    years. Pick more years above, or choose another artist.
                  </>
                ) : undefined
              }
            />
          ))}

        {/* Privacy Notice */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-spotify-border bg-spotify-dark p-4 text-sm text-spotify-lightgray">
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
