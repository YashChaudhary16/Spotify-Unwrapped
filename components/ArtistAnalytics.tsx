import { TopTrack } from '@/lib/analytics';
import TimeOfDayChart from './TimeOfDayChart';
import TimeSeriesChart from './TimeSeriesChart';
import TopTracks from './TopTracks';

interface ArtistAnalyticsProps {
  artistName: string;
  analytics: {
    totalHours: number;
    uniqueTracks: number;
    uniqueDays: number;
    avgHoursPerDay: number;
    topTracks: TopTrack[];
    timeOfDay: { bucket: string; hours: number }[];
    timeSeries: { date: string; hours: number }[];
  };
  topN: number;
}

export default function ArtistAnalytics({ artistName, analytics, topN }: ArtistAnalyticsProps) {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6 text-spotify-green">🎤 Artist Analytics: {artistName}</h2>
      
      <div className="artist-card mb-8">
        <div className="metric-row flex gap-8 flex-wrap">
          <div className="metric-box">
            <h2>{analytics.totalHours.toFixed(2)}</h2>
            <span>Total Hours Listened</span>
          </div>
          <div className="metric-box">
            <h2>{analytics.uniqueTracks}</h2>
            <span>Unique Tracks</span>
          </div>
          <div className="metric-box">
            <h2>{analytics.avgHoursPerDay.toFixed(2)}</h2>
            <span>Avg Daily Listening (hrs)</span>
          </div>
        </div>
      </div>

      <TopTracks tracks={analytics.topTracks.slice(0, topN)} />

      <TimeOfDayChart data={analytics.timeOfDay} />

      <TimeSeriesChart data={analytics.timeSeries} />
    </div>
  );
}

