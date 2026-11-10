'use client';

import { CalendarCheck, Flag, Flame, Music, PartyPopper, Sun, Trophy } from 'lucide-react';
import { formatDate, formatDuration } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { Card, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';

interface StreaksMilestonesProps {
  longestStreak: { days: number; start: string; end: string };
  maxDay: { date: string; hours: number };
  firstSong: { track: string; artist: string; date: string };
  milestones: { hours: number; date: string }[];
  mostListenedTrack: { track: string; hours: number; date: string };
}

export default function StreaksMilestones({
  longestStreak,
  maxDay,
  firstSong,
  milestones,
  mostListenedTrack,
}: StreaksMilestonesProps) {
  const { unit } = useTimeUnit();

  return (
    <Section title="Streaks and milestones" icon={Trophy}>
      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          icon={Flame}
          label="Longest listening streak"
          value={`${longestStreak.days} days`}
          detail={`${formatDate(longestStreak.start)} → ${formatDate(longestStreak.end)}`}
        />
        <StatCard
          icon={Sun}
          label="Biggest listening day"
          value={formatDuration(maxDay.hours, unit)}
          detail={formatDate(maxDay.date)}
        />
        <StatCard
          icon={Flag}
          label="First song played"
          size="md"
          value={firstSong.track}
          detail={`${firstSong.artist} · ${formatDate(firstSong.date)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardTitle icon={PartyPopper}>Listening milestones</CardTitle>
          <div className="space-y-2">
            {milestones.map((milestone, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 rounded-md bg-spotify-highlight p-3">
                <span className="font-semibold text-white">Crossed {formatDuration(milestone.hours, unit)}</span>
                <span className="tabular-nums text-spotify-lightgray">{formatDate(milestone.date)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle icon={Music}>Most listened track</CardTitle>
          <p className="text-xl font-bold text-white">{mostListenedTrack.track}</p>
          <p className="mt-1 tabular-nums text-spotify-lightgray">{formatDuration(mostListenedTrack.hours, unit)} total</p>
          <p className="mt-4 flex items-center gap-2 text-sm text-spotify-lightgray">
            <CalendarCheck className="h-4 w-4" aria-hidden />
            Top day: {formatDate(mostListenedTrack.date)}
          </p>
        </Card>
      </div>
    </Section>
  );
}
