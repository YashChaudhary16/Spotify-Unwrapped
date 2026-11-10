'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Shuffle, WifiOff, type LucideIcon } from 'lucide-react';
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

export default function ShuffleOfflineCharts({ shuffleStats, offlineStats }: ShuffleOfflineChartsProps) {
  return (
    <Section title="Playback" icon={Activity} subtitle="Share of all plays">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SplitDonut
          title="Shuffle"
          icon={Shuffle}
          data={[
            { name: 'Shuffled', value: shuffleStats.shuffled },
            { name: 'In order', value: shuffleStats.notShuffled },
          ]}
        />
        <SplitDonut
          title="Offline vs online"
          icon={WifiOff}
          data={[
            { name: 'Offline', value: offlineStats.offline },
            { name: 'Online', value: offlineStats.online },
          ]}
        />
      </div>
    </Section>
  );
}

/** Two-part donut: the first slice is the headline (green, % in the center), the second is the rest. */
function SplitDonut({
  title,
  icon,
  data,
}: {
  title: string;
  icon: LucideIcon;
  data: [{ name: string; value: number }, { name: string; value: number }];
}) {
  const total = data[0].value + data[1].value;
  const share = (v: number) => (total > 0 ? v / total : 0);

  return (
    <Card>
      <CardTitle icon={icon}>{title}</CardTitle>
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="72%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                stroke={CHART_COLORS.surface}
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip
                wrapperStyle={{ zIndex: 10 }}
                content={<ChartTooltip valueFormatter={v => `${formatNumber(v)} plays · ${formatPercent(share(v))}`} />}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold tabular-nums text-white">{formatPercent(share(data[0].value))}</span>
            <span className="text-xs text-spotify-lightgray">{data[0].name.toLowerCase()}</span>
          </div>
        </div>

        <ul className="w-full space-y-3">
          {data.map((entry, index) => (
            <li key={entry.name} className="flex items-center gap-3">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: COLORS[index] }} aria-hidden />
              <span className="text-white">{entry.name}</span>
              <span className="ml-auto text-right tabular-nums">
                <span className="font-semibold text-white">{formatPercent(share(entry.value))}</span>
                <span className="block text-xs text-spotify-lightgray">{formatNumber(entry.value)} plays</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
