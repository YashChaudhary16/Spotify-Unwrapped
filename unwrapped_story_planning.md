# Unwrapped Story — Feature Plan

The pitch: **Wrapped shows your year. Unwrapped shows the story of your life in music, and brings you back to songs you lost.**

This file plans the next big body of work in two parts, built in this order:
1. **Part 1 — "Your Unwrapped Story"** (Steps A–K): a Wrapped-style, full-screen, tap-through story for any year, ending in an image you can share.
2. **Part 2 — "Wrapped Can't Do"** (Steps L–R): features that need the *whole* history, which Wrapped (one year, roughly Jan–Oct) structurally can't offer.
3. **Part 3 — Showcase** (Steps S–V): packaging the project so it shows well to someone at Spotify.

**How to use this file** (same rules as `PLANNING.md`)
- Read `PLANNING.md` first. Its Decisions, design tokens and working rules still apply unless a decision here overrides them for story mode.
- **Decisions** records what was agreed. Items marked *(proposed)* need the user's OK before or while building the step that uses them.
- **Roadmap** is the checklist. Work the steps in order and tick `[x]` as items land. Each step ends with a **Done when** line.
- **Work Log** at the bottom gets one entry per session, newest first. `PLANNING.md` keeps its own Work Log; add a one-line pointer there too.
- Claude does not commit. The user reviews and commits (pushing to `main` deploys).

---

## Decisions

