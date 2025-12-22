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
import { format, parseISO } from 'date-fns';

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

export default function AlbumAnalytics({ albums, artistCoverage }: AlbumAnalyticsProps) {
  if (!albums || albums.length === 0) return null;

  const [selectedAlbumKey, setSelectedAlbumKey] = useState(albums[0].key);
  const [comparisonKey, setComparisonKey] = useState(albums[1]?.key || albums[0].key);
  const [activeSessionIdx, setActiveSessionIdx] = useState<number | null>(null);

  useEffect(() => {
    // Keep comparison selection valid
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
  }, [albums, selectedAlbumKey, comparisonKey]);

  const selectedAlbum = useMemo(
    () => albums.find(a => a.key === selectedAlbumKey) || albums[0],
    [albums, selectedAlbumKey]
  );
  const comparisonAlbum = useMemo(
    () => albums.find(a => a.key === comparisonKey),
    [albums, comparisonKey]
  );

  const topAlbums = albums.slice(0, 8);

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6 text-spotify-green">💿 Albums</h2>

      {/* Top Albums selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {topAlbums.map((album, idx) => (
          <button
            key={album.key}
            onClick={() => setSelectedAlbumKey(album.key)}
            className={`text-left rounded-xl p-4 transition border ${
              album.key === selectedAlbumKey ? 'border-spotify-green bg-spotify-gray/60' : 'border-spotify-gray bg-spotify-gray/30 hover:border-spotify-green/60'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-spotify-lightgray">#{idx + 1}</div>
              <div className="text-xs px-2 py-1 rounded-full bg-spotify-dark text-spotify-green">
                {depthLabel(album.depthScore)}
              </div>
            </div>
            <div className="text-lg font-semibold text-white">{album.album}</div>
            <div className="text-sm text-spotify-lightgray mb-2">{album.artist}</div>
            <div className="flex gap-3 text-sm">
              <span className="text-spotify-green font-semibold">{album.hours.toFixed(1)} hrs</span>
              <span className="text-spotify-lightgray">{album.plays} plays</span>
              <span className="text-spotify-lightgray">{album.uniqueTracks} tracks</span>
            </div>
          </button>
        ))}
      </div>

      {/* Selected album detail */}
      <div className="bg-spotify-gray/40 rounded-xl p-6 mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-2xl font-semibold text-white">{selectedAlbum.album}</h3>
            <p className="text-spotify-lightgray">{selectedAlbum.artist}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <StatPill label="Total hours" value={`${selectedAlbum.hours.toFixed(1)} hrs`} />
            <StatPill label="Total plays" value={selectedAlbum.plays.toLocaleString()} />
            <StatPill label="Unique tracks" value={selectedAlbum.uniqueTracks.toString()} />
            <StatPill label="Top track share" value={`${(selectedAlbum.depthScore * 100).toFixed(0)}%`} />
            <StatPill label="First listen" value={selectedAlbum.firstListen} />
            <StatPill label="Latest listen" value={selectedAlbum.lastListen} />
          </div>
        </div>

        {/* Most played track + depth */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="col-span-1 md:col-span-2 bg-spotify-dark rounded-lg p-4 border border-spotify-gray">
            <h4 className="text-lg font-semibold text-spotify-green mb-2">Most-played track</h4>
            <div className="text-xl text-white">{selectedAlbum.mostPlayedTrack.track || 'Unknown track'}</div>
            <div className="text-sm text-spotify-lightgray">{selectedAlbum.artist}</div>
            <div className="mt-2 text-sm">
              {selectedAlbum.mostPlayedTrack.hours.toFixed(2)} hrs · {selectedAlbum.mostPlayedTrack.plays} plays (
              {selectedAlbum.hours > 0 ? ((selectedAlbum.mostPlayedTrack.hours / selectedAlbum.hours) * 100).toFixed(1) : '0'}% of album)
            </div>
          </div>
          <div className="bg-spotify-dark rounded-lg p-4 border border-spotify-gray">
            <h4 className="text-lg font-semibold text-spotify-green mb-2">Depth vs repeat</h4>
            <p className="text-sm text-spotify-lightgray mb-2">
              {depthLabel(selectedAlbum.depthScore)} · {(selectedAlbum.depthScore * 100).toFixed(0)}% top track share
            </p>
            <div className="h-2 rounded-full bg-spotify-gray overflow-hidden">
              <div
                className="h-full bg-spotify-green transition-all"
                style={{ width: `${Math.min(selectedAlbum.depthScore * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-spotify-lightgray mt-2">
              Top track share reflects % of album listening time spent on its most-played track.
            </p>
          </div>
        </div>

        {/* Momentum and session placement */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-spotify-dark rounded-lg p-4 border border-spotify-gray">
            <h4 className="text-lg font-semibold text-spotify-green mb-4">Album momentum</h4>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart
                data={selectedAlbum.timeSeries.map(d => ({
                  ...d,
                  dateFormatted: format(parseISO(d.date), 'MMM dd, yyyy'),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis
                  dataKey="dateFormatted"
                  stroke="#B3B3B3"
                  angle={-35}
                  textAnchor="end"
                  height={70}
                  interval="preserveStartEnd"
                />
                <YAxis stroke="#B3B3B3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#282828',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="#1DB954"
                  strokeWidth={2}
                  dot={{ fill: '#1DB954', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-spotify-dark rounded-lg p-4 border border-spotify-gray">
            <h4 className="text-lg font-semibold text-spotify-green mb-4">Session placement</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={selectedAlbum.timeOfDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis dataKey="bucket" stroke="#B3B3B3" tick={{ fontSize: 12 }} interval={0} />
                <YAxis stroke="#B3B3B3" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#282828',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                  }}
                  cursor={{ fill: 'transparent' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#1DB954' }}
                  formatter={(value: number) => [`${value.toFixed(1)} hrs`, 'hours']}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]} activeBar={false}>
                  {selectedAlbum.timeOfDay.map((entry, idx) => (
                    <Cell
                      key={entry.bucket}
                      fill={activeSessionIdx === idx ? '#1ED760' : '#1DB954'}
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
        <div className="bg-spotify-dark rounded-lg p-4 border border-spotify-gray mt-6">
          <h4 className="text-lg font-semibold text-spotify-green mb-4">Listening density (month x weekday)</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left text-spotify-lightgray">Month</th>
                  {WEEKDAY_ORDER.map(day => (
                    <th key={day} className="p-2 text-center text-spotify-lightgray text-xs">
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
                      <td className="p-2 font-semibold">{month}</td>
                      {WEEKDAY_ORDER.map(weekday => {
                        const entry = row.find(r => r.weekday === weekday);
                        const hours = entry?.hours || 0;
                        const intensity = hours / maxHours;
                        const bgColor = `rgba(29, 185, 84, ${Math.max(intensity, 0.1)})`;
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
      </div>

      {/* Artist coverage */}
      <div className="bg-spotify-gray/40 rounded-xl p-6 mb-10">
        <h3 className="text-2xl font-semibold text-white mb-4">Artist coverage by albums</h3>
        <p className="text-sm text-spotify-lightgray mb-4">
          Which albums dominate each artist&apos;s listening time.
        </p>
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
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis type="number" stroke="#B3B3B3" />
            <YAxis dataKey="artist" type="category" stroke="#B3B3B3" width={120} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#282828',
                border: '1px solid #404040',
                borderRadius: '8px',
              }}
              cursor={{ fill: 'transparent' }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#1DB954' }}
              formatter={(value, name, props: any) => {
                if (name === 'hours') return [`${(value as number).toFixed(1)} hrs`, 'Hours'];
                if (name === 'topShare') return [`${(value as number).toFixed(1)}%`, 'Top album share'];
                return [value, name];
              }}
              labelFormatter={(_label, payload) => payload?.[0]?.payload?.topAlbum || ''}
            />
            <Bar dataKey="hours" radius={[8, 8, 8, 8]} activeBar={false}>
              {artistCoverage.slice(0, 8).map((artist, idx) => (
                <Cell
                  key={artist.artist}
                  fill="#1DB954"
                  style={{
                    transform: 'translateY(0)',
                    transition: 'transform 150ms ease, fill 150ms ease, filter 150ms ease',
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="text-xs text-spotify-lightgray mt-2">
          Tooltip shows each artist&apos;s top album and its share of that artist&apos;s hours.
        </div>
      </div>

      {/* Comparison */}
      <div className="bg-spotify-gray/40 rounded-xl p-6">
        <h3 className="text-2xl font-semibold text-white mb-4">Album comparison</h3>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <select
            value={selectedAlbumKey}
            onChange={e => setSelectedAlbumKey(e.target.value)}
            className="w-full md:w-1/2 bg-spotify-dark border border-spotify-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-spotify-green"
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
            className="w-full md:w-1/2 bg-spotify-dark border border-spotify-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:border-spotify-green"
          >
            {albums.map(album => (
              <option key={album.key} value={album.key}>
                {album.album} — {album.artist}
              </option>
            ))}
          </select>
        </div>

        {comparisonAlbum && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CompareCard title="Listening hours" primary={selectedAlbum.hours} secondary={comparisonAlbum.hours} />
            <CompareCard title="Total plays" primary={selectedAlbum.plays} secondary={comparisonAlbum.plays} />
            <CompareCard title="Unique tracks" primary={selectedAlbum.uniqueTracks} secondary={comparisonAlbum.uniqueTracks} />
            <CompareCard
              title="Top track share"
              primary={Number((selectedAlbum.depthScore * 100).toFixed(0))}
              secondary={Number((comparisonAlbum.depthScore * 100).toFixed(0))}
              suffix="%"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 rounded-lg bg-spotify-dark border border-spotify-gray text-sm">
      <div className="text-spotify-lightgray">{label}</div>
      <div className="font-semibold text-white">{value}</div>
    </div>
  );
}

function CompareCard({
  title,
  primary,
  secondary,
  suffix = '',
}: {
  title: string;
  primary: number;
  secondary: number;
  suffix?: string;
}) {
  const max = Math.max(primary, secondary, 1);
  return (
    <div className="bg-spotify-dark rounded-lg p-4 border border-spotify-gray">
      <div className="text-spotify-green font-semibold mb-2">{title}</div>
      <div className="flex items-center justify-between text-white mb-2">
        <span className="font-bold">{primary.toLocaleString()} {suffix}</span>
        <span className="text-spotify-lightgray">vs</span>
        <span className="font-bold">{secondary.toLocaleString()} {suffix}</span>
      </div>
      <div className="h-2 rounded-full bg-spotify-gray overflow-hidden mb-1">
        <div
          className="h-full bg-spotify-green"
          style={{ width: `${(primary / max) * 100}%` }}
        />
      </div>
      <div className="h-2 rounded-full bg-spotify-gray overflow-hidden">
        <div
          className="h-full bg-spotify-lightgray"
          style={{ width: `${(secondary / max) * 100}%` }}
        />
      </div>
    </div>
  );
}

