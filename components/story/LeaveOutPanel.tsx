'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Play, X } from 'lucide-react';
import type { HideCandidate, StoryHideCandidates } from '@/lib/story';
import type { StoryHiddenState } from '@/lib/useStoryHidden';
import { formatDuration, type TimeUnit } from '@/lib/format';
import { SearchOption, SearchSelect } from '@/components/ui/SearchSelect';

interface LeaveOutPanelProps {
  year: number;
  candidates: StoryHideCandidates;
  hidden: StoryHiddenState;
  setArtistHidden: (artist: string, hidden: boolean, auto: boolean) => void;
  setTrackHidden: (key: string, hidden: boolean, auto: boolean) => void;
  unit: TimeUnit;
  onClose: () => void;
  /** Shown as the main button when the panel is opened before the story starts. */
  onPlay?: () => void;
}

/** How many auto-detected rows to show before "Show all". */
const AUTO_PREVIEW = 6;
/** Songs offered in the search (most listened first); typing narrows them. */
const MAX_SEARCH_TRACKS = 3000;

const splitTrackKey = (key: string) => {
  const [name, artist] = key.split('\u0000');
  return { name, artist: artist || null };
};

/**
 * "Leave out of story" (unwrapped_story_planning.md, Step E): auto-detected sleep/ambient sounds with
 * checkboxes, the viewer's own hidden artists and songs, and a search to hide more. Hidden listening still
 * counts toward the total time; it's just never named in the story.
 */
