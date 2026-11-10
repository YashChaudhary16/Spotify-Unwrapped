import type { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/** Standard surface: Spotify "elevated" background with a hairline border. */
export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-spotify-border bg-spotify-dark p-5 md:p-6 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  subtitle?: React.ReactNode;
  className?: string;
}

/** Title inside a Card. White text; icons and subtitles stay in subdued gray. */
export function CardTitle({ children, icon: Icon, subtitle, className = 'mb-4' }: CardTitleProps) {
  return (
    <div className={className}>
      <h3 className="flex items-center gap-2 text-base font-semibold text-white">
        {Icon && <Icon className="h-4 w-4 text-spotify-lightgray" aria-hidden />}
        {children}
      </h3>
      {subtitle && <p className="mt-1 text-sm text-spotify-lightgray">{subtitle}</p>}
    </div>
  );
}
