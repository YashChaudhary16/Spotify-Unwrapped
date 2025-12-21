import { TopTrack } from '@/lib/analytics';

interface TopTracksProps {
  tracks: TopTrack[];
}

export default function TopTracks({ tracks }: TopTracksProps) {
  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h} hrs ${m} mins`;
  };

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6 text-spotify-green">🎵 Top Tracks</h2>
      <div className="space-y-4">
        {tracks.map((track, idx) => (
          <div key={`${track.track}-${idx}`} className="track-card">
            <div className="track-info">
              <div className="track-name">
                {idx + 1}. {track.track}
              </div>
              <div className="track-time">
                Listening Time: {formatTime(track.hours)}
              </div>
            </div>
            {track.trackId && (
              <div className="spotify-embed">
                <iframe
                  src={`https://open.spotify.com/embed/track/${track.trackId}`}
                  width="320"
                  height="80"
                  frameBorder="0"
                  allowTransparency
                  allow="encrypted-media"
                  style={{ borderRadius: '12px', background: '#181818' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

