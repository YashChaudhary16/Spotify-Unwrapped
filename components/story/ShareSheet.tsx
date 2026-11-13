'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, Loader2, Share2, X } from 'lucide-react';
import type { StoryData } from '@/lib/story';
import type { TimeUnit } from '@/lib/format';
import { renderShareImage, SHARE_SIZES, type ShareFormat } from '@/lib/shareImage';
import { chipClassName } from '@/components/ui/ChipGroup';
import { BOLD_TONES, type BoldTone } from './palette';

interface ShareSheetProps {
  story: StoryData;
  unit: TimeUnit;
  onClose: () => void;
}

const TONES: BoldTone[] = ['electric', 'hotpink', 'lime', 'tangerine', 'sky', 'plum'];

type Status = { kind: 'idle' } | { kind: 'done'; message: string } | { kind: 'error'; message: string };

/**
 * Share your story as an image (unwrapped_story_planning.md, Step I). The poster is drawn in the browser;
 * sharing goes through the device's share sheet (mobile), a download, or the clipboard. Nothing is uploaded.
 */
export function ShareSheet({ story, unit, onClose }: ShareSheetProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [format, setFormat] = useState<ShareFormat>('story');
  const [tone, setTone] = useState<BoldTone>('electric');
  const [showTime, setShowTime] = useState(true);
  const [showPersonality, setShowPersonality] = useState(true);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rendering, setRendering] = useState(true);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  /** Current preview object URL, revoked when replaced or on close. */
  const previewRef = useRef<string | null>(null);

  const fileName = `unwrapped-${story.year}-${format}.png`;
  const file = blob ? new File([blob], fileName, { type: 'image/png' }) : null;
  const canShareFile =
    !!file && typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [file] });
  const canCopy = typeof window !== 'undefined' && 'ClipboardItem' in window && !!navigator.clipboard?.write;

  // Re-render the poster whenever an option changes.
  useEffect(() => {
    let cancelled = false;
    setRendering(true);
    setStatus({ kind: 'idle' });
    renderShareImage(story, { format, tone: BOLD_TONES[tone], unit, showTime, showPersonality })
      .then(result => {
        if (cancelled) return;
        setBlob(result);
        if (previewRef.current) URL.revokeObjectURL(previewRef.current);
        previewRef.current = URL.createObjectURL(result);
        setPreviewUrl(previewRef.current);
      })
      .catch(() => !cancelled && setStatus({ kind: 'error', message: 'Could not create the image.' }))
      .finally(() => !cancelled && setRendering(false));
    return () => {
      cancelled = true;
    };
  }, [story, format, tone, unit, showTime, showPersonality]);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    []
  );

  // Esc closes; focus moves in and returns on close; Tab stays inside.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
      } else if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input');
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
    return () => {
      window.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, []);

  const share = async () => {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: `My ${story.year}, unwrapped` });
      setStatus({ kind: 'done', message: 'Shared.' });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return; // closed the share sheet
      setStatus({ kind: 'error', message: 'Sharing failed. Try Download instead.' });
    }
  };

  const download = () => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus({ kind: 'done', message: 'Saved to your downloads.' });
  };

  const copy = async () => {
    if (!blob) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setStatus({ kind: 'done', message: 'Image copied.' });
    } catch {
      setStatus({ kind: 'error', message: 'Copying isn’t allowed here. Try Download instead.' });
    }
  };

  const { width, height } = SHARE_SIZES[format];
  const busy = rendering || !blob;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/70 sm:items-center sm:p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        tabIndex={-1}
        className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-spotify-border bg-spotify-dark shadow-2xl outline-none sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-spotify-border px-5 py-4">
          <h2 id="share-title" className="text-lg font-bold text-white">
            Share your {story.year}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex h-9 w-9 items-center justify-center rounded-full text-spotify-lightgray transition-colors hover:bg-spotify-gray hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5 sm:flex-row">
          {/* Preview */}
          <div className="flex shrink-0 items-start justify-center sm:w-[44%]">
            <div
              className="relative w-full max-w-[260px] overflow-hidden rounded-xl bg-spotify-gray shadow-xl sm:max-w-none"
              style={{ aspectRatio: `${width} / ${height}` }}
            >
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL
                <img
                  src={previewUrl}
                  alt={`Preview of your ${story.year} share image`}
                  className={`h-full w-full object-contain transition-opacity ${rendering ? 'opacity-60' : ''}`}
                />
              )}
              {rendering && (
                <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
                  <Loader2 className="h-8 w-8 animate-spin text-white/80" />
                </span>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-white">Size</legend>
              <div className="flex gap-1.5" role="radiogroup" aria-label="Image size">
                {(
                  [
                    ['story', 'Story 9:16'],
                    ['square', 'Square 1:1'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={format === value}
                    onClick={() => setFormat(value)}
                    className={chipClassName(format === value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-white">Color</legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Background color">
                {TONES.map(t => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={tone === t}
                    aria-label={t}
                    onClick={() => setTone(t)}
                    className={`h-9 w-9 rounded-full ring-offset-2 ring-offset-spotify-dark transition-transform hover:scale-110 ${
                      tone === t ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ background: BOLD_TONES[t].bg }}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-white">Show</legend>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-white">
                <input type="checkbox" checked={showTime} onChange={e => setShowTime(e.target.checked)} className="h-4 w-4" />
                Listening time
              </label>
              {story.personality && (
                <label className="flex cursor-pointer items-center gap-3 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={showPersonality}
                    onChange={e => setShowPersonality(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Listening personality
                </label>
              )}
            </fieldset>

            <div className="mt-auto space-y-3">
              <div className="flex flex-wrap gap-2">
                {canShareFile && (
                  <button
                    type="button"
                    onClick={share}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition-transform hover:scale-[1.03] disabled:opacity-50"
                  >
                    <Share2 className="h-4 w-4" aria-hidden />
                    Share
                  </button>
                )}
                <button
                  type="button"
                  onClick={download}
                  disabled={busy}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.03] disabled:opacity-50 ${
                    canShareFile ? 'border border-white/30 text-white' : 'bg-white text-black'
                  }`}
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Download
                </button>
                {canCopy && (
                  <button
                    type="button"
                    onClick={copy}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.03] disabled:opacity-50"
                  >
                    <Copy className="h-4 w-4" aria-hidden />
                    Copy
                  </button>
                )}
              </div>
              <p className="min-h-[1.25rem] text-sm" role="status" aria-live="polite">
                {status.kind === 'done' && (
                  <span className="inline-flex items-center gap-1.5 text-white">
                    <Check className="h-4 w-4" aria-hidden />
                    {status.message}
                  </span>
                )}
                {status.kind === 'error' && <span className="text-[#F3727F]">{status.message}</span>}
              </p>
              <p className="text-xs text-spotify-muted">Made on your device. Nothing is uploaded.</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
