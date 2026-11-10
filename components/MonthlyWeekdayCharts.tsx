'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CalendarDays, CalendarRange, Grid3x3, Sun } from 'lucide-react';
import { CHART_COLORS, barCursor, gridProps, xAxisProps, yAxisProps } from '@/lib/chartTheme';
import { formatDurationShort } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { Card, CardTitle } from '@/components/ui/Card';
import { ChartTooltip } from '@/components/ui/ChartTooltip';

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
  const [activeMonthIdx, setActiveMonthIdx] = useState<number | null>(null);
  const [activeWeekdayIdx, setActiveWeekdayIdx] = useState<number | null>(null);
  const { unit } = useTimeUnit();

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
  const tickFormatter = (v: number) => formatDurationShort(v, unit);

  return (
    <Section title="Monthly and weekday trends" icon={CalendarDays}>
      <Card className="mb-4">
        <CardTitle icon={CalendarRange}>Listening time per month</CardTitle>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={monthlyHours}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} dataKey="month" />
            <YAxis {...yAxisProps} tickFormatter={tickFormatter} />
            <Tooltip cursor={barCursor} content={<ChartTooltip hideSwatch nameFormatter={() => 'Listening time'} />} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} activeBar={false}>
              {monthlyHours.map((entry, idx) => (
                <Cell
                  key={entry.month}
                  fill={CHART_COLORS.accent}
                  style={{
                    transform: activeMonthIdx === idx ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'transform 150ms ease, fill 150ms ease, filter 150ms ease',
                    filter: activeMonthIdx === idx ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setActiveMonthIdx(idx)}
                  onMouseLeave={() => setActiveMonthIdx(null)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="mb-4">
        <CardTitle icon={Sun}>Average daily listening by weekday</CardTitle>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedWeekdayHours}>
            <CartesianGrid {...gridProps} />
            <XAxis {...xAxisProps} dataKey="weekday" />
            <YAxis {...yAxisProps} tickFormatter={tickFormatter} />
            <Tooltip cursor={barCursor} content={<ChartTooltip hideSwatch nameFormatter={() => 'Average per day'} />} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]} activeBar={false}>
              {sortedWeekdayHours.map((entry, idx) => (
                <Cell
                  key={entry.weekday}
                  fill={CHART_COLORS.accent}
                  style={{
                    transform: activeWeekdayIdx === idx ? 'translateY(-6px)' : 'translateY(0)',
                    transition: 'transform 150ms ease, fill 150ms ease, filter 150ms ease',
                    filter: activeWeekdayIdx === idx ? 'drop-shadow(0 8px 12px rgba(0,0,0,0.25))' : 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setActiveWeekdayIdx(idx)}
                  onMouseLeave={() => setActiveWeekdayIdx(null)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* TODO(Step 2): stepped color scale + legend, distinct empty cells, contrast-aware text. */}
      <Card>
        <CardTitle
          icon={Grid3x3}
          subtitle="Each cell is total listening hours on that weekday for that month. Brighter cells mean more hours."
        >
          Month vs. weekday
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse tabular-nums">
            <thead>
              <tr>
                <th className="p-2 text-left text-sm font-medium text-spotify-lightgray">Month</th>
                {WEEKDAY_ORDER.map(day => (
                  <th key={day} className="p-2 text-center text-sm font-medium text-spotify-lightgray">
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
                    <td className="p-2 text-sm font-semibold">{month}</td>
                    {WEEKDAY_ORDER.map(weekday => {
                      const hours = monthData[weekday] || 0;
                      const intensity = hours / maxHours;
                      const bgColor = `rgba(30, 215, 96, ${Math.max(intensity, 0.1)})`;
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
      </Card>
    </Section>
  );
}
