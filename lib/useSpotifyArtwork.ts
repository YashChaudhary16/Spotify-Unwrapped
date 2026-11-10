'use client';

import { useEffect, useState } from 'react';

export interface SpotifyArtwork {
  /** Album cover (640px when available). */
  imageUrl: string;
  /** Dominant cover color, darkened so white text stays readable on it (CSS rgb()). */
  color: string;
}

const cache = new Map<string, Promise<SpotifyArtwork | null>>();

/** 300px cover ids start with this prefix; swapping it gives the 640px version of the same image. */
const COVER_300 = 'ab67616d00001e02';
const COVER_640 = 'ab67616d0000b273';

/**
 * Average color of the image, weighted toward saturated pixels (so a colorful cover isn't averaged to gray),
 * then darkened to at most ~32% lightness for contrast with white text.
 */
function dominantColor(img: HTMLImageElement): string {
  const size = 24;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return 'rgb(30, 30, 30)';
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  let r = 0;
  let g = 0;
  let b = 0;
  let total = 0;
  for (let i = 0; i < data.length; i += 4) {
    const [pr, pg, pb] = [data[i], data[i + 1], data[i + 2]];
    const max = Math.max(pr, pg, pb);
    const min = Math.min(pr, pg, pb);
    const saturation = max === 0 ? 0 : (max - min) / max;
    const weight = 0.15 + saturation * (max / 255); // favor vivid, non-black pixels
    r += pr * weight;
    g += pg * weight;
    b += pb * weight;
    total += weight;
  }
  r /= total;
  g /= total;
  b /= total;

  // Darken so the brightest channel is at most ~82/255 (keeps white text ≥ 7:1 contrast).
  const scale = Math.min(1, 82 / Math.max(r, g, b, 1));
  return `rgb(${Math.round(r * scale)}, ${Math.round(g * scale)}, ${Math.round(b * scale)})`;
}

function loadArtwork(trackId: string): Promise<SpotifyArtwork | null> {
  const cached = cache.get(trackId);
  if (cached) return cached;

  const promise = (async () => {
    // Public oEmbed endpoint: no login or API key, CORS-enabled. Only the track ID is sent.
    const res = await fetch(
      `https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/track/${trackId}`)}`
    );
    if (!res.ok) return null;
    const json: { thumbnail_url?: string } = await res.json();
    if (!json.thumbnail_url) return null;
    const imageUrl = json.thumbnail_url.replace(COVER_300, COVER_640);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    await img.decode();
    let color = 'rgb(30, 30, 30)';
    try {
      color = dominantColor(img);
    } catch {
      /* canvas blocked — keep the neutral color */
    }
    return { imageUrl, color };
  })().catch(() => null);

  cache.set(trackId, promise);
  return promise;
}

/** Album cover + dominant color for a Spotify track, or null while loading / unavailable. */
export function useSpotifyArtwork(trackId: string | null): SpotifyArtwork | null {
  const [artwork, setArtwork] = useState<SpotifyArtwork | null>(null);

  useEffect(() => {
    setArtwork(null);
    if (!trackId) return;
    let cancelled = false;
    loadArtwork(trackId).then(result => {
      if (!cancelled) setArtwork(result);
    });
    return () => {
      cancelled = true;
    };
  }, [trackId]);

  return artwork;
}
