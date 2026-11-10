'use client';

import { Repeat, SkipForward } from 'lucide-react';
import { formatDuration, formatNumber } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { Card, CardTitle } from '@/components/ui/Card';

interface SkipsReplaysProps {
  skippedTracks: { track: string; count: number }[];
  topPlayedTracks: { track: string; hours: number }[];
}

export default function SkipsReplays({ skippedTracks, topPlayedTracks }: SkipsReplaysProps) {
  const { unit } = useTimeUnit();
  const totalSkips = skippedTracks.reduce((sum, t) => sum + t.count, 0);

  return (
    <Section title="Skips and replays" icon={SkipForward}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardTitle icon={SkipForward} subtitle={`${formatNumber(totalSkips)} skips across these tracks`}>
            Most skipped
          </CardTitle>
          <RankedList
            empty="No skipped tracks found"
            rows={skippedTracks.map(t => ({ label: t.track, value: `${formatNumber(t.count)} skips` }))}
          />
        </Card>

        <Card>
          <CardTitle icon={Repeat} subtitle="Tracks you let play the longest">
            Most played without skipping
          </CardTitle>
          <RankedList
            empty="No data available"
            rows={topPlayedTracks.map(t => ({ label: t.track, value: formatDuration(t.hours, unit) }))}
          />
        </Card>
      </div>
    </Section>
  );
}

function RankedList({ rows, empty }: { rows: { label: string; value: string }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-spotify-lightgray">{empty}</p>;
  return (
    <ol className="space-y-1">
      {rows.map((row, idx) => (
        <li
          key={idx}
          className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-spotify-highlight"
        >
          <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-spotify-lightgray">
            {idx + 1}
          </span>
          <span className="min-w-0 flex-1 truncate text-white" title={row.label}>
            {row.label}
          </span>
          <span className="shrink-0 text-sm font-semibold tabular-nums text-white">{row.value}</span>
        </li>
      ))}
    </ol>
  );
}
