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
| Demo data | "Try with sample data" uses the **creator's real 2024** (user decision 2026-11-12), published in `public/demo/history-2024.json` and committed. **Removed before publishing:** IP addresses, private-session plays, sleep/ambient sounds (auto-detected + Nature Therapy), unused fields. **Kept:** countries and device names. Rebuild with `node scripts/build-demo-history.mjs --input <export folder>`. |
| Minimum data | A year needs at least ~10 hours and 30 active days to get a story; otherwise its "Play story" button is hidden. *(proposed — tune on real data)* |
| Story palette | **Hybrid** (user decision 2026-11-12). Number cards use bold, flat color blocks with a simple shape and their own black or white ink. Artwork cards use the cover's or artist's color. Story mode only; the dashboard keeps its rules. Secondary text on story cards is at least 75% ink, for contrast. |
| Private sessions | Plays with `incognito_mode` **count toward totals** (time, plays, active days) but are **never named or ranked** in the story. User decision 2026-11-12. |
| Ambient / sleep sounds | Same rule as private sessions: counted in totals, never named. Detected automatically by strict phrases (`detectAmbient` in `lib/story.ts`), plus a **"Leave out of story" list** the viewer edits (Step E). User decision 2026-11-12. |
| Left-out footnote | **No mention** in the story of how much private or ambient listening was left out; the total simply includes it. User decision 2026-11-12. |
| Audio in story | **Sound on by default** (user decision 2026-11-12). Each song card plays its 30 s Spotify preview, with a speaker button to mute; the choice is remembered in this browser. If the browser blocks sound, the button shows "Tap for sound". |
| Share image | **Bold poster** (user decision 2026-11-12): a bold color block with a 2×2 grid of the top-4 song covers, listening time, top artist and personality, plus a **small "Unwrapped · spotify-unwrapped-nine.vercel.app" footer**. Drawn on a `<canvas>` in the browser, with no new dependency (both Spotify image CDNs send CORS `*`). 9:16 and 1:1. |
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

### Step C — Listening personality ✅ (2026-11-12; generic labels approved for now)
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

### Step D — Story player shell ✅ (2026-11-12; not yet viewed in a browser)
Goal: the full-screen, tap-through player, with placeholder cards.
- [x] `components/story/StoryPlayer.tsx`: full-screen overlay (portal), dark backdrop, card at 9:16 on desktop (centered) and full screen on mobile.
- [x] Segmented progress bars at the top; auto-advance (~6–8 s per card, tunable per card).
- [x] Navigation: tap right/left half, ← → keys, swipe on touch; hold (or Space) to pause; Esc/✕ to close.
- [x] Hash routing `#story-<year>` so a story is linkable and Back closes it.
- [x] Accessibility: focus trap, `aria-live` announcement per card, visible pause/play button, everything works by keyboard; `prefers-reduced-motion` turns off auto-advance and big animations.
- [x] Preload the next card's artwork.

**Done when:** placeholder cards can be stepped through by tap, keys and swipe, on mobile and desktop.

### Step E — Entry point ✅ (2026-11-12; not yet viewed in a browser)
- [x] "Play your {year} story" hero button on Overview, for the latest eligible year, with a small year picker for the others.
- [x] When a single year is selected in the header filter, the button uses that year.
- [x] Ineligible years are hidden (or disabled with "Not enough listening in {year}"). Hidden, and the banner disappears if no year qualifies.
- [x] Warm the story cache when the dashboard is idle (`requestIdleCallback`), so the first story opens instantly. The first `buildStory` call builds the shared index (~360 ms on 279k plays in Node; slower on phones), and later years take ~55–90 ms. If it's still slow on phones, move it into the Web Worker.
- [x] **"Leave out of story" panel**, opened from the banner ("Leave out…", then "Play your {year} story") and from an eye-off button in the player's top bar. The **⋯ menu on artist/song cards moves to Step F**, since it needs the designed cards:
  - Lists the auto-detected sleep/ambient artists that appear in this year (with their time), each with a checkbox to put it back.
  - "Added by you": artists or songs the viewer hid, with ✕ to remove; a search (reuse `SearchSelect`) to add any artist or song.
  - Note: "Hidden listening still counts toward your total time."
  - Saved in `localStorage` (per browser, wrapped in try/catch) and passed to `buildStory` as `StoryOptions` (`hiddenArtists`, `hiddenTracks`, plus `shownArtists`/`shownTracks` for auto-detected items the viewer puts back).
  - Example it must handle: "Nature Therapy" (218 hrs in 2025) has no telltale words, so only the viewer can hide it.

