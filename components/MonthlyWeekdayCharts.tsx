'use client';

import { useMemo } from 'react';
import { CalendarDays, CalendarRange, Grid3x3, Sun } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Card, CardTitle } from '@/components/ui/Card';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import { Heatmap } from '@/components/charts/Heatmap';

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
  const sortedWeekdayHours = useMemo(
    () => [...weekdayHours].sort((a, b) => WEEKDAY_ORDER.indexOf(a.weekday) - WEEKDAY_ORDER.indexOf(b.weekday)),
    [weekdayHours]
  );

  const heatmapLookup = useMemo(() => {
    const map = new Map<string, number>();
    heatmapData.forEach(({ month, weekday, hours }) => map.set(`${month}|${weekday}`, hours));
    return map;
  }, [heatmapData]);

  return (
    <Section title="Monthly and weekday trends" icon={CalendarDays}>
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle icon={CalendarRange} subtitle="All selected years combined">
            Listening time per month
          </CardTitle>
          <SimpleBarChart data={monthlyHours} categoryKey="month" height={260} />
        </Card>

        <Card>
          <CardTitle icon={Sun} subtitle="Average listening on each weekday">
            By weekday
          </CardTitle>
          <SimpleBarChart
            data={sortedWeekdayHours}
            categoryKey="weekday"
            height={260}
            seriesName="Average per day"
            categoryTickFormatter={day => day.slice(0, 3)}
          />
        </Card>
      </div>

      <Card>
        <CardTitle
          icon={Grid3x3}
          subtitle="Total listening on each weekday of each month, all selected years combined. Hover a cell for the exact time."
        >
          Month vs. weekday
        </CardTitle>
        <Heatmap
          rows={MONTH_ORDER}
          cols={WEEKDAY_ORDER}
          colLabel={day => day.slice(0, 3)}
          value={(month, weekday) => heatmapLookup.get(`${month}|${weekday}`) || 0}
        />
      </Card>
    </Section>
  );
}
