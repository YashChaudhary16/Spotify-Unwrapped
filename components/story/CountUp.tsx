'use client';

import { useEffect, useState } from 'react';

/**
 * Counts from 0 up to `value` when the card appears (ease-out, ~1.4 s), formatting each frame with `format`.
 * With reduced motion it shows the final value straight away. Screen readers get the final value only.
 */
export function CountUp({
  value,
  format,
  durationMs = 1400,
  delayMs = 200,
}: {
  value: number;
  format: (n: number) => string;
  durationMs?: number;
  delayMs?: number;
}) {
  const [current, setCurrent] = useState<number | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrent(value);
      return;
    }
    let frame = 0;
    const start = performance.now() + delayMs;
    const tick = (now: number) => {
      const t = Math.min(Math.max((now - start) / durationMs, 0), 1);
      setCurrent(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs, delayMs]);

  return (
    <>
      <span aria-hidden className="tabular-nums">
        {format(current ?? 0)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
