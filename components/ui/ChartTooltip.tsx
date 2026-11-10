'use client';

import { formatDuration } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';

interface PayloadItem {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, any>;
}

interface ChartTooltipProps {
  // Injected by Recharts
  active?: boolean;
  payload?: PayloadItem[];
  label?: string | number;
  // Our options
  /** Formats each value. Defaults to treating the value as hours in the selected time unit. */
  valueFormatter?: (value: number, item: PayloadItem) => string;
  /** Formats the header line. Receives the axis label and the hovered row. */
  labelFormatter?: (label: string | number | undefined, row: Record<string, any> | undefined) => React.ReactNode;
  /** Overrides the series name shown next to each value. */
  nameFormatter?: (item: PayloadItem) => string;
  /** Hide the colored swatch (useful for single-series charts). */
  hideSwatch?: boolean;
}

/**
 * One tooltip for every chart: dark Spotify surface, white values, subdued label.
 * Use as <Tooltip content={<ChartTooltip />} />.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
  nameFormatter,
  hideSwatch,
}: ChartTooltipProps) {
  const { unit } = useTimeUnit();
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0]?.payload;
  const heading = labelFormatter ? labelFormatter(label, row) : label;
  const fmt = valueFormatter ?? ((v: number) => formatDuration(v, unit));

  return (
    <div className="min-w-[140px] rounded-md border border-white/10 bg-spotify-gray px-3 py-2 text-sm shadow-xl shadow-black/40">
      {heading !== undefined && heading !== '' && (
        <div className="mb-1 text-xs font-medium text-spotify-lightgray">{heading}</div>
      )}
      <div className="space-y-0.5">
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {!hideSwatch && (
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color ?? item.payload?.fill }} aria-hidden />
            )}
            <span className="text-spotify-lightgray">{nameFormatter ? nameFormatter(item) : item.name}</span>
            <span className="ml-auto pl-3 font-semibold tabular-nums text-white">
              {typeof item.value === 'number' ? fmt(item.value, item) : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
