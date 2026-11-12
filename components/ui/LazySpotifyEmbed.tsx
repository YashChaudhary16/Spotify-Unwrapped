'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Music } from 'lucide-react';
import { useTrackAvailability } from '@/lib/useSpotifyArtwork';

interface LazySpotifyEmbedProps {
  trackId: string;
  title: string;
  /** Track and artist names, used for the "Find on Spotify" search when the track can't be played. */
  trackName: string;
  artist?: string | null;
  className?: string;
}

/**
 * Spotify track player that only loads when it scrolls near the viewport.
 * Until then a same-size placeholder holds its space, so the list doesn't jump.
 * If Spotify can't play the track for this viewer (ID removed or region-locked), a styled card with a
 * Spotify search link replaces Spotify's empty gray player.
 */
export function LazySpotifyEmbed({ trackId, title, trackName, artist, className = '' }: LazySpotifyEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const availability = useTrackAvailability(visible ? trackId : null);
  const unavailable = availability === 'unavailable';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (unavailable) {
    return <UnavailableTrack trackName={trackName} artist={artist} className={className} />;
  }

  // The player fades in once it has loaded and the availability check has passed, so an
  // unplayable track never flashes Spotify's gray player before the fallback card replaces it.
  const showPlayer = loaded && availability === 'available';

  return (
    <div ref={ref} className={`relative h-20 overflow-hidden rounded-xl bg-spotify-gray ${className}`}>
      {!showPlayer && (
        <div className="absolute inset-0 flex items-center gap-3 px-4 text-sm text-spotify-lightgray" aria-hidden>
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-spotify-highlight">
            <Music className={`h-5 w-5 ${visible ? 'animate-pulse' : ''}`} />
          </span>
          {visible ? 'Loading player…' : 'Spotify player'}
        </div>
      )}
      {visible && (
        <iframe
          title={title}
          // Keep the plain URL: Spotify then picks a colorful background from the album art.
          // (Adding `theme=0` forces the dark gray player.)
          src={`https://open.spotify.com/embed/track/${trackId}`}
          height="80"
          width="100%"
          frameBorder="0"
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          onLoad={() => setLoaded(true)}
          className={`relative block transition-opacity duration-300 ${showPlayer ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}

/** Same footprint as the player, for tracks Spotify can't play here. */
function UnavailableTrack({
  trackName,
  artist,
  className,
}: {
  trackName: string;
  artist?: string | null;
  className: string;
}) {
  const query = [trackName, artist].filter(Boolean).join(' ');
  const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(query)}`;

  return (
    <div
      className={`flex h-20 items-center gap-3 overflow-hidden rounded-xl border border-white/5 bg-gradient-to-br from-[#2a2a2a] via-spotify-highlight to-spotify-dark px-3 ${className}`}
    >
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#3e3e3e] to-[#232323] shadow-lg shadow-black/40"
        aria-hidden
      >
        <Music className="h-6 w-6 text-white/60" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">Not playable here</div>
        <div className="truncate text-xs text-spotify-lightgray">Removed or region-locked on Spotify</div>
      </div>
      <a
        href={searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Search Spotify for “${query}”`}
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/25 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-white hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-spotify-green"
      >
        Find on Spotify
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  );
}
