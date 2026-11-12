import { ProcessedRecord } from './preprocessing';

/**
 * Data for the "Your Unwrapped Story" mode (see unwrapped_story_planning.md, Step A).
 * Pure functions, no React: `buildStory(records, year)` turns the full history into everything a
 * year's story needs. Durations are in hours, like the rest of the app (display with `formatDuration`).
 *
 * What the story shows vs counts (user decision 2026-11-12):
 * - **Private-session plays** (`incognito_mode`) and **ambient / sleep sounds** (rain, white noise, …)
 *   count toward the totals (time, plays, active days) but are never named or ranked in the story.
 * - Ambient sounds are found by `detectAmbient` (strict phrases, see `AMBIENT_PHRASES`), plus any artists
 *   or songs the viewer hides themselves (`StoryOptions`).
 */

/** Minimum listening for a year to get a story (Decisions → "Minimum data"; tune on real data). */
export const STORY_MIN_HOURS = 10;
export const STORY_MIN_ACTIVE_DAYS = 30;

export interface StoryTrack {
  track: string;
  artist: string | null;
  /** Spotify ID for cover art and players: the most recently played ID of this song (see `pickTrackId`). */
  trackId: string | null;
  hours: number;
  plays: number;
}

export interface StoryArtist {
  name: string;
  hours: number;
  /** Share of the year's total listening time (0–1), the same total the story shows. */
  share: number;
  plays: number;
  /** The artist's most-played song this year (its `trackId` also finds the artist photo). */
  topTrack: StoryTrack | null;
}

export interface StoryAlbum {
  album: string;
  artist: string | null;
  hours: number;
  plays: number;
  uniqueTracks: number;
  /** Any track ID from the album; every track shares the cover. */
  trackId: string | null;
}

/** "That's 23 films back to back": the same time expressed as something relatable. */
export interface StoryEquivalent {
  id: 'days' | 'films' | 'nights' | 'marathons';
  count: number;
  /** Ready-to-use phrase, e.g. "23 films back to back". */
  label: string;
}

export interface StoryData {
  year: number;
  /** All listening, including private sessions and ambient sounds. */
  totalHours: number;
  plays: number;
  activeDays: number;
  /** Counted in the totals above, but not named or ranked anywhere in the story. */
  leftOut: StoryLeftOut;
  /** Days in the calendar year (365 or 366). */
  daysInYear: number;
  /** Distinct songs and artists, not counting private-session plays or ambient sounds. */
  uniqueTracks: number;
  uniqueArtists: number;
  /** First and last listening date in the year (yyyy-MM-dd). */
  firstDate: string;
  lastDate: string;
  /** True when more than two weeks are missing at the start or end of the year. */
  partialYear: boolean;
  /** Relatable equivalents of `totalHours`, best first. May be empty for tiny totals. */
  equivalents: StoryEquivalent[];
  firstSong: { track: string; artist: string | null; trackId: string | null; date: string } | null;
  topArtist: StoryArtist | null;
  /** Top 5 songs by listening time. */
  topTracks: StoryTrack[];
  topAlbum: StoryAlbum | null;
}

/** What was counted in the totals but left out of everything that names a song, artist or album. */
export interface StoryLeftOut {
  hours: number;
  plays: number;
  /** Private-session plays. */
  privateHours: number;
  /** Ambient / sleep sounds, detected or hidden by the viewer (excluding private-session plays). */
  ambientHours: number;
}

export interface StoryOptions {
  /** Artists the viewer chose to leave out of the story (exact names as in the export). */
  hiddenArtists?: Iterable<string>;
  /** Songs the viewer chose to leave out, as `storyTrackKey(track, artist)`. */
  hiddenTracks?: Iterable<string>;
}

export interface StoryYear {
  year: number;
  hours: number;
  activeDays: number;
  eligible: boolean;
}

const TOP_TRACKS = 5;

