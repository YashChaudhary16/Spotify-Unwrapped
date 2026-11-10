'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface SearchOption {
  value: string;
  label: string;
  /** Second line under the label (e.g. the artist of an album). */
  sublabel?: string;
  /** Right-aligned detail (e.g. listening time). */
  meta?: string;
  /** Extra text to match when searching (e.g. artist name for albums). */
  keywords?: string;
}

interface SearchSelectProps {
  options: SearchOption[];
  value: string | null;
  onChange: (value: string) => void;
  /** Shows a clear (×) button when a value is selected. */
  onClear?: () => void;
  ariaLabel: string;
  placeholder?: string;
  /** Max rows rendered at once; typing narrows the rest. */
  maxResults?: number;
  /** Which edge the dropdown lines up with. */
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Searchable single-select (combobox). Replaces native <select> for long lists
 * like thousands of artists or albums. Keyboard: ↑ ↓ to move, Enter to pick, Esc to close.
 */
export function SearchSelect({
  options,
  value,
  onChange,
  onClear,
  ariaLabel,
  placeholder = 'Search…',
  maxResults = 50,
  align = 'left',
  className = '',
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = `ss-${useId().replace(/:/g, '')}`;

  const selected = options.find(o => o.value === value) ?? null;

  const { results, hiddenCount } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? options.filter(o => o.label.toLowerCase().includes(q) || o.keywords?.toLowerCase().includes(q))
      : options;
    return { results: matches.slice(0, maxResults), hiddenCount: Math.max(matches.length - maxResults, 0) };
  }, [options, query, maxResults]);

  useEffect(() => setActiveIdx(0), [query, open]);

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Keep the keyboard-highlighted row visible.
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${activeIdx}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx, open, listId]);

  const choose = (option: SearchOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIdx(i => Math.min(i + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && results[activeIdx]) {
        e.preventDefault();
        choose(results[activeIdx]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-spotify-lightgray" aria-hidden />
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && results[activeIdx] ? `${listId}-${activeIdx}` : undefined}
        value={open ? query : selected?.label ?? ''}
        placeholder={open && selected ? selected.label : placeholder}
        onFocus={() => {
          setOpen(true);
          setQuery('');
        }}
        onChange={e => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="w-full truncate rounded-full border border-transparent bg-spotify-gray py-2 pl-9 pr-9 text-sm text-white placeholder:text-spotify-lightgray hover:bg-[#333333] focus:border-white/40 focus:bg-spotify-gray focus:outline-none"
      />
      {selected && onClear && !open ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-spotify-lightgray hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-spotify-lightgray"
          aria-hidden
        />
      )}

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute z-50 mt-2 max-h-80 w-full min-w-[16rem] overflow-y-auto rounded-lg border border-white/10 bg-spotify-gray p-1 shadow-2xl shadow-black/60 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-spotify-lightgray">No matches</li>
          ) : (
            results.map((option, idx) => {
              const isSelected = option.value === value;
              return (
                <li
                  key={option.value}
                  id={`${listId}-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={e => {
                    e.preventDefault();
                    choose(option);
                  }}
                  onMouseEnter={() => setActiveIdx(idx)}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                    idx === activeIdx ? 'bg-white/10' : ''
                  }`}
                >
                  <span className="min-w-0">
                    <span className={`block truncate ${isSelected ? 'font-semibold text-spotify-green' : 'text-white'}`}>
                      {option.label}
                    </span>
                    {option.sublabel && (
                      <span className="block truncate text-xs text-spotify-lightgray">{option.sublabel}</span>
                    )}
                  </span>
                  {option.meta && <span className="shrink-0 text-xs tabular-nums text-spotify-lightgray">{option.meta}</span>}
                </li>
              );
            })
          )}
          {hiddenCount > 0 && (
            <li className="px-3 py-2 text-xs text-spotify-muted">
              {hiddenCount.toLocaleString()} more — keep typing to narrow down
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
