'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlatformChartProps {
  data: { platform: string; hours: number }[];
}

export default function PlatformChart({ data }: PlatformChartProps) {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6 text-spotify-green">🖥️ Platform Usage Comparison</h2>
      <div className="bg-spotify-gray/50 rounded-lg p-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis dataKey="platform" stroke="#B3B3B3" />
            <YAxis stroke="#B3B3B3" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#282828',
                border: '1px solid #404040',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Bar dataKey="hours" fill="#1DB954" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

