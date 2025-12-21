import { format, parseISO, getHours, getMinutes, getSeconds, getMonth, getYear } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
// @ts-ignore - world-countries has type resolution issues with Next.js
import countries from 'world-countries';

// Country code to full name mapping
const getCountryName = (code: string | null): string | null => {
  if (!code) return null;
  // @ts-ignore - world-countries type resolution
  const country = countries.find((c: any) => c.cca2 === code);
  return country ? country.name.common : null;
};

// Timezone mapping
const TZ_MAP: Record<string, string> = {
  'IN': 'Asia/Kolkata',
  'US': 'America/New_York',
  'QA': 'Asia/Qatar',
};

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

export const preprocessStreamingHistory = (records: RawStreamingRecord[]): ProcessedRecord[] => {
  const cutoff = new Date('2024-08-04T00:00:00Z');
  
  // Remove IP addresses for privacy
  const sanitizedRecords = records.map(({ ip_addr, ip_addr_decrypted, ...rest }) => rest);
  
  const processed: ProcessedRecord[] = [];
  
  for (const record of sanitizedRecords) {
    // Parse UTC timestamp
    const tsUtc = parseISO(record.ts);
    
    // Determine timezone based on country
    let timezone = 'UTC';
    const country = record.conn_country;
    
    if (country && TZ_MAP[country]) {
      timezone = TZ_MAP[country];
    } else if (!country) {
      // Fallback: US after cutoff, India before
      timezone = tsUtc >= cutoff ? 'America/New_York' : 'Asia/Kolkata';
    }
    
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
    const msPlayed = record.ms_played || 0;
    const hours = msPlayed / (1000 * 60 * 60);
    const minutes = msPlayed / (1000 * 60);
    
    // Process record
    const processedRecord: ProcessedRecord = {
      ms_played: msPlayed,
      conn_country_full: getCountryName(country || null),
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
  
  return processed;
};

