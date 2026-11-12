import type { StoryData } from '@/lib/story';
import { formatDuration, formatPercent, type TimeUnit } from '@/lib/format';
import type { StoryCard } from './types';

/**
 * Temporary cards for Step D, so the player can be tried with real data. Step F replaces them with the
 * designed card set; Step H decides the story palette (these neutral gradients are placeholders only).
 */
const BG = [
  'linear-gradient(160deg, #2a2a2a 0%, #121212 100%)',
  'linear-gradient(160deg, #1f3a2c 0%, #121212 100%)',
  'linear-gradient(160deg, #2c2540 0%, #121212 100%)',
  'linear-gradient(160deg, #3a2a1f 0%, #121212 100%)',
];

const Kicker = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm font-semibold uppercase tracking-widest text-white/70">{children}</p>
);
const Big = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-3 text-4xl font-extrabold leading-tight text-white sm:text-5xl">{children}</p>
);
const Sub = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 text-lg text-white/80">{children}</p>
);

export function buildPlaceholderCards(story: StoryData, unit: TimeUnit): StoryCard[] {
  const cards: StoryCard[] = [];
  const bg = () => BG[cards.length % BG.length];

  cards.push({
    id: 'intro',
    label: `${story.year}, unwrapped`,
    background: bg(),
    durationMs: 4000,
    content: (
      <div className="my-auto">
        <Kicker>Your story</Kicker>
        <Big>{story.year}, unwrapped.</Big>
        {story.firstSong && <Sub>It started with “{story.firstSong.track}”.</Sub>}
      </div>
    ),
  });

  cards.push({
    id: 'total',
    label: `You listened for ${formatDuration(story.totalHours, unit)}`,
    background: bg(),
    content: (
      <div className="my-auto">
        <Kicker>This year you listened for</Kicker>
        <Big>{formatDuration(story.totalHours, unit)}</Big>
        {story.equivalents[0] && <Sub>That’s {story.equivalents[0].label}.</Sub>}
      </div>
    ),
  });

  if (story.topArtist) {
    cards.push({
      id: 'top-artist',
      label: `Your top artist: ${story.topArtist.name}`,
      background: bg(),
      content: (
        <div className="my-auto">
          <Kicker>Your top artist</Kicker>
          <Big>{story.topArtist.name}</Big>
          <Sub>
            {formatDuration(story.topArtist.hours, unit)} · {formatPercent(story.topArtist.share)} of your listening
          </Sub>
        </div>
      ),
    });
  }

  if (story.topTracks.length > 0) {
    cards.push({
      id: 'top-songs',
      label: `Your top songs, led by ${story.topTracks[0].track}`,
      background: bg(),
      durationMs: 9000,
      content: (
        <div className="my-auto">
          <Kicker>Your top songs</Kicker>
          <ol className="mt-5 space-y-3">
            {story.topTracks.map((t, i) => (
              <li key={`${t.track}-${i}`} className="flex items-baseline gap-3">
                <span className="w-6 shrink-0 text-2xl font-extrabold tabular-nums text-white/60">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block truncate text-xl font-bold text-white">{t.track}</span>
                  {t.artist && <span className="block truncate text-sm text-white/70">{t.artist}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ),
    });
  }

  if (story.personality) {
    const { main, touch } = story.personality;
    cards.push({
      id: 'personality',
      label: `Your listening personality: ${main.title}`,
      background: bg(),
      durationMs: 8000,
      content: (
        <div className="my-auto">
          <Kicker>Your listening personality</Kicker>
          <Big>{main.title}</Big>
          {touch && <p className="mt-2 text-lg font-semibold text-white/80">with a touch of {touch.title.replace(/^The /, '')}</p>}
          <Sub>{main.description}</Sub>
          <p className="mt-6 text-sm text-white/70">{main.evidence}</p>
        </div>
      ),
    });
  }

  cards.push({
    id: 'summary',
    label: `Your ${story.year} summary`,
    background: bg(),
    content: (
      <div className="my-auto space-y-4">
        <Kicker>{story.year} in summary</Kicker>
        <p className="text-2xl font-extrabold text-white">{formatDuration(story.totalHours, unit)}</p>
        {story.topArtist && <p className="text-lg text-white/80">Top artist: {story.topArtist.name}</p>}
        {story.topTracks[0] && <p className="text-lg text-white/80">Top song: {story.topTracks[0].track}</p>}
        {story.personality && <p className="text-lg text-white/80">{story.personality.main.title}</p>}
        <p className="pt-4 text-xs text-white/50">Placeholder cards (Step D). The designed cards come in Step F.</p>
      </div>
    ),
  });

  return cards;
}
