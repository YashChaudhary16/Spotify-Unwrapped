/**
 * Story card colors (user decision 2026-11-12: **hybrid**).
 * - Number cards (intro, total time, on repeat, year over year, personality, …) use **bold, flat color blocks**
 *   with a simple shape, Wrapped-style. Each sets its own ink (text) color for contrast.
 * - Artwork cards (top artist, songs, album, comeback, discoveries, summary) use a **dark tone that switches to
 *   the cover's / artist's color** once loaded, so the art leads.
 *
 * Contrast (WCAG, computed 2026-11-12), full ink / 75% ink blended over the block:
 *   electric 6.9 / 4.5 · hotpink 6.9 / 5.1 · lime 16.4 / 9.1 · tangerine 7.3 / 5.4 · sky 11.2 / 7.1 ·
 *   plum 10.7 / 6.6 · sun 14.5 / 8.4 · crimson 7.6 / 4.7.
 * So on story cards, secondary text uses **at least 75% ink** (`text-ink/75`); 60% fails on most blocks.
 */

/** Ink as "r g b" for the `--story-ink` CSS variable (Tailwind color `ink`). */
const WHITE = '255 255 255';
const BLACK = '0 0 0';

export const BOLD_TONES = {
  electric: { bg: '#3D2EFF', shape: '#7466FF', ink: WHITE },
  hotpink: { bg: '#FF4FA3', shape: '#FF92C6', ink: BLACK },
  lime: { bg: '#C6F432', shape: '#E3FF8C', ink: BLACK },
  tangerine: { bg: '#FF6A2B', shape: '#FFA072', ink: BLACK },
  sky: { bg: '#5FC8FF', shape: '#A8E2FF', ink: BLACK },
  plum: { bg: '#5B1A8C', shape: '#8840C2', ink: WHITE },
  sun: { bg: '#FFD23F', shape: '#FFE78F', ink: BLACK },
  crimson: { bg: '#A8102F', shape: '#CF3352', ink: WHITE },
} as const;

export const DARK_TONES = {
  violet: 'linear-gradient(165deg, #3b2a6b 0%, #1d1536 45%, #121212 100%)',
  green: 'linear-gradient(165deg, #1f5a3a 0%, #13301f 45%, #121212 100%)',
  blue: 'linear-gradient(165deg, #1f3f6b 0%, #142640 45%, #121212 100%)',
  rose: 'linear-gradient(165deg, #6b2a45 0%, #36152a 45%, #121212 100%)',
  amber: 'linear-gradient(165deg, #6b4a1f 0%, #362612 45%, #121212 100%)',
} as const;

export type BoldTone = keyof typeof BOLD_TONES;
export type DarkTone = keyof typeof DARK_TONES;
export type StoryShape = 'circles' | 'arch' | 'stripes' | 'blob';

export const INK_WHITE = WHITE;

/** Background from an artwork color (CSS rgb()), fading into the page color. */
export const tintBackground = (color: string) => `linear-gradient(170deg, ${color} 0%, ${color} 18%, #121212 100%)`;
