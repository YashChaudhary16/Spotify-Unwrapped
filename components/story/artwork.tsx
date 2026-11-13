'use client';

import type { CSSProperties, ReactNode } from 'react';
import { MicVocal, Music } from 'lucide-react';
import { useSpotifyArtwork } from '@/lib/useSpotifyArtwork';
import { useSpotifyArtist } from '@/lib/useSpotifyArtist';
import { STORY_TONES, tintBackground, type StoryTone } from './palette';

/** Album cover for a track, or a soft tile with a note icon (no ID, unavailable, or still loading). */
export function Cover({
  trackId,
  alt,
  className = 'h-14 w-14',
  rounded = 'rounded-md',
}: {
  trackId: string | null;
  alt: string;
  className?: string;
  rounded?: string;
}) {
  const art = useSpotifyArtwork(trackId);
  return (
    <span className={`relative block shrink-0 overflow-hidden bg-white/10 ${rounded} ${className}`}>
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN image
        <img src={art.imageUrl} alt={alt} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <span className="flex h-full w-full items-center justify-center" aria-hidden>
          <Music className="h-1/3 w-1/3 text-white/40" />
        </span>
      )}
    </span>
  );
}

/** Round artist photo, falling back to a mic tile. */
export function ArtistPhoto({ trackId, name, className }: { trackId: string | null; name: string; className: string }) {
  const info = useSpotifyArtist(trackId, name);
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full bg-white/10 shadow-2xl shadow-black/50 ${className}`}>
      {info?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN image
        <img src={info.imageUrl} alt={name} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <span className="flex h-full w-full items-center justify-center" aria-hidden>
          <MicVocal className="h-1/3 w-1/3 text-white/40" />
        </span>
      )}
    </span>
  );
}

/**
 * Full-bleed card background: the cover's (or artist's) color once known, otherwise the given tone.
 * Rendered as the first child of a card; content after it should be `relative`.
 */
export function CardBackground({
  tone,
  trackId,
  artist,
}: {
  tone: StoryTone;
  trackId?: string | null;
  /** Use Spotify's artist color instead of the cover color. */
  artist?: string;
}) {
  const art = useSpotifyArtwork(artist ? null : trackId ?? null);
  const artistInfo = useSpotifyArtist(artist ? trackId ?? null : null, artist ?? '');
  const color = artist ? artistInfo?.tintedColor ?? artistInfo?.color : art?.color;
  const style: CSSProperties = { background: STORY_TONES[tone] };
  return (
    <>
      <div className="pointer-events-none absolute inset-0" style={style} aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{ background: color ? tintBackground(color) : undefined, opacity: color ? 1 : 0 }}
        aria-hidden
      />
    </>
  );
}

/** Layout wrapper every card uses: background first, then content above it. */
export function CardFrame({ background, children }: { background: ReactNode; children: ReactNode }) {
  return (
    <>
      {background}
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </>
  );
}
