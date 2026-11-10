import { RawStreamingRecord } from './preprocessing';

/**
 * Generates two years of realistic, entirely fictional listening history in Spotify's
 * extended-streaming-history format. Seeded, so every visitor sees the same data.
 * No real artists, tracks or personal data — track URIs are null, so no Spotify players appear.
 */

// Deterministic PRNG (mulberry32).
const createRng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const CATALOG: { artist: string; albums: string[] }[] = [
  { artist: 'Velvet Static', albums: ['Low Light Hours', 'Signal & Noise'] },
  { artist: 'The Paper Lanterns', albums: ['Folded Skies'] },
  { artist: 'Mira Solano', albums: ['Saltwater Letters', 'Daybreak Tapes'] },
  { artist: 'Northbound Echo', albums: ['Atlas of Small Towns'] },
  { artist: 'Juno Vale', albums: ['Glasshouse', 'Afterglow Club'] },
  { artist: 'Static Bloom', albums: ['Overgrown'] },
  { artist: 'Orchid Avenue', albums: ['Late Summer Static'] },
  { artist: 'Lowtide Radio', albums: ['Night Shift FM', 'Harbor Lights'] },
  { artist: 'Ember Lane', albums: ['Cinders'] },
  { artist: 'The Quiet Satellites', albums: ['Orbiting Home'] },
  { artist: 'Marlo Fenn', albums: ['Kitchen Table Songs'] },
  { artist: 'Sundial Club', albums: ['Golden Hour Sessions'] },
  { artist: 'Pale Comet', albums: ['Tail Light'] },
  { artist: 'Rosa Mendel Trio', albums: ['Blue Room Standards'] },
  { artist: 'Kite & Kettle', albums: ['Weekend Weather'] },
  { artist: 'Ivory Coastline', albums: ['Drift'] },
];

const WORDS_A = ['Midnight', 'Paper', 'Golden', 'Silver', 'Quiet', 'Electric', 'Hollow', 'Slow', 'Neon', 'Velvet', 'Distant', 'Summer', 'Winter', 'Broken', 'Bright', 'Lonely', 'Wild', 'Faded', 'Northern', 'Secret'];
const WORDS_B = ['Lights', 'Rivers', 'Hearts', 'Windows', 'Streets', 'Signals', 'Echoes', 'Gardens', 'Mornings', 'Satellites', 'Letters', 'Tides', 'Mirrors', 'Highways', 'Fires', 'Waves', 'Dreams', 'Stations', 'Shadows', 'Rooms'];

interface CatalogTrack {
  artistIdx: number;
  artist: string;
  album: string;
  track: string;
  lengthMs: number;
  weight: number;
}

const PLATFORMS = [
  { raw: 'Android OS 14 API 34 (Google, Pixel 8)', weight: 0.5 },
  { raw: 'windows', weight: 0.3 },
  { raw: 'iOS 17.2 (iPhone15,3)', weight: 0.12 },
  { raw: 'cast_to_device', weight: 0.08 },
];

/** Typical listening hours (local time) and how often sessions start there. */
const SESSION_HOURS = [
  { hour: 8, weight: 0.3 },
  { hour: 13, weight: 0.15 },
  { hour: 19, weight: 0.35 },
  { hour: 23, weight: 0.2 },
];

/** UTC offsets used to turn local listening times into the export's UTC timestamps. */
const UTC_OFFSET: Record<string, number> = { US: -5, IN: 5.5, QA: 3 };

const DAY_MS = 86_400_000;

