import { ProcessedRecord } from './preprocessing';
import { differenceInDays, parseISO } from 'date-fns';

export interface TopTrack {
  track: string;
  trackId: string | null;
  hours: number;
  artist: string | null;
}

export interface AlbumStat {
  key: string;
  album: string;
  artist: string | null;
  hours: number;
  plays: number;
  uniqueTracks: number;
  depthScore: number;
  mostPlayedTrack: { track: string | null; hours: number; plays: number };
  firstListen: string;
  lastListen: string;
  timeSeries: { date: string; hours: number }[];
  timeOfDay: { bucket: string; hours: number }[];
  heatmapData: { month: string; weekday: string; hours: number }[];
}

export interface ArtistAlbumCoverage {
  artist: string;
  totalHours: number;
  albums: { key: string; album: string; hours: number; share: number }[];
}

export interface Analytics {
  totalHours: number;
  totalTracks: number;
  uniqueDays: number;
  avgHoursPerDay: number;
  topTracks: TopTrack[];
  albumStats: AlbumStat[];
  artistAlbumCoverage: ArtistAlbumCoverage[];
  platformUsage: { platform: string; hours: number }[];
  shuffleStats: { shuffled: number; notShuffled: number };
  offlineStats: { offline: number; online: number };
  countryStats: { country: string; hours: number }[];
  timeSeries: { date: string; hours: number }[];
  timeOfDay: { bucket: string; hours: number }[];
  monthlyHours: { month: string; hours: number }[];
  weekdayHours: { weekday: string; hours: number }[];
  longestStreak: { days: number; start: string; end: string };
  maxDay: { date: string; hours: number };
  firstSong: { track: string; artist: string; date: string };
  milestones: { hours: number; date: string }[];
  mostListenedTrack: { track: string; hours: number; date: string };
  skippedTracks: { track: string; count: number }[];
  topPlayedTracks: { track: string; hours: number }[];
  heatmapData: { month: string; weekday: string; hours: number }[];
}

