import { format } from 'date-fns';
// @ts-ignore - world-countries has type resolution issues with Next.js (same as lib/preprocessing.ts)
import countries from 'world-countries';
import { ProcessedRecord } from './preprocessing';
import { getPersonality, StoryPersonality } from './personality';
import { AMBIENT_ARTIST_SHARE, AMBIENT_PHRASES } from './ambientPhrases.mjs';

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
 * - Only the **totals** include them. Every other stat (top lists, seasons, sessions, time of day, skips, …)
 *   is built from the plays the story may show, so e.g. all-night rain sounds don't make someone a "Night Owl".
 *
 * Step B adds `StoryData.stats`: optional "only you" moments. Each one is null when it isn't interesting,
 * so its card can be skipped instead of showing something weak.
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
  /** Extra moments (Step B); each is null when there's nothing interesting to say. */
  stats: StoryStats;
  /** Listening personality (Step C, `lib/personality.ts`). */
  personality: StoryPersonality | null;
}

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export interface StorySeason {
  season: Season;
  /** Calendar months (1–12) in this season, within this calendar year. */
  months: number[];
  hours: number;
  track: StoryTrack;
}

export interface StoryDiscovery {
  name: string;
  /** Rank among this year's artists (1-based). */
  rank: number;
  hours: number;
  /** Date of the very first play of this artist (yyyy-MM-dd). */
  firstPlayed: string;
  topTrack: StoryTrack | null;
}

export interface StorySession {
  /** Start date and local start/end times (yyyy-MM-dd, HH:mm). The end may be on the next day. */
  date: string;
  start: string;
  end: string;
  /** Time actually played, and the time from first start to last end. */
  hours: number;
  spanHours: number;
  plays: number;
  topTrack: StoryTrack | null;
}

export interface StoryStats {
  /** Song of each season (northern or southern hemisphere, from where most listening happened). Needs 2+ seasons. */
  seasons: StorySeason[] | null;
  /** Song of each month with at least an hour of listening. */
  months: { month: number; hours: number; track: StoryTrack }[] | null;
  /** Artists first played this year who reached the year's top 20. Null in the history's first year. */
  discoveries: StoryDiscovery[] | null;
  /** Longest stretch of listening with no gap over 30 minutes. Needs 2+ hours. */
  longestSession: StorySession | null;
  /** Most plays (30 s or more each) of one song in a single day. Needs 5+. */
  repeatDay: { date: string; plays: number; track: StoryTrack } | null;
  timeOfDay: {
    /** Listening hours per local hour of day (index 0–23). */
    byHour: number[];
    peakHour: number;
    /** Share (0–1) of listening between 00:00–05:00 and 05:00–11:00. */
    nightShare: number;
    morningShare: number;
  } | null;
  /** Countries with at least an hour of listening, largest first. Needs 2+. */
  countries: { country: string; hours: number }[] | null;
  /** Total time vs the previous year (all listening on both sides). */
  yearOverYear: {
    previousYear: number;
    previousHours: number;
    /** Relative change, e.g. 0.18 = 18% more. */
    change: number;
    /** True if either year is partial, so the comparison is shaky (the UI may soften or skip it). */
    partial: boolean;
  } | null;
  /** This year's #1 artist has been #1 for this many years in a row (2+). */
  loyalty: { artist: string; years: number; since: number } | null;
  /** A song from an earlier year's top 50, barely played the year before (under an hour), back in this year's top 50. */
  comeback: {
    track: StoryTrack;
    /** This year's rank (1-based), and its best earlier year and rank. */
    rank: number;
    peakYear: number;
    peakRank: number;
    /** Hours played in the quiet year before this one (may be 0). */
    quietYearHours: number;
  } | null;
  /** Share of plays skipped (`skipped` or ended with the next button), this year and over the whole history. Needs 100+ plays. */
  skips: { rate: number; lifetimeRate: number; skipped: number; plays: number } | null;
  /** Listening habits behind the personality (Step C). Shares are 0–1. Null when nothing is visible. */
  habits: StoryHabits | null;
}

