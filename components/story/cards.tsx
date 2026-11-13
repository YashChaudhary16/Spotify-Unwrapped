'use client';

import type { ReactNode } from 'react';
import {
  CalendarDays,
  Compass,
  Disc3,
  Flower2,
  Heart,
  Leaf,
  MapPin,
  Moon,
  Plane,
  Repeat,
  RotateCcw,
  Shuffle,
  SkipForward,
  Snowflake,
  Sparkles,
  Sun,
  Sunrise,
  Timer,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { Season, StoryData, StoryTrack } from '@/lib/story';
import type { PersonalityIcon } from '@/lib/personality';
import { formatDate, formatDuration, formatNumber, formatPercent, type TimeUnit } from '@/lib/format';
import { prefetchSpotifyArtwork } from '@/lib/useSpotifyArtwork';
import { prefetchSpotifyArtist } from '@/lib/useSpotifyArtist';
import { ArtistPhoto, CardBackground, CardFrame, Cover } from './artwork';
import { LeaveOutMenu } from './LeaveOutMenu';
import type { StoryCard } from './types';

/**
 * The story's cards (unwrapped_story_planning.md, Steps F and G).
 *
 * Order: intro → total time → top artist → top songs → top album → extra moments (Step G, the most striking
 * ones that fit) → personality → summary. The summary is last and becomes the share image in Step I.
 * Every name shown here comes from plays the story may show (no private sessions, no ambient sounds).
 */

export interface StoryCardContext {
  unit: TimeUnit;
  /** "Leave out of story" from the ⋯ menus. */
  hideArtist: (artist: string) => void;
  hideTrack: (track: string, artist: string | null) => void;
}

/** At most this many cards per story (plan: about 12–14). */
const MAX_CARDS = 14;

// ── Small text pieces ──────────────────────────────────────────────────────────

const Kicker = ({ children, icon: Icon }: { children: ReactNode; icon?: LucideIcon }) => (
  <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-white/75">
    {Icon && <Icon className="h-4 w-4" aria-hidden />}
    {children}
  </p>
);

/** Headline that scales with the card width (the card is a CSS size container). */
const Headline = ({ children, size = 'lg' }: { children: ReactNode; size?: 'md' | 'lg' | 'xl' }) => {
  const cls = size === 'xl' ? 'text-[17cqw]' : size === 'lg' ? 'text-[11cqw]' : 'text-[8.5cqw]';
  return (
    <p className={`mt-3 break-words font-extrabold leading-[1.02] tracking-tight text-white ${cls}`}>{children}</p>
  );
};

const Body = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <p className={`mt-4 text-[4.6cqw] leading-snug text-white/85 ${className}`}>{children}</p>
);

const Pill = ({ children }: { children: ReactNode }) => (
  <span className="inline-flex items-center rounded-full bg-black/30 px-3 py-1.5 text-[3.6cqw] font-semibold text-white">
    {children}
  </span>
);

const quote = (s: string) => `“${s}”`;

function TrackRow({
  track,
  rank,
  meta,
  onHide,
  coverClass = 'h-[13cqw] w-[13cqw]',
}: {
  track: StoryTrack;
  rank?: number;
  meta?: string;
  onHide?: () => void;
  coverClass?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {rank !== undefined && (
        <span className="w-[6cqw] shrink-0 text-right text-[5.5cqw] font-extrabold tabular-nums text-white/70">{rank}</span>
      )}
      <Cover trackId={track.trackId} alt={`Cover art for ${track.track}`} className={coverClass} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[4.4cqw] font-bold text-white">{track.track}</span>
        <span className="block truncate text-[3.6cqw] text-white/75">
          {[track.artist, meta].filter(Boolean).join(' · ')}
        </span>
      </span>
      {onHide && <LeaveOutMenu label={track.track} onLeaveOut={onHide} />}
    </div>
  );
}

