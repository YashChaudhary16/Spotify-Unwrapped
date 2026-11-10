'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlbumStat,
  ArtistAlbumCoverage,
} from '@/lib/analytics';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Clock, Disc3, GitCompare, Grid3x3, Layers, TrendingUp, Trophy, Users } from 'lucide-react';
import {
  CHART_COLORS,
  barCursor,
  gridProps,
  gridPropsHorizontalBars,
  xAxisProps,
  yAxisProps,
} from '@/lib/chartTheme';
import { formatDate, formatDuration, formatDurationShort, formatNumber, formatPercent } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { Card, CardTitle } from '@/components/ui/Card';
import { ChartTooltip } from '@/components/ui/ChartTooltip';

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
  const [activeSessionIdx, setActiveSessionIdx] = useState<number | null>(null);

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
  const comparisonAlbum = useMemo(
    () => (hasAlbums ? albums.find(a => a.key === comparisonKey) : null),
    [albums, comparisonKey, hasAlbums]
  );

  const topAlbums = hasAlbums ? albums.slice(0, 8) : [];

  if (!hasAlbums || !selectedAlbum) return null;

  const tickFormatter = (v: number) => formatDurationShort(v, unit);
  const durationFmt = (v: number) => formatDuration(v, unit);

  return (
    <Section title="Albums" icon={Disc3}>
      {/* Top Albums selector */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {topAlbums.map((album, idx) => (
          <button
            key={album.key}
            onClick={() => setSelectedAlbumKey(album.key)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              album.key === selectedAlbumKey
                ? 'border-spotify-green bg-spotify-highlight'
                : 'border-spotify-border bg-spotify-dark hover:bg-spotify-highlight'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold tabular-nums text-spotify-lightgray">#{idx + 1}</div>
              <div className="rounded-full bg-spotify-gray px-2 py-1 text-xs text-spotify-lightgray">
                {depthLabel(album.depthScore)}
              </div>
            </div>
            <div className="truncate text-lg font-semibold text-white">{album.album}</div>
            <div className="mb-2 truncate text-sm text-spotify-lightgray">{album.artist}</div>
            <div className="flex gap-3 text-sm tabular-nums">
              <span className="font-semibold text-white">{formatDuration(album.hours, unit)}</span>
              <span className="text-spotify-lightgray">{formatNumber(album.plays)} plays</span>
              <span className="text-spotify-lightgray">{album.uniqueTracks} tracks</span>
            </div>
          </button>
        ))}
      </div>

      {/* Selected album detail */}
      <Card className="mb-10">
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">{selectedAlbum.album}</h3>
            <p className="text-spotify-lightgray">{selectedAlbum.artist}</p>
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
            <CardTitle icon={TrendingUp}>Album momentum</CardTitle>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={selectedAlbum.timeSeries.map(d => ({
                  ...d,
                  dateFormatted: formatDate(d.date, 'MMM dd, yyyy'),
                }))}
              >
                <CartesianGrid {...gridProps} />
                <XAxis
                  {...xAxisProps}
                  dataKey="dateFormatted"
                  angle={-35}
                  textAnchor="end"
                  height={70}
                  interval="preserveStartEnd"
                />
                <YAxis {...yAxisProps} tickFormatter={tickFormatter} />
                <Tooltip
                  cursor={{ stroke: CHART_COLORS.tick, strokeWidth: 1 }}
                  content={<ChartTooltip hideSwatch nameFormatter={() => 'Listening time'} />}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke={CHART_COLORS.accent}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.accent, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={panel}>
            <CardTitle icon={Clock}>Session placement</CardTitle>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={selectedAlbum.timeOfDay}>
                <CartesianGrid {...gridProps} />
                <XAxis {...xAxisProps} dataKey="bucket" tick={{ ...xAxisProps.tick, fontSize: 11 }} interval={0} />
                <YAxis {...yAxisProps} tickFormatter={tickFormatter} />
                <Tooltip cursor={barCursor} content={<ChartTooltip hideSwatch nameFormatter={() => 'Listening time'} />} />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} activeBar={false}>
                  {selectedAlbum.timeOfDay.map((entry, idx) => (
                    <Cell
                      key={entry.bucket}
                      fill={CHART_COLORS.accent}
                      style={{
                        transform: activeSessionIdx === idx ? 'translateY(-6px)' : 'translateY(0)',
                        transition: 'transform 150ms ease, fill 150ms ease, filter 150ms ease',
                        filter: activeSessionIdx === idx ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' : 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={() => setActiveSessionIdx(idx)}
                      onMouseLeave={() => setActiveSessionIdx(null)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Listening density */}
        {/* TODO(Step 2): scale colors against the whole grid (currently per month), add legend. */}
        <div className={`mt-4 ${panel}`}>
          <CardTitle
            icon={Grid3x3}
            subtitle="Each cell is total listening hours on that weekday for that month, for this album. Brighter cells mean more hours."
          >
            Listening density (month × weekday)
          </CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse tabular-nums">
              <thead>
                <tr>
                  <th className="p-2 text-left text-sm font-medium text-spotify-lightgray">Month</th>
                  {WEEKDAY_ORDER.map(day => (
                    <th key={day} className="p-2 text-center text-xs font-medium text-spotify-lightgray">
                      {day.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTH_ORDER.map(month => {
                  const row = selectedAlbum.heatmapData.filter(h => h.month === month);
                  const maxHours = Math.max(...row.map(r => r.hours), 1);
                  return (
                    <tr key={month}>
                      <td className="p-2 text-sm font-semibold">{month}</td>
                      {WEEKDAY_ORDER.map(weekday => {
                        const entry = row.find(r => r.weekday === weekday);
                        const hours = entry?.hours || 0;
                        const intensity = hours / maxHours;
                        const bgColor = `rgba(30, 215, 96, ${Math.max(intensity, 0.1)})`;
                        return (
                          <td
                            key={weekday}
                            className="p-2 text-center text-xs"
                            style={{ backgroundColor: bgColor }}
                          >
                            {hours > 0 ? hours.toFixed(1) : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Artist coverage */}
      <Card className="mb-10">
        <CardTitle icon={Users} subtitle="Which albums dominate each artist's listening time. Hover a bar to see the top album and its share.">
          Artist coverage by albums
        </CardTitle>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart
            data={artistCoverage.slice(0, 8).map(artist => ({
              artist: artist.artist,
              topAlbum: artist.albums[0]?.album || 'Unknown',
              hours: artist.totalHours,
              topShare: artist.albums[0]?.share || 0,
            }))}
            layout="vertical"
          >
            <CartesianGrid {...gridPropsHorizontalBars} />
            <XAxis {...xAxisProps} type="number" tickFormatter={tickFormatter} />
            <YAxis {...yAxisProps} dataKey="artist" type="category" width={120} />
            <Tooltip
              cursor={barCursor}
              content={
                <ChartTooltip
                  hideSwatch
                  nameFormatter={() => 'Artist total'}
                  labelFormatter={(label, row) =>
                    row ? `${label} · top album: ${row.topAlbum} (${formatNumber(row.topShare, 1)}%)` : label
                  }
                />
              }
            />
            <Bar dataKey="hours" radius={[0, 4, 4, 0]} activeBar={false} fill={CHART_COLORS.accent} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Comparison */}
      <Card>
        <CardTitle icon={GitCompare}>Album comparison</CardTitle>
        <div className="mb-4 flex flex-col gap-4 md:flex-row">
          <select
            value={selectedAlbumKey}
            onChange={e => setSelectedAlbumKey(e.target.value)}
            className="w-full rounded-lg border border-spotify-border bg-spotify-gray px-4 py-2 text-white focus:border-spotify-green focus:outline-none md:w-1/2"
          >
            {albums.map(album => (
              <option key={album.key} value={album.key}>
                {album.album} — {album.artist}
              </option>
            ))}
          </select>
          <select
            value={comparisonKey}
            onChange={e => setComparisonKey(e.target.value)}
            className="w-full rounded-lg border border-spotify-border bg-spotify-gray px-4 py-2 text-white focus:border-spotify-green focus:outline-none md:w-1/2"
          >
            {albums.map(album => (
              <option key={album.key} value={album.key}>
                {album.album} — {album.artist}
              </option>
            ))}
          </select>
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