export const calculateAnalytics = (records: ProcessedRecord[]): Analytics => {
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Filter out records with 0 or negative play time
  const validRecords = records.filter(r => r.hours > 0);
  
  // Basic stats
  const totalHours = validRecords.reduce((sum, r) => sum + r.hours, 0);
  const totalTracks = validRecords.length;
  const uniqueDays = new Set(records.map(r => r.date)).size;
  const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;
  
  // Top tracks
  const trackMap = new Map<string, { hours: number; artist: string | null; trackId: string | null }>();
  validRecords.forEach(r => {
    if (!r.master_metadata_track_name) return;
    const key = r.master_metadata_track_name;
    const existing = trackMap.get(key) || { hours: 0, artist: r.master_metadata_album_artist_name, trackId: r.track_id };
    existing.hours += r.hours;
    if (!existing.trackId && r.track_id) existing.trackId = r.track_id;
    trackMap.set(key, existing);
  });
  
  const topTracks: TopTrack[] = Array.from(trackMap.entries())
    .map(([track, data]) => ({
      track,
      trackId: data.trackId,
      hours: data.hours,
      artist: data.artist,
    }))
    .sort((a, b) => b.hours - a.hours);
  
  // Platform usage
  const platformMap = new Map<string, number>();
  validRecords.forEach(r => {
    const current = platformMap.get(r.platform_clean) || 0;
    platformMap.set(r.platform_clean, current + r.hours);
  });
  const platformUsage = Array.from(platformMap.entries())
    .map(([platform, hours]) => ({ platform, hours }))
    .sort((a, b) => b.hours - a.hours);
  
  // Shuffle stats
  const shuffled = records.filter(r => r.shuffle).length;
  const notShuffled = records.filter(r => !r.shuffle).length;
  
  // Offline stats
  const offline = records.filter(r => r.offline).length;
  const online = records.filter(r => !r.offline).length;
  
  // Country stats
  const countryMap = new Map<string, number>();
  validRecords.forEach(r => {
    const country = r.conn_country_full || 'Unknown';
    const current = countryMap.get(country) || 0;
    countryMap.set(country, current + r.hours);
  });
  const countryStats = Array.from(countryMap.entries())
    .map(([country, hours]) => ({ country, hours }))
    .sort((a, b) => b.hours - a.hours);
  
  // Time series
  const dateMap = new Map<string, number>();
  validRecords.forEach(r => {
    const current = dateMap.get(r.date) || 0;
    dateMap.set(r.date, current + r.hours);
  });
  const timeSeries = Array.from(dateMap.entries())
    .map(([date, hours]) => ({ date, hours }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  // Time of day
  const timeBucketMap = new Map<string, number>();
  validRecords.forEach(r => {
    const current = timeBucketMap.get(r.time_bucket) || 0;
    timeBucketMap.set(r.time_bucket, current + r.hours);
  });
  const timeOfDay = [
    { bucket: 'Morning (5-11)', hours: timeBucketMap.get('Morning (5-11)') || 0 },
    { bucket: 'Afternoon (12-17)', hours: timeBucketMap.get('Afternoon (12-17)') || 0 },
    { bucket: 'Evening (18-22)', hours: timeBucketMap.get('Evening (18-22)') || 0 },
    { bucket: 'Night (23-4)', hours: timeBucketMap.get('Night (23-4)') || 0 },
  ];
  
  // Monthly hours
  const monthMap = new Map<string, number>();
  validRecords.forEach(r => {
    const current = monthMap.get(r.month) || 0;
    monthMap.set(r.month, current + r.hours);
  });
  const monthlyHours = monthOrder
    .map(month => ({ month, hours: monthMap.get(month) || 0 }))
    .filter(m => m.hours > 0);
  
  // Weekday hours (average)
  const weekdayMap = new Map<string, { total: number; count: number }>();
  const dailyTotals = new Map<string, number>();
  validRecords.forEach(r => {
    const current = dailyTotals.get(r.date) || 0;
    dailyTotals.set(r.date, current + r.hours);
  });
  
  records.forEach(r => {
    const dayTotal = dailyTotals.get(r.date) || 0;
    const existing = weekdayMap.get(r.weekday) || { total: 0, count: 0 };
    existing.total += dayTotal;
    existing.count += 1;
    weekdayMap.set(r.weekday, existing);
  });
  
  const weekdayHours = weekdayOrder.map(weekday => {
    const data = weekdayMap.get(weekday) || { total: 0, count: 1 };
    return { weekday, hours: data.count > 0 ? data.total / data.count : 0 };
  });
  
  // Streaks
  const sortedDates = Array.from(new Set(records.map(r => r.date))).sort();
  let longestStreak = { days: 0, start: '', end: '' };
  let currentStreak = 1;
  let streakStart = sortedDates[0];
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diff = differenceInDays(curr, prev);
    
    if (diff === 1) {
      currentStreak++;
    } else {
      if (currentStreak > longestStreak.days) {
        longestStreak = {
          days: currentStreak,
          start: streakStart,
          end: sortedDates[i - 1],
        };
      }
      currentStreak = 1;
      streakStart = sortedDates[i];
    }
  }
  
  if (currentStreak > longestStreak.days) {
    longestStreak = {
      days: currentStreak,
      start: streakStart,
      end: sortedDates[sortedDates.length - 1],
    };
  }
  
  // Max day
  const maxDayEntry = Array.from(dateMap.entries())
    .sort((a, b) => b[1] - a[1])[0];
  const maxDay = maxDayEntry ? { date: maxDayEntry[0], hours: maxDayEntry[1] } : { date: '', hours: 0 };
  
  // First song
  // Convert timestamp strings back to Date objects if needed (after JSON serialization)
  const sortedByTime = [...records].sort((a, b) => {
    const timeA = typeof a.timestamp === 'string' ? parseISO(a.timestamp).getTime() : a.timestamp.getTime();
    const timeB = typeof b.timestamp === 'string' ? parseISO(b.timestamp).getTime() : b.timestamp.getTime();
    return timeA - timeB;
  });
  const firstRecord = sortedByTime[0];
  const firstSong = {
    track: firstRecord.master_metadata_track_name || 'Unknown',
    artist: firstRecord.master_metadata_album_artist_name || 'Unknown',
    date: firstRecord.date,
  };
  
  // Milestones
  const cumulative = timeSeries.map((entry, idx) => ({
    date: entry.date,
    hours: timeSeries.slice(0, idx + 1).reduce((sum, e) => sum + e.hours, 0),
  }));
  
  const milestoneHours = [100, 500, 1000, 2000, 5000, 10000, 20000];
  const milestones = milestoneHours
    .map(targetHours => {
      const milestone = cumulative.find(c => c.hours >= targetHours);
      return milestone ? { hours: targetHours, date: milestone.date } : null;
    })
    .filter((m): m is { hours: number; date: string } => m !== null);
  
  // Most listened track
  const mostListened = topTracks[0];
  const mostListenedDate = validRecords
    .filter(r => r.master_metadata_track_name === mostListened.track)
    .reduce((acc, r) => {
      const current = acc.get(r.date) || 0;
      acc.set(r.date, current + r.hours);
      return acc;
    }, new Map<string, number>());
  
  const mostListenedDateEntry = Array.from(mostListenedDate.entries())
    .sort((a, b) => b[1] - a[1])[0];
  
  const mostListenedTrack = {
    track: mostListened.track,
    hours: mostListened.hours,
    date: mostListenedDateEntry?.[0] || '',
  };
  
  // Skipped tracks
  const skippedMap = new Map<string, number>();
  records.filter(r => r.skipped).forEach(r => {
    if (r.master_metadata_track_name) {
      const current = skippedMap.get(r.master_metadata_track_name) || 0;
      skippedMap.set(r.master_metadata_track_name, current + 1);
    }
  });
  const skippedTracks = Array.from(skippedMap.entries())
    .map(([track, count]) => ({ track, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Top played (non-skipped)
  const topPlayedMap = new Map<string, number>();
  validRecords.filter(r => !r.skipped).forEach(r => {
    if (r.master_metadata_track_name) {
      const current = topPlayedMap.get(r.master_metadata_track_name) || 0;
      topPlayedMap.set(r.master_metadata_track_name, current + r.hours);
    }
  });
  const topPlayedTracks = Array.from(topPlayedMap.entries())
    .map(([track, hours]) => ({ track, hours }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);
  
  // Heatmap data
  const heatmapMap = new Map<string, number>();
  validRecords.forEach(r => {
    const key = `${r.month}_${r.weekday}`;
    const current = heatmapMap.get(key) || 0;
    heatmapMap.set(key, current + r.hours);
  });
  
  const heatmapData: { month: string; weekday: string; hours: number }[] = [];
  monthOrder.forEach(month => {
    weekdayOrder.forEach(weekday => {
      const key = `${month}_${weekday}`;
      heatmapData.push({
        month,
        weekday,
        hours: heatmapMap.get(key) || 0,
      });
    });
  });

  // Album analytics
  const albumMap = new Map<string, {
    album: string;
    artist: string | null;
    hours: number;
    plays: number;
    trackMap: Map<string, { hours: number; plays: number }>;
    dateMap: Map<string, number>;
    timeBucketMap: Map<string, number>;
    heatmapMap: Map<string, number>;
    firstListen: string;
    lastListen: string;
  }>();

  validRecords.forEach(r => {
    const album = r.master_metadata_album_album_name || 'Unknown Album';
    const artist = r.master_metadata_album_artist_name || 'Unknown Artist';
    const key = `${album}__${artist}`;

    if (!albumMap.has(key)) {
      albumMap.set(key, {
        album,
        artist,
        hours: 0,
        plays: 0,
        trackMap: new Map(),
        dateMap: new Map(),
        timeBucketMap: new Map(),
        heatmapMap: new Map(),
        firstListen: r.date,
        lastListen: r.date,
      });
    }

    const entry = albumMap.get(key)!;
    entry.hours += r.hours;
    entry.plays += 1;

    if (r.date < entry.firstListen) entry.firstListen = r.date;
    if (r.date > entry.lastListen) entry.lastListen = r.date;

    if (r.master_metadata_track_name) {
      const trackStats = entry.trackMap.get(r.master_metadata_track_name) || { hours: 0, plays: 0 };
      trackStats.hours += r.hours;
      trackStats.plays += 1;
      entry.trackMap.set(r.master_metadata_track_name, trackStats);
    }

    const currentDateHours = entry.dateMap.get(r.date) || 0;
    entry.dateMap.set(r.date, currentDateHours + r.hours);

    const currentBucketHours = entry.timeBucketMap.get(r.time_bucket) || 0;
    entry.timeBucketMap.set(r.time_bucket, currentBucketHours + r.hours);

    const heatKey = `${r.month}_${r.weekday}`;
    const currentHeat = entry.heatmapMap.get(heatKey) || 0;
    entry.heatmapMap.set(heatKey, currentHeat + r.hours);
  });

  const albumStats: AlbumStat[] = Array.from(albumMap.entries()).map(([key, entry]) => {
    const mostPlayedTrackEntry = Array.from(entry.trackMap.entries())
      .sort((a, b) => b[1].hours - a[1].hours)[0];
    const topTrackShare = entry.hours > 0 ? (mostPlayedTrackEntry?.[1].hours || 0) / entry.hours : 0;

    const timeSeries = Array.from(entry.dateMap.entries())
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const timeOfDay = [
      { bucket: 'Morning (5-11)', hours: entry.timeBucketMap.get('Morning (5-11)') || 0 },
      { bucket: 'Afternoon (12-17)', hours: entry.timeBucketMap.get('Afternoon (12-17)') || 0 },
      { bucket: 'Evening (18-22)', hours: entry.timeBucketMap.get('Evening (18-22)') || 0 },
      { bucket: 'Night (23-4)', hours: entry.timeBucketMap.get('Night (23-4)') || 0 },
    ];

    const heatmapDataForAlbum: { month: string; weekday: string; hours: number }[] = [];
    monthOrder.forEach(month => {
      weekdayOrder.forEach(weekday => {
        const heatKey = `${month}_${weekday}`;
        heatmapDataForAlbum.push({
          month,
          weekday,
          hours: entry.heatmapMap.get(heatKey) || 0,
        });
      });
    });

    const uniqueTracks = entry.trackMap.size;
    const depthScore = topTrackShare;

    return {
      key,
      album: entry.album,
      artist: entry.artist,
      hours: entry.hours,
      plays: entry.plays,
      uniqueTracks,
      depthScore,
      mostPlayedTrack: {
        track: mostPlayedTrackEntry?.[0] || null,
        hours: mostPlayedTrackEntry?.[1].hours || 0,
        plays: mostPlayedTrackEntry?.[1].plays || 0,
      },
      firstListen: entry.firstListen,
      lastListen: entry.lastListen,
      timeSeries,
      timeOfDay,
      heatmapData: heatmapDataForAlbum,
    };
  }).sort((a, b) => b.hours - a.hours);

  const artistAlbumCoverage: ArtistAlbumCoverage[] = Array.from(
    albumStats.reduce((acc, album) => {
      const artistName = album.artist || 'Unknown Artist';
      const artistEntry = acc.get(artistName) || { totalHours: 0, albums: [] as { key: string; album: string; hours: number }[] };
      artistEntry.totalHours += album.hours;
      artistEntry.albums.push({ key: album.key, album: album.album, hours: album.hours });
      acc.set(artistName, artistEntry);
      return acc;
    }, new Map<string, { totalHours: number; albums: { key: string; album: string; hours: number }[] }>())
  ).map(([artist, data]) => {
    const albums = data.albums
      .map(a => ({
        ...a,
        share: data.totalHours > 0 ? (a.hours / data.totalHours) * 100 : 0,
      }))
      .sort((a, b) => b.hours - a.hours);
    return {
      artist,
      totalHours: data.totalHours,
      albums,
    };
  }).sort((a, b) => b.totalHours - a.totalHours);
  
  return {
    totalHours,
    totalTracks,
    uniqueDays,
    avgHoursPerDay,
    topTracks,
    albumStats,
    artistAlbumCoverage,
    platformUsage,
    shuffleStats: { shuffled, notShuffled },
    offlineStats: { offline, online },
    countryStats,
    timeSeries,
    timeOfDay,
    monthlyHours,
    weekdayHours,
    longestStreak,
    maxDay,
    firstSong,
    milestones,
    mostListenedTrack,
    skippedTracks,
    topPlayedTracks,
    heatmapData,
  };
};

export const getArtistAnalytics = (records: ProcessedRecord[], artistName: string) => {
  const artistRecords = records.filter(
    r => r.master_metadata_album_artist_name === artistName
  );
  
  const validRecords = artistRecords.filter(r => r.hours > 0);
  const totalHours = validRecords.reduce((sum, r) => sum + r.hours, 0);
  const uniqueTracks = new Set(validRecords.map(r => r.master_metadata_track_name)).size;
  const uniqueDays = new Set(artistRecords.map(r => r.date)).size;
  const avgHoursPerDay = uniqueDays > 0 ? totalHours / uniqueDays : 0;
  
  // Top tracks
  const trackMap = new Map<string, { hours: number; trackId: string | null }>();
  validRecords.forEach(r => {
    if (!r.master_metadata_track_name) return;
    const key = r.master_metadata_track_name;
    const existing = trackMap.get(key) || { hours: 0, trackId: r.track_id };
    existing.hours += r.hours;
    if (!existing.trackId && r.track_id) existing.trackId = r.track_id;
    trackMap.set(key, existing);
  });
  
  const topTracks: TopTrack[] = Array.from(trackMap.entries())
    .map(([track, data]) => ({
      track,
      trackId: data.trackId,
      hours: data.hours,
      artist: artistName,
    }))
    .sort((a, b) => b.hours - a.hours);
  
  // Time of day
  const timeBucketMap = new Map<string, number>();
  validRecords.forEach(r => {
    const current = timeBucketMap.get(r.time_bucket) || 0;
    timeBucketMap.set(r.time_bucket, current + r.hours);
  });
  const timeOfDay = [
    { bucket: 'Morning (5-11)', hours: timeBucketMap.get('Morning (5-11)') || 0 },
    { bucket: 'Afternoon (12-17)', hours: timeBucketMap.get('Afternoon (12-17)') || 0 },
    { bucket: 'Evening (18-22)', hours: timeBucketMap.get('Evening (18-22)') || 0 },
    { bucket: 'Night (23-4)', hours: timeBucketMap.get('Night (23-4)') || 0 },
  ];
  
  // Time series
  const dateMap = new Map<string, number>();
  validRecords.forEach(r => {
    const current = dateMap.get(r.date) || 0;
    dateMap.set(r.date, current + r.hours);
  });
  const timeSeries = Array.from(dateMap.entries())
    .map(([date, hours]) => ({ date, hours }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  return {
    totalHours,
    uniqueTracks,
    uniqueDays,
    avgHoursPerDay,
    topTracks,
    timeOfDay,
    timeSeries,
  };
};

