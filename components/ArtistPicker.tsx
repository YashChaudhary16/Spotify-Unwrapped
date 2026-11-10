'use client';

import { MicVocal } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { SearchOption, SearchSelect } from '@/components/ui/SearchSelect';

interface ArtistPickerProps {
  options: SearchOption[];
  onSelect: (artist: string) => void;
  /** Shown above the picker, e.g. when the chosen artist has no plays in the selected years. */
  notice?: React.ReactNode;
}

/** Artist tab before an artist is chosen: a search box plus your top artists as quick picks. */
export default function ArtistPicker({ options, onSelect, notice }: ArtistPickerProps) {
  const quickPicks = options.slice(0, 12);

  return (
    <Section title="Artists" icon={MicVocal} subtitle="Pick an artist to open their page">
      {notice && (
        <div className="mb-4 rounded-xl border border-spotify-border bg-spotify-dark p-4 text-sm text-spotify-lightgray">
          {notice}
        </div>
      )}

      <SearchSelect
        ariaLabel="Search artists"
        placeholder={`Search ${options.length.toLocaleString()} artists`}
        options={options}
        value={null}
        onChange={onSelect}
        className="mb-8 max-w-xl"
      />

      {quickPicks.length > 0 && (
        <>
          <h3 className="mb-3 text-sm font-semibold text-spotify-lightgray">Your top artists</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quickPicks.map((artist, idx) => (
              <button
                key={artist.value}
                type="button"
                onClick={() => onSelect(artist.value)}
                className="flex items-center gap-3 rounded-xl border border-spotify-border bg-spotify-dark p-3 text-left transition-colors hover:bg-spotify-highlight"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-spotify-gray text-sm font-bold tabular-nums text-spotify-lightgray">
                  {idx + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-white">{artist.label}</span>
                  {artist.meta && <span className="block text-xs tabular-nums text-spotify-lightgray">{artist.meta}</span>}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}
