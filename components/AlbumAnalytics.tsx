'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlbumStat,
  ArtistAlbumCoverage,
} from '@/lib/analytics';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Clock, Disc3, GitCompare, Grid3x3, Layers, TrendingUp, Trophy, Users } from 'lucide-react';
import {
  CHART_COLORS,
  DIMMED_OPACITY,
  RANK_COLORS,
  TIME_OF_DAY_COLORS,
  gridPropsHorizontalBars,
  xAxisProps,
  yAxisProps,
} from '@/lib/chartTheme';
import { formatDate, formatDuration, formatDurationShort, formatNumber, formatPercent } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { Card, CardTitle } from '@/components/ui/Card';
import { ChartTooltip, PayloadItem } from '@/components/ui/ChartTooltip';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import { TrendChart } from '@/components/charts/TrendChart';
import { Heatmap } from '@/components/charts/Heatmap';
import { SearchOption, SearchSelect } from '@/components/ui/SearchSelect';
import { useSpotifyArtwork } from '@/lib/useSpotifyArtwork';

interface AlbumAnalyticsProps {
  albums: AlbumStat[];
  artistCoverage: ArtistAlbumCoverage[];
}

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const depthLabel = (depthScore: number) => {
  if (depthScore >= 0.5) return 'Single-track binges';
  if (depthScore >= 0.25) return 'Balanced';
  return 'Album-through listens';
};

/** Inner panel inside a Card. */
const panel = 'rounded-lg border border-spotify-border bg-spotify-highlight p-4';

