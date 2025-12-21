import { Analytics } from '@/lib/analytics';

interface MetricsProps {
  analytics: Analytics;
}

export default function Metrics({ analytics }: MetricsProps) {
  const formatAvgTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h} hrs ${m} mins`;
  };

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6 text-spotify-green">📊 Overall Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="metric-card">
          <h1>{analytics.totalHours.toFixed(2)}</h1>
          <p>Total Listening Hours</p>
        </div>
        <div className="metric-card">
          <h1>{analytics.totalTracks.toLocaleString()}</h1>
          <p>Total Tracks Played</p>
        </div>
        <div className="metric-card">
          <h1>{formatAvgTime(analytics.avgHoursPerDay)}</h1>
          <p>Avg Listen Time / Day</p>
        </div>
      </div>
    </div>
  );
}

