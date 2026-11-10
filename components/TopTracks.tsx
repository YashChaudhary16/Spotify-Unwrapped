'use client';

import { Music } from 'lucide-react';
import { TopTrack } from '@/lib/analytics';
import { formatDuration } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { Section } from '@/components/ui/Section';

interface TopTracksProps {
  tracks: TopTrack[];
}

export default function TopTracks({ tracks }: TopTracksProps) {
  const { unit } = useTimeUnit();

  return (
    <Section title="Top tracks" icon={Music}>
      <div className="space-y-3">
        {tracks.map((track, idx) => (
          <div
            key={`${track.track}-${idx}`}
            className="flex flex-col gap-4 rounded-xl border border-spotify-border bg-spotify-dark p-4 transition-colors hover:bg-spotify-highlight md:flex-row md:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="w-6 shrink-0 text-right text-lg font-semibold tabular-nums text-spotify-lightgray">
                {idx + 1}
              </span>
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-white">{track.track}</div>
                <div className="truncate text-sm text-spotify-lightgray">
                  {track.artist ? `${track.artist} · ` : ''}
                  <span className="tabular-nums">{formatDuration(track.hours, unit)}</span>
                </div>
              </div>
            </div>
            {track.trackId && (
              <iframe
                title={`Play ${track.track} on Spotify`}
                src={`https://open.spotify.com/embed/track/${track.trackId}`}
                height="80"
                frameBorder="0"
                allow="encrypted-media"
                className="w-full shrink-0 rounded-xl md:w-[320px]"
                style={{ background: '#181818' }}
              />
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