export function generateSampleHistory(): RawStreamingRecord[] {
  const rng = createRng(20240101);
  const pick = <T,>(items: T[]) => items[Math.floor(rng() * items.length)];
  const weighted = <T extends { weight: number }>(items: T[]) => {
    let r = rng() * items.reduce((s, i) => s + i.weight, 0);
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item;
    }
    return items[items.length - 1];
  };

  const START = Date.UTC(2023, 0, 1);
  const DAYS = 731;

  // Build the catalog. Each artist has a popularity and an "era" when they peak.
  const artistMeta = CATALOG.map((_, idx) => ({
    base: 1 / (idx + 1) ** 0.8, // Zipf-like popularity
    peakDay: Math.floor(rng() * DAYS),
    width: 60 + rng() * 200,
  }));
  const tracks: CatalogTrack[] = [];
  const usedNames = new Set<string>();
  CATALOG.forEach(({ artist, albums }, artistIdx) => {
    albums.forEach(album => {
      const count = 6 + Math.floor(rng() * 6);
      for (let t = 0; t < count; t++) {
        let name = `${pick(WORDS_A)} ${pick(WORDS_B)}`;
        while (usedNames.has(name)) name = `${pick(WORDS_A)} ${pick(WORDS_B)}`;
        usedNames.add(name);
        tracks.push({
          artistIdx,
          artist,
          album,
          track: name,
          lengthMs: Math.round((150 + rng() * 150) * 1000),
          weight: 1 / (t + 1) ** 0.6, // a few standout songs per album
        });
      }
    });
  });

  const records: RawStreamingRecord[] = [];

  for (let day = 0; day < DAYS; day++) {
    const dayStart = START + day * DAY_MS;
    const weekday = new Date(dayStart).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    if (rng() < (weekend ? 0.08 : 0.12)) continue; // some days off

    // Travel: a few weeks in India, a few days in Qatar.
    const country = day >= 200 && day < 221 ? 'IN' : day >= 520 && day < 525 ? 'QA' : 'US';

    // Listening grows a little over time; weekends run longer.
    const growth = 1 + day / DAYS;
    const sessions = 1 + Math.floor(rng() * 2.4 * growth) + (weekend ? 1 : 0);

    // Today's artist weights follow each artist's era.
    const artistWeight = artistMeta.map(
      m => m.base * (0.2 + Math.exp(-(((day - m.peakDay) / m.width) ** 2)))
    );

    for (let s = 0; s < sessions; s++) {
      const platform = weighted(PLATFORMS).raw;
      const shuffle = rng() < 0.6;
      const offline = platform.startsWith('Android') && rng() < 0.15;
      const startHour = (weighted(SESSION_HOURS).hour + rng() * 2.5) % 24;
      let clock = dayStart + (startHour - UTC_OFFSET[country]) * 3_600_000;

      // 30% of sessions play an album front to back; the rest pick tracks by taste.
      let queue: CatalogTrack[];
      const playsInSession = 4 + Math.floor(rng() * 16);
      if (!shuffle && rng() < 0.3) {
        const seed = weighted(tracks.map(t => ({ ...t, weight: t.weight * artistWeight[t.artistIdx] })));
        queue = tracks.filter(t => t.album === seed.album && t.artist === seed.artist);
      } else {
        const pool = tracks.map(t => ({ ...t, weight: t.weight * artistWeight[t.artistIdx] }));
        queue = Array.from({ length: playsInSession }, () => weighted(pool));
      }

      queue.forEach((t, idx) => {
        const skipped = rng() < (shuffle ? 0.2 : 0.08);
        const msPlayed = skipped
          ? Math.round(3000 + rng() * 25000)
          : rng() < 0.08
            ? Math.round(t.lengthMs * (0.3 + rng() * 0.6))
            : t.lengthMs;
        clock += msPlayed + Math.round(rng() * 4000);

        records.push({
          ts: new Date(clock).toISOString().replace(/\.\d{3}Z$/, 'Z'),
          platform,
          ms_played: msPlayed,
          conn_country: country,
          master_metadata_track_name: t.track,
          master_metadata_album_artist_name: t.artist,
          master_metadata_album_album_name: t.album,
          spotify_track_uri: null,
          reason_start: idx === 0 ? 'clickrow' : 'trackdone',
          reason_end: skipped ? 'fwdbtn' : 'trackdone',
          shuffle,
          skipped,
          offline,
          incognito_mode: false,
        });
      });
    }
  }

  return records;
}
