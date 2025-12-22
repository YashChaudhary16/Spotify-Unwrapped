'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CountryMapProps {
  data: { country: string; hours: number }[];
}

export default function CountryMap({ data }: CountryMapProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6 text-spotify-green">🌍 Country-wise Listening</h2>
      <div className="bg-spotify-gray/50 rounded-lg p-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis dataKey="country" stroke="#B3B3B3" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#B3B3B3" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#282828',
                border: '1px solid #404040',
                borderRadius: '8px',
              }}
              cursor={{ fill: 'transparent' }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#1DB954' }}
              formatter={(value: number) => [`${value.toFixed(1)} hrs`, 'hours']}
            />
            <Bar dataKey="hours" radius={[8, 8, 0, 0]} activeBar={false}>
              {data.map((entry, idx) => (
                <Cell
                  key={entry.country}
                  fill={activeIndex === idx ? '#1ED760' : '#1DB954'}
                  style={{
                    transform: activeIndex === idx ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'transform 150ms ease, fill 150ms ease, filter 150ms ease',
                    filter: activeIndex === idx ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
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

