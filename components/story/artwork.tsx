'use client';

import type { CSSProperties, ReactNode } from 'react';
import { MicVocal, Music } from 'lucide-react';
import { useSpotifyArtwork } from '@/lib/useSpotifyArtwork';
import { useSpotifyArtist } from '@/lib/useSpotifyArtist';
import {
  BOLD_TONES,
  DARK_TONES,
  INK_WHITE,
  tintBackground,
  type BoldTone,
  type DarkTone,
  type StoryShape,
} from './palette';

/** Slow zoom-out on artwork as the card appears (skipped with reduced motion). */
const DRIFT = 'motion-safe:animate-[story-drift_9s_ease-out_both]';

/** Album cover for a track, or a soft tile with a note icon (no ID, unavailable, or still loading). */
export function Cover({
  trackId,
  alt,
  className = 'h-14 w-14',
  rounded = 'rounded-md',
  drift = false,
}: {
  trackId: string | null;
  alt: string;
  className?: string;
  rounded?: string;
  drift?: boolean;
}) {
  const art = useSpotifyArtwork(trackId);
  return (
    <span className={`relative block shrink-0 overflow-hidden bg-ink/10 ${rounded} ${className}`}>
      {art ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN image
        <img
          src={art.imageUrl}
          alt={alt}
          className={`h-full w-full object-cover ${drift ? DRIFT : ''}`}
          draggable={false}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center" aria-hidden>
          <Music className="h-1/3 w-1/3 text-ink/40" />
        </span>
      )}
    </span>
  );
}

/** Round artist photo, falling back to a mic tile. */
export function ArtistPhoto({ trackId, name, className }: { trackId: string | null; name: string; className: string }) {
  const info = useSpotifyArtist(trackId, name);
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full bg-ink/10 shadow-2xl shadow-black/50 ${className}`}>
      {info?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Spotify CDN image
        <img src={info.imageUrl} alt={name} className={`h-full w-full object-cover ${DRIFT}`} draggable={false} />
      ) : (
        <span className="flex h-full w-full items-center justify-center" aria-hidden>
          <MicVocal className="h-1/3 w-1/3 text-ink/40" />
        </span>
      )}
    </span>
  );
}

/** Dark tone that switches to the cover's (or Spotify artist's) color once known. */
function ArtworkBackground({ tone, trackId, artist }: { tone: DarkTone; trackId?: string | null; artist?: string }) {
  const art = useSpotifyArtwork(artist ? null : trackId ?? null);
  const artistInfo = useSpotifyArtist(artist ? trackId ?? null : null, artist ?? '');
  const color = artist ? artistInfo?.tintedColor ?? artistInfo?.color : art?.color;
  return (
    <>
      <div className="pointer-events-none absolute inset-0" style={{ background: DARK_TONES[tone] }} aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{ background: color ? tintBackground(color) : undefined, opacity: color ? 1 : 0 }}
        aria-hidden
      />
    </>
  );
}

/** Flat color block with one large, slowly floating shape. */
function BoldBackground({ tone, shape }: { tone: BoldTone; shape: StoryShape }) {
  const { bg, shape: fill } = BOLD_TONES[tone];
  const float = 'motion-safe:animate-[story-float_14s_ease-in-out_infinite_alternate]';
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: bg }} aria-hidden>
      <svg viewBox="0 0 100 178" preserveAspectRatio="xMidYMid slice" className={`absolute inset-0 h-full w-full ${float}`}>
        {shape === 'circles' && (
          <>
            <circle cx="88" cy="22" r="34" fill={fill} />
            <circle cx="12" cy="150" r="16" fill={fill} />
          </>
        )}
        {shape === 'arch' && <path d="M-10 178 A60 60 0 0 1 110 178 Z" fill={fill} transform="translate(0 -6)" />}
        {shape === 'stripes' && (
          <g fill={fill}>
            <rect x="-40" y="10" width="200" height="14" transform="rotate(-24 50 89)" />
            <rect x="-40" y="44" width="200" height="14" transform="rotate(-24 50 89)" />
            <rect x="-40" y="78" width="200" height="14" transform="rotate(-24 50 89)" />
          </g>
        )}
        {shape === 'blob' && (
          <path
            d="M70 6c18 4 30 22 26 40s-22 26-38 22-26-16-24-32S52 2 70 6zM18 128c12-2 22 8 22 20s-12 22-24 20-18-12-16-22 6-16 18-18z"
            fill={fill}
          />
        )}
      </svg>
    </div>
  );
}

type FrameProps =
  | { bold: BoldTone; shape?: StoryShape; children: ReactNode }
  | { dark: DarkTone; trackId?: string | null; artist?: string; children: ReactNode };

/**
 * Wrapper every card uses: its background (bold block or artwork-tinted dark tone), and the ink color for
 * the text on top (`text-ink`, `bg-ink/15`, …). Backgrounds are absolutely positioned against the player's
 * card layer, so they fill the whole card.
 */
export function CardFrame(props: FrameProps) {
  const ink = 'bold' in props ? BOLD_TONES[props.bold].ink : INK_WHITE;
  const style = { '--story-ink': ink } as CSSProperties;
  return (
    <div className="flex min-h-0 flex-1 flex-col text-ink" style={style}>
      {'bold' in props ? (
        <BoldBackground tone={props.bold} shape={props.shape ?? 'circles'} />
      ) : (
        <ArtworkBackground tone={props.dark} trackId={props.trackId} artist={props.artist} />
      )}
      <div className="relative flex min-h-0 flex-1 flex-col">{props.children}</div>
    </div>
  );
}
