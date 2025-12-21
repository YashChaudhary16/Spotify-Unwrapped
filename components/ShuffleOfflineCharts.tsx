'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ShuffleOfflineChartsProps {
  shuffleStats: { shuffled: number; notShuffled: number };
  offlineStats: { offline: number; online: number };
}

const COLORS = ['#1DB954', '#212121'];

export default function ShuffleOfflineCharts({ shuffleStats, offlineStats }: ShuffleOfflineChartsProps) {
  const shuffleData = [
    { name: 'Shuffled', value: shuffleStats.shuffled },
    { name: 'Not Shuffled', value: shuffleStats.notShuffled },
  ];

  const offlineData = [
    { name: 'Offline', value: offlineStats.offline },
    { name: 'Online', value: offlineStats.online },
  ];

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6 text-spotify-green">📊 Playback Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-spotify-gray/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-spotify-green">🔀 Shuffle Usage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={shuffleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {shuffleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#282828',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-spotify-gray/50 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-spotify-green">📶 Offline vs Online Playback</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={offlineData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {offlineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#282828',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

