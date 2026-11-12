'use client';

import { Music } from 'lucide-react';
import { Analytics } from '@/lib/analytics';
import { formatDate, formatDuration, formatPercent } from '@/lib/format';
import { useSpotifyArtwork } from '@/lib/useSpotifyArtwork';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { LazySpotifyEmbed } from '@/components/ui/LazySpotifyEmbed';

interface MostListenedTrackProps {
  track: Analytics['mostListenedTrack'];
}

/** Fallback tint when there's no cover (e.g. sample data): a soft Spotify green. */
const FALLBACK_TINT = 'rgba(30, 215, 96, 0.28)';

/**
 * "#1 track" card styled like a Spotify track page: cover art, a background tinted with the cover's
 * dominant color, key stats, and the playable Spotify player.
 */
export default function MostListenedTrack({ track }: MostListenedTrackProps) {
  const { unit } = useTimeUnit();
  const artwork = useSpotifyArtwork(track.trackId);
  const tint = artwork?.color ?? FALLBACK_TINT;

  const stats = [
    { label: 'Total', value: formatDuration(track.hours, unit) },
    { label: 'Of all listening', value: formatPercent(track.share, 1) },
    {
      label: 'Top day',
      value: track.date ? formatDate(track.date, 'MMM d, yyyy') : '—',
      detail: track.dayHours > 0 ? formatDuration(track.dayHours, unit) : undefined,
    },
  ];

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-spotify-border bg-spotify-dark">
      {/* Background tint from the cover; fades in once the color is known. */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          backgroundImage: `linear-gradient(180deg, ${tint} 0%, rgba(24, 24, 24, 0.85) 65%, #181818 100%)`,
          opacity: artwork || !track.trackId ? 1 : 0.4,
        }}
        aria-hidden
      />

      <div className="relative flex h-full flex-col p-5 md:p-6">
        <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-white">
          <Music className="h-4 w-4 text-white/70" aria-hidden />
          Most listened track
        </h3>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-md bg-spotify-gray shadow-2xl shadow-black/50 sm:h-40 sm:w-40">
            {artwork ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN image, no optimization needed
              <img src={artwork.imageUrl} alt={`Cover art for ${track.track}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Music className={`h-12 w-12 text-spotify-muted ${track.trackId ? 'animate-pulse' : ''}`} aria-hidden />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Your #1 track</p>
            <p className="mt-1 line-clamp-2 break-words text-2xl font-extrabold leading-tight tracking-tight text-white md:text-3xl">
              {track.track}
            </p>
            {track.artist && <p className="mt-1 truncate text-white/80">{track.artist}</p>}
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-2">
          {stats.map(stat => (
            <div key={stat.label} className="rounded-lg bg-black/25 p-3">
              <dt className="text-xs text-white/70">{stat.label}</dt>
              <dd className="mt-0.5 font-semibold tabular-nums text-white">{stat.value}</dd>
              {stat.detail && <dd className="text-xs tabular-nums text-white/70">{stat.detail}</dd>}
            </div>
          ))}
        </dl>

        {track.trackId && (
          <div className="mt-auto pt-5">
            <LazySpotifyEmbed
              trackId={track.trackId}
              title={`Play ${track.track} on Spotify`}
              trackName={track.track}
              artist={track.artist}
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