const hourLabel = (h: number) => (h === 0 ? '12 am' : h < 12 ? `${h} am` : h === 12 ? '12 pm' : `${h - 12} pm`);
const partOfDay = (h: number) =>
  h < 5 ? 'late at night' : h < 12 ? 'in the morning' : h < 17 ? 'in the afternoon' : h < 21 ? 'in the evening' : 'at night';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SEASON: Record<Season, { label: string; icon: LucideIcon }> = {
  winter: { label: 'Winter', icon: Snowflake },
  spring: { label: 'Spring', icon: Flower2 },
  summer: { label: 'Summer', icon: Sun },
  autumn: { label: 'Autumn', icon: Leaf },
};

const PERSONALITY_ICON: Record<PersonalityIcon, LucideIcon> = {
  Heart,
  Compass,
  Moon,
  Sunrise,
  Shuffle,
  SkipForward,
  Repeat,
  Disc3,
  Timer,
  Plane,
  Sparkles,
};

// ── Card builder ───────────────────────────────────────────────────────────────

interface Extra {
  card: StoryCard;
  /** How striking this moment is (0–1); the most striking extras win when there isn't room for all. */
  score: number;
}

export function buildStoryCards(story: StoryData, ctx: StoryCardContext): StoryCard[] {
  const { unit } = ctx;
  const d = (hours: number) => formatDuration(hours, unit);
  const s = story.stats;
  const hideTrack = (t: StoryTrack) => () => ctx.hideTrack(t.track, t.artist);

  const core: StoryCard[] = [];
  const extras: Extra[] = [];

  // 1. Intro
  core.push({
    id: 'intro',
    label: `${story.year}, unwrapped`,
    durationMs: 5000,
    content: (
      <CardFrame background={<CardBackground tone="violet" />}>
        <div className="my-auto">
          <Kicker>Your year in music</Kicker>
          <Headline size="xl">
            {story.year},
            <br />
            unwrapped.
          </Headline>
          {story.partialYear && story.firstDate > `${story.year}-01-14` && (
            <Body>Your history starts on {formatDate(story.firstDate, 'MMMM d')}.</Body>
          )}
        </div>
        {story.firstSong && (
          <div className="mt-6">
            <p className="mb-3 text-[3.8cqw] font-semibold text-white/75">
              It all started on {formatDate(story.firstSong.date, 'MMMM d')} with
            </p>
            <TrackRow
              track={{ ...story.firstSong, hours: 0, plays: 0 }}
              onHide={() => ctx.hideTrack(story.firstSong!.track, story.firstSong!.artist)}
            />
          </div>
        )}
      </CardFrame>
    ),
  });

  // 2. Total time
  const equivalent = story.equivalents[0];
  core.push({
    id: 'total',
    label: `You listened for ${d(story.totalHours)}`,
    content: (
      <CardFrame background={<CardBackground tone="green" />}>
        <div className="my-auto">
          <Kicker>This year you listened for</Kicker>
          <Headline size="lg">
            <span className="tabular-nums">{d(story.totalHours)}</span>
          </Headline>
          {equivalent && <Body>That&apos;s {equivalent.label}.</Body>}
          <div className="mt-8 flex flex-wrap gap-2">
            <Pill>
              {formatNumber(story.activeDays)} of {story.daysInYear} days
            </Pill>
            <Pill>{formatNumber(story.uniqueTracks)} songs</Pill>
            <Pill>{formatNumber(story.uniqueArtists)} artists</Pill>
          </div>
        </div>
      </CardFrame>
    ),
  });

  // 3. Top artist
  const artist = story.topArtist;
  if (artist) {
    const artistTrackId = artist.topTrack?.trackId ?? null;
    core.push({
      id: 'top-artist',
      label: `Your top artist: ${artist.name}`,
      durationMs: 8000,
      content: (
        <CardFrame background={<CardBackground tone="rose" trackId={artistTrackId} artist={artist.name} />}>
          <Kicker>Your top artist</Kicker>
          <div className="flex flex-1 flex-col items-center justify-center py-4">
            <ArtistPhoto trackId={artistTrackId} name={artist.name} className="h-[58cqw] w-[58cqw]" />
          </div>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="break-words text-[10cqw] font-extrabold leading-[1.02] tracking-tight text-white">
                {artist.name}
              </p>
              <p className="mt-3 text-[4.4cqw] text-white/85">
                {d(artist.hours)} · {formatPercent(artist.share)} of your listening
              </p>
              {s.loyalty && (
                <p className="mt-1 text-[4cqw] font-semibold text-white">
                  Your #1 for {s.loyalty.years} years running
                </p>
              )}
            </div>
            <LeaveOutMenu label={artist.name} onLeaveOut={() => ctx.hideArtist(artist.name)} />
          </div>
        </CardFrame>
      ),
    });
  }

  // 4. Top songs, revealed from #5 up to #1
  if (story.topTracks.length > 0) {
    const n = story.topTracks.length;
    core.push({
      id: 'top-songs',
      label: `Your top songs: ${story.topTracks.map((t, i) => `${i + 1}. ${t.track}`).join(', ')}`,
      durationMs: 6000 + n * 700,
      content: (
        <CardFrame background={<CardBackground tone="blue" trackId={story.topTracks[0].trackId} />}>
          <Kicker>Your top songs</Kicker>
          <ol className="my-auto space-y-[4cqw]">
            {story.topTracks.map((t, i) => (
              <li
                key={`${t.track}-${t.artist}`}
                className="motion-safe:animate-[story-row-in_500ms_ease-out_both]"
                style={{ animationDelay: `${300 + (n - 1 - i) * 650}ms` }}
              >
                <TrackRow
                  track={t}
                  rank={i + 1}
                  meta={d(t.hours)}
                  onHide={hideTrack(t)}
                  coverClass={i === 0 ? 'h-[17cqw] w-[17cqw]' : 'h-[13cqw] w-[13cqw]'}
                />
              </li>
            ))}
          </ol>
        </CardFrame>
      ),
    });
  }

  // 5. Top album
  const album = story.topAlbum;
  if (album) {
    core.push({
      id: 'top-album',
      label: `Your top album: ${album.album}`,
      content: (
        <CardFrame background={<CardBackground tone="amber" trackId={album.trackId} />}>
          <Kicker icon={Disc3}>Your top album</Kicker>
          <div className="flex flex-1 items-center justify-center py-4">
            <Cover
              trackId={album.trackId}
              alt={`Cover art for ${album.album}`}
              className="h-[66cqw] w-[66cqw] shadow-2xl shadow-black/60"
              rounded="rounded-lg"
            />
          </div>
          <p className="line-clamp-3 break-words text-[8.5cqw] font-extrabold leading-[1.05] tracking-tight text-white">
            {album.album}
          </p>
          {album.artist && <p className="mt-1 truncate text-[4.6cqw] text-white/85">{album.artist}</p>}
          <p className="mt-3 text-[4cqw] text-white/75">
            {d(album.hours)} · {formatNumber(album.plays)} plays across {album.uniqueTracks} songs
          </p>
        </CardFrame>
      ),
    });
  }

  // ── Step G: extra moments (each only when it has something to say) ──

  if (s.seasons) {
    const distinct = new Set(s.seasons.map(x => `${x.track.track}|${x.track.artist}`)).size;
    extras.push({
      score: 0.55 + (distinct >= 3 ? 0.2 : 0),
      card: {
        id: 'seasons',
        label: `Your songs of the seasons: ${s.seasons.map(x => `${SEASON[x.season].label}, ${x.track.track}`).join('; ')}`,
        durationMs: 8000,
        content: (
          <CardFrame background={<CardBackground tone="teal" />}>
            <Kicker>Your year in seasons</Kicker>
            <ul className="my-auto space-y-[5cqw]">
              {s.seasons.map(x => {
                const { label, icon: Icon } = SEASON[x.season];
                return (
                  <li key={x.season}>
                    <p className="mb-2 flex items-center gap-2 text-[3.6cqw] font-bold uppercase tracking-widest text-white/70">
                      <Icon className="h-4 w-4" aria-hidden />
                      {label}
                    </p>
                    <TrackRow track={x.track} onHide={hideTrack(x.track)} />
                  </li>
                );
              })}
            </ul>
          </CardFrame>
        ),
      },
    });
  }

  if (s.months && s.months.length >= 6) {
    extras.push({
      score: 0.35,
      card: {
        id: 'months',
        label: 'Your song of each month',
        durationMs: 9000,
        content: (
          <CardFrame background={<CardBackground tone="slate" />}>
            <Kicker icon={CalendarDays}>Month by month</Kicker>
            <ul className="my-auto space-y-[1.6cqw]">
              {s.months.map(m => (
                <li key={m.month} className="flex items-baseline gap-3">
                  <span className="w-[10cqw] shrink-0 text-[3.6cqw] font-bold uppercase tracking-wider text-white/60">
                    {MONTHS[m.month - 1]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[4cqw] text-white">
                    <span className="font-bold">{m.track.track}</span>
                    {m.track.artist && <span className="text-white/70"> · {m.track.artist}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </CardFrame>
        ),
      },
    });
  }

  if (s.discoveries) {
    const [lead, ...rest] = s.discoveries;
    extras.push({
      score: Math.min(1, 0.65 + 0.08 * s.discoveries.length),
      card: {
        id: 'discoveries',
        label: `New to you in ${story.year}: ${s.discoveries.map(x => x.name).join(', ')}`,
        durationMs: 8000,
        content: (
          <CardFrame background={<CardBackground tone="violet" trackId={lead.topTrack?.trackId} artist={lead.name} />}>
            <Kicker icon={Compass}>New to you</Kicker>
            <div className="flex flex-1 flex-col justify-center py-4">
              <ArtistPhoto trackId={lead.topTrack?.trackId ?? null} name={lead.name} className="h-[40cqw] w-[40cqw]" />
              <div className="mt-6 flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <Headline size="md">{lead.name}</Headline>
                  <Body className="mt-3">
                    You first played them on {formatDate(lead.firstPlayed, 'MMMM d')}. By the end of the year they
                    were your #{lead.rank}.
                  </Body>
                </div>
                <LeaveOutMenu label={lead.name} onLeaveOut={() => ctx.hideArtist(lead.name)} />
              </div>
            </div>
            {rest.length > 0 && (
              <p className="text-[3.8cqw] text-white/75">
                Also new: {rest.slice(0, 3).map(x => `${x.name} (#${x.rank})`).join(', ')}
              </p>
            )}
          </CardFrame>
        ),
      },
    });
  }

  if (s.repeatDay) {
    const r = s.repeatDay;
    extras.push({
      score: Math.min(1, 0.4 + r.plays / 60),
      card: {
        id: 'repeat-day',
        label: `On ${formatDate(r.date, 'MMMM d')} you played ${r.track.track} ${r.plays} times`,
        content: (
          <CardFrame background={<CardBackground tone="rose" trackId={r.track.trackId} />}>
            <Kicker icon={Repeat}>On repeat</Kicker>
            <div className="my-auto">
              <Headline size="xl">
                <span className="tabular-nums">{formatNumber(r.plays)}×</span>
              </Headline>
              <Body>
                On {formatDate(r.date, 'EEEE, MMMM d')} you played {quote(r.track.track)} {formatNumber(r.plays)} times.
              </Body>
            </div>
            <TrackRow track={r.track} onHide={hideTrack(r.track)} />
          </CardFrame>
        ),
      },
    });
  }

  if (s.longestSession) {
    const l = s.longestSession;
    const overnight = l.end < l.start;
    extras.push({
      score: Math.min(1, 0.35 + l.hours / 15),
      card: {
        id: 'longest-session',
        label: `Your longest session: ${d(l.hours)} on ${formatDate(l.date, 'MMMM d')}`,
        content: (
          <CardFrame background={<CardBackground tone="blue" trackId={l.topTrack?.trackId} />}>
            <Kicker icon={Timer}>Your longest session</Kicker>
            <div className="my-auto">
              <Headline size="lg">
                <span className="tabular-nums">{d(l.hours)}</span>
              </Headline>
              <Body>
                {formatDate(l.date, 'EEEE, MMMM d')}, from {l.start} to {l.end}
                {overnight ? ' the next morning' : ''}. {formatNumber(l.plays)} plays, barely a break.
              </Body>
            </div>
            {l.topTrack && (
              <>
                <p className="mb-3 text-[3.8cqw] font-semibold text-white/75">The song you kept coming back to</p>
                <TrackRow track={l.topTrack} onHide={hideTrack(l.topTrack)} />
              </>
            )}
          </CardFrame>
        ),
      },
    });
  }

  if (s.timeOfDay) {
    const t = s.timeOfDay;
    const max = Math.max(...t.byHour, 0.0001);
    extras.push({
      score: 0.45 + Math.min(0.3, Math.max(t.nightShare - 0.08, 0) * 2),
      card: {
        id: 'time-of-day',
        label: `Your peak listening hour: ${hourLabel(t.peakHour)}`,
        content: (
          <CardFrame background={<CardBackground tone="slate" />}>
            <Kicker icon={t.peakHour >= 21 || t.peakHour < 5 ? Moon : Sun}>When you listened</Kicker>
            <div className="my-auto">
              <Headline size="lg">{hourLabel(t.peakHour)}</Headline>
              <Body>was your peak hour. You did most of your listening {partOfDay(t.peakHour)}.</Body>
              <div className="mt-8 flex h-[30cqw] items-end gap-[0.8cqw]" aria-hidden>
                {t.byHour.map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${i === t.peakHour ? 'bg-spotify-green' : 'bg-white/35'}`}
                    style={{ height: `${Math.max((h / max) * 100, 2)}%` }}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[3.2cqw] text-white/60" aria-hidden>
                <span>12 am</span>
                <span>6 am</span>
                <span>12 pm</span>
                <span>6 pm</span>
                <span>11 pm</span>
              </div>
            </div>
          </CardFrame>
        ),
      },
    });
  }

  if (s.countries) {
    const top = s.countries.slice(0, 5);
    const max = top[0].hours;
    extras.push({
      score: 0.8,
      card: {
        id: 'countries',
        label: `You listened in ${s.countries.length} countries: ${s.countries.map(c => c.country).join(', ')}`,
        content: (
          <CardFrame background={<CardBackground tone="teal" />}>
            <Kicker icon={MapPin}>Where you listened</Kicker>
            <div className="my-auto">
              <Headline size="lg">{s.countries.length} countries</Headline>
              <ul className="mt-8 space-y-4">
                {top.map(c => (
                  <li key={c.country}>
                    <div className="flex items-baseline justify-between gap-3 text-[4.2cqw]">
                      <span className="truncate font-bold text-white">{c.country}</span>
                      <span className="shrink-0 tabular-nums text-white/75">{d(c.hours)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
                      <div
                        className="h-full rounded-full bg-spotify-green"
                        style={{ width: `${Math.max((c.hours / max) * 100, 2)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </CardFrame>
        ),
      },
    });
  }

  if (s.comeback) {
    const c = s.comeback;
    extras.push({
      score: 0.9,
      card: {
        id: 'comeback',
        label: `The comeback: ${c.track.track}`,
        content: (
          <CardFrame background={<CardBackground tone="amber" trackId={c.track.trackId} />}>
            <Kicker icon={RotateCcw}>The comeback</Kicker>
            <div className="flex flex-1 items-center justify-center py-4">
              <Cover
                trackId={c.track.trackId}
                alt={`Cover art for ${c.track.track}`}
                className="h-[56cqw] w-[56cqw] shadow-2xl shadow-black/60"
                rounded="rounded-lg"
              />
            </div>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="break-words text-[8cqw] font-extrabold leading-[1.05] tracking-tight text-white">
                  {c.track.track}
                </p>
                <Body className="mt-3">
                  Your #{c.peakRank} in {c.peakYear}. After a quiet {story.year - 1}, it climbed back to #{c.rank}.
                </Body>
              </div>
              <LeaveOutMenu label={c.track.track} onLeaveOut={hideTrack(c.track)} />
            </div>
          </CardFrame>
        ),
      },
    });
  }

  if (s.yearOverYear && !s.yearOverYear.partial && Math.abs(s.yearOverYear.change) >= 0.05) {
    const y = s.yearOverYear;
    const up = y.change > 0;
    extras.push({
      score: Math.min(0.9, 0.5 + Math.abs(y.change)),
      card: {
        id: 'year-over-year',
        label: `${formatPercent(Math.abs(y.change))} ${up ? 'more' : 'less'} listening than in ${y.previousYear}`,
        content: (
          <CardFrame background={<CardBackground tone={up ? 'green' : 'blue'} />}>
            <Kicker icon={up ? TrendingUp : TrendingDown}>Compared with {y.previousYear}</Kicker>
            <div className="my-auto">
              <Headline size="xl">
                <span className="tabular-nums">
                  {up ? '+' : '−'}
                  {formatPercent(Math.abs(y.change))}
                </span>
              </Headline>
              <Body>
                {up ? 'more' : 'less'} listening than in {y.previousYear}: {d(y.previousHours)} then,{' '}
                {d(story.totalHours)} now.
              </Body>
            </div>
          </CardFrame>
        ),
      },
    });
  }

  if (s.skips && Math.abs(s.skips.rate - s.skips.lifetimeRate) >= 0.05) {
    const k = s.skips;
    const more = k.rate > k.lifetimeRate;
    extras.push({
      score: 0.4,
      card: {
        id: 'skips',
        label: `You skipped ${formatPercent(k.rate)} of songs this year`,
        content: (
          <CardFrame background={<CardBackground tone="slate" />}>
            <Kicker icon={SkipForward}>Skip check</Kicker>
            <div className="my-auto">
              <Headline size="xl">
                <span className="tabular-nums">{formatPercent(k.rate)}</span>
              </Headline>
              <Body>
                of the songs you started, you skipped. That&apos;s {more ? 'pickier' : 'more patient'} than your usual{' '}
                {formatPercent(k.lifetimeRate)}.
              </Body>
            </div>
          </CardFrame>
        ),
      },
    });
  }

  // 6. Personality
  const tail: StoryCard[] = [];
  if (story.personality) {
    const { main, touch } = story.personality;
    const Icon = PERSONALITY_ICON[main.icon];
    tail.push({
      id: 'personality',
      label: `Your listening personality: ${main.title}${touch ? `, with a touch of ${touch.title}` : ''}`,
      durationMs: 9000,
      content: (
        <CardFrame background={<CardBackground tone="violet" />}>
          <Kicker>Your listening personality</Kicker>
          <div className="my-auto">
            <span className="flex h-[22cqw] w-[22cqw] items-center justify-center rounded-full bg-white/15">
              <Icon className="h-1/2 w-1/2 text-white" aria-hidden />
            </span>
            <Headline size="lg">{main.title}</Headline>
            {touch && (
              <p className="mt-2 text-[4.8cqw] font-semibold text-white/85">
                with a touch of {touch.title.replace(/^The /, '')}
              </p>
            )}
            <Body>{main.description}</Body>
            <div className="mt-6">
              <Pill>{main.evidence}</Pill>
            </div>
          </div>
        </CardFrame>
      ),
    });
  }

  // 7. Summary (last; the future share image)
  tail.push({
    id: 'summary',
    label: `Your ${story.year} summary`,
    durationMs: 12000,
    content: <SummaryCard story={story} unit={unit} />,
  });

  // Fit the most striking extras into the card budget, then keep them in narrative order.
  const room = Math.max(MAX_CARDS - core.length - tail.length, 0);
  const chosen = new Set(
    [...extras]
      .sort((a, b) => b.score - a.score)
      .slice(0, room)
      .map(e => e.card.id)
  );
  const middle = extras.filter(e => chosen.has(e.card.id)).map(e => e.card);

  return [...core, ...middle, ...tail];
}

function SummaryCard({ story, unit }: { story: StoryData; unit: TimeUnit }) {
  const artist = story.topArtist;
  return (
    <CardFrame
      background={<CardBackground tone="green" trackId={artist?.topTrack?.trackId} artist={artist?.name} />}
    >
      <p className="text-[3.8cqw] font-bold uppercase tracking-[0.14em] text-white/80">{story.year} · Unwrapped</p>
      <div className="flex flex-1 items-center justify-center py-3">
        {artist ? (
          <ArtistPhoto trackId={artist.topTrack?.trackId ?? null} name={artist.name} className="h-[42cqw] w-[42cqw]" />
        ) : (
          <Cover trackId={story.topTracks[0]?.trackId ?? null} alt="" className="h-[42cqw] w-[42cqw]" />
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <div className="min-w-0">
          <p className="text-[3.4cqw] font-semibold text-white/70">Top artist</p>
          <p className="mt-1 line-clamp-2 break-words text-[4.6cqw] font-bold leading-tight text-white">
            {artist?.name ?? '—'}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[3.4cqw] font-semibold text-white/70">Listening time</p>
          <p className="mt-1 text-[4.6cqw] font-bold tabular-nums leading-tight text-white">
            {formatDuration(story.totalHours, unit)}
          </p>
        </div>
        <div className="col-span-2 min-w-0">
          <p className="text-[3.4cqw] font-semibold text-white/70">Top songs</p>
          <ol className="mt-1 space-y-0.5">
            {story.topTracks.map((t, i) => (
              <li key={`${t.track}-${t.artist}`} className="flex gap-2 text-[4.2cqw] leading-snug text-white">
                <span className="w-[4cqw] shrink-0 font-bold tabular-nums text-white/70">{i + 1}</span>
                <span className="min-w-0 truncate font-semibold">{t.track}</span>
              </li>
            ))}
          </ol>
        </div>
        {story.personality && (
          <div className="col-span-2 min-w-0">
            <p className="text-[3.4cqw] font-semibold text-white/70">Listening personality</p>
            <p className="mt-1 text-[4.6cqw] font-bold leading-tight text-white">{story.personality.main.title}</p>
          </div>
        )}
      </div>
    </CardFrame>
  );
}

/** Start fetching the cover art and artist photos the story will show (only public track IDs go to Spotify). */
export function prefetchStoryArt(story: StoryData) {
  const s = story.stats;
  if (story.topArtist) prefetchSpotifyArtist(story.topArtist.topTrack?.trackId, story.topArtist.name);
  [
    story.firstSong?.trackId,
    ...story.topTracks.map(t => t.trackId),
    story.topAlbum?.trackId,
    s.repeatDay?.track.trackId,
    s.longestSession?.topTrack?.trackId,
    s.comeback?.track.trackId,
    ...(s.seasons ?? []).map(x => x.track.trackId),
  ].forEach(id => prefetchSpotifyArtwork(id));
  const lead = s.discoveries?.[0];
  if (lead) prefetchSpotifyArtist(lead.topTrack?.trackId, lead.name);
}
