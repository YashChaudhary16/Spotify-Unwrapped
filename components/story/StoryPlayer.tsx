'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, EyeOff, Pause, Play, X } from 'lucide-react';
import { DEFAULT_CARD_MS, type StoryCard } from './types';

interface StoryPlayerProps {
  /** Accessible name of the dialog, e.g. "Your 2025 story". */
  title: string;
  cards: StoryCard[];
  onClose: () => void;
  /** Opens the "Leave out of story" panel (shown as a button in the top bar). */
  onLeaveOut?: () => void;
  /** True while another dialog (the panel) is open on top: the story pauses and ignores keys. */
  suspended?: boolean;
}

/** A press held this long pauses instead of navigating. */
const HOLD_MS = 250;
/** Movement beyond this (px) is a swipe/drag, not a tap. */
const TAP_SLOP = 10;
const SWIPE_X = 50;
const SWIPE_DOWN = 80;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/** Elements inside a card that handle their own clicks (buttons, links, menus) don't navigate the story. */
const isInteractive = (target: EventTarget | null) =>
  target instanceof Element && !!target.closest('button, a, input, select, textarea, [data-story-interactive]');

/**
 * Full-screen, tap-through story (unwrapped_story_planning.md, Step D).
 *
 * - Segmented progress bars; each card auto-advances after its `durationMs` and the story stops on the last card.
 * - Tap the left third for back and the rest for next; swipe left/right; swipe down to close.
 * - Press and hold (or Space, or the pause button) to pause. The story also pauses while the tab is hidden.
 * - Keyboard: ← → to move, Space to pause, Esc to close. Focus stays inside the dialog and returns on close.
 * - `prefers-reduced-motion`: no auto-advance and no entrance animation; the viewer moves at their own pace.
 */
export function StoryPlayer({ title, cards, onClose, onLeaveOut, suspended = false }: StoryPlayerProps) {
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ x: number; y: number; held: boolean; timer: number } | null>(null);

  const count = cards.length;
  const card = cards[index];
  const isLast = index === count - 1;
  const paused = userPaused || held || tabHidden || suspended;

  const next = useCallback(() => setIndex(i => Math.min(i + 1, count - 1)), [count]);
  const prev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), []);

  // The card list can shrink when something is left out; stay in range.
  useEffect(() => {
    if (index > count - 1) setIndex(Math.max(count - 1, 0));
  }, [index, count]);

  // Keyboard
  useEffect(() => {
    if (suspended) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === ' ' && !isInteractive(e.target)) {
        e.preventDefault();
        setUserPaused(p => !p);
      } else if (e.key === 'Tab') {
        // Keep focus inside the dialog.
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose, suspended]);

  // Focus the dialog on open, lock page scroll, and restore both on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  // Pause while the tab is in the background.
  useEffect(() => {
    const update = () => setTabHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  // Preload the next card's images.
  useEffect(() => {
    cards[index + 1]?.preload?.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, [cards, index]);

  // Pointer: tap, hold-to-pause, swipe.
  const endPress = () => {
    if (press.current) window.clearTimeout(press.current.timer);
    press.current = null;
    setHeld(false);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || isInteractive(e.target)) return;
    const timer = window.setTimeout(() => {
      if (press.current) {
        press.current.held = true;
        setHeld(true);
      }
    }, HOLD_MS);
    press.current = { x: e.clientX, y: e.clientY, held: false, timer };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (p && !p.held && Math.hypot(e.clientX - p.x, e.clientY - p.y) > TAP_SLOP) window.clearTimeout(p.timer);
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const p = press.current;
    endPress();
    if (!p || p.held) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (Math.abs(dx) > SWIPE_X && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    } else if (dy > SWIPE_DOWN && dy > Math.abs(dx)) {
      onClose();
    } else if (Math.abs(dx) <= TAP_SLOP && Math.abs(dy) <= TAP_SLOP) {
      const rect = cardRef.current?.getBoundingClientRect();
      if (rect && e.clientX - rect.left < rect.width / 3) prev();
      else next();
    }
  };

  if (!card) return null;
  const duration = card.durationMs ?? DEFAULT_CARD_MS;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 outline-none sm:gap-6"
    >
      {/* Desktop arrows beside the card */}
      <button
        type="button"
        onClick={prev}
        disabled={index === 0}
        aria-label="Previous card"
        className="hidden h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-0 sm:flex"
      >
        <ChevronLeft className="h-6 w-6" aria-hidden />
      </button>

      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={endPress}
        onPointerLeave={endPress}
        onContextMenu={e => e.preventDefault()}
        className="relative h-[100dvh] w-full touch-none select-none overflow-hidden bg-spotify-dark [-webkit-touch-callout:none] sm:aspect-[9/16] sm:h-[min(92dvh,880px)] sm:w-auto sm:rounded-2xl sm:shadow-2xl"
        style={{ background: card.background }}
      >
        {/* Card content */}
        <div
          key={card.id}
          className="absolute inset-0 flex flex-col px-6 pb-10 pt-[calc(env(safe-area-inset-top)+4.5rem)] motion-safe:animate-[story-card-in_350ms_ease-out]"
        >
          {card.content}
        </div>

        {/* Top bar: progress, pause, close */}
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/40 to-transparent px-3 pb-6 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
          <div className="flex gap-1" aria-hidden>
            {cards.map((c, i) => (
              <div key={c.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                {i === index && !reducedMotion ? (
                  <div
                    // Re-keyed per card visit so going back restarts the fill.
                    key={`fill-${index}`}
                    className="h-full w-full origin-left bg-white"
                    style={{
                      animation: `story-progress ${duration}ms linear forwards`,
                      animationPlayState: paused ? 'paused' : 'running',
                    }}
                    onAnimationEnd={isLast ? undefined : next}
                  />
                ) : (
                  <div
                    className="h-full w-full origin-left bg-white"
                    style={{ transform: `scaleX(${i <= index ? 1 : 0})` }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-white/90">{title}</span>
            <div className="flex shrink-0 items-center gap-1">
              {onLeaveOut && (
                <button
                  type="button"
                  onClick={onLeaveOut}
                  aria-label="Leave artists or songs out of the story"
                  title="Leave out of story"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
                >
                  <EyeOff className="h-5 w-5" aria-hidden />
                </button>
              )}
              {!reducedMotion && (
                <button
                  type="button"
                  onClick={() => setUserPaused(p => !p)}
                  aria-label={paused ? 'Play story' : 'Pause story'}
                  aria-pressed={userPaused}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
                >
                  {paused ? <Play className="h-5 w-5" aria-hidden /> : <Pause className="h-5 w-5" aria-hidden />}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close story"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={next}
        disabled={isLast}
        aria-label="Next card"
        className="hidden h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-0 sm:flex"
      >
        <ChevronRight className="h-6 w-6" aria-hidden />
      </button>

      {/* Screen-reader announcement per card */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {`Card ${index + 1} of ${count}. ${card.label}`}
      </p>
    </div>,
    document.body
  );
}
