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
| Private sessions | Plays with `incognito_mode` **count toward totals** (time, plays, active days) but are **never named or ranked** in the story. User decision 2026-11-12. |
| Ambient / sleep sounds | Same rule as private sessions: counted in totals, never named. Detected automatically by strict phrases (`detectAmbient` in `lib/story.ts`), plus a **"Leave out of story" list** the viewer edits (Step E). User decision 2026-11-12. |
| Left-out footnote | **No mention** in the story of how much private or ambient listening was left out; the total simply includes it. User decision 2026-11-12. |
| Audio in story | **Undecided.** The user rejected a playable track in "First song played", so background previews in the story need an explicit yes (see Step H). |
| Share image | Rendered on a `<canvas>` in the browser with no new dependency (cover CDN sends CORS `*`, already verified). 9:16 story size and 1:1 square. *(proposed)* |
| Entry point | A "Play your {year} story" button on the Overview tab, plus a year picker; linkable as `#story-2025`. *(proposed)* |

### Rejected / not doing (don't re-suggest)
- Percentile comparisons with other users (no data).
- Mood/energy stats from audio features (deprecated API).
- `theme=0` on Spotify players (forces the gray player).
- A playable track on the "First song played" card.
- A "guilty pleasure" card from private-session plays: private sessions are never named (decision 2026-11-12).
- A footnote saying how much private or ambient listening the story left out.

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

### Step B — Extra story stats ✅ (2026-11-12)
Goal: the "only you" moments. Each stat returns `null` when it isn't interesting, so the card is skipped instead of showing something weak.
- [x] **Song of each season** (Dec–Feb, Mar–May, Jun–Aug, Sep–Nov) and **song of each month**.
- [x] **Discoveries:** artists first played this year (never in earlier years) who reached your top 10/20.
- [x] **Longest session:** continuous listening with gaps under 30 minutes. Date, length, and its most-played track.
- [x] **Repeat day:** the most plays of a single track in one day ("On 3 March you played *X* 14 times").
- [x] **Time-of-day profile:** peak hour, and night (00–05) vs morning (05–11) share.
- [x] **Where you listened:** countries this year with at least 1 hour of listening (only if more than one). Short blips like layovers are ignored.
- [x] **Year over year:** listening time change vs the previous year; "#1 artist N years running" streak.
- [x] **Comeback song:** a track in an earlier year's top 50, **barely played (under 1 hour)** the year before, back in this year's top 50. ("Absent" was too strict: no comebacks at all on the real history.)
- [x] **Skip style:** skip rate this year (`skipped` / `reason_end = fwdbtn`) vs lifetime.

**Done when:** each stat is computed and returns `null` correctly on thin years (e.g. the first, partial year of a history).

### Step C — Listening personality ✅ (2026-11-12; waiting on the user's verdict on the labels)
Goal: a fun, shareable label built from rules that can be explained.
- [x] `lib/personality.ts`: a list of archetypes, each with a rule, a score, a title, a one-line description and an icon (thresholds as built; score = value ÷ threshold):
  - **The Loyalist:** top artist ≥ 20% of the year's visible listening.
  - **The Explorer:** ≥ 25% of listening on artists first played this year.
  - **The Night Owl / The Early Bird:** ≥ 15% of listening between 00–05, or ≥ 33% between 05–11.
  - **The Repeat Offender:** ≥ 33% of plays (30 s+) repeat a song already played that day.
  - **The Skipper:** skip rate ≥ 35%.
  - **The Deep Diver:** ≥ 20% of plays follow the previous track of the same album to its end, without shuffle.
  - **The Shuffler:** ≥ 85% of plays on shuffle.
  - **The Globetrotter:** 3+ countries with an hour or more of listening.
  - **The Marathoner** (added): ≥ 35% of listening in sessions of 3+ hours.
  - **The All-Rounder** (fallback): nothing qualifies.
