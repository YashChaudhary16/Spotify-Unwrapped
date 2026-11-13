/**
 * Phrases that only show up in ambient / sleep-sound releases (rain, white noise, …). Shared by the story
 * (`detectAmbient` in lib/story.ts) and scripts/build-demo-history.mjs, so both leave out the same plays.
 *
 * Deliberately strict: single words like "rain", "birds", "ocean" or "sleep" also appear in real songs
 * ("Ocean Eyes", "Birds", Vancouver Sleep Clinic), so they are not enough on their own. Not "\d+ Hz" either:
 * pop releases use it too (JVKE, "… feels like (554Hz)"). Matched against "artist | album | track".
 */
export const AMBIENT_PHRASES = new RegExp(
  [
    'rain ?sounds?',
    'sounds? of (the )?(rain|nature|ocean|forest|thunder)',
    'nature sounds?',
    '(white|brown|pink|green) noise',
    'thunder ?storms?',
    'rain(fall)? (and|&) thunder',
    'heavy rain',
    'gentle rain',
    'rainstorm',
    'for (deep )?sleep(ing)?',
    'sleep sounds?',
    'sleep (&|and) relax',
    'relaxing sounds?',
    'ambien(ce|t sounds?)',
    'asmr',
    'binaural',
    'cricket sounds?',
    'forest rain',
    'rain ?forest',
    'rainforest sounds?',
    'ocean waves',
    'fan noise',
  ].join('|'),
  'i'
);

/** An artist counts as ambient when at least this share of their listening matches the phrases. */
export const AMBIENT_ARTIST_SHARE = 0.5;
