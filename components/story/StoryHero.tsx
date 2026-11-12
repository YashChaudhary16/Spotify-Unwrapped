'use client';

import { useEffect, useState } from 'react';
import { EyeOff, Play, Sparkles } from 'lucide-react';
import { chipClassName } from '@/components/ui/ChipGroup';

interface StoryHeroProps {
  /** Years with a story, newest first. */
  years: number[];
  /** Year to offer first: the single year picked in the header filter, otherwise the newest. */
  defaultYear: number;
  onPlay: (year: number) => void;
  onLeaveOut: (year: number) => void;
}

/** "Play your {year} story" banner at the top of Overview (unwrapped_story_planning.md, Step E). */
export function StoryHero({ years, defaultYear, onPlay, onLeaveOut }: StoryHeroProps) {
  const [year, setYear] = useState(defaultYear);
  useEffect(() => setYear(defaultYear), [defaultYear]);

  return (
    <section
      aria-labelledby="story-hero-title"
      className="relative mb-8 overflow-hidden rounded-2xl border border-spotify-border bg-[linear-gradient(120deg,#2a2440_0%,#1d2a24_55%,#181818_100%)] p-6 md:p-8"
    >
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/70">
            <Sparkles className="h-4 w-4" aria-hidden />
            Your Unwrapped story
          </p>
          <h2 id="story-hero-title" className="mt-2 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            {year}, unwrapped.
          </h2>
          <p className="mt-2 text-base text-white/80">Your year in music, one card at a time.</p>

          {years.length > 1 && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Story year">
              {years.map(y => (
                <button
                  key={y}
                  type="button"
                  role="radio"
                  aria-checked={y === year}
                  onClick={() => setYear(y)}
                  className={chipClassName(y === year, 'sm')}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onLeaveOut(year)}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            <EyeOff className="h-4 w-4" aria-hidden />
            Leave out…
          </button>
          <button
            type="button"
            onClick={() => onPlay(year)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-bold text-black transition-transform hover:scale-[1.03] active:scale-100"
          >
            <Play className="h-5 w-5 fill-current" aria-hidden />
            Play your {year} story
          </button>
        </div>
      </div>
    </section>
  );
}
