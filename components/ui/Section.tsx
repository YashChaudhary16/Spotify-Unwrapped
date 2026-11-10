import type { LucideIcon } from 'lucide-react';

interface SectionProps {
  title: string;
  icon?: LucideIcon;
  subtitle?: React.ReactNode;
  /** Controls shown on the right of the heading (toggles, pickers). */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/** A dashboard section: heading row plus content. Headings are white; green is kept for data. */
export function Section({ title, icon: Icon, subtitle, actions, children, className = '' }: SectionProps) {
  return (
    <section className={`mb-12 ${className}`}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-white">
            {Icon && <Icon className="h-6 w-6 text-spotify-green" aria-hidden />}
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-spotify-lightgray">{subtitle}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );
}
