'use client';

import type { StoryData, StoryTrack } from './story';
import { formatDuration, type TimeUnit } from './format';
import { getSpotifyArtwork } from './useSpotifyArtwork';
import { SITE_HOST } from './site';

/**
 * Share image for a story year (unwrapped_story_planning.md, Step I; user decision 2026-11-12: **bold poster**
 * with the site address in the footer). Drawn on a <canvas> in the browser: nothing is uploaded. Cover art
 * comes from Spotify's CDN, which allows cross-origin reads, so the canvas can be exported.
 */

export type ShareFormat = 'story' | 'square';

export interface ShareTone {
  bg: string;
  shape: string;
  /** "r g b" */
  ink: string;
}

export interface ShareOptions {
  format: ShareFormat;
  tone: ShareTone;
  unit: TimeUnit;
  showTime: boolean;
  showPersonality: boolean;
}

export const SHARE_SIZES: Record<ShareFormat, { width: number; height: number }> = {
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

async function coverFor(track: StoryTrack): Promise<HTMLImageElement | null> {
  if (!track.trackId) return null;
  try {
    const art = await getSpotifyArtwork(track.trackId);
    return art ? await loadImage(art.imageUrl) : null;
  } catch {
    return null;
  }
}

/** The page's Figtree family name (next/font generates it), loaded at the weights we draw with. */
async function fontFamily(): Promise<string> {
  const family = getComputedStyle(document.body).fontFamily || 'sans-serif';
  try {
    await Promise.all([
      document.fonts.load(`800 100px ${family}`),
      document.fonts.load(`700 40px ${family}`),
      document.fonts.load(`600 30px ${family}`),
    ]);
    await document.fonts.ready;
  } catch {
    /* draw with whatever is available */
  }
  return family;
}

/** Fits text on one line, ending with "…" if it's too wide. */
function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (ctx.measureText(`${text.slice(0, mid).trimEnd()}…`).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return `${text.slice(0, lo).trimEnd()}…`;
}

/** Wraps text into at most `maxLines` lines (the last one ellipsized). */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  // Split on plain spaces only, so non-breaking spaces (e.g. "124\u00a0days") keep a number with its unit.
  const words = text.split(/ +/);
  const lines: string[] = [];
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(next).width <= maxWidth || !line) {
      line = next;
    } else {
      lines.push(line);
      line = words[i];
      if (lines.length === maxLines - 1) {
        line = words.slice(i).join(' ');
        break;
      }
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines).map((l, i, all) => (i === all.length - 1 ? ellipsize(ctx, l, maxWidth) : l));
}

