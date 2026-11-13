'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Ellipsis, EyeOff } from 'lucide-react';
import { useStoryHold } from './context';

/**
 * Small ⋯ button on artist/song cards with one action: "Leave out of story". While the menu is open the
 * story holds still. Marked `data-story-interactive`, so taps on it don't move the story.
 */
export function LeaveOutMenu({ label, onLeaveOut }: { label: string; onLeaveOut: () => void }) {
  const [open, setOpen] = useState(false);
  const hold = useStoryHold();
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    hold(id, open);
    return () => hold(id, false);
  }, [open, hold, id]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus(); // don't strand keyboard focus on the removed menu
      }
    };
    document.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0" data-story-interactive>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`More options for ${label}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-ink/75 transition-colors hover:bg-ink/15 hover:text-ink"
      >
        <Ellipsis className="h-5 w-5" aria-hidden />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-md bg-[#282828] py-1 shadow-2xl shadow-black/60"
        >
          <button
            type="button"
            role="menuitem"
            autoFocus
            onClick={() => {
              setOpen(false);
              onLeaveOut();
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-white transition-colors hover:bg-white/10 focus:bg-white/10 focus:outline-none"
          >
            <EyeOff className="h-4 w-4 shrink-0 text-white/70" aria-hidden />
            Leave out of story
          </button>
        </div>
      )}
    </div>
  );
}
