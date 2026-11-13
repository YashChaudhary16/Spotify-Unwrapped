import type { ReactNode } from 'react';

/** One full-screen card in the story player. */
export interface StoryCard {
  /** Stable id, e.g. "intro", "top-artist". */
  id: string;
  /** Short text announced to screen readers when the card appears, e.g. "Your top artist: Hans Zimmer". */
  label: string;
  /** How long the card stays before auto-advancing (ms). */
  durationMs?: number;
  /** Card background (any CSS background value). */
  background?: string;
  /** Image URLs to preload while the previous card is showing. */
  preload?: string[];
  /**
   * Song whose 30-second preview plays behind this card. Undefined keeps the previous card's song playing,
   * so number cards don't interrupt the music.
   */
  audioTrackId?: string | null;
  content: ReactNode;
}

export const DEFAULT_CARD_MS = 7000;
