import { NextRequest, NextResponse } from 'next/server';
import { CommonsBanner, findCommonsBanner } from '@/lib/server/commonsBanner';

/**
 * GET /api/spotify/artist?trackId=<22-char id>&name=<artist name>
 *
 * Looks up an artist's profile photo and Spotify's own artist colors without any login or API key.
 * The streaming-history export has track IDs but no artist IDs, so:
 *   1. read the track's public embed page → its artists (name + ID); pick the one matching `name`
 *   2. read that artist's public embed page → profile images + `visualIdentity` colors
 *   3. in parallel, look for a wide, freely licensed banner photo on Wikimedia Commons (lib/server/commonsBanner.ts)
 * These embed pages don't allow browser (CORS) requests, hence this small server route.
 *
 * Only public, non-personal data is involved (a track ID and an artist name). Nothing is stored.
 * Responses are cached for a day at the edge. The embed format is undocumented and may change;
 * any failure returns 404 and the UI falls back to its plain green header.
 */

const TRACK_ID = /^[A-Za-z0-9]{22}$/;
const ONE_DAY = 60 * 60 * 24;

type Rgb = { red: number; green: number; blue: number };

interface ArtistLookup {
  id: string;
  name: string;
  /** Largest profile photo (usually 640px). */
  imageUrl: string | null;
  /** Spotify's artist colors (CSS rgb()), if provided. */
  color: string | null;
  tintedColor: string | null;
  /** Wide, freely licensed photo from Wikimedia Commons (with attribution), if a confident match exists. */
  banner: CommonsBanner | null;
}

async function fetchEmbedData(path: string): Promise<any | null> {
  const res = await fetch(`https://open.spotify.com/embed/${path}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Unwrapped/1.0)' },
    next: { revalidate: ONE_DAY },
  });
  if (!res.ok) return null;
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1])?.props?.pageProps?.state?.data?.entity ?? null;
  } catch {
    return null;
  }
}

const rgb = (c: Rgb | undefined): string | null =>
  c && [c.red, c.green, c.blue].every(n => Number.isFinite(n)) ? `rgb(${c.red}, ${c.green}, ${c.blue})` : null;

const normalize = (s: string) => s.normalize('NFKC').trim().toLowerCase();

export async function GET(request: NextRequest) {
  const trackId = request.nextUrl.searchParams.get('trackId') ?? '';
  const name = request.nextUrl.searchParams.get('name') ?? '';
  if (!TRACK_ID.test(trackId)) {
    return NextResponse.json({ error: 'Invalid trackId' }, { status: 400 });
  }

  try {
    // 1. Track → artists
    const track = await fetchEmbedData(`track/${trackId}`);
    const artists: { name?: string; uri?: string }[] = Array.isArray(track?.artists) ? track.artists : [];
    const candidates = artists.filter(a => typeof a.uri === 'string' && a.uri.startsWith('spotify:artist:'));
    const chosen = candidates.find(a => a.name && normalize(a.name) === normalize(name)) ?? candidates[0];
    if (!chosen?.uri) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    const artistId = chosen.uri.split(':')[2];
    if (!TRACK_ID.test(artistId)) return NextResponse.json({ error: 'Artist not found' }, { status: 404 });

    // 2. Artist → photo + colors (Spotify), and a freely licensed wide banner photo (Wikimedia Commons), in parallel.
    const [artist, banner] = await Promise.all([
      fetchEmbedData(`artist/${artistId}`),
      findCommonsBanner(artistId).catch(err => {
        console.error('[artist banner] Commons lookup failed:', err);
        return null;
      }),
    ]);
    const identity = artist?.visualIdentity ?? {};
    const images: { url?: string; maxWidth?: number }[] = Array.isArray(identity.image) ? identity.image : [];
    const largest = images
      .filter(img => typeof img.url === 'string' && img.url.startsWith('https://'))
      .sort((a, b) => (b.maxWidth ?? 0) - (a.maxWidth ?? 0))[0];

    const body: ArtistLookup = {
      id: artistId,
      name: artist?.name ?? chosen.name ?? name,
      imageUrl: largest?.url ?? null,
      color: rgb(identity.backgroundBase),
      tintedColor: rgb(identity.backgroundTintedBase),
      banner,
    };

    return NextResponse.json(body, {
      headers: { 'Cache-Control': `public, s-maxage=${ONE_DAY}, stale-while-revalidate=${ONE_DAY * 7}` },
    });
  } catch {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 404 });
  }
}