/** Key for a song (name + artist); also the format of `StoryOptions.hiddenTracks`. */
export const storyTrackKey = (track: string, artist: string | null) => `${track}\u0000${artist ?? ''}`;
const trackKey = storyTrackKey;
const albumKey = (album: string, artist: string | null) => `${album}\u0000${artist ?? ''}`;

const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/**
 * Per-year listening totals and whether each year has enough for a story, newest first.
 * One pass over the history; cheap enough to run on every data change.
 */
export function storyYears(records: ProcessedRecord[]): StoryYear[] {
  const byYear = new Map<number, { hours: number; days: Set<string> }>();
  for (const r of records) {
    if (!(r.hours > 0)) continue;
    let entry = byYear.get(r.Year);
    if (!entry) {
      entry = { hours: 0, days: new Set() };
      byYear.set(r.Year, entry);
    }
    entry.hours += r.hours;
    entry.days.add(r.date);
  }
  return Array.from(byYear.entries())
    .map(([year, { hours, days }]) => ({
      year,
      hours,
      activeDays: days.size,
      eligible: hours >= STORY_MIN_HOURS && days.size >= STORY_MIN_ACTIVE_DAYS,
    }))
    .sort((a, b) => b.year - a.year);
}

/** Whether `year` has enough listening for a story. */
export function isStoryEligible(records: ProcessedRecord[], year: number): boolean {
  return storyYears(records).some(y => y.year === year && y.eligible);
}

/**
 * Phrases that only show up in ambient / sleep-sound releases. Deliberately strict: single words like
 * "rain", "birds", "ocean" or "sleep" also appear in real songs ("Ocean Eyes", "Birds", Vancouver Sleep Clinic),
 * so they are not enough on their own. Matched against "artist | album | track".
 */
const AMBIENT_PHRASES = new RegExp(
  [
    'rain ?sounds?',
    'sounds? of (the )?(rain|nature|ocean|forest|thunder)',
    'nature sounds?',
    '(white|brown|pink|green) noise',
    'thunder ?storms?',
    'rain(fall)? (and|&) thunder',
    'heavy rain',
    'gentle rain',
    'rainstorm',
    'for (deep )?sleep(ing)?',
    'sleep sounds?',
    'sleep (&|and) relax',
    'relaxing sounds?',
    'ambien(ce|t sounds?)',
    'asmr',
    'binaural',
    'cricket sounds?',
    'forest rain',
    'rainforest sounds?',
    'ocean waves',
    'fan noise',
    // Not "\d+ Hz" on its own: pop releases use it too (JVKE, "… feels like (554Hz)").
  ].join('|'),
  'i'
);

/** An artist counts as ambient when at least this share of their listening matches `AMBIENT_PHRASES`. */
const AMBIENT_ARTIST_SHARE = 0.5;

export interface AmbientSet {
  artists: Set<string>;
  /** Individual songs (`storyTrackKey`) that match, by artists who are otherwise regular musicians. */
  tracks: Set<string>;
}

const ambientCache = new WeakMap<ProcessedRecord[], AmbientSet>();

/**
 * Ambient / sleep sounds in the whole history: artists whose listening is mostly ambient, plus single
 * matching songs. Cached per records array. Can't catch releases with no telltale words in their names
 * (e.g. "Nature Therapy – Rumbling Tweets"); those need the viewer's hide list (`StoryOptions`).
 */
