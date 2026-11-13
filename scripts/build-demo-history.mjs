#!/usr/bin/env node
/**
 * Builds the public demo history behind "Try with sample data" from a real Spotify extended streaming
 * history export (user decision 2026-11-12: the creator's own 2024, instead of generated fake data).
 *
 *   node scripts/build-demo-history.mjs --input "/path/to/Spotify Extended Streaming History" [--year 2024]
 *        [--hide "Artist 1,Artist 2"] [--out public/demo/history-2024.json]
 *
 * What is removed before anything is written (the file is public):
 * - IP addresses and every field the app doesn't use (offline timestamps, podcast/audiobook fields, …)
 * - plays in private sessions (`incognito_mode`)
 * - ambient / sleep sounds: the same detection as the story (lib/ambientPhrases.mjs), plus the artists in --hide
 * - podcasts, audiobooks and plays without a track name
 * - plays outside the year (a day of margin either side is kept for timezones; the app trims to local time)
 *
 * Output format (compact JSON, version 1):
 *   { v, year, tracks: [[name, artist, album, trackId]], platforms: [], countries: [], reasons: [],
 *     plays: [[tsDeltaSeconds, msPlayed, trackIdx, platformIdx, countryIdx, reasonStartIdx, reasonEndIdx, flags]] }
 * `ts` is stored as seconds since the previous play (the first is since `start`); flags: 1 shuffle, 2 skipped, 4 offline.
 * Decoded by lib/demoHistory.ts.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { gzipSync } from 'node:zlib';
import { AMBIENT_ARTIST_SHARE, AMBIENT_PHRASES } from '../lib/ambientPhrases.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]]);
    return pairs;
  }, [])
);

const input = args.input;
const year = Number(args.year ?? 2024);
const hidden = new Set((args.hide ?? 'Nature Therapy').split(',').map(s => s.trim()).filter(Boolean));
const out = args.out ?? `public/demo/history-${year}.json`;

if (!input || !Number.isInteger(year)) {
  console.error('Usage: node scripts/build-demo-history.mjs --input <export folder> [--year 2024] [--hide "A,B"] [--out file]');
  process.exit(1);
}

// 1. Read every audio history file.
const files = readdirSync(input).filter(f => /^Streaming_History_Audio_.*\.json$/i.test(f));
if (files.length === 0) {
  console.error(`No Streaming_History_Audio_*.json files in ${input}`);
  process.exit(1);
}
const all = files.flatMap(f => JSON.parse(readFileSync(join(input, f), 'utf8')));

const isMusic = r =>
  typeof r?.ts === 'string' &&
  r.master_metadata_track_name &&
  !(r.spotify_episode_uri || r.episode_name || r.episode_show_name || r.audiobook_uri || r.audiobook_chapter_uri || r.audiobook_title);
const music = all.filter(isMusic);

// 2. Ambient detection over the whole history, exactly like detectAmbient() in lib/story.ts.
const trackKey = r => `${r.master_metadata_track_name}\u0000${r.master_metadata_album_artist_name ?? ''}`;
const matches = new Map();
const artistTotal = new Map();
const artistAmbient = new Map();
for (const r of music) {
  if (!(r.ms_played > 0)) continue;
  const key = trackKey(r);
  let m = matches.get(key);
  if (m === undefined) {
    m = AMBIENT_PHRASES.test(
      `${r.master_metadata_album_artist_name ?? ''} | ${r.master_metadata_album_album_name ?? ''} | ${r.master_metadata_track_name}`
    );
    matches.set(key, m);
  }
  const artist = r.master_metadata_album_artist_name;
  if (artist) {
    artistTotal.set(artist, (artistTotal.get(artist) ?? 0) + r.ms_played);
    if (m) artistAmbient.set(artist, (artistAmbient.get(artist) ?? 0) + r.ms_played);
  }
}
const ambientArtists = new Set(hidden);
artistAmbient.forEach((ms, artist) => {
  if (ms / (artistTotal.get(artist) || 1) >= AMBIENT_ARTIST_SHARE) ambientArtists.add(artist);
});
const isAmbient = r => ambientArtists.has(r.master_metadata_album_artist_name) || matches.get(trackKey(r)) === true;

// 3. Keep the year (± a day for timezones), drop private sessions and ambient sounds.
const from = Date.parse(`${year - 1}-12-31T00:00:00Z`);
const to = Date.parse(`${year + 1}-01-02T00:00:00Z`);
const counts = { inWindow: 0, private: 0, ambient: 0 };
const kept = [];
for (const r of music) {
  const t = Date.parse(r.ts);
  if (!Number.isFinite(t) || t < from || t >= to) continue;
  counts.inWindow++;
  if (r.incognito_mode) {
    counts.private++;
    continue;
  }
  if (isAmbient(r)) {
    counts.ambient++;
    continue;
  }
  kept.push({ r, t });
}
kept.sort((a, b) => a.t - b.t);

// 4. Encode with lookup tables.
const table = () => {
  const index = new Map();
  const list = [];
  return {
    list,
    id(value) {
      const k = value ?? '';
      if (!index.has(k)) {
        index.set(k, list.length);
        list.push(k);
      }
      return index.get(k);
    },
  };
};
const platforms = table();
const countries = table();
const reasons = table();
const trackIndex = new Map();
const tracks = [];
const trackId = uri => (typeof uri === 'string' && uri.startsWith('spotify:track:') ? uri.slice(14) : '');

const start = kept.length ? Math.floor(kept[0].t / 1000) : 0;
let prev = start;
const plays = kept.map(({ r, t }) => {
  const key = `${trackKey(r)}\u0000${r.master_metadata_album_album_name ?? ''}\u0000${r.spotify_track_uri ?? ''}`;
  let ti = trackIndex.get(key);
  if (ti === undefined) {
    ti = tracks.length;
    trackIndex.set(key, ti);
    tracks.push([
      r.master_metadata_track_name,
      r.master_metadata_album_artist_name ?? '',
      r.master_metadata_album_album_name ?? '',
      trackId(r.spotify_track_uri),
    ]);
  }
  const s = Math.floor(t / 1000);
  const delta = s - prev;
  prev = s;
  const flags = (r.shuffle ? 1 : 0) | (r.skipped ? 2 : 0) | (r.offline ? 4 : 0);
  return [
    delta,
    Math.max(0, Math.round(r.ms_played) || 0),
    ti,
    platforms.id(r.platform),
    countries.id(r.conn_country),
    reasons.id(r.reason_start),
    reasons.id(r.reason_end),
    flags,
  ];
});

const body = {
  v: 1,
  year,
  start,
  tracks,
  platforms: platforms.list,
  countries: countries.list,
  reasons: reasons.list,
  plays,
};

mkdirSync(dirname(out), { recursive: true });
const json = JSON.stringify(body);
writeFileSync(out, json);

const kb = n => `${(n / 1024).toFixed(0)} KB`;
console.log(`Read ${files.length} files, ${all.length} rows (${music.length} music).`);
console.log(
  `${year} (±1 day): ${counts.inWindow} plays → kept ${plays.length}; removed ${counts.private} private-session and ${counts.ambient} ambient plays.`
);
console.log(`Ambient artists: ${ambientArtists.size} (incl. --hide: ${[...hidden].join(', ') || 'none'}).`);
console.log(`${tracks.length} tracks, ${platforms.list.length} platforms, ${countries.list.length} countries.`);
console.log(`Wrote ${out}: ${kb(statSync(out).size)} (${kb(gzipSync(json).length)} gzipped).`);
