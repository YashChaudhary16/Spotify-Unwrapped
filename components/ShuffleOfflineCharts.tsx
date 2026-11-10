'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Shuffle, WifiOff } from 'lucide-react';
import { CHART_COLORS } from '@/lib/chartTheme';
import { formatNumber, formatPercent } from '@/lib/format';
import { Section } from '@/components/ui/Section';
import { Card, CardTitle } from '@/components/ui/Card';
import { ChartTooltip } from '@/components/ui/ChartTooltip';

interface ShuffleOfflineChartsProps {
  shuffleStats: { shuffled: number; notShuffled: number };
  offlineStats: { offline: number; online: number };
}

// Green = the measured part, gray = the rest. Gray passes 3:1 contrast on the card surface.
const COLORS = [CHART_COLORS.accent, CHART_COLORS.neutral];

// TODO(Step 2): convert to donuts with the main percentage in the center.
export default function ShuffleOfflineCharts({ shuffleStats, offlineStats }: ShuffleOfflineChartsProps) {
  const shuffleData = [
    { name: 'Shuffled', value: shuffleStats.shuffled },
    { name: 'Not shuffled', value: shuffleStats.notShuffled },
  ];

  const offlineData = [
    { name: 'Offline', value: offlineStats.offline },
    { name: 'Online', value: offlineStats.online },
  ];

  return (
    <Section title="Playback" icon={Activity} subtitle="Share of plays">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SplitPie title="Shuffle" icon={Shuffle} data={shuffleData} />
        <SplitPie title="Offline vs online" icon={WifiOff} data={offlineData} />
      </div>
    </Section>
  );
}

function SplitPie({
  title,
  icon,
  data,
}: {
  title: string;
  icon: typeof Shuffle;
  data: { name: string; value: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;

  return (
    <Card>
      <CardTitle icon={icon}>{title}</CardTitle>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent, x, y, textAnchor }) => (
              <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fill="#FFFFFF" fontSize={13}>
                {`${name}: ${formatPercent(percent)}`}
              </text>
            )}
            outerRadius={80}
            dataKey="value"
            stroke={CHART_COLORS.surface}
            strokeWidth={2}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={
              <ChartTooltip
                valueFormatter={v => `${formatNumber(v)} plays · ${formatPercent(v / total)}`}
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
