'use client';

import { TIME_UNITS } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';

/** Spotify-style filter chips for choosing minutes / hours / days. */
export function TimeUnitToggle() {
  const { unit, setUnit } = useTimeUnit();

  return (
    <div role="radiogroup" aria-label="Time unit" className="flex items-center gap-1.5">
      {TIME_UNITS.map(option => {
        const active = option.value === unit;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setUnit(option.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-spotify-green text-black'
                : 'bg-spotify-gray text-white hover:bg-[#333333]'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
