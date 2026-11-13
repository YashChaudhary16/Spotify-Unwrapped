'use client';

/**
 * Background music for the story (user decision 2026-11-12: sound on by default, with a mute button).
 *
 * One shared <audio> element. Browsers (Safari especially) only allow sound that starts inside a tap or
 * click, so `unlockStoryAudio()` is called from the "Play your story" click: it plays a silent clip on the
 * element, after which the story can switch it to real previews. If a browser still blocks it, the player
 * shows "Tap for sound".
 *
 * Preview clips are Spotify's 30-second previews (p.scdn.co), found through /api/spotify/preview, which
 * reads the track's public embed page. Only public track IDs are sent; nothing about the listening history.
 */

/** 44-byte WAV with no samples: enough to unlock an audio element. */
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
const SOUND_KEY = 'unwrapped.story.sound';

let element: HTMLAudioElement | null = null;

export function getStoryAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!element) {
    element = new Audio();
    element.preload = 'auto';
    element.loop = true;
  }
  return element;
}

/** Call synchronously inside the click that opens the story. */
export function unlockStoryAudio(): void {
  const audio = getStoryAudio();
  if (!audio || !readSoundOn()) return;
  try {
    audio.src = SILENCE;
    audio.play().catch(() => {
      /* still blocked: the player offers "Tap for sound" */
    });
  } catch {
    /* ignore */
  }
}

const previewCache = new Map<string, Promise<string | null>>();

/** URL of a track's 30-second preview, or null if it has none (or the lookup fails). */
export function fetchPreviewUrl(trackId: string): Promise<string | null> {
  let promise = previewCache.get(trackId);
  if (!promise) {
    promise = fetch(`/api/spotify/preview?trackId=${encodeURIComponent(trackId)}`)
      .then(res => (res.ok ? (res.json() as Promise<{ url: string | null }>) : { url: null }))
      .then(json => (typeof json.url === 'string' ? json.url : null))
      .catch(() => null);
    previewCache.set(trackId, promise);
  }
  return promise;
}

/** Sound is on unless the viewer turned it off before (remembered in this browser). */
export function readSoundOn(): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function writeSoundOn(on: boolean): void {
  try {
    window.localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}