export function LeaveOutPanel({
  year,
  candidates,
  hidden,
  setArtistHidden,
  setTrackHidden,
  unit,
  onClose,
  onPlay,
}: LeaveOutPanelProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  // Parents pass a fresh onClose each render; read it through a ref so the focus effect runs only once.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [showAllAuto, setShowAllAuto] = useState(false);

  const autoArtistSet = useMemo(() => new Set(candidates.autoArtists.map(a => a.key)), [candidates]);
  const autoTrackSet = useMemo(() => new Set(candidates.autoTracks.map(t => t.key)), [candidates]);
  const artistHours = useMemo(() => new Map(candidates.artists.map(a => [a.key, a.hours])), [candidates]);
  const trackHours = useMemo(() => new Map(candidates.tracks.map(t => [t.key, t.hours])), [candidates]);

  // Esc closes; Tab stays inside; focus returns on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Let an open search dropdown close first.
        if ((e.target as Element | null)?.closest?.('[role="combobox"][aria-expanded="true"]')) return;
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, []);

  const searchOptions: SearchOption[] = useMemo(() => {
    const hiddenA = new Set(hidden.hiddenArtists);
    const hiddenT = new Set(hidden.hiddenTracks);
    const artists = candidates.artists
      .filter(a => !hiddenA.has(a.key) && !autoArtistSet.has(a.key))
      .map(a => ({ value: `a:${a.key}`, label: a.name, sublabel: 'Artist', meta: formatDuration(a.hours, unit) }));
    const tracks = candidates.tracks
      .filter(t => !hiddenT.has(t.key) && !autoTrackSet.has(t.key) && !(t.artist && hiddenA.has(t.artist)))
      .slice(0, MAX_SEARCH_TRACKS)
      .map(t => ({
        value: `t:${t.key}`,
        label: t.name,
        sublabel: t.artist ? `Song · ${t.artist}` : 'Song',
        meta: formatDuration(t.hours, unit),
        keywords: t.artist ?? undefined,
      }));
    return [...artists, ...tracks];
  }, [candidates, hidden, autoArtistSet, autoTrackSet, unit]);

  const onPick = (value: string) => {
    if (value.startsWith('a:')) setArtistHidden(value.slice(2), true, false);
    else if (value.startsWith('t:')) setTrackHidden(value.slice(2), true, false);
  };

  const shownA = new Set(hidden.shownArtists);
  const shownT = new Set(hidden.shownTracks);
  const autoRows: (HideCandidate & { kind: 'artist' | 'track' })[] = [
    ...candidates.autoArtists.map(a => ({ ...a, kind: 'artist' as const })),
    ...candidates.autoTracks.map(t => ({ ...t, kind: 'track' as const })),
  ].sort((a, b) => b.hours - a.hours);
  const visibleAutoRows = showAllAuto ? autoRows : autoRows.slice(0, AUTO_PREVIEW);
  const hasOwn = hidden.hiddenArtists.length + hidden.hiddenTracks.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="leave-out-title"
        tabIndex={-1}
        className="flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-spotify-border bg-spotify-dark shadow-2xl outline-none sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-spotify-border px-5 py-4">
          <div>
            <h2 id="leave-out-title" className="text-lg font-bold text-white">
              Leave out of your story
            </h2>
            <p className="mt-1 text-sm text-spotify-lightgray">
              Sleep sounds, rain, or anything you&apos;d rather not see named. Hidden listening still counts toward
              your total time. Private-session plays are always left out.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-spotify-lightgray transition-colors hover:bg-spotify-gray hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section>
            <SearchSelect
              options={searchOptions}
              value={null}
              onChange={onPick}
              ariaLabel="Search an artist or song to leave out"
              placeholder="Search an artist or song to leave out…"
            />
          </section>

          {hasOwn && (
            <section>
              <h3 className="mb-2 text-sm font-semibold text-white">Left out by you</h3>
              <ul className="space-y-1">
                {hidden.hiddenArtists.map(artist => (
                  <OwnRow
                    key={`a:${artist}`}
                    title={artist}
                    subtitle="Artist"
                    hours={artistHours.get(artist)}
                    unit={unit}
                    onRemove={() => setArtistHidden(artist, false, false)}
                  />
                ))}
                {hidden.hiddenTracks.map(key => {
                  const { name, artist } = splitTrackKey(key);
                  return (
                    <OwnRow
                      key={`t:${key}`}
                      title={name}
                      subtitle={artist ? `Song · ${artist}` : 'Song'}
                      hours={trackHours.get(key)}
                      unit={unit}
                      onRemove={() => setTrackHidden(key, false, false)}
                    />
                  );
                })}
              </ul>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold text-white">Sleep and ambient sounds found in {year}</h3>
            <p className="mb-2 mt-0.5 text-xs text-spotify-lightgray">Untick anything that&apos;s real music to you.</p>
            {autoRows.length === 0 ? (
              <p className="rounded-lg bg-spotify-highlight px-3 py-3 text-sm text-spotify-lightgray">
                Nothing found automatically. Use the search to leave something out.
              </p>
            ) : (
              <>
                <ul className="space-y-1">
                  {visibleAutoRows.map(row => {
                    const checked = row.kind === 'artist' ? !shownA.has(row.key) : !shownT.has(row.key);
                    const id = `leave-out-${row.kind}-${row.key}`;
                    return (
                      <li key={`${row.kind}:${row.key}`}>
                        <label
                          htmlFor={id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-spotify-highlight"
                        >
                          <input
                            id={id}
                            type="checkbox"
                            checked={checked}
                            onChange={e =>
                              row.kind === 'artist'
                                ? setArtistHidden(row.key, e.target.checked, true)
                                : setTrackHidden(row.key, e.target.checked, true)
                            }
                            className="h-4 w-4 shrink-0"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-white">{row.name}</span>
                            <span className="block truncate text-xs text-spotify-lightgray">
                              {row.kind === 'artist' ? 'Artist' : `Song${row.artist ? ` · ${row.artist}` : ''}`}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-spotify-lightgray">
                            {formatDuration(row.hours, unit)}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                {autoRows.length > AUTO_PREVIEW && (
                  <button
                    type="button"
                    onClick={() => setShowAllAuto(v => !v)}
                    className="mt-2 px-2 text-sm font-semibold text-spotify-lightgray transition-colors hover:text-white"
                  >
                    {showAllAuto ? 'Show fewer' : `Show all ${autoRows.length}`}
                  </button>
                )}
              </>
            )}
          </section>

          <p className="text-xs text-spotify-muted">Your choices are saved in this browser only and apply to every year.</p>
        </div>

        <div className="flex justify-end gap-2 border-t border-spotify-border px-5 py-4">
          {onPlay ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-spotify-gray"
              >
                Done
              </button>
              <button
                type="button"
                onClick={onPlay}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition-transform hover:scale-[1.03]"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden />
                Play your {year} story
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition-transform hover:scale-[1.03]"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function OwnRow({
  title,
  subtitle,
  hours,
  unit,
  onRemove,
}: {
  title: string;
  subtitle: string;
  hours: number | undefined;
  unit: TimeUnit;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-spotify-highlight">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-white">{title}</span>
        <span className="block truncate text-xs text-spotify-lightgray">{subtitle}</span>
      </span>
      {hours !== undefined && (
        <span className="shrink-0 text-xs tabular-nums text-spotify-lightgray">{formatDuration(hours, unit)}</span>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Put ${title} back into the story`}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-spotify-lightgray transition-colors hover:bg-spotify-gray hover:text-white"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </li>
  );
}
