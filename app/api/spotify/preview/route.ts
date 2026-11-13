import { NextRequest, NextResponse } from 'next/server';
import { fetchEmbedEntity, ONE_DAY, SPOTIFY_ID } from '@/lib/server/spotifyEmbed';

/**
 * GET /api/spotify/preview?trackId=<22-char id> → { url: string | null }
 *
 * The 30-second preview clip of a track (for the story's background music), read from the track's public
 * embed page (`audioPreview.url`, on Spotify's p.scdn.co CDN). Only a public track ID is involved; nothing
 * is stored. Unplayable tracks and tracks without a clip give `url: null`. Cached for a day at the edge.
 */
export async function GET(request: NextRequest) {
  const trackId = request.nextUrl.searchParams.get('trackId') ?? '';
  if (!SPOTIFY_ID.test(trackId)) {
    return NextResponse.json({ error: 'Invalid trackId' }, { status: 400 });
  }

  let url: string | null = null;
  try {
    const track = await fetchEmbedEntity(`track/${trackId}`);
    const candidate = track?.isPlayable === false ? null : track?.audioPreview?.url;
    // Only Spotify's preview CDN, so the route can't be used to point the player anywhere else.
    if (typeof candidate === 'string' && candidate.startsWith('https://p.scdn.co/')) url = candidate;
  } catch {
    url = null;
  }

  return NextResponse.json(
    { url },
    { headers: { 'Cache-Control': `public, s-maxage=${ONE_DAY}, stale-while-revalidate=${ONE_DAY * 7}` } }
  );
}
