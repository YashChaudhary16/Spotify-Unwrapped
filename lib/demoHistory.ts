import type { RawStreamingRecord } from './preprocessing';

/**
 * The public demo behind "Try with sample data": one real year of the creator's listening (2024), with
 * private sessions, sleep/ambient sounds and IP addresses removed. Built by scripts/build-demo-history.mjs
 * into a compact file in public/demo/ (see that script for the format), fetched only when the demo is opened.
 */
export const DEMO_YEAR = 2024;
const DEMO_URL = `/demo/history-${DEMO_YEAR}.json`;

interface DemoFile {
  v: 1;
  year: number;
  start: number;
  tracks: [string, string, string, string][];
  platforms: string[];
  countries: string[];
  reasons: string[];
  plays: [number, number, number, number, number, number, number, number][];
}

/** Downloads and expands the demo into the same shape as an uploaded export. */
export async function loadDemoHistory(): Promise<{ year: number; records: RawStreamingRecord[] }> {
  const res = await fetch(DEMO_URL);
  if (!res.ok) throw new Error('Could not load the sample data. Please try again.');
  const file = (await res.json()) as DemoFile;
  if (file.v !== 1) throw new Error('The sample data is in an unexpected format.');

  let t = file.start;
  const records = file.plays.map(([delta, ms, ti, pi, ci, rs, re, flags]) => {
    t += delta;
    const [name, artist, album, id] = file.tracks[ti];
    const record: RawStreamingRecord = {
      ts: new Date(t * 1000).toISOString().replace('.000Z', 'Z'),
      platform: file.platforms[pi] || undefined,
      ms_played: ms,
      conn_country: file.countries[ci] || null,
      master_metadata_track_name: name,
      master_metadata_album_artist_name: artist || null,
      master_metadata_album_album_name: album || null,
      spotify_track_uri: id ? `spotify:track:${id}` : null,
      reason_start: file.reasons[rs] || undefined,
      reason_end: file.reasons[re] || undefined,
      shuffle: (flags & 1) !== 0,
      skipped: (flags & 2) !== 0,
      offline: (flags & 4) !== 0,
      incognito_mode: false,
    };
    return record;
  });
  return { year: file.year, records };
}