- [x] The strongest archetype wins (score relative to its threshold). Show the runner-up as "with a touch of …" (only if it also qualifies).
- [x] Each personality shows the evidence ("38% of your listening was Arijit Singh"). Evidence is percent-based, so it doesn't depend on the time unit.
- [x] Tune thresholds on sample data and the user's real years so results vary by year and aren't always the same label.

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
- [ ] Warm the story cache when the dashboard is idle (`requestIdleCallback`), so the first story opens instantly. The first `buildStory` call builds the shared index (~360 ms on 279k plays in Node; slower on phones), and later years take ~55–90 ms. If it's still slow on phones, move it into the Web Worker.
- [ ] **"Leave out of story" panel**, opened before the story starts and from a small ⋯ menu on artist/song cards:
  - Lists the auto-detected sleep/ambient artists that appear in this year (with their time), each with a checkbox to put it back.
  - "Added by you": artists or songs the viewer hid, with ✕ to remove; a search (reuse `SearchSelect`) to add any artist or song.
  - Note: "Hidden listening still counts toward your total time."
  - Saved in `localStorage` (per browser, wrapped in try/catch) and passed to `buildStory` as `StoryOptions` (`hiddenArtists`, `hiddenTracks`). Unticking an auto-detected artist needs a matching "shownArtists" option (add it to `StoryOptions` then).
  - Example it must handle: "Nature Therapy" (218 hrs in 2025) has no telltale words, so only the viewer can hide it.

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
- [ ] One card per non-null stat from Step B, in a fixed narrative order: seasons → discoveries → repeat day → longest session → time of day → travel → comeback → year over year.
- [ ] Cap the story at about 12–14 cards. If more stats qualify, keep the most striking ones (rank by how unusual the value is).

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
- [ ] Optional toggles before sharing: hide total time, include personality.

**Done when:** a PNG is downloaded or shared on desktop and mobile and looks right with long names, missing artwork and every time unit.

### Step J — Sample-data story
- [ ] The story works fully on "Try with sample data" (no track IDs → gradient art), so a recruiter or engineer can try it without requesting their own data.
- [ ] Sample data is shaped so the demo story is interesting (a clear personality, a discovery, a comeback).

**Done when:** the sample story is fun to tap through.

### Step K — QA and hardening
- [ ] Edge cases: first/partial year, a year with one artist, only offline plays, all plays in incognito or ambient (nothing left to name: show a gentle empty card instead of a broken story), very long names, RTL and non-Latin names.
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
- ~~**Step B/C:** Should ambient / sleep sounds count?~~ Answered 2026-11-12: counted in totals, never named (see Decisions).
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

### 2026-11-12 — Step C: listening personality
**Done**
- `StoryData.stats.habits` (in `lib/story.ts`) holds the measures behind the personality, all from visible plays:
  - top artist share, share of listening on new artists, night and morning shares
  - shuffle share, skip rate, repeat share, album-in-order share, share of listening in sessions of 3+ hrs
  - number of countries
- New `lib/personality.ts`:
  - Ten archetypes plus an All-Rounder fallback. Each has a title, a one-line description, a lucide icon name and percent-based evidence.
  - Score = value ÷ threshold. The highest score ≥ 1 wins, and the second (if ≥ 1) is "with a touch of …".
  - `buildStory` now returns `personality`.
- Added **The Marathoner** (long sessions); the user's 2025 needed it.

**Results**
| Year | Sample data | User's real history (Nature Therapy hidden) |
|---|---|---|
| 2025 | | Marathoner + touch of Globetrotter (42% in 3+ hr sessions; 3 countries) |
| 2024 | Loyalist + touch of Night Owl (35% Velvet Static) | Repeat Offender (37% same-day repeats) |
| 2023 | Loyalist + touch of Night Owl | Shuffler + touch of Skipper (88% shuffle; 36% skipped) |
| 2022 | | Shuffler (98%) |
| 2021 | | Shuffler (95%) |
| 2020 | | Explorer + touch of Repeat Offender (41% new artists) |
| 2019 | | Repeat Offender (40%) |
- With Nature Therapy **not** hidden, 2025 would also score as a Night Owl (1.09) because of the sleep sounds. That supports the visible-plays rule and the hide list.

**Changed files**
- New: `lib/personality.ts`
- Updated: `lib/story.ts`

**Notes / decisions**
- 2020's "Explorer" is partly because the history starts in March 2019: any artist from before that counts as new in 2020.
- `tsc`, `next lint` and `next build` pass.
- **Waiting on the user:** do these labels feel right for their years?

**Next**
- Step D: story player shell.

