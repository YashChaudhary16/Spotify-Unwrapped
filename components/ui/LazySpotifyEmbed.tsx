'use client';

import { useEffect, useRef, useState } from 'react';
import { Music } from 'lucide-react';

interface LazySpotifyEmbedProps {
  trackId: string;
  title: string;
  className?: string;
}

/**
 * Spotify track player that only loads when it scrolls near the viewport.
 * Until then a same-size placeholder holds its space, so the list doesn't jump.
 */
export function LazySpotifyEmbed({ trackId, title, className = '' }: LazySpotifyEmbedProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

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

  return (
    <div ref={ref} className={`relative h-20 overflow-hidden rounded-xl bg-spotify-gray ${className}`}>
      {!loaded && (
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
          className={`relative block transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  );
}
