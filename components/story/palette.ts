/**
 * Story backgrounds. These are deep, tinted gradients in the app's dark style. Whether the story switches to
 * bold full-bleed color blocks is the Step H decision ("Story palette" in unwrapped_story_planning.md);
 * changing the values here restyles every card.
 */
export const STORY_TONES = {
  violet: 'linear-gradient(165deg, #3b2a6b 0%, #1d1536 45%, #121212 100%)',
  green: 'linear-gradient(165deg, #1f5a3a 0%, #13301f 45%, #121212 100%)',
  blue: 'linear-gradient(165deg, #1f3f6b 0%, #142640 45%, #121212 100%)',
  rose: 'linear-gradient(165deg, #6b2a45 0%, #36152a 45%, #121212 100%)',
  amber: 'linear-gradient(165deg, #6b4a1f 0%, #362612 45%, #121212 100%)',
  teal: 'linear-gradient(165deg, #1f5a5a 0%, #123232 45%, #121212 100%)',
  slate: 'linear-gradient(165deg, #34343f 0%, #1c1c22 45%, #121212 100%)',
} as const;

export type StoryTone = keyof typeof STORY_TONES;

/** Background from an artwork color (CSS rgb()), fading into the page color. */
export const tintBackground = (color: string) => `linear-gradient(170deg, ${color} 0%, ${color} 18%, #121212 100%)`;