export interface StoryHabits {
  /** Visible plays (the denominator for the play-based shares below). */
  plays: number;
  /** Top artist's share of visible listening time (hidden ambient time doesn't dilute it). */
  topArtistShare: number;
  /** Listening time on artists first ever played this year. Null in the history's first year. */
  newArtistShare: number | null;
  nightShare: number;
  morningShare: number;
  /** Plays with shuffle on. */
  shuffleShare: number;
  /** Plays that were skipped (`skipped` or the next button). */
  skipRate: number;
  /** Plays (30 s+) that repeat a song already played that day. */
  repeatShare: number;
  /** Plays that followed the previous track of the same album to its end, without shuffle: album-in-order listening. */
  albumFlowShare: number;
  /** Listening time inside sessions of 3+ hours. */
  longSessionShare: number;
  /** Countries with at least an hour of listening. */
  countries: number;
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
  /** Auto-detected ambient artists / songs the viewer put back into the story. */
  shownArtists?: Iterable<string>;
  shownTracks?: Iterable<string>;
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

// Ambient phrases and the artist rule live in ./ambientPhrases.mjs (shared with scripts/build-demo-history.mjs).

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

export interface HideCandidate {
  /** Artist name, or `storyTrackKey` for a song. */
  key: string;
  name: string;
  /** The song's artist (songs only). */
  artist?: string | null;
  hours: number;
}

export interface StoryHideCandidates {
  /** Auto-detected ambient artists and songs with listening this year, most listened first. */
  autoArtists: HideCandidate[];
  autoTracks: HideCandidate[];
  /** Every artist and song played this year (not in private sessions), for the "hide" search. */
  artists: HideCandidate[];
  tracks: HideCandidate[];
}

/**
 * What the "Leave out of story" panel lists for `year`. Ignores the viewer's choices, so the panel can show
 * every auto-detected item with a checkbox.
 */
export function storyHideCandidates(records: ProcessedRecord[], year: number): StoryHideCandidates {
  const ambient = detectAmbient(records);
  const artists = new Map<string, number>();
  const tracks = new Map<string, HideCandidate>();
  for (const r of records) {
    if (r.Year !== year || !(r.hours > 0) || r.incognito_mode) continue;
    const artist = r.master_metadata_album_artist_name;
    const name = r.master_metadata_track_name;
    if (artist) artists.set(artist, (artists.get(artist) ?? 0) + r.hours);
    if (name) {
      const key = trackKey(name, artist);
      const t = tracks.get(key) ?? { key, name, artist, hours: 0 };
      t.hours += r.hours;
      tracks.set(key, t);
    }
  }
  const artistList = Array.from(artists.entries())
    .map(([name, hours]) => ({ key: name, name, hours }))
    .sort((a, b) => b.hours - a.hours);
  const trackList = Array.from(tracks.values()).sort((a, b) => b.hours - a.hours);
  return {
    autoArtists: artistList.filter(a => ambient.artists.has(a.name)),
    autoTracks: trackList.filter(
      t => ambient.tracks.has(t.key) && !(t.artist && ambient.artists.has(t.artist))
    ),
    artists: artistList,
    tracks: trackList,
  };
}

/** Why a play is counted in the totals but not shown by name, or null if the story may show it. */
type Hidden = 'private' | 'ambient' | null;

const optionsKey = (o: StoryOptions) =>
  JSON.stringify(
    [o.hiddenArtists, o.hiddenTracks, o.shownArtists, o.shownTracks].map(list => Array.from(list ?? []).sort())
  );

function visibility(records: ProcessedRecord[], options: StoryOptions): (r: ProcessedRecord) => Hidden {
  const ambient = detectAmbient(records);
  const hiddenArtists = new Set(options.hiddenArtists ?? []);
  const hiddenTracks = new Set(options.hiddenTracks ?? []);
  const shownArtists = new Set(options.shownArtists ?? []);
  const shownTracks = new Set(options.shownTracks ?? []);
  return r => {
    if (r.incognito_mode) return 'private';
    const name = r.master_metadata_track_name;
    const artist = r.master_metadata_album_artist_name;
    const key = name !== null ? trackKey(name, artist) : null;
    // The viewer's own choices win over auto-detection.
    if ((artist !== null && hiddenArtists.has(artist)) || (key !== null && hiddenTracks.has(key))) return 'ambient';
    // Putting an artist back also puts back their songs that match on their own.
    if ((key !== null && shownTracks.has(key)) || (artist !== null && shownArtists.has(artist))) return null;
    if (artist !== null && ambient.artists.has(artist)) return 'ambient';
    if (key !== null && ambient.tracks.has(key)) return 'ambient';
    return null;
  };
}

const isSkip = (r: ProcessedRecord) => r.skipped || r.reason_end === 'fwdbtn';

/** Per-year summaries of the whole history, for comparisons with earlier years. Cached per records + options. */
interface HistoryIndex {
  firstYear: number;
  /** All listening per year (totals rule), plus first/last date for the partial-year check. */
  years: Map<number, { hours: number; firstDate: string; lastDate: string }>;
  /** Visible listening per year: artist → hours, track key → hours. */
  artistHours: Map<number, Map<string, number>>;
  trackHours: Map<number, Map<string, number>>;
  /** Each year's #1 visible artist, and its top-50 songs as track key → rank (0-based). */
  topArtist: Map<number, string>;
  topTrackRanks: Map<number, Map<string, number>>;
  /** Very first play of each artist (any play, hidden or not). */
  artistFirst: Map<string, { year: number; date: string }>;
  lifetimeSkips: { skipped: number; plays: number };
}

const indexCache = new WeakMap<ProcessedRecord[], Map<string, HistoryIndex>>();

function historyIndex(records: ProcessedRecord[], options: StoryOptions): HistoryIndex {
  const key = optionsKey(options);
  let perRecords = indexCache.get(records);
  const cached = perRecords?.get(key);
  if (cached) return cached;

  const hidden = visibility(records, options);
  const index: HistoryIndex = {
    firstYear: Infinity,
    years: new Map(),
    artistHours: new Map(),
    trackHours: new Map(),
    topArtist: new Map(),
    topTrackRanks: new Map(),
    artistFirst: new Map(),
    lifetimeSkips: { skipped: 0, plays: 0 },
  };
  const bump = <K>(m: Map<K, number>, k: K, v: number) => m.set(k, (m.get(k) ?? 0) + v);

  for (const r of records) {
    if (!(r.hours > 0)) continue;
    const y = r.Year;
    if (y < index.firstYear) index.firstYear = y;
    const yr = index.years.get(y) ?? { hours: 0, firstDate: r.date, lastDate: r.date };
    yr.hours += r.hours;
    if (r.date < yr.firstDate) yr.firstDate = r.date;
    if (r.date > yr.lastDate) yr.lastDate = r.date;
    index.years.set(y, yr);

    const artist = r.master_metadata_album_artist_name;
    const name = r.master_metadata_track_name;
    if (artist) {
      const f = index.artistFirst.get(artist);
      if (!f || r.date < f.date) index.artistFirst.set(artist, { year: y, date: r.date });
    }
    if (hidden(r)) continue;

    index.lifetimeSkips.plays++;
    if (isSkip(r)) index.lifetimeSkips.skipped++;
    if (artist) {
      if (!index.artistHours.has(y)) index.artistHours.set(y, new Map());
      bump(index.artistHours.get(y)!, artist, r.hours);
    }
    if (name) {
      if (!index.trackHours.has(y)) index.trackHours.set(y, new Map());
      bump(index.trackHours.get(y)!, trackKey(name, artist), r.hours);
    }
  }

  index.artistHours.forEach((m, y) => {
    const top = ranked(m)[0];
    if (top) index.topArtist.set(y, top);
  });
  index.trackHours.forEach((m, y) => {
    index.topTrackRanks.set(y, new Map(ranked(m).slice(0, COMEBACK_TOP).map((k, i) => [k, i])));
  });

  if (!perRecords) {
    perRecords = new Map();
    indexCache.set(records, perRecords);
  }
  perRecords.set(key, index);
  return index;
}

const isPartial = (year: number, firstDate: string, lastDate: string) =>
  firstDate > `${year}-01-14` || lastDate < `${year}-12-18`;

/** Keys sorted by value, largest first. */
const ranked = <K>(m: Map<K, number> | undefined): K[] =>
  m ? Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([k]) => k) : [];

