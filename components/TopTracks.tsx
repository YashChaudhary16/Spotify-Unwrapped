'use client';

import { Music } from 'lucide-react';
import { TopTrack } from '@/lib/analytics';
import { formatDuration } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';
import { LazySpotifyEmbed } from '@/components/ui/LazySpotifyEmbed';

interface TopTracksProps {
  tracks: TopTrack[];
}

export default function TopTracks({ tracks }: TopTracksProps) {
  const { unit } = useTimeUnit();
  const maxHours = tracks[0]?.hours || 1;

  return (
    <Section title="Top tracks" icon={Music} subtitle="Ranked by total listening time">
      <ol className="space-y-3">
        {tracks.map((track, idx) => (
          <li
            key={`${track.track}-${idx}`}
            className="flex flex-col gap-4 rounded-xl border border-spotify-border bg-spotify-dark p-4 transition-colors hover:bg-spotify-highlight md:flex-row md:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="w-6 shrink-0 text-right text-lg font-semibold tabular-nums text-spotify-lightgray">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-white" title={track.track}>
                  {track.track}
                </div>
                <div className="truncate text-sm text-spotify-lightgray">
                  {track.artist ? `${track.artist} · ` : ''}
                  <span className="tabular-nums">{formatDuration(track.hours, unit)}</span>
                </div>
                {/* Share of the #1 track's listening time */}
                <div className="mt-2 h-1 max-w-xs overflow-hidden rounded-full bg-spotify-gray" aria-hidden>
                  <div
                    className="h-full rounded-full bg-spotify-green"
                    style={{ width: `${Math.max((track.hours / maxHours) * 100, 2)}%` }}
                  />
                </div>
              </div>
            </div>
            {track.trackId && (
              <LazySpotifyEmbed
                trackId={track.trackId}
                title={`Play ${track.track} on Spotify`}
                className="w-full shrink-0 md:w-[320px]"
              />
            )}
          </li>
        ))}
      </ol>
    </Section>
  );
}
