import { format, isValid, parseISO, getHours, getMinutes, getSeconds, getMonth, getYear } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
// @ts-ignore - world-countries has type resolution issues with Next.js
import countries from 'world-countries';
import { COUNTRY_TIMEZONES } from './countryTimezones';

// Country code -> full name, built once (was a linear search per record).
const COUNTRY_NAMES = new Map<string, string>(
  // @ts-ignore - world-countries type resolution
  (countries as any[]).map(c => [c.cca2, c.name.common])
);
const getCountryName = (code: string | null): string | null => (code ? COUNTRY_NAMES.get(code) ?? null : null);

/** Spotify reports "ZZ" (or nothing) when it couldn't tell the country. */
const knownCountry = (code: string | null | undefined): string | null =>
  code && code !== 'ZZ' && COUNTRY_TIMEZONES[code] ? code : null;

// Older browsers may not know newer IANA names; fall back to their long-standing aliases.
const TZ_ALIASES: Record<string, string> = {
  'Europe/Kyiv': 'Europe/Kiev',
  'America/Nuuk': 'America/Godthab',
  'Pacific/Kanton': 'Pacific/Enderbury',
};
const tzSupport = new Map<string, string>();
/** Returns a timezone this runtime can use: the zone itself, its alias, or UTC. */
const usableTimezone = (zone: string): string => {
  const cached = tzSupport.get(zone);
  if (cached) return cached;
  let result = 'UTC';
  for (const candidate of [zone, TZ_ALIASES[zone]]) {
    if (!candidate) continue;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: candidate });
      result = candidate;
      break;
    } catch {
      /* try the next candidate */
    }
  }
  tzSupport.set(zone, result);
  return result;
};

/** The viewer's own timezone, used only when no play in the whole upload has a country. */
const browserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/** Podcast episodes and audiobook chapters aren't counted (yet) — only music. */
export const isPodcastOrAudiobook = (r: RawStreamingRecord): boolean =>
  Boolean(
    r.spotify_episode_uri ||
      r.episode_name ||
      r.episode_show_name ||
      r.audiobook_uri ||
      r.audiobook_chapter_uri ||
      r.audiobook_title
  );

// Platform cleaning regex patterns
const PLATFORM_REGEX: Record<string, RegExp> = {
  'Android': /android/i,
  'iOS': /ios|iphone|ipad|mac|darwin/i,
  'Windows': /windows/i,
  'Google Cast': /google cast|chromecast|cast_/i,
};

const cleanPlatform = (platform: string | null): string => {
  if (!platform) return 'Unknown';
  const lower = platform.toLowerCase();
  for (const [name, regex] of Object.entries(PLATFORM_REGEX)) {
    if (regex.test(lower)) {
      return name;
    }
  }
  return 'Other';
};

// Extract track ID from Spotify URI
const extractTrackId = (uri: string | null): string | null => {
  if (!uri) return null;
  const parts = uri.split(':');
  return parts.length > 0 ? parts[parts.length - 1] : null;
};

// Time bucket function
const getTimeBucket = (hour: number): string => {
  if (hour >= 5 && hour <= 11) return 'Morning (5-11)';
  if (hour >= 12 && hour <= 17) return 'Afternoon (12-17)';
  if (hour >= 18 && hour <= 22) return 'Evening (18-22)';
  return 'Night (23-4)';
};

export interface RawStreamingRecord {
  ts: string;
  platform?: string;
  ms_played: number;
  conn_country?: string | null;
  ip_addr?: string | null;
  ip_addr_decrypted?: string | null;
  master_metadata_track_name?: string | null;
  master_metadata_album_artist_name?: string | null;
  master_metadata_album_album_name?: string | null;
  spotify_track_uri?: string | null;
  episode_name?: string | null;
  episode_show_name?: string | null;
  spotify_episode_uri?: string | null;
  audiobook_title?: string | null;
  audiobook_uri?: string | null;
  audiobook_chapter_uri?: string | null;
  audiobook_chapter_title?: string | null;
  reason_start?: string;
  reason_end?: string;
  shuffle?: boolean;
  skipped?: boolean;
  offline?: boolean;
  incognito_mode?: boolean;
  [key: string]: any;
}

export interface ProcessedRecord {
  ms_played: number;
  conn_country_full: string | null;
  master_metadata_track_name: string | null;
  master_metadata_album_artist_name: string | null;
  master_metadata_album_album_name: string | null;
  reason_start: string | null;
  reason_end: string | null;
  shuffle: boolean;
  skipped: boolean;
  offline: boolean;
  incognito_mode: boolean;
  platform_clean: string;
  track_id: string | null;
  timestamp: Date;
  Hour: number;
  Minute: number;
  Second: number;
  HH_MM_SS: string;
  Date: string;
  Day_Name: string;
  Month: number;
  Month_Name: string;
  Year: number;
  hours: number;
  minutes: number;
  date: string;
  hour: number;
  time_bucket: string;
  month: string;
  month_num: number;
  weekday: string;
}

