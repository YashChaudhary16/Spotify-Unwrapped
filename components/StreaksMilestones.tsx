interface StreaksMilestonesProps {
  longestStreak: { days: number; start: string; end: string };
  maxDay: { date: string; hours: number };
  firstSong: { track: string; artist: string; date: string };
  milestones: { hours: number; date: string }[];
  mostListenedTrack: { track: string; hours: number; date: string };
}

export default function StreaksMilestones({
  longestStreak,
  maxDay,
  firstSong,
  milestones,
  mostListenedTrack,
}: StreaksMilestonesProps) {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6 text-spotify-green">🏆 Listening Streaks & Milestones</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-spotify-gray/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-spotify-green">Longest Listening Streak</h3>
          <p className="text-3xl font-bold">{longestStreak.days} days</p>
          <p className="text-spotify-lightgray text-sm mt-2">
            {longestStreak.start} → {longestStreak.end}
          </p>
        </div>

        <div className="bg-spotify-gray/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-spotify-green">Day with Most Listening</h3>
          <p className="text-3xl font-bold">{maxDay.hours.toFixed(2)} hrs</p>
          <p className="text-spotify-lightgray text-sm mt-2">{maxDay.date}</p>
        </div>

        <div className="bg-spotify-gray/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2 text-spotify-green">First Song Played</h3>
          <p className="text-xl font-bold">{firstSong.track}</p>
          <p className="text-spotify-lightgray text-sm mt-2">
            {firstSong.artist} ({firstSong.date})
          </p>
        </div>
      </div>

      <div className="bg-spotify-gray/50 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold mb-4 text-spotify-green">🎉 Listening Milestones</h3>
        <div className="space-y-2">
          {milestones.map((milestone, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-spotify-dark rounded">
              <span className="text-spotify-green font-semibold">
                Crossed {milestone.hours.toLocaleString()} hours
              </span>
              <span className="text-spotify-lightgray">{milestone.date}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-spotify-gray/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-2 text-spotify-green">Most Listened Track</h3>
        <p className="text-lg">
          <span className="font-bold">{mostListenedTrack.track}</span> ({mostListenedTrack.hours.toFixed(2)} hrs)
        </p>
        <p className="text-spotify-lightgray text-sm mt-2">Top Day: {mostListenedTrack.date}</p>
      </div>
    </div>
  );
}

