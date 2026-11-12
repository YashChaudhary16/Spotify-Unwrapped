'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { StoryOptions } from './story';

/**
 * The viewer's "Leave out of story" choices, remembered in this browser only (never sent anywhere).
 * They apply to every year's story. Storage can be unavailable (private windows, blocked site data), so
 * every read and write is guarded and the story still works without it.
 */
export interface StoryHiddenState {
  hiddenArtists: string[];
  /** `storyTrackKey(track, artist)` */
  hiddenTracks: string[];
  /** Auto-detected ambient artists / songs put back into the story. */
  shownArtists: string[];
  shownTracks: string[];
}

const STORAGE_KEY = 'unwrapped.story.leaveOut.v1';
const EMPTY: StoryHiddenState = { hiddenArtists: [], hiddenTracks: [], shownArtists: [], shownTracks: [] };

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

function read(): StoryHiddenState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return {
      hiddenArtists: strings(parsed?.hiddenArtists),
      hiddenTracks: strings(parsed?.hiddenTracks),
      shownArtists: strings(parsed?.shownArtists),
      shownTracks: strings(parsed?.shownTracks),
    };
  } catch {
    return EMPTY;
  }
}

function write(state: StoryHiddenState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: the choice still applies until the page closes */
  }
}

const without = (list: string[], item: string) => list.filter(x => x !== item);
const withItem = (list: string[], item: string) => (list.includes(item) ? list : [...list, item]);

export function useStoryHidden() {
  const [state, setState] = useState<StoryHiddenState>(EMPTY);

  // Read after mount (localStorage doesn't exist during the server render).
  useEffect(() => setState(read()), []);

  const update = useCallback((change: (s: StoryHiddenState) => StoryHiddenState) => {
    setState(prev => {
      const next = change(prev);
      write(next);
      return next;
    });
  }, []);

  /** Hide (true) or show (false) an artist or song. `auto` = it's auto-detected as ambient. */
  const setArtistHidden = useCallback(
    (artist: string, hidden: boolean, auto: boolean) =>
      update(s => ({
        ...s,
        hiddenArtists: hidden && !auto ? withItem(s.hiddenArtists, artist) : without(s.hiddenArtists, artist),
        shownArtists: !hidden && auto ? withItem(s.shownArtists, artist) : without(s.shownArtists, artist),
      })),
    [update]
  );

  const setTrackHidden = useCallback(
    (key: string, hidden: boolean, auto: boolean) =>
      update(s => ({
        ...s,
        hiddenTracks: hidden && !auto ? withItem(s.hiddenTracks, key) : without(s.hiddenTracks, key),
        shownTracks: !hidden && auto ? withItem(s.shownTracks, key) : without(s.shownTracks, key),
      })),
    [update]
  );

  const options: StoryOptions = useMemo(
    () => ({
      hiddenArtists: state.hiddenArtists,
      hiddenTracks: state.hiddenTracks,
      shownArtists: state.shownArtists,
      shownTracks: state.shownTracks,
    }),
    [state]
  );

  return { state, options, setArtistHidden, setTrackHidden };
}
