'use client';

interface ChipGroupProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm' | 'md';
}

/** Shared chip look (also used by multi-select chips such as the year filter). */
export const chipClassName = (active: boolean, size: 'sm' | 'md' = 'md') =>
  `shrink-0 rounded-full font-medium tabular-nums transition-colors ${
    size === 'sm' ? 'px-3 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  } ${active ? 'bg-spotify-green text-black' : 'bg-spotify-gray text-white hover:bg-[#333333]'}`;

/** Spotify-style filter chips acting as a single-choice control. */
export function ChipGroup<T extends string>({ options, value, onChange, ariaLabel, size = 'md' }: ChipGroupProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex items-center gap-1.5">
      {options.map(option => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={chipClassName(active, size)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
