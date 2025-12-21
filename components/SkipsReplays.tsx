interface SkipsReplaysProps {
  skippedTracks: { track: string; count: number }[];
  topPlayedTracks: { track: string; hours: number }[];
}

export default function SkipsReplays({ skippedTracks, topPlayedTracks }: SkipsReplaysProps) {
  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h} hrs ${m} mins`;
  };

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6 text-spotify-green">⏭️ Skips and Replays Insight</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-spotify-gray/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-spotify-green">
            Total Skipped Tracks: {skippedTracks.reduce((sum, t) => sum + t.count, 0)}
          </h3>
          <div className="space-y-2">
            {skippedTracks.length > 0 ? (
              skippedTracks.map((track, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-spotify-dark rounded">
                  <span>{track.track}</span>
                  <span className="text-spotify-green font-semibold">{track.count} skips</span>
                </div>
              ))
            ) : (
              <p className="text-spotify-lightgray">No skipped tracks found</p>
            )}
          </div>
        </div>

        <div className="bg-spotify-gray/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-spotify-green">Top Played (Non-Skipped)</h3>
          <div className="space-y-2">
            {topPlayedTracks.length > 0 ? (
              topPlayedTracks.map((track, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-spotify-dark rounded">
                  <span>{track.track}</span>
                  <span className="text-spotify-green font-semibold">{formatTime(track.hours)}</span>
                </div>
              ))
            ) : (
              <p className="text-spotify-lightgray">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

