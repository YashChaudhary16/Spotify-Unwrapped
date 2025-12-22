'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PlatformChartProps {
  data: { platform: string; hours: number }[];
}

export default function PlatformChart({ data }: PlatformChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
              }}
              cursor={{ fill: 'transparent' }}       // disables the light hover overlay
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#1DB954' }}
              formatter={(value: number) => [`${value.toFixed(1)} hrs`, 'hours']}
            />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]} activeBar={false}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${entry.platform}`}
                  fill={activeIndex === index ? '#1ED760' : '#1DB954'}
                  style={{
                    transform: activeIndex === index ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'transform 150ms ease, fill 150ms ease, filter 150ms ease',
                    filter: activeIndex === index ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