export function detectAmbient(records: ProcessedRecord[]): AmbientSet {
  const cached = ambientCache.get(records);
  if (cached) return cached;

  const artistTotal = new Map<string, number>();
  const artistAmbient = new Map<string, number>();
  const tracks = new Set<string>();
  const checked = new Map<string, boolean>(); // track key → matches (each song is tested once)

  for (const r of records) {
    const name = r.master_metadata_track_name;
    if (!name || !(r.hours > 0)) continue;
    const artist = r.master_metadata_album_artist_name;
    const key = trackKey(name, artist);
    let match = checked.get(key);
    if (match === undefined) {
      match = AMBIENT_PHRASES.test(`${artist ?? ''} | ${r.master_metadata_album_album_name ?? ''} | ${name}`);
      checked.set(key, match);
    }
    if (artist) {
      artistTotal.set(artist, (artistTotal.get(artist) ?? 0) + r.hours);
      if (match) artistAmbient.set(artist, (artistAmbient.get(artist) ?? 0) + r.hours);
    }
    if (match) tracks.add(key);
  }

  const artists = new Set<string>();
  artistAmbient.forEach((hours, artist) => {
    if (hours / (artistTotal.get(artist) || 1) >= AMBIENT_ARTIST_SHARE) artists.add(artist);
  });

  const result = { artists, tracks };
  ambientCache.set(records, result);
  return result;
}

function buildEquivalents(hours: number): StoryEquivalent[] {
  const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
  const options: StoryEquivalent[] = [];
  const days = hours / 24;
  if (days >= 2) options.push({ id: 'days', count: days, label: `${fmt(days)} days straight` });
  const films = hours / 2; // a typical feature film
  if (films >= 3) options.push({ id: 'films', count: films, label: `${fmt(films)} films back to back` });
  const nights = hours / 8; // a full night's sleep
  if (nights >= 3) options.push({ id: 'nights', count: nights, label: `${fmt(nights)} full nights of sleep` });
  const marathons = hours / 4.5; // a marathon at an average amateur pace
  if (marathons >= 3) options.push({ id: 'marathons', count: marathons, label: `${fmt(marathons)} marathons` });
  return options;
}

interface TrackAcc {
  track: string;
  artist: string | null;
  hours: number;
  plays: number;
  /** Latest timestamp per Spotify ID; the same song can have several IDs (re-releases, relinking). */
  ids: Map<string, number>;
}

/**
 * Prefer the most recently played ID: when Spotify re-releases a song under a new ID, the old one is often
 * region-locked or removed (the "Not playable here" case), so the latest ID is the most likely to still work.
 */
function pickTrackId(ids: Map<string, number>): string | null {
  let best: string | null = null;
  let bestT = -Infinity;
  ids.forEach((t, id) => {
    if (t > bestT) {
      best = id;
      bestT = t;
    }
  });
  return best;
}

const toStoryTrack = (t: TrackAcc): StoryTrack => ({
  track: t.track,
  artist: t.artist,
  trackId: pickTrackId(t.ids),
  hours: t.hours,
  plays: t.plays,
});

/**
 * Everything the story for `year` needs. Pass the **full** history: later steps compare against earlier
 * years. Returns null when the year has no listening at all (check eligibility with `storyYears`).
 */
