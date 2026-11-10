'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CalendarDays, Clock, ListMusic, MicVocal, X } from 'lucide-react';
import { useSpotifyArtist } from '@/lib/useSpotifyArtist';
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

/** "rgb(r, g, b)" → "rgba(r, g, b, a)"; falls back to the page color (#121212). */
const withAlpha = (color: string | null | undefined, alpha: number) => {
  const match = color?.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  const [r, g, b] = match ? match.slice(1) : ['18', '18', '18'];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** An artist "page", styled after the artist header in the Spotify app. */
export default function ArtistAnalytics({ artistName, analytics, topN, onClear }: ArtistAnalyticsProps) {
  const { unit } = useTimeUnit();
  // Any of the artist's tracks with a Spotify ID lets us look up their photo and colors.
  const lookupTrackId = useMemo(
    () => analytics.topTracks.find(t => t.trackId)?.trackId ?? null,
    [analytics.topTracks]
  );
  const info = useSpotifyArtist(lookupTrackId, artistName);
  const banner = info?.banner ?? null;
  const [bannerLoaded, setBannerLoaded] = useState(false);
  useEffect(() => setBannerLoaded(false), [banner?.url]);

  return (
    <div>
      <header className="relative mb-10 overflow-hidden rounded-2xl">
        {/* Background: Spotify's artist color when known, otherwise the original green tint. */}
        <div
          className="absolute inset-0"
          style={{
            background: info?.color
              ? `linear-gradient(180deg, ${info.color} 0%, ${info.tintedColor ?? '#181818'} 55%, #121212 100%)`
              : 'linear-gradient(180deg, rgba(30, 215, 96, 0.20) 0%, rgba(30, 215, 96, 0.05) 50%, transparent 100%)',
          }}
          aria-hidden
        />
        {/* Banner: a wide, freely licensed photo from Wikimedia Commons (only when there's a confident match). */}
        {banner && (
          // eslint-disable-next-line @next/next/no-img-element -- remote Wikimedia image
          <img
            src={banner.url}
            alt=""
            aria-hidden
            onLoad={() => setBannerLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover object-[center_30%] transition-opacity duration-700 ${
              bannerLoaded ? 'opacity-70' : 'opacity-0'
            }`}
          />
        )}
        {/* Tint the photo with the artist color from the left, so the name always sits on a calm background. */}
        {banner && (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, ${withAlpha(info?.tintedColor, 1)} 0%, ${withAlpha(
                info?.tintedColor,
                0.8
              )} 30%, ${withAlpha(info?.tintedColor, 0)} 75%)`,
            }}
            aria-hidden
          />
        )}
        {/* Darken the bottom so the name and stats stay readable over any photo. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" aria-hidden />

        {/* Photo credit (required by the CC licenses). */}
        {banner && bannerLoaded && (
          <a
            href={banner.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-3 top-3 z-10 max-w-[70%] truncate rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white/70 backdrop-blur-sm transition-colors hover:text-white"
            title={`Photo: ${banner.author}, ${banner.license}, via Wikimedia Commons (cropped and tinted)`}
          >
            Photo: {banner.author} · {banner.license} · Wikimedia Commons
          </a>
        )}

        <div className="relative flex flex-col gap-6 px-6 pb-6 pt-10 md:flex-row md:items-end md:px-8 md:pt-16">
          {/* Profile photo */}
          <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full bg-spotify-gray shadow-2xl shadow-black/60 md:h-44 md:w-44">
            {info?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN image
              <img src={info.imageUrl} alt={`${artistName}`} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <MicVocal
                  className={`h-12 w-12 text-spotify-muted ${lookupTrackId && !info ? 'animate-pulse' : ''}`}
                  aria-hidden
                />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-medium text-white/80">
              <MicVocal className="h-4 w-4" aria-hidden />
              Artist
            </p>
            <h1 className="mt-2 break-words text-4xl font-extrabold tracking-tight text-white drop-shadow-lg md:text-6xl">
              {artistName}
            </h1>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="tabular-nums text-white/80">
                {formatDuration(analytics.totalHours, unit)} · {formatNumber(analytics.uniqueTracks)} tracks ·{' '}
                {formatNumber(analytics.uniqueDays)} listening days
              </p>
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1.5 rounded-full border border-white/40 bg-black/20 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:border-white"
              >
                <X className="h-4 w-4" aria-hidden />
                Choose another artist
              </button>
            </div>
          </div>
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
