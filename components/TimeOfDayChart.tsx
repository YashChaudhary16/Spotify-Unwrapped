'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface TimeOfDayChartProps {
  data: { bucket: string; hours: number }[];
}

const COLORS: Record<string, string> = {
  'Morning (5-11)': '#1DB954',
  'Afternoon (12-17)': '#B3B3B3',
  'Evening (18-22)': '#535353',
  'Night (23-4)': '#191414',
};

export default function TimeOfDayChart({ data }: TimeOfDayChartProps) {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6 text-spotify-green">⏰ Listening by Time of Day</h2>
      <div className="bg-spotify-gray/50 rounded-lg p-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis dataKey="bucket" stroke="#B3B3B3" />
            <YAxis stroke="#B3B3B3" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#282828',
                border: '1px solid #404040',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.bucket] || '#1DB954'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

