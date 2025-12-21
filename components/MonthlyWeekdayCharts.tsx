'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MonthlyWeekdayChartsProps {
  monthlyHours: { month: string; hours: number }[];
  weekdayHours: { weekday: string; hours: number }[];
  heatmapData: { month: string; weekday: string; hours: number }[];
}

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_ORDER = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MonthlyWeekdayCharts({
  monthlyHours,
  weekdayHours,
  heatmapData,
}: MonthlyWeekdayChartsProps) {
  // Sort weekday data
  const sortedWeekdayHours = [...weekdayHours].sort(
    (a, b) => WEEKDAY_ORDER.indexOf(a.weekday) - WEEKDAY_ORDER.indexOf(b.weekday)
  );

  // Create heatmap matrix
  const heatmapMatrix: { [key: string]: { [key: string]: number } } = {};
  heatmapData.forEach(({ month, weekday, hours }) => {
    if (!heatmapMatrix[month]) heatmapMatrix[month] = {};
    heatmapMatrix[month][weekday] = hours;
  });

  const maxHours = Math.max(...heatmapData.map(d => d.hours), 1);

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold mb-6 text-spotify-green">📅 Monthly and Weekday Listening Trends</h2>
      
      <div className="mb-6 bg-spotify-gray/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-spotify-green">Total Listening Hours per Month</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlyHours}>
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis dataKey="month" stroke="#B3B3B3" />
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

      <div className="mb-6 bg-spotify-gray/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-spotify-green">Average Daily Listening Hours by Weekday</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedWeekdayHours}>
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis dataKey="weekday" stroke="#B3B3B3" />
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

      <div className="bg-spotify-gray/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-spotify-green">Listening Hours: Month vs. Weekday</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-spotify-lightgray">Month</th>
                {WEEKDAY_ORDER.map(day => (
                  <th key={day} className="p-2 text-center text-spotify-lightgray text-sm">
                    {day.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTH_ORDER.map(month => {
                const monthData = heatmapMatrix[month] || {};
                return (
                  <tr key={month}>
                    <td className="p-2 font-semibold">{month}</td>
                    {WEEKDAY_ORDER.map(weekday => {
                      const hours = monthData[weekday] || 0;
                      const intensity = hours / maxHours;
                      const bgColor = `rgba(29, 185, 84, ${Math.max(intensity, 0.1)})`;
                      return (
                        <td
                          key={weekday}
                          className="p-2 text-center text-xs"
                          style={{ backgroundColor: bgColor }}
                        >
                          {hours > 0 ? hours.toFixed(1) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