/** What was left out while preprocessing, so the UI can be upfront about it. */
export interface PreprocessReport {
  /** Podcast episode and audiobook plays (not counted yet). */
  podcastPlays: number;
  /** Rows without a usable timestamp. */
  invalidRecords: number;
  /** Exact duplicate plays (e.g. the same file uploaded twice). */
  duplicates: number;
}

/** Finds, for each timestamp, the country of the nearest play (in time) that reported one. */
const nearestCountryLookup = (known: { t: number; country: string }[]) => {
  known.sort((a, b) => a.t - b.t);
  return (t: number): string | null => {
    if (known.length === 0) return null;
    let lo = 0;
    let hi = known.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (known[mid].t < t) lo = mid + 1;
      else hi = mid;
    }
    const after = known[lo];
    const before = known[lo - 1];
    if (!before) return after.country;
    return Math.abs(after.t - t) < Math.abs(t - before.t) ? after.country : before.country;
  };
};

export const preprocessStreamingHistory = (records: RawStreamingRecord[]): ProcessedRecord[] =>
  preprocessWithReport(records).records;

export const preprocessWithReport = (
  records: RawStreamingRecord[]
): { records: ProcessedRecord[]; report: PreprocessReport } => {
  const report: PreprocessReport = { podcastPlays: 0, invalidRecords: 0, duplicates: 0 };

  // 1. Keep valid, unique music plays. IP addresses are dropped here for privacy.
  const seen = new Set<string>();
  const music: { record: RawStreamingRecord; tsUtc: Date }[] = [];
  for (const { ip_addr, ip_addr_decrypted, ...record } of records) {
    if (!record || typeof record.ts !== 'string') {
      report.invalidRecords++;
      continue;
    }
    const tsUtc = parseISO(record.ts);
    if (!isValid(tsUtc)) {
      report.invalidRecords++;
      continue;
    }
    if (isPodcastOrAudiobook(record)) {
      report.podcastPlays++;
      continue;
    }
    const key = `${record.ts}|${record.spotify_track_uri ?? record.master_metadata_track_name ?? ''}|${record.ms_played}|${record.platform ?? ''}`;
    if (seen.has(key)) {
      report.duplicates++;
      continue;
    }
    seen.add(key);
    music.push({ record, tsUtc });
  }

  // 2. Plays without a country borrow the country of the nearest play that has one.
  const nearestCountry = nearestCountryLookup(
    music
      .filter(m => knownCountry(m.record.conn_country))
      .map(m => ({ t: m.tsUtc.getTime(), country: m.record.conn_country as string }))
  );
  const fallbackTimezone = usableTimezone(browserTimezone());

  const processed: ProcessedRecord[] = [];

  for (const { record, tsUtc } of music) {
    const country = knownCountry(record.conn_country) ?? nearestCountry(tsUtc.getTime());
    const timezone = country ? usableTimezone(COUNTRY_TIMEZONES[country]) : fallbackTimezone;

    // Convert to local time
    const tsLocal = utcToZonedTime(tsUtc, timezone);
    
    // Extract datetime components
    const hour = getHours(tsLocal);
    const minute = getMinutes(tsLocal);
    const second = getSeconds(tsLocal);
    const date = format(tsLocal, 'yyyy-MM-dd');
    const dayName = format(tsLocal, 'EEEE');
    const month = getMonth(tsLocal) + 1;
    const monthName = format(tsLocal, 'MMMM');
    const year = getYear(tsLocal);
    const weekday = format(tsLocal, 'EEEE');
    const monthShort = format(tsLocal, 'MMM');
    
    // Calculate listening time
    const msPlayed = Number.isFinite(record.ms_played) && record.ms_played > 0 ? record.ms_played : 0;
    const hours = msPlayed / (1000 * 60 * 60);
    const minutes = msPlayed / (1000 * 60);
    
    // Process record
    const processedRecord: ProcessedRecord = {
      ms_played: msPlayed,
      // The country chart shows only what Spotify reported; the borrowed country is used just for the timezone.
      conn_country_full: getCountryName(knownCountry(record.conn_country)),
      master_metadata_track_name: record.master_metadata_track_name || null,
      master_metadata_album_artist_name: record.master_metadata_album_artist_name || null,
      master_metadata_album_album_name: record.master_metadata_album_album_name || null,
      reason_start: record.reason_start || null,
      reason_end: record.reason_end || null,
      shuffle: record.shuffle || false,
      skipped: record.skipped || false,
      offline: record.offline || false,
      incognito_mode: record.incognito_mode || false,
      platform_clean: cleanPlatform(record.platform || null),
      track_id: extractTrackId(record.spotify_track_uri || null),
      timestamp: tsLocal,
      Hour: hour,
      Minute: minute,
      Second: second,
      HH_MM_SS: format(tsLocal, 'HH:mm:ss'),
      Date: date,
      Day_Name: dayName,
      Month: month,
      Month_Name: monthName,
      Year: year,
      hours,
      minutes,
      date,
      hour,
      time_bucket: getTimeBucket(hour),
      month: monthShort,
      month_num: month,
      weekday,
    };
    
    processed.push(processedRecord);
  }

  return { records: processed, report };
};

