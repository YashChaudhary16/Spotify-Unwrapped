'use client';

import { HEAT_EMPTY, HEAT_STEPS, HEAT_TEXT } from '@/lib/chartTheme';
import { formatDuration, formatDurationShort } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';

interface HeatmapProps {
  rows: string[];
  cols: string[];
  /** Hours for a cell. */
  value: (row: string, col: string) => number;
  colLabel?: (col: string) => string;
  rowHeader?: string;
}

/** Index into HEAT_STEPS for a value, or -1 for an empty cell. Scaled against the whole grid. */
const stepFor = (value: number, max: number) =>
  value <= 0 || max <= 0 ? -1 : Math.min(HEAT_STEPS.length - 1, Math.ceil((value / max) * HEAT_STEPS.length) - 1);

/** Grid heatmap: stepped green scale, distinct empty cells, readable text, and a legend. */
export function Heatmap({ rows, cols, value, colLabel = c => c, rowHeader = '' }: HeatmapProps) {
  const { unit } = useTimeUnit();
  const max = Math.max(0, ...rows.flatMap(r => cols.map(c => value(r, c))));
  const gridTemplateColumns = `3.5rem repeat(${cols.length}, minmax(2.75rem, 1fr))`;

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[26rem] gap-[3px] tabular-nums" style={{ gridTemplateColumns }} role="table">
          <div className="text-xs font-medium text-spotify-lightgray" role="columnheader">{rowHeader}</div>
          {cols.map(col => (
            <div key={col} className="pb-1 text-center text-xs font-medium text-spotify-lightgray" role="columnheader">
              {colLabel(col)}
            </div>
          ))}

          {rows.map(row => (
            <div key={row} className="contents" role="row">
              <div className="flex items-center text-sm font-semibold text-white" role="rowheader">{row}</div>
              {cols.map(col => {
                const v = value(row, col);
                const step = stepFor(v, max);
                const label = `${row} · ${colLabel(col)}: ${v > 0 ? formatDuration(v, unit) : 'no listening'}`;
                return (
                  <div
                    key={col}
                    role="cell"
                    title={label}
                    aria-label={label}
                    className="flex h-9 items-center justify-center rounded text-xs transition-shadow hover:ring-2 hover:ring-white/70"
                    style={{
                      backgroundColor: step < 0 ? HEAT_EMPTY : HEAT_STEPS[step],
                      color: step < 0 ? '#7C7C7C' : HEAT_TEXT[step],
                    }}
                  >
                    {v > 0 ? formatDurationShort(v, unit) : '–'}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-spotify-lightgray">
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          {HEAT_STEPS.map(color => (
            <span key={color} className="h-3 w-5 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
          ))}
          <span>More</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-5 rounded-sm" style={{ backgroundColor: HEAT_EMPTY }} aria-hidden />
          <span>No listening</span>
        </div>
        {max > 0 && <span>Brightest = {formatDuration(max, unit)}</span>}
      </div>
    </div>
  );
}
