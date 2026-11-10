'use client';

import { differenceInCalendarDays, parseISO } from 'date-fns';
import { Flag, Flame, PartyPopper, Sun, Trophy } from 'lucide-react';
import { Analytics } from '@/lib/analytics';
import MostListenedTrack from './MostListenedTrack';
import { formatDate, formatDuration, formatNumber } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { Card, CardTitle } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';

interface StreaksMilestonesProps {
  longestStreak: { days: number; start: string; end: string };
  maxDay: { date: string; hours: number };
  firstSong: { track: string; artist: string; date: string };
  milestones: { hours: number; date: string }[];
  mostListenedTrack: Analytics['mostListenedTrack'];
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
          value={`${formatNumber(longestStreak.days)} days`}
          detail={`${formatDate(longestStreak.start)} → ${formatDate(longestStreak.end)}`}
        />
        <StatCard
          icon={Sun}
          label="Biggest listening day"
          value={formatDuration(maxDay.hours, unit)}
          detail={formatDate(maxDay.date, 'EEEE, MMM d, yyyy')}
        />
        <StatCard
          icon={Flag}
          label="First song played"
          size="md"
          value={<span className="line-clamp-2">{firstSong.track}</span>}
          detail={`${firstSong.artist} · ${formatDate(firstSong.date)}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardTitle icon={PartyPopper} subtitle="When your total listening crossed each mark">
            Listening milestones
          </CardTitle>
          {milestones.length === 0 ? (
            <p className="text-spotify-lightgray">No milestones reached yet.</p>
          ) : (
            <ol className="relative ml-1.5 border-l border-spotify-border">
              {milestones.map((milestone, idx) => {
                const prev = milestones[idx - 1];
                const gap = prev
                  ? differenceInCalendarDays(parseISO(milestone.date), parseISO(prev.date))
                  : null;
                const latest = idx === milestones.length - 1;
                return (
                  <li key={milestone.hours} className="relative pb-5 pl-6 last:pb-0">
                    <span
                      className={`absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-spotify-dark ${
                        latest ? 'bg-spotify-green' : 'bg-spotify-muted'
                      }`}
                      aria-hidden
                    />
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <span className="font-semibold text-white">{formatDuration(milestone.hours, unit)}</span>
                      <span className="text-sm tabular-nums text-spotify-lightgray">{formatDate(milestone.date)}</span>
                    </div>
                    {gap !== null && (
                      <p className="text-xs text-spotify-muted">
                        {formatNumber(gap)} {gap === 1 ? 'day' : 'days'} after the previous milestone
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <MostListenedTrack track={mostListenedTrack} />
      </div>
    </Section>
  );
}