**Done when:** the user can open a story for any eligible year from the dashboard.

### Step F — Card set v1 (the core story) ✅ (2026-11-12; not yet viewed in a browser)
Goal: a complete, short story.
- [x] A small ⋯ menu on the top-artist and top-song cards with "Leave out of story" (moved from Step E). It hides that item through `useStoryHidden` and the story recomputes; the player already keeps the card index in range when cards drop out.
1. [x] **Intro:** "{year}, unwrapped." Includes the year's first song (and "Your history starts on …" for a year that starts late).
2. [x] **Total time:** a big number in the selected time unit (`formatDuration`), the equivalent, and pills for active days, songs and artists. *The count-up animation is left for Step H.*
3. [x] **Top artist:** photo and Spotify artist colors (`useSpotifyArtist`), time and share.
4. [x] **Top 5 songs:** cover art (`useSpotifyArtwork`), revealed one by one from #5 to #1.
5. [x] **Top album:** cover art and play count.
6. [x] **Personality:** title, description and evidence.
7. [x] **Summary:** top artist, top 5 songs, total time, personality. This is the card that becomes the share image.
- [x] Fallbacks for sample data and unavailable tracks (no artwork): gradient tiles, no broken images.

**Done when:** a full story plays end to end for real and sample data.

### Step G — Card set v2 (the extra stats) ✅ (2026-11-12; not yet viewed in a browser)
- [x] One card per non-null stat from Step B, in a fixed narrative order: seasons → months → discoveries → repeat day → longest session → time of day → travel → comeback → year over year → skips. Loyalty ("#1 for N years running") is a line on the top-artist card. Year over year is skipped when either year is partial or the change is under 5%, and skips when within 5 points of the lifetime rate.
- [x] Cap the story at about 12–14 cards. If more stats qualify, keep the most striking ones (rank by how unusual the value is).

**Done when:** different years produce visibly different stories.

### Step H — Visual and motion polish ✅ (2026-11-12; not yet viewed or heard in a browser)
- [x] Card backgrounds: cover-art dominant colors where there's art, otherwise a curated set of bold colors (needs the **Story palette** decision). Hybrid, see Decisions.
- [x] Big type (Figtree, heavy weights), tabular numbers for counters.
- [x] Motion: count-ups, staggered reveals, subtle parallax on artwork. All of it is skipped under `prefers-reduced-motion`. (Parallax was done as a slow zoom-out "drift", plus floating shapes on bold cards.)
- [x] Contrast check on every background (white text ≥ 4.5:1; the existing darkening approach in `useSpotifyArtwork` gives ≥ 7:1). Measured values are in `components/story/palette.ts`; crimson was darkened to pass.
- [x] **(Needs user decision)** Optional background audio: a 30 s preview of the card's song. The embed page exposes `audioPreview.url` (seen on 2026-11-12), but it's null for some tracks. Muted by default, with a speaker toggle. Skip this item if the user says no.

**Done when:** the user is happy with the look on a phone and a laptop.

### Step I — Share image ✅ (2026-11-12; posters checked as PNGs, the share sheet not yet used in a browser)
- [x] `lib/shareImage.ts`: draw the summary card on a `<canvas>` (9:16 at 1080×1920, and 1:1 at 1080×1080) with cover art, names, numbers, personality and a small "Unwrapped" mark.
- [x] Mobile: the Web Share API with the image file; desktop: download PNG and "Copy image".
- [x] Load fonts before drawing (`document.fonts.ready`); truncate long names with "…".
- [x] Privacy: the image is generated on the device; nothing is uploaded.
- [x] Optional toggles before sharing: hide total time, include personality.

