import type { StoryData, StoryHabits } from './story';

/**
 * Listening personality for the story (unwrapped_story_planning.md, Step C).
 *
 * Each archetype has one measurable habit and a threshold. Its score is `value / threshold`, so 1.0 means
 * "just qualifies". The highest score of at least 1 wins, and the next one (also ≥ 1) is shown as
 * "with a touch of …". If nothing qualifies, the viewer is an All-Rounder. Every label comes with the
 * number behind it, so it never feels made up.
 *
 * Thresholds are meant for listeners in general, not tuned to one history. They were checked on the sample
 * data and on a real 7-year history (see the Work Log) to make sure labels vary from year to year.
 */

export type PersonalityId =
  | 'loyalist'
  | 'explorer'
  | 'night-owl'
  | 'early-bird'
  | 'shuffler'
  | 'skipper'
  | 'repeat-offender'
  | 'deep-diver'
  | 'marathoner'
  | 'globetrotter'
  | 'all-rounder';

/** lucide-react icon names; the UI maps them to components. */
export type PersonalityIcon =
  | 'Heart'
  | 'Compass'
  | 'Moon'
  | 'Sunrise'
  | 'Shuffle'
  | 'SkipForward'
  | 'Repeat'
  | 'Disc3'
  | 'Timer'
  | 'Plane'
  | 'Sparkles';

export interface Personality {
  id: PersonalityId;
  title: string;
  description: string;
  icon: PersonalityIcon;
  /** The number behind the label, e.g. "38% of your listening was Arijit Singh". */
  evidence: string;
  /** value / threshold (≥ 1 qualifies). 0 for the All-Rounder. */
  score: number;
}

export interface StoryPersonality {
  main: Personality;
  /** Second qualifying archetype, shown as "with a touch of …". */
  touch: Personality | null;
  /** Every archetype's score, highest first (for tuning and debugging). */
  scores: { id: PersonalityId; score: number }[];
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/** Play-based habits need enough plays to mean anything. */
const MIN_PLAYS = 100;

interface Archetype {
  id: Exclude<PersonalityId, 'all-rounder'>;
  title: string;
  description: string;
  icon: PersonalityIcon;
  threshold: number;
  /** The habit value, or null when it can't be measured for this year. */
  value: (h: StoryHabits, story: StoryData) => number | null;
  evidence: (value: number, story: StoryData) => string;
}

const ARCHETYPES: Archetype[] = [
  {
    id: 'loyalist',
    title: 'The Loyalist',
    description: 'You found your artist and stayed. Devotion is your genre.',
    icon: 'Heart',
    threshold: 0.2,
    value: h => h.topArtistShare,
    evidence: (v, s) => `${pct(v)} of your listening was ${s.topArtist?.name ?? 'one artist'}`,
  },
  {
    id: 'explorer',
    title: 'The Explorer',
    description: 'New names, new sounds. Your library never sits still.',
    icon: 'Compass',
    threshold: 0.25,
    value: h => h.newArtistShare,
    evidence: v => `${pct(v)} of your listening was artists you'd never played before`,
  },
  {
    id: 'night-owl',
    title: 'The Night Owl',
    description: 'Your best listening happens after everyone else has gone to sleep.',
    icon: 'Moon',
    threshold: 0.15,
    value: h => h.nightShare,
    evidence: v => `${pct(v)} of your listening happened between midnight and 5 am`,
  },
  {
    id: 'early-bird',
    title: 'The Early Bird',
    description: 'Music is how your day starts, and it starts early.',
    icon: 'Sunrise',
    threshold: 0.33,
    value: h => h.morningShare,
    evidence: v => `${pct(v)} of your listening happened between 5 and 11 am`,
  },
  {
    id: 'shuffler',
    title: 'The Shuffler',
    description: 'You let the music surprise you. Order is overrated.',
    icon: 'Shuffle',
    threshold: 0.85,
    value: h => (h.plays >= MIN_PLAYS ? h.shuffleShare : null),
    evidence: v => `${pct(v)} of your plays were on shuffle`,
  },
  {
    id: 'skipper',
    title: 'The Skipper',
    description: 'You know what you want within seconds, and you go and find it.',
    icon: 'SkipForward',
    threshold: 0.35,
    value: h => (h.plays >= MIN_PLAYS ? h.skipRate : null),
    evidence: v => `You skipped ${pct(v)} of the songs you started`,
  },
  {
    id: 'repeat-offender',
    title: 'The Repeat Offender',
    description: 'When a song gets you, it really gets you. Again. And again.',
    icon: 'Repeat',
    threshold: 0.33,
    value: h => (h.plays >= MIN_PLAYS ? h.repeatShare : null),
    evidence: v => `${pct(v)} of your plays were songs you'd already played that day`,
  },
  {
    id: 'deep-diver',
    title: 'The Deep Diver',
    description: 'Albums, front to back, the way the artist meant them.',
    icon: 'Disc3',
    threshold: 0.2,
    value: h => (h.plays >= MIN_PLAYS ? h.albumFlowShare : null),
    evidence: v => `${pct(v)} of your plays followed an album in order`,
  },
  {
    id: 'marathoner',
    title: 'The Marathoner',
    description: 'You don’t press play, you settle in. Hours at a time.',
    icon: 'Timer',
    threshold: 0.35,
    value: h => h.longSessionShare,
    evidence: v => `${pct(v)} of your listening came in sessions of 3+ hours`,
  },
  {
    id: 'globetrotter',
    title: 'The Globetrotter',
    description: 'Your soundtrack has a passport. It went where you went.',
    icon: 'Plane',
    threshold: 3,
    value: h => (h.countries >= 2 ? h.countries : null),
    evidence: v => `You listened in ${v} countries`,
  },
];

const ALL_ROUNDER: Omit<Personality, 'evidence'> = {
  id: 'all-rounder',
  title: 'The All-Rounder',
  description: 'No single habit runs the show. You mix it up, and it works.',
  icon: 'Sparkles',
  score: 0,
};

/** The listening personality for one story year. */
export function getPersonality(story: StoryData): StoryPersonality | null {
  const habits = story.stats.habits;
  if (!habits) return null;

  const candidates: Personality[] = [];
  for (const a of ARCHETYPES) {
    const value = a.value(habits, story);
    if (value === null || !Number.isFinite(value)) continue;
    candidates.push({
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      evidence: a.evidence(value, story),
      score: value / a.threshold,
    });
  }
  candidates.sort((x, y) => y.score - x.score);
  const qualifying = candidates.filter(c => c.score >= 1);

  const main: Personality = qualifying[0] ?? {
    ...ALL_ROUNDER,
    evidence: `${story.uniqueArtists.toLocaleString('en-US')} artists, and no single habit above the rest`,
  };

  return {
    main,
    touch: qualifying[1] ?? null,
    scores: candidates.map(c => ({ id: c.id, score: c.score })),
  };
}