| Topic | Decision |
|---|---|
| Scope order | Story mode first (Part 1), then "Wrapped Can't Do" (Part 2), then Showcase (Part 3). Agreed 2026-11-12. |
| Privacy | Everything is computed in the browser. Story data, share images and comparisons never go to our server. Only public track/artist IDs go to Spotify (oEmbed, embeds), as today. |
| Honesty | **No percentile claims** against other listeners ("top 0.5% of fans"): we have no data from other users. Never fake a comparison. |
| Audio features | **Don't use** Spotify's audio-features API (danceability, valence, …). It was deprecated for new apps in late 2024. |
| Story scope | One story per calendar year, using the **full year** (Wrapped stops around October; we don't). *(proposed)* |
| Minimum data | A year needs at least ~10 hours and 30 active days to get a story; otherwise its "Play story" button is hidden. *(proposed — tune on real data)* |
| Story palette | Inside story mode only, cards may use **bold full-bleed color blocks** (cover-art colors and a curated set of saturated backgrounds), unlike the dashboard rule that green is for data only. *(proposed — needs user OK, since it relaxes a dashboard rule)* |
| Incognito stat | "Guilty pleasure" (most-played track in private sessions) is **off by default** and only shows after the viewer opts in on that card. Never on the share image unless chosen. *(proposed)* |
| Audio in story | **Undecided.** The user rejected a playable track in "First song played", so background previews in the story need an explicit yes (see Step H). |
| Share image | Rendered on a `<canvas>` in the browser with no new dependency (cover CDN sends CORS `*`, already verified). 9:16 story size and 1:1 square. *(proposed)* |
| Entry point | A "Play your {year} story" button on the Overview tab, plus a year picker; linkable as `#story-2025`. *(proposed)* |

### Rejected / not doing (don't re-suggest)
- Percentile comparisons with other users (no data).
- Mood/energy stats from audio features (deprecated API).
- `theme=0` on Spotify players (forces the gray player).
- A playable track on the "First song played" card.

---

## Data available (for planning)

From `ProcessedRecord` (`lib/preprocessing.ts`), music only, deduplicated:
`timestamp` (local, via country timezone), `Year`/`Month`/`Date`/`Hour`/`Day_Name`, `hours`/`minutes` and `ms_played`, track, artist, album, `track_id`, `reason_start`, `reason_end`, `shuffle`, `skipped`, `offline`, `incognito_mode`, `platform_clean`, `conn_country_full`.

**Not available:** genres, track length (could be estimated as the longest `ms_played` for a track, or read from the embed page's `duration` through the existing server route), release dates (the embed page has `releaseDate`), other users' data.

---

## Roadmap

## Part 1 — "Your Unwrapped Story"

### Step A — Story data layer ✅ (2026-11-12)
Goal: one pure function that turns a year of records into everything the story needs, with no UI.
- [x] `lib/story.ts`: `buildStory(records, year) → StoryData | null` (pure, no React). It takes the **full** history and filters to the year itself, so later steps can compare with earlier years without a second parameter.
- [x] Core numbers: total listening time and a relatable equivalent ("that's 53 days straight", "≈ 640 flights from Delhi to Mumbai" style; keep a small list of equivalents), active days, unique tracks/artists.
- [x] Top artist (time, share, play count) with `trackId` of their top song (for artwork via `/api/spotify/artist`).
- [x] Top 5 tracks and top album, each with a `trackId` for cover art.
- [x] `isStoryEligible(records, year)` and `storyYears(records)` (per-year totals plus eligibility, for Step E) using the minimum-data rule.
- [x] ~~Reuse helpers from `lib/analytics.ts`~~: it has no reusable helpers (one big `calculateAnalytics`), so `story.ts` does its own single pass. It keys songs by **name + artist** (analytics uses name only).
- [x] Check timings with the largest real history (target: under 150 ms per year on a laptop) and with sample data.

**Done when:** `buildStory` returns sensible values for every year of the sample data and the user's real data (checked by logging, not UI).

### Step B — Extra story stats
Goal: the "only you" moments. Each stat returns `null` when it isn't interesting, so the card is skipped instead of showing something weak.
- [ ] **Song of each season** (Dec–Feb, Mar–May, Jun–Aug, Sep–Nov) and **song of each month**.
- [ ] **Discoveries:** artists first played this year (never in earlier years) who reached your top 10/20.
- [ ] **Longest session:** continuous listening with gaps under 30 minutes. Date, length, and its most-played track.
- [ ] **Repeat day:** the most plays of a single track in one day ("On 3 March you played *X* 14 times").
- [ ] **Time-of-day profile:** peak hour, and night (00–05) vs morning (05–11) share.
- [ ] **Where you listened:** countries this year (only if more than one).
- [ ] **Year over year:** listening time change vs the previous year; "#1 artist N years running" streak.
- [ ] **Comeback song:** a track big in an earlier year, absent the year before, back in this year's top 50.
- [ ] **Guilty pleasure:** most-played track with `incognito_mode` (computed always, shown only on opt-in).
- [ ] **Skip style:** skip rate this year (`skipped` / `reason_end = fwdbtn`) vs lifetime.

**Done when:** each stat is computed and returns `null` correctly on thin years (e.g. the first, partial year of a history).

### Step C — Listening personality
Goal: a fun, shareable label built from rules that can be explained.
- [ ] `lib/personality.ts`: a list of archetypes, each with a rule, a score, a title, a one-line description and an icon:
  - **The Loyalist:** top artist is more than 25% of the year.
  - **The Explorer:** high share of first-time artists.
  - **The Night Owl / The Early Bird:** night or morning share well above average.
  - **The Repeat Offender:** high replays per day of the same track.
  - **The Skipper:** skip rate above ~40%.
  - **The Deep Diver:** listens to albums in order (`reason_start = trackdone` within one album).
  - **The Shuffler:** shuffle share above ~80%.
  - **The Globetrotter:** listening in 3 or more countries.
- [ ] The strongest archetype wins (score relative to its threshold). Show the runner-up as "with a touch of …".
- [ ] Each personality shows the evidence ("38% of your listening was Arijit Singh").
- [ ] Tune thresholds on sample data and the user's real years so results vary by year and aren't always the same label.

**Done when:** every eligible year gets a personality, and the user agrees the labels feel right for their own years.

### Step D — Story player shell
Goal: the full-screen, tap-through player, with placeholder cards.
- [ ] `components/story/StoryPlayer.tsx`: full-screen overlay (portal), dark backdrop, card at 9:16 on desktop (centered) and full screen on mobile.
- [ ] Segmented progress bars at the top; auto-advance (~6–8 s per card, tunable per card).
- [ ] Navigation: tap right/left half, ← → keys, swipe on touch; hold (or Space) to pause; Esc/✕ to close.
- [ ] Hash routing `#story-<year>` so a story is linkable and Back closes it.
- [ ] Accessibility: focus trap, `aria-live` announcement per card, visible pause/play button, everything works by keyboard; `prefers-reduced-motion` turns off auto-advance and big animations.
- [ ] Preload the next card's artwork.

**Done when:** placeholder cards can be stepped through by tap, keys and swipe, on mobile and desktop.

### Step E — Entry point
- [ ] "Play your {year} story" hero button on Overview, for the latest eligible year, with a small year picker for the others.
- [ ] When a single year is selected in the header filter, the button uses that year.
- [ ] Ineligible years are hidden (or disabled with "Not enough listening in {year}").

**Done when:** the user can open a story for any eligible year from the dashboard.

### Step F — Card set v1 (the core story)
Goal: a complete, short story.
1. [ ] **Intro:** "{year}, unwrapped." Includes the year's first song.
2. [ ] **Total time:** a big counting-up number in the selected time unit (`formatDuration`), plus the equivalent.
3. [ ] **Top artist:** photo and Spotify artist colors (`useSpotifyArtist`), time and share.
4. [ ] **Top 5 songs:** cover art (`useSpotifyArtwork`), revealed one by one from #5 to #1.
5. [ ] **Top album:** cover art and play count.
6. [ ] **Personality:** title, description and evidence.
7. [ ] **Summary:** top artist, top 5 songs, total time, personality. This is the card that becomes the share image.
- [ ] Fallbacks for sample data and unavailable tracks (no artwork): gradient tiles, no broken images.

**Done when:** a full story plays end to end for real and sample data.

### Step G — Card set v2 (the extra stats)
- [ ] One card per non-null stat from Step B, in a fixed narrative order: seasons → discoveries → repeat day → longest session → time of day → travel → comeback → year over year → (guilty pleasure, opt-in).
- [ ] Cap the story at about 12–14 cards. If more stats qualify, keep the most striking ones (rank by how unusual the value is).
- [ ] Opt-in UI for the guilty-pleasure card ("Reveal your guilty pleasure?" → tap to reveal / skip).

**Done when:** different years produce visibly different stories.

### Step H — Visual and motion polish
- [ ] Card backgrounds: cover-art dominant colors where there's art, otherwise a curated set of bold colors (needs the **Story palette** decision).
- [ ] Big type (Figtree, heavy weights), tabular numbers for counters.
- [ ] Motion: count-ups, staggered reveals, subtle parallax on artwork. All of it is skipped under `prefers-reduced-motion`.
- [ ] Contrast check on every background (white text ≥ 4.5:1; the existing darkening approach in `useSpotifyArtwork` gives ≥ 7:1).
- [ ] **(Needs user decision)** Optional background audio: a 30 s preview of the card's song. The embed page exposes `audioPreview.url` (seen on 2026-11-12), but it's null for some tracks. Muted by default, with a speaker toggle. Skip this item if the user says no.

**Done when:** the user is happy with the look on a phone and a laptop.

### Step I — Share image
- [ ] `lib/shareImage.ts`: draw the summary card on a `<canvas>` (9:16 at 1080×1920, and 1:1 at 1080×1080) with cover art, names, numbers, personality and a small "Unwrapped" mark.
- [ ] Mobile: the Web Share API with the image file; desktop: download PNG and "Copy image".
- [ ] Load fonts before drawing (`document.fonts.ready`); truncate long names with "…".
- [ ] Privacy: the image is generated on the device; nothing is uploaded.
- [ ] Optional toggles before sharing: hide total time, include personality, include guilty pleasure.

**Done when:** a PNG is downloaded or shared on desktop and mobile and looks right with long names, missing artwork and every time unit.

### Step J — Sample-data story
- [ ] The story works fully on "Try with sample data" (no track IDs → gradient art), so a recruiter or engineer can try it without requesting their own data.
- [ ] Sample data is shaped so the demo story is interesting (a clear personality, a discovery, a comeback).

**Done when:** the sample story is fun to tap through.

### Step K — QA and hardening
- [ ] Edge cases: first/partial year, a year with one artist, only offline plays, all plays in incognito, very long names, RTL and non-Latin names.
- [ ] Performance: no jank on a mid-range phone; artwork requests capped and cached.
- [ ] Accessibility pass (keyboard only, screen reader read-through, reduced motion).
- [ ] `tsc`, `next lint`, `next build`; viewed in a browser on mobile and desktop.

**Done when:** all checks pass and the user has reviewed it in a browser.

## Part 2 — "Wrapped Can't Do"

Ordered from easiest to hardest. Each one works on the **whole history** (all years).

### Step L — On this day
- [ ] What you played on today's date 1, 3, 5, … years ago (and a date picker for any day), with cover art and players (`LazySpotifyEmbed` with the unavailable-track fallback).
- [ ] A small card on Overview when there's a match for today.

**Done when:** today's card shows for real data and hides when there's nothing.

### Step M — Forgotten favourites
- [ ] Tracks with high past play counts and no plays in the last 2+ years ("You played *Phir Kabhi* 212 times in 2020. Last play: 3 years ago").
- [ ] **"Copy as playlist":** copy the `spotify:track:` links of the list to the clipboard. Spotify's desktop app lets you paste them straight into a playlist, with no login (verify the paste flow before shipping, and show a two-line how-to).
- [ ] Unavailable tracks show the "Find on Spotify" fallback and are left out of the copied list.

**Done when:** the list is sensible on real data and the pasted playlist works in the Spotify desktop app.

### Step N — Loyalty and drift
- [ ] A ranking chart: your top artists' rank year by year (lines across years).
- [ ] "Longest-running artists" (years in your top 10) and "artists you left behind" (top 10 once, gone since).
- [ ] Can feed the story's "#1 for N years running" card.

**Done when:** the chart reads clearly with 3+ years of data and degrades gracefully with 1–2.

### Step O — Skip stories
- [ ] Estimate track length (longest `ms_played` across plays, or the embed page's `duration` through the server route for top tracks only).
- [ ] "You skip *X* at 0:31 every time": the median skip point for often-skipped tracks.
- [ ] "Never finished, always back": tracks you start often but rarely finish.

**Done when:** skip points look plausible for tracks the user knows.

### Step P — Life chapters
- [ ] Detect events from the data: a lasting change in `conn_country_full` (a move) vs short visits (trips), a new `platform_clean` (new device), and big shifts in listening hours or time of day.
- [ ] A timeline with auto-detected chapters ("Sept 2024: moved to the United States, and your late-night listening dropped 40%").
- [ ] User notes on the timeline ("started college"), stored in `localStorage` only (per device, never sent anywhere).

**Done when:** the detected chapters match the user's real life events.

### Step Q — Listening eras
- [ ] Group consecutive months with a similar artist mix (cosine similarity of monthly artist-share vectors; split where similarity drops) into eras.
- [ ] Name each era after its dominant artist or album ("Your Arijit era, Mar 2021 – Aug 2022"), with a color from its cover art and a signature song.
- [ ] A scrollable eras timeline; eras can also appear as a lifetime story ("Your life in music" story using the Part 1 player).

**Done when:** the eras on the user's real history feel right to them (tune the split threshold).

### Step R — Lifetime Blend
- [ ] Load a second person's export (parsed in the same Web Worker, in the browser only).
- [ ] Taste overlap: shared artists and tracks, overlap score per year, "you both had an Arijit era, four years apart" (uses Step Q).
- [ ] A Blend summary card and share image (reuses Step I).
- [ ] Clear privacy copy: the friend's file never leaves this browser.

**Done when:** two exports compare correctly, including when they share no years.

## Part 3 — Showcase (for sharing with Spotify)

### Step S — Performance and engineering notes
- [ ] Measure and record: parse time and memory for the largest real history (e.g. 100k+ rows), time to first dashboard, story build time.
- [ ] README section: architecture (Web Worker, privacy-first, no login), with those numbers.

### Step T — Case study
- [ ] A one-page case study (in the app or README): problem, users, decisions and trade-offs, what was cut and why, what's next. `PLANNING.md` and this file are the raw material.

### Step U — Demo video
- [ ] A 60-second screen recording: upload or sample data → dashboard → story → share image → one "Wrapped can't do" feature.

### Step V — Branding and polish check
- [ ] Keep the "Not affiliated with Spotify" disclaimer; no Spotify logo used as our own; Spotify marks only where they belong (players, "Find on Spotify").
- [ ] Final pass on landing page copy so the pitch ("your life in music") is clear in five seconds.

---

## Open questions (ask when the step comes up)
- **Step D/H:** Is the bold story palette OK inside story mode?
- **Step H:** Background song previews in the story: yes or no?
- **Step B/C:** Any archetypes or stats to add or drop after seeing them on real data?
- **Step B/C:** Should ambient / sleep sounds (rain, nature tracks) count? On the user's real data, "Nature Therapy" is the 2025 top artist and rain sounds are a 2024 top-5 song. Options: count everything (honest), or offer a "leave out sleep/ambient sounds" toggle (needs a way to detect them, e.g. a user-picked list of artists).
- **Step E:** Should the story also be offered for "All time" (a lifetime story), or wait for Step Q?

---

## Work Log

<!-- Template — copy for each session, newest on top
### YYYY-MM-DD — <short title>
**Done**
- …
**Changed files**
- …
**Notes / decisions**
- …
**Next**
- …
-->

### 2026-11-12 — Step A: story data layer
**Done**
- New `lib/story.ts` (pure, no React):
  - `buildStory(records, year)`: year totals (time, plays, active days, unique tracks/artists), first/last date and a `partialYear` flag, relatable equivalents (days straight, films, nights of sleep, marathons), first song, top artist (share, plays, top song), top 5 songs and top album, each with a Spotify ID for artwork.
  - `storyYears(records)` and `isStoryEligible(records, year)`, using the minimum-data rule (≥ 10 hours and ≥ 30 active days).
- Songs are keyed by **name + artist**. When a song has several Spotify IDs (re-releases, relinking), the **most recently played ID** is used, because older IDs are the ones that tend to become "Not playable here".
- `partialYear` means more than two weeks are missing at either end, so an export that ends on Dec 22 still counts as a full year.

**Checked** (a local script in the scratchpad; nothing committed, nothing sent anywhere)
- Sample data: 2023 and 2024 both eligible, with sensible top lists.
- The user's real history (279k plays, 2019–2025): every year is eligible. 2019 is correctly partial (starts Mar 8). Top artists by year: Ludwig Göransson, Billie Eilish ×2, Ramin Djawadi ×2, Hans Zimmer, Nature Therapy.
- `buildStory` takes **25–63 ms per year** on 279k records (target was under 150 ms). Preprocessing the whole history takes about 3.7 s in Node.

**Changed files**
- New: `lib/story.ts`

**Notes / decisions**
- New open question: whether ambient/sleep sounds should count (see Open questions).
- `tsc`, `next lint` and `next build` pass. No UI yet.

**Next**
- Step B: extra story stats.

### 2026-11-12 — Plan created
**Done**
- Wrote this plan: Part 1 story mode (Steps A–K), Part 2 "Wrapped Can't Do" (Steps L–R), Part 3 showcase (Steps S–V).

**Notes / decisions**
- Scope order agreed with the user: story first, "Wrapped Can't Do" later.
- Items marked *(proposed)* in Decisions still need the user's OK.

**Next**
- Step A: `lib/story.ts` data layer.