export function buildStory(records: ProcessedRecord[], year: number, options: StoryOptions = {}): StoryData | null {
  const ambient = detectAmbient(records);
  const hiddenArtists = new Set(options.hiddenArtists ?? []);
  const hiddenTracks = new Set(options.hiddenTracks ?? []);
  const leftOut: StoryLeftOut = { hours: 0, plays: 0, privateHours: 0, ambientHours: 0 };

  let totalHours = 0;
  let plays = 0;
  let firstDate = '';
  let lastDate = '';
  let first: ProcessedRecord | null = null;
  const days = new Set<string>();
  const tracks = new Map<string, TrackAcc>();
  const artists = new Map<string, { hours: number; plays: number }>();
  const albums = new Map<string, { album: string; artist: string | null; hours: number; plays: number; tracks: Set<string>; trackId: string | null }>();

  for (const r of records) {
    if (r.Year !== year || !(r.hours > 0)) continue;
    const t = r.timestamp.getTime();
    totalHours += r.hours;
    plays++;
    days.add(r.date);
    if (!firstDate || r.date < firstDate) firstDate = r.date;
    if (!lastDate || r.date > lastDate) lastDate = r.date;

    const name = r.master_metadata_track_name;
    const artist = r.master_metadata_album_artist_name;

    // Counted above; from here on only what the story may name.
    const isPrivate = r.incognito_mode;
    const key = name ? trackKey(name, artist) : '';
    const isAmbient =
      (artist !== null && (ambient.artists.has(artist) || hiddenArtists.has(artist))) ||
      (name !== null && (ambient.tracks.has(key) || hiddenTracks.has(key)));
    if (isPrivate || isAmbient) {
      leftOut.hours += r.hours;
      leftOut.plays++;
      if (isPrivate) leftOut.privateHours += r.hours;
      else leftOut.ambientHours += r.hours;
      continue;
    }

    if (name && (!first || t < first.timestamp.getTime())) first = r;

    if (name) {
      let acc = tracks.get(key);
      if (!acc) {
        acc = { track: name, artist, hours: 0, plays: 0, ids: new Map() };
        tracks.set(key, acc);
      }
      acc.hours += r.hours;
      acc.plays++;
      if (r.track_id && (acc.ids.get(r.track_id) ?? -Infinity) < t) acc.ids.set(r.track_id, t);
    }

    if (artist) {
      const a = artists.get(artist) ?? { hours: 0, plays: 0 };
      a.hours += r.hours;
      a.plays++;
      artists.set(artist, a);
    }

    const album = r.master_metadata_album_album_name;
    if (album) {
      const key = albumKey(album, artist);
      let acc = albums.get(key);
      if (!acc) {
        acc = { album, artist, hours: 0, plays: 0, tracks: new Set(), trackId: null };
        albums.set(key, acc);
      }
      acc.hours += r.hours;
      acc.plays++;
      if (name) acc.tracks.add(name);
      if (r.track_id) acc.trackId = r.track_id; // latest seen; any ID gives the album cover
    }
  }

  if (plays === 0) return null;

  const sortedTracks = Array.from(tracks.values()).sort((a, b) => b.hours - a.hours);

  const topArtistEntry = Array.from(artists.entries()).sort((a, b) => b[1].hours - a[1].hours)[0];
  let topArtist: StoryArtist | null = null;
  if (topArtistEntry) {
    const [name, { hours, plays: artistPlays }] = topArtistEntry;
    const top = sortedTracks.find(t => t.artist === name);
    topArtist = {
      name,
      hours,
      share: totalHours > 0 ? hours / totalHours : 0,
      plays: artistPlays,
      topTrack: top ? toStoryTrack(top) : null,
    };
  }

  const topAlbumAcc = Array.from(albums.values()).sort((a, b) => b.hours - a.hours)[0];
  const topAlbum: StoryAlbum | null = topAlbumAcc
    ? {
        album: topAlbumAcc.album,
        artist: topAlbumAcc.artist,
        hours: topAlbumAcc.hours,
        plays: topAlbumAcc.plays,
        uniqueTracks: topAlbumAcc.tracks.size,
        trackId: topAlbumAcc.trackId,
      }
    : null;

  const firstSong = first
    ? {
        track: first.master_metadata_track_name as string,
        artist: first.master_metadata_album_artist_name,
        trackId: first.track_id,
        date: first.date,
      }
    : null;

  // "Partial" if more than two weeks are missing at either end of the year (e.g. the history starts in
  // March). An export requested in late December still counts as a full year.
  const partialYear = firstDate > `${year}-01-14` || lastDate < `${year}-12-18`;

  return {
    year,
    totalHours,
    plays,
    activeDays: days.size,
    leftOut,
    daysInYear: isLeapYear(year) ? 366 : 365,
    uniqueTracks: tracks.size,
    uniqueArtists: artists.size,
    firstDate,
    lastDate,
    partialYear,
    equivalents: buildEquivalents(totalHours),
    firstSong,
    topArtist,
    topTracks: sortedTracks.slice(0, TOP_TRACKS).map(toStoryTrack),
    topAlbum,
  };
}
