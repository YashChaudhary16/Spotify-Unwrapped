import { ProcessedRecord } from './preprocessing';

/**
 * Data for the "Your Unwrapped Story" mode (see unwrapped_story_planning.md, Step A).
 * Pure functions, no React: `buildStory(records, year)` turns the full history into everything a
 * year's story needs. Durations are in hours, like the rest of the app (display with `formatDuration`).
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
  /** Share of the year's listening time (0–1). */
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
  totalHours: number;
  plays: number;
  activeDays: number;
  /** Days in the calendar year (365 or 366). */
  daysInYear: number;
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

export interface StoryYear {
  year: number;
  hours: number;
  activeDays: number;
  eligible: boolean;
}

const TOP_TRACKS = 5;

const trackKey = (track: string, artist: string | null) => `${track}\u0000${artist ?? ''}`;
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
export function buildStory(records: ProcessedRecord[], year: number): StoryData | null {
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
    if (name && (!first || t < first.timestamp.getTime())) first = r;

    if (name) {
      const key = trackKey(name, artist);
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
