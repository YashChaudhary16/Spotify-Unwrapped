'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';

interface TimeSeriesChartProps {
  data: { date: string; hours: number }[];
}

export default function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const formattedData = data.map(d => ({
    ...d,
    dateFormatted: format(parseISO(d.date), 'MMM dd, yyyy'),
  }));

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6 text-spotify-green">📈 Listening Time Over Time</h2>
      <div className="bg-spotify-gray/50 rounded-lg p-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis
              dataKey="dateFormatted"
              stroke="#B3B3B3"
              angle={-45}
              textAnchor="end"
              height={100}
              interval="preserveStartEnd"
            />
            <YAxis stroke="#B3B3B3" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#282828',
                border: '1px solid #404040',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#1DB954"
              strokeWidth={2}
              dot={{ fill: '#1DB954', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

