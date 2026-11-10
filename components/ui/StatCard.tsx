import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  icon?: LucideIcon;
  /** Shrinks the value for long text (e.g. a track name instead of a number). */
  size?: 'lg' | 'md';
}

/** A headline number: label on top, big value, optional detail line. */
export function StatCard({ label, value, detail, icon: Icon, size = 'lg' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-spotify-border bg-spotify-dark p-5 transition-colors hover:bg-spotify-highlight">
      <div className="flex items-center gap-2 text-sm font-medium text-spotify-lightgray">
        {Icon && <Icon className="h-4 w-4" aria-hidden />}
        {label}
      </div>
      <div
        className={`mt-2 font-bold tabular-nums tracking-tight text-white ${
          size === 'lg' ? 'text-3xl' : 'text-xl leading-snug'
        }`}
      >
        {value}
      </div>
      {detail && <div className="mt-1 text-sm text-spotify-lightgray">{detail}</div>}
    </div>
  );
}