/** Most-listened song among `plays` (all visible, with a track name). */
function topTrackOf(plays: ProcessedRecord[]): StoryTrack | null {
  const acc = new Map<string, TrackAcc>();
  for (const r of plays) {
    const name = r.master_metadata_track_name;
    if (!name) continue;
    const artist = r.master_metadata_album_artist_name;
    const key = trackKey(name, artist);
    let a = acc.get(key);
    if (!a) {
      a = { track: name, artist, hours: 0, plays: 0, ids: new Map() };
      acc.set(key, a);
    }
    a.hours += r.hours;
    a.plays++;
    const t = r.timestamp.getTime();
    if (r.track_id && (a.ids.get(r.track_id) ?? -Infinity) < t) a.ids.set(r.track_id, t);
  }
  let best: TrackAcc | null = null;
  acc.forEach(a => {
    if (!best || a.hours > best.hours) best = a;
  });
  return best ? toStoryTrack(best) : null;
}

const COUNTRY_LATITUDE = new Map<string, number>(
  (countries as { name: { common: string }; latlng: number[] }[]).map(c => [c.name.common, c.latlng[0]])
);

const SEASONS_NORTH: { season: Season; months: number[] }[] = [
  { season: 'winter', months: [1, 2, 12] },
  { season: 'spring', months: [3, 4, 5] },
  { season: 'summer', months: [6, 7, 8] },
  { season: 'autumn', months: [9, 10, 11] },
];
const SOUTH: Record<Season, Season> = { winter: 'summer', spring: 'autumn', summer: 'winter', autumn: 'spring' };

