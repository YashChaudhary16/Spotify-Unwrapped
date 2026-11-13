'use client';

import { useEffect, useState } from 'react';

export interface SpotifyArtistInfo {
  id: string;
  name: string;
  imageUrl: string | null;
  /** Spotify's artist color (brighter) and its dark tinted variant, as CSS rgb(). */
  color: string | null;
  tintedColor: string | null;
  /** Wide, freely licensed photo from Wikimedia Commons, with what's needed for attribution. */
  banner: {
    url: string;
    width: number;
    height: number;
    pageUrl: string;
    author: string;
    license: string;
    licenseUrl: string | null;
  } | null;
}

const cache = new Map<string, Promise<SpotifyArtistInfo | null>>();

function loadArtist(trackId: string, artistName: string): Promise<SpotifyArtistInfo | null> {
  const key = `${trackId}|${artistName}`;
  let promise = cache.get(key);
  if (!promise) {
    promise = fetch(`/api/spotify/artist?trackId=${encodeURIComponent(trackId)}&name=${encodeURIComponent(artistName)}`)
      .then(res => (res.ok ? (res.json() as Promise<SpotifyArtistInfo>) : null))
      .catch(() => null);
    cache.set(key, promise);
  }
  return promise;
}

/** Starts loading an artist's photo and colors into the cache. */
export function prefetchSpotifyArtist(trackId: string | null | undefined, artistName: string): void {
  if (trackId) void loadArtist(trackId, artistName);
}

/**
 * Artist photo + Spotify's artist colors, looked up from one of the artist's track IDs
 * (via /api/spotify/artist). Returns null while loading or if unavailable.
 */
export function useSpotifyArtist(trackId: string | null, artistName: string): SpotifyArtistInfo | null {
  const [info, setInfo] = useState<SpotifyArtistInfo | null>(null);

  useEffect(() => {
    setInfo(null);
    if (!trackId) return;
    let cancelled = false;
    loadArtist(trackId, artistName).then(result => {
      if (!cancelled) setInfo(result);
    });
    return () => {
      cancelled = true;
    };
  }, [trackId, artistName]);

  return info;
}