**Done when:** a PNG is downloaded or shared on desktop and mobile and looks right with long names, missing artwork and every time unit.

### Step J — Sample-data story ✅ (2026-11-12; changed approach: real data instead of generated)
- [x] The story works fully on "Try with sample data", so a recruiter or engineer can try it without requesting their own data. **The demo is now a real year (the creator's 2024)** with Spotify IDs, so covers, artist photos, players and background music all work.
- [x] ~~Sample data is shaped so the demo story is interesting~~: replaced by real data (user decision). The demo has only one year, so "new to you", comeback and year-over-year cards don't appear in it.

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
- ~~**Step D/H:** Is the bold story palette OK inside story mode?~~ Hybrid (2026-11-12).
- ~~**Step H:** Background song previews in the story: yes or no?~~ Yes, sound on by default (2026-11-12).
- **Step B/C:** Any archetypes or stats to add or drop after seeing them on real data?
- ~~**Step B/C:** Should ambient / sleep sounds count?~~ Answered 2026-11-12: counted in totals, never named (see Decisions).
- **Step E:** Should the story also be offered for "All time" (a lifetime story), or wait for Step Q?

## Ideas for later (not scheduled)
- **More unique personality labels** (user, 2026-11-12): keep the generic ten for now, but later add more personal or surprising labels, e.g. ones built from the viewer's own artists, eras or quirks rather than one habit.

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

### 2026-11-12 — Step J: real demo history instead of fictional sample data
**Decisions (user)**
- The demo is the user's **real 2024**, not generated data.
- **Remove** private-session plays and sleep/ambient sounds (IP addresses always). **Keep** countries and device names.
- **Commit** the file to the repo.

**Done**
- `scripts/build-demo-history.mjs` (run locally on the export folder; no data passes through the chat):
  - Reads every `Streaming_History_Audio_*.json` and keeps music only.
  - Detects ambient sounds over the whole history with the story's rules, plus `--hide` (default "Nature Therapy").
  - Keeps the year ± 1 day (for timezones), and drops private sessions and ambient plays.
  - Writes compact JSON with lookup tables and delta-encoded timestamps.
  - Result for 2024: 45,072 plays → **44,082 kept** (990 ambient removed, 0 private sessions that year). 4,221 tracks, 3 countries, 1,541 KB raw / **442 KB gzipped**. The file contains no `ip_addr` or `incognito` fields.
- `lib/ambientPhrases.mjs`: the phrase list and artist rule moved out of `lib/story.ts`, so the app and the script share one definition.
- `lib/demoHistory.ts`: fetches the file only when the demo is opened and expands it into normal export records. `app/page.tsx` preprocesses them and keeps local-time 2024 only.
- The sample banner now says it's a real year (2024) from the person who built Unwrapped, with private sessions and sleep sounds left out.
- Removed `lib/sampleData.ts` (the fictional generator). Updated `CLAUDE.md`'s map and the old "sample data has no track IDs" note in `PLANNING.md`.

**Checked**
- Decoding the demo gives 43,939 records, all in 2024 (local time), in ~0.66 s in Node.
- Its story matches the real export's 2024: Hans Zimmer, "Organ Variation", Interstellar, The Repeat Offender. Total time is 2,063 vs 2,101 hrs, because the ambient plays are removed from the file instead of hidden.
- Demo cards: intro → total → top artist → top songs → top album → seasons → months → on repeat → longest session → time of day → countries → personality → summary. All top songs have Spotify IDs.
- On a local production server the file is served as `application/json`, gzipped (~450 KB). The server was stopped by its port PID.
- `tsc`, `next lint` and `next build` pass.

**Changed files**
- New: `scripts/build-demo-history.mjs`, `lib/ambientPhrases.mjs`, `lib/demoHistory.ts`, `public/demo/history-2024.json`
- Updated: `lib/story.ts`, `app/page.tsx`, `components/Dashboard.tsx`, `CLAUDE.md`, `PLANNING.md`
- Deleted: `lib/sampleData.ts`

**Notes / decisions**
- **The demo is public:** anyone on the site (and the repo) can see this 2024 listening, including countries (India, the US, Qatar) and device names.
- Not clicked through in a browser here.

**Next**
- Step K: QA and hardening.

### 2026-11-12 — Step I: share image
**Decisions (user)**
- **Layout: bold poster** (not a copy of the summary card).
- **Site address in the footer:** yes, small.

**Done**
- `lib/shareImage.ts`, `renderShareImage(story, { format, tone, unit, showTime, showPersonality })`, returns a PNG blob:
  - **9:16 (1080×1920):** "MY YEAR IN MUSIC", a huge year and "unwrapped.", a centered 2×2 grid of the top-4 covers (420 px each, a rank badge, and the song name on a dark strip), listening time + top artist side by side, personality, and the footer.
  - **1:1 (1080×1080):** title on one line, a 2×2 grid on the left, and stats stacked on the right.
  - One big circle in the tone's shape color. The rank badges are ink-colored, so they show on covers and on empty tiles alike.
  - No cover (sample data or unavailable track) → a tile in the shape color with the song name.
  - Long names are ellipsized; stats wrap to at most 2–3 lines. Number and unit stay together ("124 days / 6 hrs").
  - Uses the page's Figtree (the generated `next/font` family, read from `body`) after `document.fonts.load`.
- `components/story/ShareSheet.tsx`: a dialog with a live preview.
  - Size (Story 9:16 / Square 1:1), color (electric, hotpink, lime, tangerine, sky, plum), and toggles for listening time and personality.
  - **Share** (Web Share API with the file, only where `navigator.canShare({ files })`), **Download** (PNG), and **Copy** (Clipboard `ClipboardItem`, where supported).
  - Status messages, Esc/focus handling, and the note "Made on your device. Nothing is uploaded."
- **"Share your {year}"** button on the summary card. The story pauses while the sheet is open, and the sheet closes with the story.
- `lib/site.ts` holds `SITE_URL`/`SITE_HOST`, now shared by `app/layout.tsx` and the poster footer. `lib/useSpotifyArtwork.ts` exports `getSpotifyArtwork()`.

**Checked**
- The posters were rendered as real PNGs in Node: the same drawing code, with `@napi-rs/canvas` installed in the scratchpad only (not a project dependency), a system font standing in for Figtree, and real Spotify covers.
- Renders: real 2025 (9:16 electric, 1:1 hotpink in days, 9:16 lime in days) and sample 2024 (9:16 tangerine, no covers, time hidden).
- Fixes from viewing them: rank badges were invisible on empty tiles; the 9:16 grid was off-center; "124 days 6 / hrs" wrapped badly.
- `tsc`, `next lint` and `next build` pass.

**Changed files**
- New: `lib/shareImage.ts`, `lib/site.ts`, `components/story/ShareSheet.tsx`
- Updated: `components/story/cards.tsx`, `components/Dashboard.tsx`, `lib/useSpotifyArtwork.ts`, `app/layout.tsx`

**Notes / decisions**
- **Not yet tried in a browser:** Share on a phone, Download and Copy on desktop, and how Figtree's heavier weight fits the layout (the check used a lighter stand-in font).

**Next**
- Step J: sample-data story.

### 2026-11-12 — Step H: visual and motion polish, background music
**Decisions (user)**
- **Palette: hybrid.** Bold blocks on number cards, cover and artist colors on artwork cards.
- **Audio: sound on by default**, with a mute button.

**Done**
- **Palette** (`components/story/palette.ts`):
  - Bold tones electric, hotpink, lime, tangerine, sky, plum, sun and crimson, each with a lighter "shape" color and an ink color (black or white).
  - Dark tones for artwork cards.
  - New Tailwind color **`ink`** (`rgb(var(--story-ink) / alpha)`): each card sets `--story-ink`, so every `text-ink/…`, `bg-ink/…` flips between white and black.
- **Card colors** (`components/story/artwork.tsx`): `CardFrame` takes `bold` + `shape` (circles, arch, stripes, blob; drawn in SVG) or `dark` + cover/artist.
  - Bold: intro electric · total hotpink · seasons sky · months sun · on repeat tangerine · longest session plum · time of day crimson · countries lime · year over year sky/plum · skips sun · personality electric.
  - Artwork: top artist, top songs, album, discoveries, comeback, summary.
- **Contrast**, computed with alpha blending:
  - Full ink is ≥ 6.9:1 on every block.
  - 75% ink is ≥ 4.5:1 on every block after crimson was darkened to `#A8102F`.
  - 60% ink failed on most blocks, so secondary text now uses at least 75%. The time-of-day peak bar and country bars use ink instead of green.
- **Motion** (all `motion-safe:`):
  - `CountUp` (ease-out ~1.4 s) on total time, on-repeat plays, longest session, year over year and skips.
  - Kicker, headline and body rise in one after another.
  - Artwork does a slow zoom-out (`story-drift`), and the bold-card shapes float slowly (`story-float`).
- **Background music**:
  - New route `app/api/spotify/preview` returns a track's 30 s preview URL from its embed page (`audioPreview.url`). It only accepts `p.scdn.co` URLs and returns null for unplayable tracks. Cached for a day.
  - The embed-page reader moved to `lib/server/spotifyEmbed.ts`, shared with the artist route.
  - `lib/storyAudio.ts`: one shared `<audio>` element, unlocked with a silent clip **inside the Play click** (needed for Safari); preview lookups cached; sound on/off remembered in `localStorage`.
  - `components/story/useStoryAudio.ts`:
    - Each card's `audioTrackId` picks its song; number cards keep the previous song playing.
    - Cross-fades between songs, pauses with the story (hold, menu, panel, hidden tab), stops on close.
    - If the browser refuses, the speaker button shows "Tap for sound".
  - Songs: intro → first song; top artist → their top song; top songs → #1; album → the album; discoveries, on repeat, longest session and comeback → their song; summary → #1.

**Checked**
- Local production server:
  - The preview route returns a clip for "Jacob and the Stone - Slowed", `null` for region-locked Chunar, and 400 for a bad ID, with the cache header.
  - The refactored artist route still returns Hans Zimmer's photo and colors.
  - The server was stopped by its port PID.
- All 312 cards still render without errors (every real year × 3 units + sample).
- `tsc`, `next lint` and `next build` pass.

**Changed files**
- New: `components/story/CountUp.tsx`, `components/story/useStoryAudio.ts`, `lib/storyAudio.ts`, `lib/server/spotifyEmbed.ts`, `app/api/spotify/preview/route.ts`
- Updated: `components/story/{palette.ts,artwork.tsx,cards.tsx,LeaveOutMenu.tsx,StoryPlayer.tsx,types.ts}`, `components/Dashboard.tsx`, `app/api/spotify/artist/route.ts`, `tailwind.config.js`, `app/globals.css`

**Notes / decisions**
- **Privacy:** preview lookups send public track IDs to our server (like the artist lookup). No listening history is sent. Audio streams from Spotify's CDN.
- **Not viewed or heard in a browser.** Check sound starting on Play (Chrome and Safari/iOS), the cross-fades, muting, the bold colors and the count-ups.

**Next**
- Step I: share image.

### 2026-11-12 — Steps F and G: designed cards
**Done**
- `components/story/cards.tsx`, `buildStoryCards(story, ctx)`. Card order: intro → total time → top artist → top songs → top album → extras → personality → summary.
  - **Intro:** "{year}, unwrapped." plus the first song with its cover.
  - **Total time:** with the equivalent, plus pills for active days, songs and artists.
  - **Top artist:** big round photo from Spotify, background in Spotify's artist color, share of listening, and "Your #1 for N years running".
  - **Top songs:** covers, revealed from #5 up to #1.
  - **Top album:** large cover.
  - **Personality:** icon, title, "with a touch of", description and evidence pill.
  - **Summary:** artist photo, top artist, listening time, top 5 songs, personality.
- **Extras (Step G):** seasons, month by month, discoveries (photo of the lead artist), on repeat, longest session, time of day (24-bar chart, peak hour in green), countries (bars), the comeback, year over year, skip check.
  - Each extra has a "how striking" score. The best ones fill the card budget (14 cards max) and are then shown in narrative order.
- **⋯ "Leave out of story" menus** (`LeaveOutMenu.tsx`) on the top artist, top songs, first song, seasons, on-repeat, longest-session, discovery and comeback cards.
  - While a menu is open the story holds still (new `StoryHoldContext` in the player).
  - Artists use the auto-aware rule (re-hides a put-back ambient artist). Songs always go on the viewer's own list, which beats every other rule.
- **Artwork** (`artwork.tsx`): `Cover`, `ArtistPhoto`, and `CardBackground`, which fades from a tone to the cover or artist color once it's known.
  - The hooks gained `prefetchSpotifyArtwork` / `prefetchSpotifyArtist`, and the dashboard prefetches a story's art when it opens (about 15–20 requests, only public track IDs).
- **Sizing:** the player's card is now a CSS size container, so text is sized in `cqw` and scales with the card on phones and desktop.
- **Palette** (`palette.ts`): deep tinted gradients (violet, green, blue, rose, amber, teal, slate). The bold color-block decision is still Step H, and changing this file restyles every card.
- Removed `components/story/placeholderCards.tsx`.

**Checked** (Node, real card builder, rendered to HTML)
- Card lists by year:
  - 2025: intro → total → top artist → top songs → top album → seasons → discoveries → repeat day → longest session → countries → comeback → year over year → personality → summary (14).
  - 2022 gets the skip check; 2019 has 12 cards.
  - Sample data: 13–14 cards.
- 312 cards rendered with no errors: every real year × 3 time units, plus the sample data.
- Comeback copy, for example: "Phoenix. Your #23 in 2021. After a quiet 2024, it climbed back to #35."

**Changed files**
- New: `components/story/cards.tsx`, `artwork.tsx`, `palette.ts`, `LeaveOutMenu.tsx`, `context.ts`
- Updated: `components/story/StoryPlayer.tsx`, `components/Dashboard.tsx`, `lib/useSpotifyArtwork.ts`, `lib/useSpotifyArtist.ts`, `app/globals.css` (`story-row-in` keyframe)
- Deleted: `components/story/placeholderCards.tsx`

**Notes / decisions**
- The home page bundle went from 288 kB to 295 kB.
- `tsc`, `next lint` and `next build` pass. **Not viewed in a browser.** Check the text sizes, the long names, and the ⋯ menu taps on a phone.

**Next**
- Step H: visual and motion polish. It needs the user's decisions on the bold palette and on background song previews.

### 2026-11-12 — Step E: entry point and "Leave out of story"
**Done**
- **Banner** `components/story/StoryHero.tsx`, at the top of Overview:
  - "{year}, unwrapped." with chips for every story year (hidden years aren't offered).
  - A white "Play your {year} story" button and a "Leave out…" button.
  - It defaults to the single year picked in the header filter, otherwise the newest story year.
  - The play button is white, not green, to keep green for data and active state.
- The Play button **pushes `#story-<year>`**, so browser Back closes the story.
- **Panel** `components/story/LeaveOutPanel.tsx`: a bottom sheet on mobile, a centered dialog on desktop.
  - Search any artist or song played that year to leave it out (reuses `SearchSelect`; up to 3,000 songs offered).
  - "Left out by you" rows with ✕ to put each back.
  - "Sleep and ambient sounds found in {year}": checkboxes, 6 shown first, then "Show all N".
  - Copy: hidden listening still counts toward total time; private sessions are always left out; choices are saved in this browser and apply to every year.
  - Opened from the banner, its main button is "Play your {year} story". Opened from the player (new eye-off button in the top bar), the story pauses and ignores keys until the panel closes.
- `lib/useStoryHidden.ts`: the choices in `localStorage` (`unwrapped.story.leaveOut.v1`), every read/write guarded.
- `lib/story.ts`:
  - `StoryOptions` gains `shownArtists`/`shownTracks`. The viewer's choices beat auto-detection, and putting an artist back also brings back their individually flagged songs. That was a bug caught in testing: "Nature Sounds" stayed hidden.
  - New `storyHideCandidates(records, year)` feeds the panel (~120 ms on 2025).
- **Warm-up:** the dashboard builds the newest story in `requestIdleCallback` (with a `setTimeout` fallback), so the shared caches are ready before Play.

**Checked on the user's real history (2025)**
- The panel would list 250 auto-detected artists and 45 single songs (top: Nature Sounds 90.9 hrs, White Noise Radiance, Pure Sleeping Vibes, Sleepy John, Literrain, Edy Boman).
- Hiding Nature Therapy makes Emile Mosseri the top artist.
- Putting Nature Sounds back returns 90.9 hrs to the story; the total stays 2,982.5 hrs.

**Changed files**
- New: `components/story/StoryHero.tsx`, `components/story/LeaveOutPanel.tsx`, `lib/useStoryHidden.ts`
- Updated: `lib/story.ts`, `components/story/StoryPlayer.tsx`, `components/Dashboard.tsx`

**Notes / decisions**
- The ⋯ "Leave out" menu on artist/song cards moved to Step F (needs the designed cards).
- The home page bundle went from 285 kB to 288 kB.
- `tsc`, `next lint` and `next build` pass. **Not viewed in a browser** (none available here).

**Next**
- Step F: the designed card set v1.

### 2026-11-12 — Step D: story player shell
**Done**
- `components/story/StoryPlayer.tsx`, a full-screen dialog rendered in a portal:
  - **Layout:** a 9:16 card centered on desktop (with ← → buttons beside it), full screen (`100dvh`, safe-area padding) on mobile.
  - **Progress:** segmented bars at the top, filled with a CSS `story-progress` animation. The animation pauses through `animation-play-state`, and `onAnimationEnd` advances to the next card. Each card has its own `durationMs` (default 7 s), and the story stops on the last card.
  - **Navigation:** tap the left third for back and the rest for next; swipe left/right; swipe down to close.
  - **Pausing:** press and hold (250 ms) to pause; Space or the pause button toggles. It also pauses while the browser tab is hidden.
  - **Keyboard:** ← → to move, Esc to close, Tab stays inside the dialog, and focus returns to where it was on close. Page scroll is locked while open.
  - **Screen readers:** an `aria-live` line per card ("Card 3 of 6. Your top artist: …").
  - **Reduced motion:** no auto-advance, no pause button, no entrance animation.
  - Buttons and links inside cards (or anything marked `data-story-interactive`) don't trigger navigation.
  - Preloads the next card's `preload` images.
- `components/story/types.ts`: the `StoryCard` type (id, label, durationMs, background, preload, content).
- `components/story/placeholderCards.tsx`: temporary cards from real story data (intro, total time, top artist, top songs, personality, summary) on neutral gradients. Step F replaces them.
- Dashboard: opens the player when the URL hash is `#story-<year>` for an eligible year. Back or Esc closes it; a pasted link is replaced with the current tab on close. The button that pushes the history entry (so Back closes it) comes in Step E.
- `app/globals.css`: `story-progress` and `story-card-in` keyframes.

**How to try it now:** load data (or sample data), then add `#story-2024` to the URL.

**Changed files**
- New: `components/story/StoryPlayer.tsx`, `components/story/types.ts`, `components/story/placeholderCards.tsx`
- Updated: `components/Dashboard.tsx`, `app/globals.css`

**Notes / decisions**
- The home page bundle went from 276 kB to 285 kB (story data, personality and player).
- `tsc`, `next lint` and `next build` pass. **Not viewed in a browser** (no browser available here). Tap zones, hold-to-pause and swipe need a check on a phone and a laptop.
- The user approved the generic personality labels for now; more unique labels were added to "Ideas for later".

**Next**
- Step E: entry point ("Play your {year} story" button, year picker, "Leave out of story" panel, cache warm-up).

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
