'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPreviewUrl, getStoryAudio, readSoundOn, unlockStoryAudio, writeSoundOn } from '@/lib/storyAudio';
import type { StoryCard } from './types';

const FADE_MS = 350;
const VOLUME = 0.8;

/** The song for card `index`: its own, or the nearest earlier card's (undefined means "keep playing"). */
function songFor(cards: StoryCard[], index: number): string | null {
  for (let i = index; i >= 0; i--) {
    const id = cards[i]?.audioTrackId;
    if (id !== undefined) return id;
  }
  return null;
}

/** Ramps the volume (no-op on iOS, where volume is read-only; the switch is then just immediate). */
function fade(audio: HTMLAudioElement, to: number, done?: () => void): () => void {
  const from = audio.volume;
  const start = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    const t = Math.min((now - start) / FADE_MS, 1);
    audio.volume = from + (to - from) * t;
    if (t < 1) frame = requestAnimationFrame(tick);
    else done?.();
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

/**
 * Plays each card's 30-second preview behind the story. Pauses with the story, cross-fades between songs,
 * keeps the same song playing across cards, and stops on close. Returns the sound toggle state.
 */
export function useStoryAudio(cards: StoryCard[], index: number, paused: boolean) {
  const [soundOn, setSoundOn] = useState(true);
  /** The browser refused to start sound without a tap. */
  const [blocked, setBlocked] = useState(false);
  const currentUrl = useRef<string | null>(null);
  const song = songFor(cards, index);

  useEffect(() => setSoundOn(readSoundOn()), []);

  const tryPlay = useCallback((audio: HTMLAudioElement) => {
    audio.play().then(
      () => setBlocked(false),
      (err: unknown) => {
        if (err instanceof DOMException && err.name === 'NotAllowedError') setBlocked(true);
      }
    );
  }, []);

  // Switch songs when the card's song changes.
  useEffect(() => {
    const audio = getStoryAudio();
    if (!audio) return;
    let cancelled = false;
    let stopFade: (() => void) | undefined;

    if (!soundOn || !song) {
      stopFade = fade(audio, 0, () => audio.pause());
      currentUrl.current = null;
      return () => stopFade?.();
    }

    fetchPreviewUrl(song).then(url => {
      if (cancelled) return;
      if (!url) return; // no preview: keep whatever is playing
      if (url === currentUrl.current) return;
      const start = () => {
        if (cancelled) return;
        audio.src = url;
        audio.currentTime = 0;
        audio.volume = 0;
        currentUrl.current = url;
        if (!paused) tryPlay(audio);
        stopFade = fade(audio, VOLUME);
      };
      if (currentUrl.current && !audio.paused) stopFade = fade(audio, 0, start);
      else start();
    });

    return () => {
      cancelled = true;
      stopFade?.();
    };
    // `paused` is handled by the effect below; re-running this one on pause would restart the song.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song, soundOn, tryPlay]);

  // Pause and resume with the story.
  useEffect(() => {
    const audio = getStoryAudio();
    if (!audio || !currentUrl.current || !soundOn) return;
    if (paused) audio.pause();
    else tryPlay(audio);
  }, [paused, soundOn, tryPlay]);

  // Stop when the story closes.
  useEffect(
    () => () => {
      const audio = getStoryAudio();
      if (!audio) return;
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      currentUrl.current = null;
    },
    []
  );

  /** Called from the speaker button (a tap, so browsers allow sound to start here). */
  const toggleSound = useCallback(() => {
    const audio = getStoryAudio();
    if (blocked) {
      // Sound was meant to be on; this tap is the permission the browser wanted.
      setBlocked(false);
      if (audio && currentUrl.current) tryPlay(audio);
      return;
    }
    setSoundOn(on => {
      const next = !on;
      writeSoundOn(next);
      if (next) {
        writeSoundOn(true); // so unlockStoryAudio sees it
        if (audio && currentUrl.current) tryPlay(audio);
        else unlockStoryAudio(); // the next song can then start without another tap
      }
      return next;
    });
  }, [blocked, tryPlay]);

  return { soundOn: soundOn && !blocked, blocked, toggleSound };
}