### 2026-11-12 — Step B: extra story stats
**Done**
- `StoryData.stats` in `lib/story.ts`. Each stat is null when it isn't interesting, so its card gets skipped:
  - `seasons`: top song per season. The hemisphere comes from the year's main country (latitude from `world-countries`). Winter is Jan, Feb and Dec of the same year. A season needs ≥ 5 hrs, and the stat needs 2+ seasons.
  - `months`: top song per month with ≥ 1 hr.
  - `discoveries`: artists first ever played this year who reached the year's top 20. Null in the history's first year.
  - `longestSession`: gaps of 30 minutes or less, using play start = `ts − ms_played` (`ts` is when a play ended). Needs 2+ hrs. Gives date, start/end time, time played vs span, and top song.
  - `repeatDay`: most plays of one song in a day, counting only plays of 30 s or more. Needs 5+.
  - `timeOfDay`: hours by hour of day, peak hour, and night (00–05) and morning (05–11) shares.
  - `countries`: countries with ≥ 1 hr; needs 2+.
  - `yearOverYear`: total time vs the previous year, with a `partial` flag when either year is partial.
  - `loyalty`: same #1 artist for 2+ years in a row.
  - `comeback`: see the Step B item.
  - `skips`: skip rate (`skipped` or `fwdbtn`) this year vs the whole history; needs 100+ plays.
- **Rule applied:** only the totals (time, plays, active days, year over year) include private and ambient plays. Every other stat uses the plays the story may show, so sleep sounds can't skew time of day or sessions.
- A shared history index (per-year totals, artist and song hours, top-50 ranks, #1 artists, first play per artist, lifetime skips), cached per records array and hide list.
- Ambient phrases now include "rain forest" ("Garasia Rain Forest" by Literrain had become the 2025 winter song).

**Checked on the user's real history** (Nature Therapy hidden)
- Sensible, varied results. Examples:
  - 2025 discoveries: translucent (#7), Karan Aujla (#20).
  - Longest session: 16.1 hrs on 2025-01-24.
  - Repeat day: "First Step" 162× on 2024-11-14.
  - Countries in 2025: US, Netherlands, France (Canada, Japan and the UK were dropped as under an hour).
  - Loyalty: Billie Eilish 2020–21 and Ramin Djawadi 2022–23.
  - Comebacks: 2023 and 2025 only.
- Year over year 2020 vs 2019 (+278%) is correctly flagged partial.
- Timing: the first year takes ~360 ms (builds the index); later years take 55–90 ms each.

**Changed files**
- Updated: `lib/story.ts`

**Notes / decisions**
- Southern-hemisphere viewers get flipped season names. Tropical countries still use the four northern seasons (simple and predictable).
- Added a Step E item to warm the cache while the dashboard is idle.
- `tsc`, `next lint` and `next build` pass.

**Next**
- Step C: listening personality.

### 2026-11-12 — Step A follow-up: private sessions and ambient sounds left out
**Done**
- User decision: private-session plays and ambient/sleep sounds **count toward the totals but are never named** in the story. There's no footnote about them (see Decisions).
- `buildStory(records, year, options)`:
  - Totals (time, plays, active days) include everything.
  - Everything that names or ranks (first song, top artist, songs, album, unique counts) skips private and ambient plays.
  - The left-out time is reported in `leftOut` (for the upcoming panel, not for display in the story).
  - The top artist's `share` is measured against the full total.
- `detectAmbient(records)` (cached per records array, ~85 ms on 279k plays):
  - Matches **strict phrases** ("rain sounds", "white/brown/pink noise", "thunderstorm", "for sleeping", "ambience", "ASMR", …) against "artist | album | track".
  - An artist whose listening is ≥ 50% matches counts as ambient; otherwise only the matching songs are excluded.
  - Single words (rain, birds, ocean, sleep) were tested and **rejected**: they flagged Imagine Dragons "Birds", Billie Eilish "Ocean Eyes", Max Richter and Vancouver Sleep Clinic. A bare "554Hz" phrase flagged JVKE, so "Hz" was dropped too.
- `StoryOptions` (`hiddenArtists`, `hiddenTracks`) for the viewer's own hide list. The UI comes in Step E (the "Leave out of story" panel, user's choice).

**Checked on the user's real history**
- 261 ambient artists auto-detected, no false positives in the top flagged list after the Hz fix.
- **Nature Therapy isn't detected** (titles like "Rumbling Tweets"), which is expected; it needs the hide list. With it hidden, total time is unchanged (2,982 hrs) and the 2025 #1 artist becomes Emile Mosseri.
- Private sessions: 9.8 hrs in 2021, left out of names and counted in the total.
- 2024's rain-sounds song left the top 5.

**Changed files**
- Updated: `lib/story.ts`

**Notes / decisions**
- Dropped the "guilty pleasure" card (it was built on private-session plays).
- `tsc`, `next lint` and `next build` pass.

**Next**
- Step B: extra story stats. They follow the same rule: totals count everything, and names skip private and ambient plays.

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
