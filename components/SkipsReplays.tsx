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
          <div className="space-y-2">
            {skippedTracks.length > 0 ? (
              skippedTracks.map((track, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 rounded-md bg-spotify-highlight p-3">
                  <span className="truncate">{track.track}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-white">{formatNumber(track.count)} skips</span>
                </div>
              ))
            ) : (
              <p className="text-spotify-lightgray">No skipped tracks found</p>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle icon={Repeat} subtitle="Tracks you let play the longest">
            Most played without skipping
          </CardTitle>
          <div className="space-y-2">
            {topPlayedTracks.length > 0 ? (
              topPlayedTracks.map((track, idx) => (
                <div key={idx} className="flex items-center justify-between gap-4 rounded-md bg-spotify-highlight p-3">
                  <span className="truncate">{track.track}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-white">{formatDuration(track.hours, unit)}</span>
                </div>
              ))
            ) : (
              <p className="text-spotify-lightgray">No data available</p>
            )}
          </div>
        </Card>
      </div>
    </Section>
  );
}