const rgba = (ink: string, alpha: number) => `rgba(${ink.split(' ').join(', ')}, ${alpha})`;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** One song tile: cover (cropped to a square) with a rank badge and the name on a dark strip. */
function drawTile(
  ctx: CanvasRenderingContext2D,
  font: string,
  tone: ShareTone,
  track: StoryTrack,
  rank: number,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  size: number
) {
  ctx.save();
  roundedRect(ctx, x, y, size, size, size * 0.04);
  ctx.clip();
  if (img) {
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, x, y, size, size);
  } else {
    // No cover (sample data, unavailable track): a tile in the shape color.
    ctx.fillStyle = tone.shape;
    ctx.fillRect(x, y, size, size);
  }
  // Name strip
  const strip = size * 0.26;
  const grad = ctx.createLinearGradient(0, y + size - strip * 1.6, 0, y + size);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y + size - strip * 1.6, size, strip * 1.6);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `700 ${Math.round(size * 0.075)}px ${font}`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(ellipsize(ctx, track.track, size * 0.88), x + size * 0.06, y + size - size * 0.07);
  ctx.restore();

  // Rank badge
  const r = size * 0.085;
  const cx = x + size * 0.06 + r;
  const cy = y + size * 0.06 + r;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  // Ink-colored badge with the number in the block color: visible on covers and on empty tiles alike.
  ctx.fillStyle = rgba(tone.ink, 1);
  ctx.fill();
  ctx.fillStyle = tone.bg;
  ctx.font = `800 ${Math.round(r * 1.05)}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(rank), cx, cy + r * 0.05);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** A label + value pair; returns the y below it. */
function drawStat(
  ctx: CanvasRenderingContext2D,
  font: string,
  ink: string,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  valueSize: number,
  maxLines = 1
): number {
  ctx.fillStyle = rgba(ink, 0.75);
  ctx.font = `600 ${Math.round(valueSize * 0.5)}px ${font}`;
  ctx.fillText(label, x, y);
  ctx.fillStyle = rgba(ink, 1);
  ctx.font = `800 ${valueSize}px ${font}`;
  const lines = wrap(ctx, value, width, maxLines);
  let ly = y + valueSize * 1.15;
  for (const line of lines) {
    ctx.fillText(line, x, ly);
    ly += valueSize * 1.08;
  }
  return ly;
}

/** Draws the poster and returns it as a PNG blob. */
export async function renderShareImage(story: StoryData, options: ShareOptions): Promise<Blob> {
  const { width, height } = SHARE_SIZES[options.format];
  const { tone } = options;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available');

  const songs = story.topTracks.slice(0, 4);
  const [font, covers] = await Promise.all([fontFamily(), Promise.all(songs.map(coverFor))]);

  // Background block + one big shape
  ctx.fillStyle = tone.bg;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = tone.shape;
  ctx.beginPath();
  ctx.arc(width * 0.93, height * (options.format === 'story' ? 0.09 : 0.12), width * 0.3, 0, Math.PI * 2);
  ctx.fill();

  const ink = tone.ink;
  // Keep each number with its unit when the value wraps ("124 days / 6 hrs", never "124 days 6 / hrs").
  const time = formatDuration(story.totalHours, options.unit).replace(/(\d) /g, '$1\u00a0');
  const artist = story.topArtist?.name ?? null;
  const personality = options.showPersonality ? story.personality?.main.title ?? null : null;

  if (options.format === 'story') {
    // 2×2 covers of 420 px, centered; text shares the grid's left edge.
    const gap = 24;
    const tile = 420;
    const pad = (width - (2 * tile + gap)) / 2;
    ctx.fillStyle = rgba(ink, 0.75);
    ctx.font = `700 34px ${font}`;
    ctx.fillText('MY YEAR IN MUSIC', pad, 150);
    ctx.fillStyle = rgba(ink, 1);
    ctx.font = `800 220px ${font}`;
    ctx.fillText(String(story.year), pad - 8, 360);
    ctx.font = `800 100px ${font}`;
    ctx.fillText('unwrapped.', pad, 462);

    const top = 510;
    songs.forEach((t, i) =>
      drawTile(ctx, font, tone, t, i + 1, covers[i], pad + (i % 2) * (tile + gap), top + Math.floor(i / 2) * (tile + gap), tile)
    );

    let y = top + 2 * tile + gap + 76;
    const col = (width - pad * 2 - 40) / 2;
    if (options.showTime && artist) {
      const a = drawStat(ctx, font, ink, 'Listening time', time, pad, y, col, 56, 2);
      const b = drawStat(ctx, font, ink, 'Top artist', artist, pad + col + 40, y, col, 56, 2);
      y = Math.max(a, b) + 36;
    } else if (options.showTime || artist) {
      const [label, value] = options.showTime ? ['Listening time', time] : ['Top artist', artist as string];
      y = drawStat(ctx, font, ink, label, value, pad, y, width - pad * 2, 56, 2) + 36;
    }
    if (personality) drawStat(ctx, font, ink, 'Listening personality', personality, pad, y, width - pad * 2, 64);

    ctx.fillStyle = rgba(ink, 0.75);
    ctx.font = `600 30px ${font}`;
    ctx.fillText(`Unwrapped · ${SITE_HOST}`, pad, height - 64);
  } else {
    const pad = 72;
    ctx.fillStyle = rgba(ink, 0.75);
    ctx.font = `700 28px ${font}`;
    ctx.fillText('MY YEAR IN MUSIC', pad, 112);
    ctx.fillStyle = rgba(ink, 1);
    ctx.font = `800 120px ${font}`;
    ctx.fillText(`${story.year}`, pad - 4, 232);
    const yearWidth = ctx.measureText(`${story.year} `).width;
    ctx.font = `800 64px ${font}`;
    ctx.fillText('unwrapped.', pad + yearWidth, 232);

    const gap = 20;
    const tile = 300;
    const top = 290;
    songs.forEach((t, i) =>
      drawTile(ctx, font, tone, t, i + 1, covers[i], pad + (i % 2) * (tile + gap), top + Math.floor(i / 2) * (tile + gap), tile)
    );

    const x = pad + 2 * tile + gap + 48;
    const w = width - x - pad;
    let y = top + 30;
    if (options.showTime) y = drawStat(ctx, font, ink, 'Listening time', time, x, y, w, 48, 2) + 40;
    if (artist) y = drawStat(ctx, font, ink, 'Top artist', artist, x, y, w, 40, 3) + 40;
    if (personality) drawStat(ctx, font, ink, 'Personality', personality, x, y, w, 40, 3);

    ctx.fillStyle = rgba(ink, 0.75);
    ctx.font = `600 24px ${font}`;
    ctx.fillText(`Unwrapped · ${SITE_HOST}`, pad, height - 52);
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Could not create the image'))), 'image/png')
  );
}
