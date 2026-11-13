/**
 * Reads the data behind Spotify's public embed pages (open.spotify.com/embed/{type}/{id}), which carry
 * track/artist details without any login or API key. Those pages don't allow browser (CORS) requests,
 * so this runs on the server. The `__NEXT_DATA__` format is undocumented; callers must treat a null as
 * "not available" and fall back quietly.
 */

export const SPOTIFY_ID = /^[A-Za-z0-9]{22}$/;
export const ONE_DAY = 60 * 60 * 24;

// The JSON is undocumented third-party data, hence `any`.
export async function fetchEmbedEntity(path: string): Promise<any | null> {
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
