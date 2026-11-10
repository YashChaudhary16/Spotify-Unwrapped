'use client';

interface ChipGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
}

/** Spotify-style filter chips acting as a single-choice control. */
export function ChipGroup<T extends string>({ options, value, onChange, ariaLabel, size = 'md' }: ChipGroupProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap items-center gap-1.5">
      {options.map(option => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`rounded-full font-medium transition-colors ${
              size === 'sm' ? 'px-3 py-1 text-xs' : 'px-3 py-1.5 text-sm'
            } ${active ? 'bg-spotify-green text-black' : 'bg-spotify-gray text-white hover:bg-[#333333]'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