const MIN_SEASON_HOURS = 5;
const MIN_MONTH_HOURS = 1;
const DISCOVERY_TOP = 20;
const SESSION_GAP_MS = 30 * 60 * 1000;
const MIN_SESSION_HOURS = 2;
const REPEAT_MIN_MS = 30_000; // Spotify counts a stream at 30 s
const MIN_REPEAT_PLAYS = 5;
const MIN_COUNTRY_HOURS = 1;
const COMEBACK_TOP = 50;
// "Barely played" the year before a comeback. Stricter values (under 3 minutes) found no comebacks at all on a
// real 7-year history: favourites tend to get a few plays every year.
const QUIET_YEAR_HOURS = 1;
const MIN_SKIP_PLAYS = 100;
const LONG_SESSION_HOURS = 3;

function buildStats(
  year: number,
  visible: ProcessedRecord[],
  totalHours: number,
  partialYear: boolean,
  topArtistName: string | null,
  yearTrackKeys: string[],
  index: HistoryIndex
): StoryStats {
  const bump = <K>(m: Map<K, number>, k: K, v: number) => m.set(k, (m.get(k) ?? 0) + v);

  // Hemisphere from the country with the most listening this year (unknown → northern).
  const countryHours = new Map<string, number>();
  for (const r of visible) if (r.conn_country_full) bump(countryHours, r.conn_country_full, r.hours);
  const mainCountry = ranked(countryHours)[0];
  const southern = (mainCountry ? COUNTRY_LATITUDE.get(mainCountry) ?? 0 : 0) < 0;

  // Seasons and months
  const byMonth = new Map<number, ProcessedRecord[]>();
  for (const r of visible) {
    const list = byMonth.get(r.Month);
    if (list) list.push(r);
    else byMonth.set(r.Month, [r]);
  }
  const hoursOf = (list: ProcessedRecord[]) => list.reduce((sum, r) => sum + r.hours, 0);
  const seasonList: StorySeason[] = [];
  for (const { season, months } of SEASONS_NORTH) {
    const plays = months.flatMap(m => byMonth.get(m) ?? []);
    const hours = hoursOf(plays);
    const track = hours >= MIN_SEASON_HOURS ? topTrackOf(plays) : null;
    if (track) seasonList.push({ season: southern ? SOUTH[season] : season, months, hours, track });
  }
  const monthList: NonNullable<StoryStats['months']> = [];
  for (let m = 1; m <= 12; m++) {
    const plays = byMonth.get(m) ?? [];
    const hours = hoursOf(plays);
    const track = hours >= MIN_MONTH_HOURS ? topTrackOf(plays) : null;
    if (track) monthList.push({ month: m, hours, track });
  }

  // Discoveries: first-ever play this year, and in this year's top 20 artists.
  let discoveries: StoryDiscovery[] | null = null;
  if (year > index.firstYear) {
    const artistHours = index.artistHours.get(year);
    discoveries = ranked(artistHours)
      .slice(0, DISCOVERY_TOP)
      .map((name, i) => ({ name, rank: i + 1, first: index.artistFirst.get(name) }))
      .filter(a => a.first?.year === year)
      .map(a => ({
        name: a.name,
        rank: a.rank,
        hours: artistHours?.get(a.name) ?? 0,
        firstPlayed: a.first!.date,
        topTrack: topTrackOf(visible.filter(r => r.master_metadata_album_artist_name === a.name)),
      }));
    if (discoveries.length === 0) discoveries = null;
  }

  // Sessions: plays in time order; a gap over 30 minutes between one play's end and the next one's start
  // ends the session. `timestamp` is when a play ended, so it started `ms_played` earlier.
  type Run = { from: number; to: number; hours: number; startIdx: number; endIdx: number };
  const sorted = [...visible].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  let b: Run | null = null;
  let cur: Run | null = null;
  const sessionHours: number[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const end = r.timestamp.getTime();
    const start = end - r.ms_played;
    if (cur !== null && start - cur.to <= SESSION_GAP_MS) {
      cur.to = Math.max(cur.to, end);
      cur.hours += r.hours;
      cur.endIdx = i;
    } else {
      cur = { from: start, to: end, hours: r.hours, startIdx: i, endIdx: i };
    }
    if (b === null || cur.hours > b.hours) b = { ...cur };
    // Close the session when the next play starts a new one (or this is the last play).
    const next = sorted[i + 1];
    if (!next || next.timestamp.getTime() - next.ms_played - cur.to > SESSION_GAP_MS) sessionHours.push(cur.hours);
  }
  let longestSession: StorySession | null = null;
  if (b && b.hours >= MIN_SESSION_HOURS) {
    const plays = sorted.slice(b.startIdx, b.endIdx + 1);
    longestSession = {
      date: format(new Date(b.from), 'yyyy-MM-dd'),
      start: format(new Date(b.from), 'HH:mm'),
      end: format(new Date(b.to), 'HH:mm'),
      hours: b.hours,
      spanHours: (b.to - b.from) / 3_600_000,
      plays: plays.length,
      topTrack: topTrackOf(plays),
    };
  }

  // Repeat day
  const dayCounts = new Map<string, number>();
  let repeat: { k: string; n: number } | null = null;
  for (const r of visible) {
    if (!r.master_metadata_track_name || r.ms_played < REPEAT_MIN_MS) continue;
    const k = `${r.date}\u0001${trackKey(r.master_metadata_track_name, r.master_metadata_album_artist_name)}`;
    const n = (dayCounts.get(k) ?? 0) + 1;
    dayCounts.set(k, n);
    if (!repeat || n > repeat.n) repeat = { k, n };
  }
  let repeatDay: StoryStats['repeatDay'] = null;
  const rep = repeat as { k: string; n: number } | null;
  if (rep && rep.n >= MIN_REPEAT_PLAYS) {
    const [date, key] = rep.k.split('\u0001');
    const plays = visible.filter(
      r =>
        r.date === date &&
        r.master_metadata_track_name !== null &&
        trackKey(r.master_metadata_track_name, r.master_metadata_album_artist_name) === key
    );
    const track = topTrackOf(plays);
    if (track) repeatDay = { date, plays: rep.n, track };
  }

  // Time of day
  let timeOfDay: StoryStats['timeOfDay'] = null;
  const visibleHours = hoursOf(visible);
  if (visibleHours > 0) {
    const byHour = new Array<number>(24).fill(0);
    for (const r of visible) byHour[r.Hour] += r.hours;
    const sum = (from: number, to: number) => byHour.slice(from, to).reduce((a, h) => a + h, 0);
    timeOfDay = {
      byHour,
      peakHour: byHour.indexOf(Math.max(...byHour)),
      nightShare: sum(0, 5) / visibleHours,
      morningShare: sum(5, 11) / visibleHours,
    };
  }

  // Countries
  const countryList = Array.from(countryHours.entries())
    .filter(([, h]) => h >= MIN_COUNTRY_HOURS)
    .sort((a, b) => b[1] - a[1])
    .map(([country, hours]) => ({ country, hours }));

  // Year over year (totals rule: all listening)
  let yearOverYear: StoryStats['yearOverYear'] = null;
  const prev = index.years.get(year - 1);
  if (prev && prev.hours > 0) {
    yearOverYear = {
      previousYear: year - 1,
      previousHours: prev.hours,
      change: (totalHours - prev.hours) / prev.hours,
      partial: partialYear || isPartial(year - 1, prev.firstDate, prev.lastDate),
    };
  }

  // Loyalty: consecutive years (ending this year) with the same #1 artist.
  let loyalty: StoryStats['loyalty'] = null;
  if (topArtistName) {
    let y = year;
    while (index.topArtist.get(y - 1) === topArtistName) y--;
    if (year - y + 1 >= 2) loyalty = { artist: topArtistName, years: year - y + 1, since: y };
  }

  // Comeback: in this year's top 50, barely played the year before (which must be in the history), top 50 earlier.
  let comeback: StoryStats['comeback'] = null;
  const prevTracks = index.trackHours.get(year - 1);
  if (index.years.has(year - 1)) {
    const thisTop = yearTrackKeys.slice(0, COMEBACK_TOP);
    for (let i = 0; i < thisTop.length && !comeback; i++) {
      const key = thisTop[i];
      const quietYearHours = prevTracks?.get(key) ?? 0;
      if (quietYearHours >= QUIET_YEAR_HOURS) continue;
      let peak: { year: number; rank: number } | null = null;
      for (let y = year - 2; y >= index.firstYear; y--) {
        const rank = index.topTrackRanks.get(y)?.get(key);
        if (rank !== undefined && (!peak || rank < peak.rank)) peak = { year: y, rank };
      }
      if (peak) {
        const plays = visible.filter(
          r =>
            r.master_metadata_track_name !== null &&
            trackKey(r.master_metadata_track_name, r.master_metadata_album_artist_name) === key
        );
        const track = topTrackOf(plays);
        if (track) {
          comeback = { track, rank: i + 1, peakYear: peak.year, peakRank: peak.rank + 1, quietYearHours };
        }
      }
    }
  }

  // Habits (for the personality)
  let habits: StoryHabits | null = null;
  if (visible.length > 0 && visibleHours > 0) {
    const artistHours = index.artistHours.get(year);
    const topArtistHours = topArtistName ? artistHours?.get(topArtistName) ?? 0 : 0;
    let newArtistHours = 0;
    artistHours?.forEach((h, name) => {
      if (index.artistFirst.get(name)?.year === year) newArtistHours += h;
    });

    let repeatPlays = 0;
    let longPlays = 0;
    dayCounts.forEach(n => {
      longPlays += n;
      repeatPlays += n - 1;
    });

    let albumFlow = 0;
    for (let i = 1; i < sorted.length; i++) {
      const r = sorted[i];
      const prev = sorted[i - 1];
      if (
        !r.shuffle &&
        r.reason_start === 'trackdone' &&
        r.master_metadata_album_album_name !== null &&
        r.master_metadata_album_album_name === prev.master_metadata_album_album_name &&
        r.master_metadata_album_artist_name === prev.master_metadata_album_artist_name &&
        r.master_metadata_track_name !== prev.master_metadata_track_name
      ) {
        albumFlow++;
      }
    }

    habits = {
      plays: visible.length,
      topArtistShare: topArtistHours / visibleHours,
      newArtistShare: year > index.firstYear ? newArtistHours / visibleHours : null,
      nightShare: timeOfDay?.nightShare ?? 0,
      morningShare: timeOfDay?.morningShare ?? 0,
      shuffleShare: visible.filter(r => r.shuffle).length / visible.length,
      skipRate: visible.filter(isSkip).length / visible.length,
      repeatShare: longPlays > 0 ? repeatPlays / longPlays : 0,
      albumFlowShare: albumFlow / visible.length,
      longSessionShare:
        sessionHours.filter(h => h >= LONG_SESSION_HOURS).reduce((a, h) => a + h, 0) / visibleHours,
      countries: countryList.length,
    };
  }

  // Skips
  let skips: StoryStats['skips'] = null;
  if (visible.length >= MIN_SKIP_PLAYS && index.lifetimeSkips.plays > 0) {
    const skipped = visible.filter(isSkip).length;
    skips = {
      rate: skipped / visible.length,
      lifetimeRate: index.lifetimeSkips.skipped / index.lifetimeSkips.plays,
      skipped,
      plays: visible.length,
    };
  }

  return {
    seasons: seasonList.length >= 2 ? seasonList : null,
    months: monthList.length > 0 ? monthList : null,
    discoveries,
    longestSession,
    repeatDay,
    timeOfDay,
    countries: countryList.length >= 2 ? countryList : null,
    yearOverYear,
    loyalty,
    comeback,
    skips,
    habits,
  };
}

/**
 * Everything the story for `year` needs. Pass the **full** history: later steps compare against earlier
 * years. Returns null when the year has no listening at all (check eligibility with `storyYears`).
 */
export function buildStory(records: ProcessedRecord[], year: number, options: StoryOptions = {}): StoryData | null {
  const hidden = visibility(records, options);
  const visible: ProcessedRecord[] = [];
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

    // Counted above; from here on only what the story may show.
    const why = hidden(r);
    if (why) {
      leftOut.hours += r.hours;
      leftOut.plays++;
      if (why === 'private') leftOut.privateHours += r.hours;
      else leftOut.ambientHours += r.hours;
      continue;
    }
    visible.push(r);
    const key = name ? trackKey(name, artist) : '';

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
  const partialYear = isPartial(year, firstDate, lastDate);

  const stats = buildStats(
    year,
    visible,
    totalHours,
    partialYear,
    topArtist?.name ?? null,
    sortedTracks.map(t => trackKey(t.track, t.artist)),
    historyIndex(records, options)
  );

  const story: Omit<StoryData, 'personality'> = {
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
    stats,
  };
  return { ...story, personality: getPersonality({ ...story, personality: null }) };
}