export default function AlbumAnalytics({ albums, artistCoverage }: AlbumAnalyticsProps) {
  const { unit } = useTimeUnit();
  const hasAlbums = Array.isArray(albums) && albums.length > 0;
  const [selectedAlbumKey, setSelectedAlbumKey] = useState(hasAlbums ? albums[0].key : '');
  const [comparisonKey, setComparisonKey] = useState(hasAlbums ? (albums[1]?.key || albums[0].key) : '');
  const [activeArtistIdx, setActiveArtistIdx] = useState<number | null>(null);

  useEffect(() => {
    // Keep comparison selection valid
    if (!hasAlbums) return;
    if (!albums.find(a => a.key === selectedAlbumKey)) {
      setSelectedAlbumKey(albums[0].key);
    }
    if (!albums.find(a => a.key === comparisonKey)) {
      const fallback = albums.find(a => a.key !== selectedAlbumKey)?.key || albums[0].key;
      setComparisonKey(fallback);
    }
    if (selectedAlbumKey === comparisonKey && albums.length > 1) {
      const alternative = albums.find(a => a.key !== selectedAlbumKey);
      if (alternative) setComparisonKey(alternative.key);
    }
  }, [albums, selectedAlbumKey, comparisonKey, hasAlbums]);

  const selectedAlbum = useMemo(
    () => (hasAlbums ? (albums.find(a => a.key === selectedAlbumKey) || albums[0]) : null),
    [albums, selectedAlbumKey, hasAlbums]
  );
  const selectedArtwork = useSpotifyArtwork(selectedAlbum?.coverTrackId ?? null);
  const comparisonAlbum = useMemo(
    () => (hasAlbums ? albums.find(a => a.key === comparisonKey) : null),
    [albums, comparisonKey, hasAlbums]
  );

  const topAlbums = hasAlbums ? albums.slice(0, 8) : [];

  // Artist coverage: per artist, top album + 2nd album + everything else (stacked).
  const coverageRows = useMemo(
    () =>
      artistCoverage.slice(0, 8).map(artist => {
        const [first, second] = artist.albums;
        const a0 = first?.hours ?? 0;
        const a1 = second?.hours ?? 0;
        return {
          artist: artist.artist,
          total: artist.totalHours,
          a0,
          a1,
          rest: Math.max(artist.totalHours - a0 - a1, 0),
          n0: first?.album ?? 'Unknown album',
          n1: second?.album ?? '',
          restCount: Math.max(artist.albums.length - 2, 0),
        };
      }),
    [artistCoverage]
  );

  const albumOptions: SearchOption[] = useMemo(
    () =>
      albums.map(album => ({
        value: album.key,
        label: album.album,
        sublabel: album.artist ?? undefined,
        keywords: album.artist ?? undefined,
        meta: formatDuration(album.hours, unit),
      })),
    [albums, unit]
  );

  const selectedHeatmap = useMemo(() => {
    const map = new Map<string, number>();
    selectedAlbum?.heatmapData.forEach(h => map.set(`${h.month}|${h.weekday}`, h.hours));
    return map;
  }, [selectedAlbum]);

  if (!hasAlbums || !selectedAlbum) return null;

  const tickFormatter = (v: number) => formatDurationShort(v, unit);
  const durationFmt = (v: number) => formatDuration(v, unit);

  const segmentName = (item: PayloadItem) => {
    const row = item.payload ?? {};
    if (item.dataKey === 'a0') return row.n0;
    if (item.dataKey === 'a1') return row.n1;
    return `${row.restCount} other album${row.restCount === 1 ? '' : 's'}`;
  };

  return (
    <Section title="Albums" icon={Disc3}>
      {/* Top Albums selector */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {topAlbums.map((album, idx) => (
          <AlbumCard
            key={album.key}
            album={album}
            rank={idx + 1}
            selected={album.key === selectedAlbumKey}
            onSelect={() => setSelectedAlbumKey(album.key)}
          />
        ))}
      </div>

      {/* Selected album detail */}
      <Card className="mb-10">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            {/* Album cover (rounded square), placeholder tile when there's no Spotify ID or while loading */}
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-spotify-gray shadow-xl shadow-black/50 md:h-28 md:w-28">
              {selectedArtwork ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN image
                <img
                  src={selectedArtwork.imageUrl}
                  alt={`Cover of ${selectedAlbum.album}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Disc3
                    className={`h-10 w-10 text-spotify-muted ${selectedAlbum.coverTrackId ? 'animate-pulse' : ''}`}
                    aria-hidden
                  />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-white">{selectedAlbum.album}</h3>
              <p className="text-spotify-lightgray">{selectedAlbum.artist}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatPill label="Total time" value={formatDuration(selectedAlbum.hours, unit)} />
            <StatPill label="Total plays" value={formatNumber(selectedAlbum.plays)} />
            <StatPill label="Unique tracks" value={selectedAlbum.uniqueTracks.toString()} />
            <StatPill label="Top track share" value={formatPercent(selectedAlbum.depthScore)} />
            <StatPill label="First listen" value={formatDate(selectedAlbum.firstListen)} />
            <StatPill label="Latest listen" value={formatDate(selectedAlbum.lastListen)} />
          </div>
        </div>

        {/* Most played track + depth */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={`col-span-1 md:col-span-2 ${panel}`}>
            <CardTitle icon={Trophy} className="mb-2">Most-played track</CardTitle>
            <div className="text-xl font-semibold text-white">{selectedAlbum.mostPlayedTrack.track || 'Unknown track'}</div>
            <div className="text-sm text-spotify-lightgray">{selectedAlbum.artist}</div>
            <div className="mt-2 text-sm tabular-nums text-spotify-lightgray">
              {formatDuration(selectedAlbum.mostPlayedTrack.hours, unit)} · {formatNumber(selectedAlbum.mostPlayedTrack.plays)} plays ·{' '}
              {formatPercent(selectedAlbum.hours > 0 ? selectedAlbum.mostPlayedTrack.hours / selectedAlbum.hours : 0, 1)} of album
            </div>
          </div>
          <div className={panel}>
            <CardTitle icon={Layers} className="mb-2">Depth vs repeat</CardTitle>
            <p className="mb-2 text-sm text-spotify-lightgray">
              {depthLabel(selectedAlbum.depthScore)} · {formatPercent(selectedAlbum.depthScore)} top track share
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-spotify-gray">
              <div
                className="h-full rounded-full bg-spotify-green transition-all"
                style={{ width: `${Math.min(selectedAlbum.depthScore * 100, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-spotify-lightgray">
              Top track share reflects % of album listening time spent on its most-played track.
            </p>
          </div>
        </div>

        {/* Momentum and session placement */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className={`lg:col-span-2 ${panel}`}>
            <TrendChart
              data={selectedAlbum.timeSeries}
              height={260}
              title={<CardTitle icon={TrendingUp} className="mb-1">Album momentum</CardTitle>}
            />
          </div>

          <div className={panel}>
            <CardTitle icon={Clock} subtitle="Time of day you play this album">Session placement</CardTitle>
            <SimpleBarChart
              data={selectedAlbum.timeOfDay}
              categoryKey="bucket"
              height={260}
              colorFor={row => TIME_OF_DAY_COLORS[row.bucket] ?? CHART_COLORS.accent}
              categoryTickFormatter={bucket => bucket.split(' ')[0]}
            />
          </div>
        </div>

        {/* Listening density */}
        <div className={`mt-4 ${panel}`}>
          <CardTitle
            icon={Grid3x3}
            subtitle="Total listening to this album on each weekday of each month. Hover a cell for the exact time."
          >
            Listening density (month × weekday)
          </CardTitle>
          <Heatmap
            rows={MONTH_ORDER}
            cols={WEEKDAY_ORDER}
            colLabel={day => day.slice(0, 3)}
            value={(month, weekday) => selectedHeatmap.get(`${month}|${weekday}`) || 0}
          />
        </div>
      </Card>

      {/* Artist coverage */}
      <Card className="mb-10">
        <CardTitle icon={Users} subtitle="How each top artist's listening splits across their albums">
          Artist coverage by albums
        </CardTitle>
        <ResponsiveContainer width="100%" height={coverageRows.length * 40 + 40}>
          <BarChart
            data={coverageRows}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
            onMouseMove={(state: any) =>
              setActiveArtistIdx(
                state?.isTooltipActive && typeof state.activeTooltipIndex === 'number' ? state.activeTooltipIndex : null
              )
            }
            onMouseLeave={() => setActiveArtistIdx(null)}
          >
            <CartesianGrid {...gridPropsHorizontalBars} />
            <XAxis {...xAxisProps} type="number" tickFormatter={tickFormatter} />
            <YAxis
              {...yAxisProps}
              dataKey="artist"
              type="category"
              width={150}
              interval={0}
              tick={{ ...yAxisProps.tick, fill: '#FFFFFF', fontSize: 13 }}
              tickFormatter={(name: string) => (name.length > 20 ? `${name.slice(0, 19)}…` : name)}
            />
            <Tooltip
              cursor={false}
              content={
                <ChartTooltip
                  hideZero
                  nameFormatter={segmentName}
                  valueFormatter={(v, item) =>
                    `${formatDuration(v, unit)} · ${formatPercent(item.payload?.total ? v / item.payload.total : 0)}`
                  }
                  labelFormatter={(label, row) => (row ? `${label} · ${formatDuration(row.total, unit)}` : label)}
                />
              }
            />
            {(['a0', 'a1', 'rest'] as const).map((key, segment) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="albums"
                fill={RANK_COLORS[segment]}
                stroke={CHART_COLORS.surface}
                strokeWidth={2}
                maxBarSize={24}
                activeBar={false}
              >
                {coverageRows.map((row, idx) => (
                  <Cell
                    key={row.artist}
                    fillOpacity={activeArtistIdx === null || activeArtistIdx === idx ? 1 : DIMMED_OPACITY}
                    style={{ transition: 'fill-opacity 150ms ease' }}
                  />
                ))}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-spotify-lightgray">
          {['Top album', '2nd album', 'Other albums'].map((label, idx) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: RANK_COLORS[idx] }} aria-hidden />
              {label}
            </span>
          ))}
        </div>
      </Card>

      {/* Comparison */}
      <Card>
        <CardTitle icon={GitCompare}>Album comparison</CardTitle>
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-spotify-lightgray">
              <span className="h-2.5 w-2.5 rounded-sm bg-spotify-green" aria-hidden />
              Album A
            </span>
            <SearchSelect
              ariaLabel="Album A"
              placeholder="Search albums or artists"
              options={albumOptions}
              value={selectedAlbumKey}
              onChange={setSelectedAlbumKey}
            />
          </div>
          <div>
            <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-spotify-lightgray">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.neutral }} aria-hidden />
              Album B
            </span>
            <SearchSelect
              ariaLabel="Album B"
              placeholder="Search albums or artists"
              options={albumOptions}
              value={comparisonKey}
              onChange={setComparisonKey}
              align="right"
            />
          </div>
        </div>

        {comparisonAlbum && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CompareCard title="Listening time" primary={selectedAlbum.hours} secondary={comparisonAlbum.hours} format={durationFmt} />
            <CompareCard title="Total plays" primary={selectedAlbum.plays} secondary={comparisonAlbum.plays} />
            <CompareCard title="Unique tracks" primary={selectedAlbum.uniqueTracks} secondary={comparisonAlbum.uniqueTracks} />
            <CompareCard
              title="Top track share"
              primary={selectedAlbum.depthScore}
              secondary={comparisonAlbum.depthScore}
              format={v => formatPercent(v)}
            />
          </div>
        )}
      </Card>
    </Section>
  );
}

/** Top-album selector card with a background gradient from its cover's dominant color. */
function AlbumCard({
  album,
  rank,
  selected,
  onSelect,
}: {
  album: AlbumStat;
  rank: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { unit } = useTimeUnit();
  const artwork = useSpotifyArtwork(album.coverTrackId);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative overflow-hidden rounded-xl border bg-spotify-dark p-4 text-left transition-colors ${
        selected ? 'border-spotify-green ring-1 ring-spotify-green' : 'border-spotify-border hover:border-white/25'
      }`}
    >
      {/* Cover-color gradient (fades in once the color is known). */}
      <span
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          backgroundImage: artwork
            ? `linear-gradient(135deg, ${artwork.color} 0%, rgba(24, 24, 24, 0.55) 70%, #181818 100%)`
            : undefined,
          opacity: artwork ? 1 : 0,
        }}
        aria-hidden
      />
      {/* Hover lift */}
      <span className="pointer-events-none absolute inset-0 bg-white/0 transition-colors group-hover:bg-white/[0.04]" aria-hidden />

      <span className="relative block">
        <span className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold tabular-nums text-white/80">#{rank}</span>
          <span className="rounded-full bg-black/30 px-2 py-1 text-xs text-white/85">{depthLabel(album.depthScore)}</span>
        </span>
        <span className="block truncate text-lg font-semibold text-white">{album.album}</span>
        <span className="mb-2 block truncate text-sm text-white/80">{album.artist}</span>
        <span className="flex gap-3 text-sm tabular-nums">
          <span className="font-semibold text-white">{formatDuration(album.hours, unit)}</span>
          <span className="text-white/80">{formatNumber(album.plays)} plays</span>
          <span className="text-white/80">{album.uniqueTracks} tracks</span>
        </span>
      </span>
    </button>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-spotify-border bg-spotify-highlight px-3 py-2 text-sm">
      <div className="text-xs text-spotify-lightgray">{label}</div>
      <div className="font-semibold tabular-nums text-white">{value}</div>
    </div>
  );
}

function CompareCard({
  title,
  primary,
  secondary,
  format = v => formatNumber(v),
}: {
  title: string;
  primary: number;
  secondary: number;
  format?: (value: number) => string;
}) {
  const max = Math.max(primary, secondary, Number.EPSILON);
  return (
    <div className={panel}>
      <div className="mb-2 text-sm font-semibold text-white">{title}</div>
      <div className="mb-2 flex items-center justify-between tabular-nums">
        <span className="font-bold text-white">{format(primary)}</span>
        <span className="text-xs text-spotify-muted">vs</span>
        <span className="font-bold text-white">{format(secondary)}</span>
      </div>
      <div className="mb-1 h-1.5 overflow-hidden rounded-full bg-spotify-gray">
        <div className="h-full rounded-full bg-spotify-green" style={{ width: `${(primary / max) * 100}%` }} />
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-spotify-gray">
        <div className="h-full rounded-full" style={{ width: `${(secondary / max) * 100}%`, backgroundColor: CHART_COLORS.neutral }} />
      </div>
    </div>
  );
}
