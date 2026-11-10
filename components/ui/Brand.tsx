import { AudioLines } from 'lucide-react';

/** App logo + name. Deliberately not Spotify's logo — see the "Not affiliated" footer. */
export function Brand({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const lg = size === 'lg';
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex items-center justify-center rounded-full bg-spotify-green text-black ${
          lg ? 'h-12 w-12' : 'h-9 w-9'
        }`}
      >
        <AudioLines className={lg ? 'h-6 w-6' : 'h-5 w-5'} aria-hidden />
      </div>
      <span className={`font-bold tracking-tight text-white ${lg ? 'text-3xl' : 'text-xl'}`}>Unwrapped</span>
    </div>
  );
}
