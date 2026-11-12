# UI Polish Plan — Unwrapped

The goal is to make the dashboard look and feel like a polished product, close to the Spotify app's look, instead of a personal-project port.

**How to use this file**
- **Decisions** records what was agreed. Change it only when we decide something new, and note the change in the Work Log.
- **Roadmap** is the checklist. Tick items `[x]` as they land.
- **Work Log** gets one entry per working session, newest first, using the template at the bottom. Record what was done, what changed, anything left half-finished, and what's next.

---

## Decisions (interview, 2026-11-09)

| Topic | Decision |
|---|---|
| Site name | **Unwrapped**. Supporting copy may say "for your Spotify listening history". |
| Accent green | **#1ED760**, the current Spotify app green |
| Overall palette | Spotify's dark app palette (see Design tokens). Dark mode only. |
| Font | **Figtree**, the closest free match to Spotify's Circular, loaded with `next/font` |
| Icons | **Line icons** (`lucide-react`) replace all emojis |
| Two-part splits (shuffle, offline) | **Donut** with the main percentage in the center and readable labels/legend |
| Listening-over-time chart | **Day / Week / Month toggle** with a smart default for the range; no dots; no zoom slider |
| Bar hover | **Dim the other bars**; no jumping bars and no shadows |
| Navigation | **Tabs**: Overview · Tracks · Habits · Albums · Artist |
| Filters | **Compact bar in the sticky header**: year chips with an "All" option, artist search, top-N, time unit |
| Artist analysis | **Its own tab/page**, like an artist page in Spotify |
| Top tracks | **Keep the Spotify players, but lazy-load** them (load each player only when it scrolls into view) |
| Sample data | **Yes**, generated fake history (no real personal data) behind a "Try with sample data" button |
| Time display | **User-selectable unit**: `x,xxx minutes`, `x,xxx hrs`, or `x,xxx days z hrs` |
| Disclaimer | Footer says **"Not affiliated with Spotify"** |
| Git | Claude **does not commit**. The user reviews and commits. |

### Design tokens (Spotify dark palette)

| Token | Hex | Use |
|---|---|---|
| `base` | `#121212` | Page background |
| `elevated` | `#181818` | Cards |
| `highlight` | `#1F1F1F` | Card hover, inner panels |
| `press` / `gray` | `#282828` | Inputs, pressed state, tracks of progress bars |
| `border` | `#2A2A2A` | Hairlines, chart gridlines |
| `text` | `#FFFFFF` | Primary text |
| `subdued` | `#B3B3B3` | Secondary text |
| `muted` | `#7C7C7C` | Tertiary text and chart ticks (use sparingly) |
| `green` | `#1ED760` | Accent: primary data series, active states |
| `green-dark` | `#1DB954` | Pressed/hover variant of accent |
| `neutral-series` | `#535353` | Second series in two-part charts (Spotify's progress-bar gray) |

Rules: green marks **data and active state** only, so headings are white. Numbers use tabular figures.

### Proposed tab contents (adjust as we build)
- **Overview**: headline stats, streaks and milestones, listening over time, shuffle/offline donuts
- **Tracks**: top tracks (lazy players), skips and replays
- **Habits**: time of day, monthly, weekday, month × weekday heatmap, platforms, countries
- **Albums**: album analytics as it is today, restyled
- **Artist**: search or pick an artist to see their page

---

## Roadmap

### Step 1 — Foundation ✅ (2026-11-09; awaiting visual review in the browser)
- [x] Spotify palette as Tailwind tokens; remove the old CSS classes (`metric-card`, `artist-card`, `metric-box`)
- [x] Figtree font with `next/font`; tabular numbers
- [x] `lucide-react` icons replace the emojis in all headings
- [x] Shared UI: `Card`, `Section` (icon, title, subtitle, actions), `StatCard`
- [x] `lib/format.ts`: number, date, percent, and duration formatting in the selected unit
- [x] Time-unit preference (minutes / hours / days): a React context plus a simple toggle in the header (moves into the filter bar in Step 3)
- [x] Shared chart theme (axis, grid, colors) and a `ChartTooltip` component used by every chart
- [x] Apply all of the above across existing components (mechanical swaps, no redesigns)
- [x] Rename the site to "Unwrapped" (header and page title); footer with the "Not affiliated with Spotify" disclaimer

### Step 2 — Charts ✅ (2026-11-09; awaiting visual review)
- [x] Shuffle/offline → donuts with a center percentage and readable labels
- [x] Listening over time: Day/Week/Month toggle, data grouped to match, area line with no dots, year/month ticks without rotation (also the album momentum chart and the artist time chart)
- [x] Bar hover: dim the other bars (remove translateY and shadow everywhere)
- [x] Time of day: one green ramp in order (no near-black bar)
- [x] Countries: horizontal bars sorted from largest to smallest (countries past the top 9 grouped into "Other (n)"); platforms horizontal too
- [x] Heatmaps: distinct empty cells, stepped green scale with a legend, gaps between cells, text color that contrasts with the cell
- [x] Album heatmap: scale colors against the whole grid, not per month
- [x] Chart heights fit their content; monthly and weekday charts side by side (pairing charts *across* sections is left for the Step 3 tabs)
- [x] Artist coverage: stacked bar (top album / 2nd album / other albums) with a legend; names truncated with "…"; dead `topShare` code removed

### Step 3 — Layout and navigation ✅ (2026-11-09; awaiting visual review)
- [x] Tabs: Overview · Tracks · Habits · Albums · Artist (linkable via `#hash`)
- [x] Sticky header filter bar: year chips with "All", top-N (10/25/50, shown on Tracks and Artist), artist search combobox, time-unit toggle
- [x] Artist tab (replaces the section at the bottom of the page): picker with search and top-12 quick picks → artist page
- [x] Searchable pickers for album comparison
- [x] Handle "no years selected" on purpose: an empty selection is shown as the active **All** chip

### Step 4 — Sections and landing page ✅ (2026-11-09; awaiting visual review)
- [x] Top tracks: lazy-loaded players, responsive width, artist name in each row
- [x] Headline stats: add unique tracks, unique artists, days active, top artist
- [x] Skips and replays: rank numbers, ellipsis for long names, move the total out of the heading
- [x] Streaks and milestones: formatted dates; milestone timeline
- [x] Landing page: one title, a proper upload icon, clearer instructions with a link to Spotify's data request page (mention it can take up to 30 days)
- [x] "Try with sample data" button plus a generator for fake history (in-browser, seeded — see Work Log)
- [x] Parse uploads in a Web Worker and show progress (e.g. "Parsed 3 of 8 files"); friendlier error messages
- [x] Open Graph image and meta tags

### Step 5 — Data correctness ✅ (2026-11-09)
- [x] Timezones for every country (generated from the IANA tz database), with nearest-play inference for missing countries
- [x] Podcasts and audiobooks excluded from all totals (music only)
- [x] Guard rails for wrong uploads and for "zero playable tracks"

### Later / ideas (not committed)
- **Podcasts and audiobooks tab/page**: they're currently excluded and counted in the import notice (decision 2026-11-09). A dedicated tab could use `episode_show_name`, `episode_name`, `audiobook_title` and so on; `isPodcastOrAudiobook()` in `lib/preprocessing.ts` already identifies them.
- `/api/preprocess` is unused; leave it alone for now (user decision 2026-11-09).
- Regenerate `lib/countryTimezones.ts` when the tz database changes: `node scripts/generate-country-timezones.mjs`.
- ~~Milestones computed in O(n²)~~ — fixed 2026-11-09 (running sum)
- Album selection resets when leaving the Albums tab (could lift into Dashboard state)
- Sample data has no Spotify track IDs, so the Top Tracks players don't appear in the demo (by design: no real tracks)
- ~~`calculateAnalytics` crashes with zero playable tracks~~ — guarded 2026-11-09
- Weekday averages and the month × weekday heatmap sum all years together; consider normalizing by how many of each day occur
- ~~**Bug:** `weekdayHours` was weighted by play count~~ — fixed 2026-11-09 (see Work Log).
- ~~Timezone map covers only IN, US and QA~~ — fixed 2026-11-09 (all countries)
- ~~Podcast and audiobook rows counted in total time~~ — excluded 2026-11-09

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

### 2026-11-10 — Albums tab: cover-color cards + cover art in the album header
**Done**
- **Top-album cards** (`AlbumCard` in `components/AlbumAnalytics.tsx`): each card's background is a 135° gradient from its **cover's dominant color** to the card color (via `useSpotifyArtwork`, fading in once loaded). Secondary text is `white/80` (≥ 4.5:1 on the tint; the usual `#B3B3B3` would be about 3.7:1), and the depth pill is `bg-black/30`. The selected card has a green border plus ring, and hover adds a faint lift.
- **Selected album header**: a rounded-square cover (96px, 112px on desktop, `rounded-lg`, drop shadow) in front of the album name and artist. A disc-icon tile shows while loading (pulsing) or when there's no Spotify ID (sample data).
- `AlbumStat` gained `coverTrackId`: the first Spotify track ID seen for that album. Every track on an album shares the cover, so one is enough.
- Covers and colors are cached per track in `useSpotifyArtwork`, so the selected album's cover reuses its card's lookup.

**Changed files**
- Updated: `lib/analytics.ts`, `components/AlbumAnalytics.tsx`

**Notes / decisions**
- Each visit to the Albums tab makes up to 8 oEmbed requests (one per top album, cached afterwards); only track IDs go to Spotify.
- `tsc`, `next lint` and `next build` pass. Not viewed in a browser here.

### 2026-11-10 — Artist banner: free-licensed photos from Wikimedia Commons
**Done**
- User feedback: the round profile photo is good, but the same photo stretched as the banner wasn't appealing. **The profile-photo banner is removed.**
- New `lib/server/commonsBanner.ts`, called in parallel from `/api/spotify/artist` (response gains `banner`):
  - It maps the Spotify artist ID to Wikidata through **P1902 "Spotify artist ID"**, an exact match rather than a name guess.
  - Eligible photos (precision over coverage):
    1. The **uncropped original of the main image (P18)**, score 100 (e.g. James Blake's headshot was cropped from a 6016×4016 concert photo).
    2. The main image itself, score 80.
    3. Commons photos tagged **"depicts" (P180) = this person**, score 60.
  - File-name matching was tried and **dropped**: it picked "Hans Zimmer's Piano" and a JD Sports ad still.
  - Filters: landscape (1.3–3:1), ≥1600px wide, JPEG/PNG/WebP, and a **free license only** (CC0 / public domain / CC BY / CC BY-SA, not NonFree). Excludes stars, posters, logos, signatures, pianos and similar. Solo shots rank above "X and Y" group shots, and concert/live photos rank slightly higher. A 1920px thumbnail is used.
  - It sends the User-Agent Wikimedia asks for (`Unwrapped/1.0 (site URL)`), uses 5s timeouts, and is cached for a day like the rest of the route.
- Header (`components/ArtistAnalytics.tsx`):
  - Full-width photo at 70% opacity, tinted from the left with Spotify's dark artist color so the name sits on a calm area, plus bottom darkening.
  - The required **credit** sits top-right ("Photo: author · license · Wikimedia Commons"), linking to the file page; the hover text notes "cropped and tinted".
  - No eligible photo → Spotify artist-color gradient only (no photo).

**Results (tested on 10 artists)**
- Banner found: Hans Zimmer (live, CC BY 2.0), James Blake (concert, CC BY 2.0), Taylor Swift (Eras Tour), Coldplay (Wembley), Ludovico Einaudi, Daft Punk.
- Color gradient only: Ramin Djawadi, Metro Boomin, Arijit Singh (no suitable free wide photo); Emile Mosseri (no Spotify ID on Wikidata).
- Expect roughly half of well-known artists to get a photo; less-known artists usually won't.

**Changed files**
- New: `lib/server/commonsBanner.ts`
- Updated: `app/api/spotify/artist/route.ts`, `lib/useSpotifyArtist.ts`, `components/ArtistAnalytics.tsx`

**Notes / decisions**
- The server now also calls Wikidata/Commons. It sends only the public Spotify artist ID, never listening data.
- Testing gotcha: `pkill -f "next start -p …"` kills its own shell and can leave the server running (stale builds). Stop test servers by the PID found from the port instead.
- `tsc`, `next lint` and `next build` pass; the route was tested end to end. The header still hasn't been viewed in a browser here.

### 2026-11-10 — Artist page header: photo + Spotify artist colors
**Done**
- The Artist page header now looks like a Spotify artist page:
  - A **round profile photo** (128px on mobile, 176px on desktop) before the name.
  - A **banner**: the artist photo, faded in from the right (CSS mask), over a gradient in **Spotify's own artist color** (`visualIdentity.backgroundBase` → `backgroundTintedBase` → page color).
  - A bottom darkening layer so the name and stats stay readable over any photo.
  - Falls back to the previous green gradient and a mic icon when there's no lookup (sample data, no track IDs, or a failure).
- New server route `app/api/spotify/artist/route.ts` (`GET ?trackId=&name=`):
  1. It reads the track's public embed page (`open.spotify.com/embed/track/{id}`, `__NEXT_DATA__`) to get the artists, and picks the one matching the name (case- and Unicode-insensitive; otherwise the first artist).
  2. It reads the artist's embed page to get `visualIdentity.image[]` (largest, usually 640px) and the colors.
  - It needs a server because those embed pages don't allow browser (CORS) requests. Inputs are validated (22-character IDs only, so other URLs can't be requested), it only calls `open.spotify.com`, and responses are cached at the edge (`s-maxage` 1 day, SWR 7 days). Any failure → 404 → fallback header.
- New client hook `lib/useSpotifyArtist.ts`: calls the route with the artist's first top track that has an ID, and caches the result per track and artist.

**Changed files**
- New: `app/api/spotify/artist/route.ts`, `lib/useSpotifyArtist.ts`
- Updated: `components/ArtistAnalytics.tsx`

**Notes / decisions**
- **No real banner image.** Spotify's wide artist header image isn't in any public endpoint (only in its internal web-player API, which we won't scrape). The profile photo used as a faded banner plus Spotify's artist color gives a similar look.
- **Fragile by nature:** the embed pages' `__NEXT_DATA__` format is undocumented, so if Spotify changes it, the header quietly falls back to green.
- **Privacy change to note:** this is the first feature that sends anything to *our* server. One public track ID and the artist's name go to the Vercel function (and may appear in Vercel's request logs). No listening history is sent. The landing page's "never uploaded" wording is still accurate about the history itself; consider adding a line about artist lookups.
- Tested on a local production server with real tracks: single-artist, a 4-artist track (picking James Blake / "metro boomin" correctly, Metro Boomin's color `rgb(153, 33, 38)`), invalid ID → 400, unknown ID → 404, cache header present. Some artists have no profile photo; Spotify returns album art for them, and we show that.
- `tsc`, `next lint` and `next build` pass. The header itself hasn't been viewed in a browser here.

### 2026-11-10 — "First song played" preview: tried and reverted
- Tried adding cover art and an in-card preview player to the "First song played" card. **The user reverted it**: they don't want a playable track there. The card stays a plain `StatCard`; don't suggest this again.

### 2026-11-10 — "Most listened track" card redesign
**Done**
- Replaced the mostly empty "Most listened track" card (Overview → Streaks and milestones) with `components/MostListenedTrack.tsx`, styled like a Spotify track page:
  - Large cover art (640px), "Your #1 track", the track name and artist.
  - The background is tinted with the cover's dominant color and fades into the card color.
  - Three stats: total time, share of all listening, and top day (with that day's time).
  - The playable Spotify player (`LazySpotifyEmbed`) along the bottom fills the space next to the milestones timeline.
- New `lib/useSpotifyArtwork.ts`:
  - It gets the cover from Spotify's public **oEmbed** endpoint (`open.spotify.com/oembed`, no login or API key, CORS `*`, verified) and swaps the 300px cover for the 640px one (`ab67616d00001e02` → `ab67616d0000b273`).
  - It extracts the dominant color on a 24×24 canvas, weighted toward vivid pixels and darkened so white text stays ≥ ~7:1. The cover CDN also sends CORS `*`, so the canvas can read it.
  - Results are cached per track. Any failure falls back quietly to no artwork.
- `Analytics.mostListenedTrack` gained `artist`, `trackId`, `share` and `dayHours`.
- Fallback when there's no track ID (e.g. sample data): a soft green tint and a music-note tile instead of cover art, and no player.

**Changed files**
- New: `components/MostListenedTrack.tsx`, `lib/useSpotifyArtwork.ts`
- Updated: `lib/analytics.ts`, `components/StreaksMilestones.tsx`

**Notes / decisions**
- Privacy: the oEmbed request sends only the track ID to Spotify. The players already do that, so nothing new leaves the browser.
- Ran the color formula on 3 real covers (outside the browser): it gives sensible tints (deep magenta for a purple cover, neutral gray for gray covers) with white-text contrast of 7.9:1 to 16:1.
- The same hook could later give album art to Top Tracks, Albums and the Artist page.
- `tsc`, `next lint` and `next build` pass. Not viewed in a browser here.

### 2026-11-09 — Step 5: Timezones, music-only totals, upload guard rails
**Done**
- **Timezones for every country.**
  - `lib/countryTimezones.ts` maps all 248 country codes (including Kosovo `XK`) to one IANA timezone. It's generated from the tz database's `zone.tab` (2026e) by `scripts/generate-country-timezones.mjs`.
  - Countries with several zones (US, RU, CA, BR, AU, MX, ID and 24 more) use their most populous zone, usually the capital's. That's listed in the script's `PRIMARY` table, and the script refuses to run if a multi-zone country has no entry.
  - India, the US and Qatar keep the same zones as before.
- **Missing country.** The hard-coded "US after 2024-08-04, India before" fallback (specific to the original author's history) is gone. A play with no country or `ZZ` now borrows the country of the **nearest play in time** that has one. If no play has a country at all, the viewer's browser timezone is used. The Countries chart still shows only what Spotify reported; the borrowed country only affects local time.
- If a browser doesn't recognize a newer zone name, the code tries its older alias (e.g. `Europe/Kyiv` → `Europe/Kiev`) and then UTC.
- **Music only.** Podcast episodes and audiobook chapters (`isPodcastOrAudiobook()`) are excluded from all totals and charts.
- **Import cleanup** (`preprocessWithReport()`): drops rows with no valid timestamp and exact duplicate plays (same ts, track, ms and platform, e.g. the same file uploaded twice), and counts everything it drops. Country-name lookup now uses a cached Map, so it's no longer a search per record.
- **Upload guard rails** (`lib/parseFiles.ts`):
  - Non-history files (Userdata.json, Playlist1.json, non-.json files) are **skipped and listed** instead of failing the whole upload, so dropping the entire unzipped export folder works.
  - The upload only fails when nothing usable is left, with a specific message: no valid files, only podcasts/audiobooks, or only 0-second plays.
- **Import notice** (`components/ImportNotice.tsx`): a dismissible note on the dashboard saying what was left out (podcast/audiobook plays, duplicates, bad rows, skipped files).
- **Analytics guards**: `calculateAnalytics([])` no longer crashes (most-listened track and first song are guarded; first song prefers the first play with a track name). The dashboard shows a "No listening in …" empty state, with a "Show all years" button, if the selected years only contain empty plays.

**Changed files**
- New: `lib/countryTimezones.ts` (generated), `scripts/generate-country-timezones.mjs`, `components/ImportNotice.tsx`
- Updated: `lib/preprocessing.ts`, `lib/parseFiles.ts`, `lib/parser.worker.ts`, `lib/analytics.ts`, `app/page.tsx`, `components/Dashboard.tsx`

**Notes / decisions**
- User decisions: podcasts and audiobooks are excluded for now (a separate tab later); `/api/preprocess` stays as is.
- **Expect the numbers to change slightly** for existing data: totals drop by the podcast/audiobook time; plays with `ZZ` (previously UTC) and plays with no country now use the nearest known country; duplicates are removed.
- Tested with the real code: local time for US/IN/QA/GB/JP/BR/AU/NP/DE (with daylight saving), nearest-country inference, browser fallback, the report counts, empty and 0-second analytics, a mixed-folder upload, and all error paths. Sample data is unaffected (20,042 plays, nothing dropped). `tsc`, `next lint` and `next build` pass.

**Next**
- User: review with real data in `npm run dev`, then commit and push.

### 2026-11-09 — Step 4: Sections and landing page
**Done**
- **Headline stats** (Overview → "At a glance"): 8 cards in a 4-column grid. They show total time, plays, days active (with "% of N days"), average per listening day, unique tracks, unique artists, top artist and top track; the subtitle shows the date range. Supporting fields added to `Analytics`: `uniqueTracks`, `uniqueArtists`, `topArtist`, `firstDate`, `lastDate`, `daysInRange`.
- **Top tracks**: Spotify players are lazy-loaded (`components/ui/LazySpotifyEmbed.tsx`: they load about 200px before scrolling into view and fade in, with a same-size placeholder so the list doesn't jump). Each row has a thin bar showing its share of the #1 track and a full-width player on mobile.
- **Skips and replays**: ranked lists with rank numbers, ellipsis plus the full name on hover, and the total in the subtitle.
- **Milestones**: a vertical timeline with the latest milestone highlighted in green and "N days after the previous milestone". The biggest-day card shows the weekday.
- **Landing page**:
  - A real headline and subhead.
  - **Try with sample data** button.
  - Clearer 4-step instructions with a link to spotify.com/account/privacy and a note that it can take up to 30 days.
  - A warning to choose *Extended streaming history*, not "Account data".
- **Sample data** (`lib/sampleData.ts`): a seeded generator creating 2 years (2023–2024) of fictional listening: 16 made-up artists, about 20k plays. It includes artist "eras", album-through sessions, skips, shuffle, offline, 4 platforms and trips to India and Qatar. Generation takes about 26 ms and the data is identical every time. The dashboard shows a "You're viewing sample data" banner with an **Upload my data** button.
- **Web Worker parsing** (`lib/parser.worker.ts` + `lib/parseFiles.ts`): files are read and processed off the main thread, with live progress ("Reading file 3 of 8 · name.json", then "Crunching 123,456 plays…"). If workers aren't available, parsing falls back to the main thread.
- **Friendlier errors**, each with a heading:
  - invalid JSON
  - not streaming history
  - the basic "Account data" export (StreamingHistory_music_*.json)
  - no plays found
  - non-.json files dropped
- **Link previews and icon**:
  - `app/opengraph-image.tsx` (1200×630, generated at build time)
  - `app/icon.tsx` (green brand mark)
  - `metadataBase`, Open Graph and Twitter `summary_large_image` metadata
  - theme color `#121212`
- Removed `public/favicon.ico`, which was a 12-byte text file containing "placeholder", i.e. a broken icon.
- Fixed the O(n²) milestone calculation (now a running sum).

**Changed files**
- New: `components/ui/LazySpotifyEmbed.tsx`, `lib/{parseFiles,parser.worker,sampleData}.ts`, `app/{icon,opengraph-image}.tsx`
- Updated: `app/{page,layout}.tsx`, `lib/analytics.ts`, `components/{Metrics,TopTracks,SkipsReplays,StreaksMilestones,Dashboard}.tsx`
- Deleted: `public/favicon.ico`

**Notes / decisions**
- The sample data is **generated in the browser** instead of shipped as a JSON file. The equivalent file would be about 8 MB; the generator is a few KB and makes identical data every time. It has no Spotify track IDs, so the demo shows no players.
- I rendered the OG image and icon on a local production server and looked at them; I fixed a bar overflow in the OG image.
- Tested with the real code: sample data → preprocessing → analytics (all sections populated), plus all upload-error paths.
- `tsc`, `next lint` and `next build` pass. The dashboard itself still hasn't been checked visually in a browser here.
- **Correction after user review:** I had added `?utm_source=generator&theme=0` to the embed URL, and `theme=0` forces Spotify's dark gray player. That URL is reverted to the original plain one, so the players are colorful again (background taken from the album art). Lazy loading is kept. Don't add `theme=0` back.

**Next**
- User: review in `npm run dev` (try **Try with sample data**), then commit and push.
- All four planned steps are done. Candidates for later are under "Later / ideas".

### 2026-11-09 — Step 3: Layout and navigation
**Done**
- **Tabs** in the sticky header: Overview · Tracks · Habits · Albums · Artist. The active tab has a green underline. The URL hash tracks the tab (`#albums` opens Albums), and switching tabs scrolls to the top.
  - Overview: at-a-glance stats, listening over time, streaks and milestones, shuffle/offline donuts
  - Tracks: top tracks, skips and replays
  - Habits: time of day + platforms side by side, month/weekday charts + heatmap, countries
  - Albums: album analytics
  - Artist: picker → artist page
- **Filter bar** (second header row, scrolls sideways on small screens):
  - Years: **All** chip plus one chip per year. Several years can be selected; selecting every year (or none) falls back to All.
  - Show: Minutes / Hours / Days.
  - Top: 10 / 25 / 50 (only on Tracks and Artist; replaces the 5–50 slider).
- **Artist search** in the top header row (`SearchSelect`): artists ranked by listening time in the selected years, each with its time. Picking one opens the Artist tab; × clears it.
- **Artist tab**:
  - With no artist chosen: `ArtistPicker` shows a search box and the top 12 artists as quick-pick cards.
  - With an artist chosen: an artist page with a Spotify-style green gradient header (name, time · tracks · days, "Choose another artist"), 4 stat cards, top tracks, listening over time and time of day.
  - If the chosen artist has no plays in the selected years, a notice explains why instead of showing empty charts.
- **Album comparison** uses two searchable pickers (search by album or artist, each showing its time), labeled Album A (green) / Album B (gray) to match the comparison bars.
- Shows "All years · 123,456 plays" (or the chosen years) above the content.
- New `components/ui/SearchSelect.tsx`: an accessible combobox (↑/↓/Enter/Esc, click outside closes) that shows 50 rows with a "keep typing" hint. Also `chipClassName()` exported from `ChipGroup.tsx` for multi-select chips.
- The Metrics section heading is now "At a glance", so it doesn't repeat the Overview tab name.

**Changed files**
- New: `components/ui/SearchSelect.tsx`, `components/ArtistPicker.tsx`
- Updated: `components/Dashboard.tsx` (rewritten), `components/ArtistAnalytics.tsx` (artist page), `components/AlbumAnalytics.tsx` (searchable pickers), `components/ui/ChipGroup.tsx`, `components/Metrics.tsx`

**Notes / decisions**
- Removed the old setState-inside-`useMemo` hack for initial years; "All" is now simply `selectedYears = []`.
- Album selection resets when you leave and come back to the Albums tab (the tab unmounts). Fine for now; could keep it in Dashboard state later.
- `tsc`, `next lint` and `next build` pass. Not checked visually in a browser yet.

**Next**
- User: review in `npm run dev`, then commit and push.
- Step 4 — Sections and landing page.

### 2026-11-09 — Step 2: Charts
**Done**
- New reusable chart components:
  - `components/charts/SimpleBarChart.tsx`: the only bar chart, used for platforms, countries, time of day, month, weekday and album sessions. Columns or horizontal bars, colors per bar, hovering dims the other bars.
  - `components/charts/TrendChart.tsx` + `lib/timeSeries.ts`: area chart with a Day/Week/Month toggle. Days are summed into buckets and gaps filled with 0. The default depends on the range (≤ 90 days → Day, ≤ 3 yrs → Week, longer → Month). X ticks are years, quarters, months or weeks, never rotated. Used for overall listening over time, album momentum and the artist view.
  - `components/charts/Heatmap.tsx`: CSS-grid heatmap with 5 green steps scaled against the whole grid, a separate empty-cell color, text color chosen per step for contrast, hover outline and tooltip, and a legend (Less → More, No listening, value of the brightest cell). Used for both heatmaps; the album heatmap is no longer scaled per month.
  - `components/ui/ChipGroup.tsx`: generic Spotify-style chip control (`TimeUnitToggle` now uses it).
- Shuffle and offline are now donuts: green part with the % in the center, gray rest, legend with % and play counts.
- Time of day uses an ordered green ramp (morning light → night deep); the near-black bar is gone.
- Countries and platforms are horizontal, sorted bars; countries past the top 9 are grouped into "Other (n)".
- Artist coverage is a stacked bar (top album / 2nd album / other albums) with a legend, tooltips naming each album with its time and share, and hover dimming.
- `ChartTooltip` gained `hideZero` and exposes `PayloadItem.dataKey`.
- New tokens in `lib/chartTheme.ts`: `DIMMED_OPACITY`, `TIME_OF_DAY_COLORS`, `RANK_COLORS`, `HEAT_STEPS`, `HEAT_EMPTY`, `HEAT_TEXT`.

**Changed files**
- New: `components/charts/{SimpleBarChart,TrendChart,Heatmap}.tsx`, `components/ui/ChipGroup.tsx`, `lib/timeSeries.ts`
- Updated: `lib/analytics.ts` (weekday fix), `lib/chartTheme.ts`, `components/ui/{ChartTooltip,TimeUnitToggle}.tsx`, `components/{PlatformChart,CountryMap,TimeOfDayChart,TimeSeriesChart,ShuffleOfflineCharts,MonthlyWeekdayCharts,AlbumAnalytics}.tsx`

**Notes / decisions**
- Artist coverage has **3 segments, not 4**. The palette validator showed that no third green step can be told apart from its neighbors while keeping ≥ 3:1 contrast, so everything past the 2nd album is grouped as gray "Other albums". Rank colors `#1ED760 / #0E7A36 / #7C7C7C` pass CVD and normal-vision checks.
- Time-of-day ramp `#B4F5CC → #1ED760 → #14A84A → #0E7A36`: every step has ≥ 3:1 contrast on `#181818`.
- Heatmap cells show compact values in the selected unit (e.g. "12h", "720m", "0.5d").
- The bucketing was tested on 7 years of synthetic daily data: bucket totals match, default = Month (82 points), 6 year ticks.
- **Fixed an analytics bug in weekday averages** (`lib/analytics.ts`, `weekdayHours`). Each day's total used to be added once per *play*, which made the result an average weighted by play count and pushed weekdays with binge days too high. It now sums listening per date (track plays only) and averages over listening days per weekday, so each date counts exactly once. Checked on a worked example: Mondays with 0.1 h and 6 h → 3.05 h (the old code gave 5.88 h). Decision: average over **days you listened**, not all calendar days.
- `tsc`, `next lint` and `next build` pass. Not checked visually in a browser yet.

**Next**
- User: review in `npm run dev`, then commit and push.
- Step 3 — Layout and navigation (tabs, header filter bar, artist tab).

### 2026-11-09 — Step 1: Foundation
**Done**
- Spotify dark palette as Tailwind tokens (`spotify-*`, see Design tokens) and slimmed `globals.css`. The old classes (`metric-card`, `artist-card`, `metric-box`, `track-card`, `spotify-embed`) were removed. Accent color for native inputs; green focus ring.
- Figtree via `next/font/google` (`--font-figtree`, the Tailwind `font-sans`).
- `lucide-react@0.460.0` added; every emoji heading now uses a line icon.
- New shared building blocks:
  - `components/ui/Card.tsx` (`Card`, `CardTitle`), `Section.tsx`, `StatCard.tsx`, `Brand.tsx`, `Footer.tsx`
  - `components/ui/ChartTooltip.tsx`: a single tooltip for all charts. Values default to durations in the selected unit; it takes `valueFormatter`, `labelFormatter`, `nameFormatter` and `hideSwatch`.
  - `components/ui/TimeUnitToggle.tsx` + `components/providers/TimeUnitProvider.tsx` (`useTimeUnit()`, remembered in localStorage)
  - `lib/format.ts`: `formatDuration(hours, unit)`, `formatDurationShort` (axis ticks), `formatNumber`, `formatPercent`, `formatDate`
  - `lib/chartTheme.ts`: `CHART_COLORS`, `xAxisProps`, `yAxisProps`, `gridProps`, `gridPropsHorizontalBars`, `barCursor`
- Every component moved to the new building blocks: white headings, solid horizontal-only gridlines, no axis tick marks, unit-aware axis ticks and tooltips, 4px bar corners, formatted dates and numbers.
- Pie colors fixed: green + `#7C7C7C` (was `#212121`, invisible), white labels, tooltip shows "200,342 plays · 72%".
- Renamed the site to **Unwrapped** (header, landing, `<title>`); added a footer with the "Not affiliated with Spotify" disclaimer.
- Small extras while touching these files: Top Tracks rows show the artist, and the players are full width on mobile; artist coverage bars are rounded only at the end; album comparison uses formatted values.

**Changed files**
- New: `PLANNING.md`, `lib/format.ts`, `lib/chartTheme.ts`, `components/providers/TimeUnitProvider.tsx`, `components/ui/{Card,Section,StatCard,ChartTooltip,TimeUnitToggle,Brand,Footer}.tsx`
- Updated: `tailwind.config.js`, `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, all files in `components/`, `package.json`/`package-lock.json` (lucide-react)

**Notes / decisions**
- The palette validator flags green + gray as a categorical pair. That's acceptable because the gray is "the rest", not a second category, and `#7C7C7C` passes 3:1 contrast on `#181818`. Labels stay in text colors (white/gray), never series colors.
- Left for Step 2 on purpose, marked with `TODO(Step 2)` in code: bar lift-on-hover, time-of-day colors, daily dots on the time chart, rotated labels, heatmap scaling, donuts.
- `npm run build` passes. Not yet checked visually in a browser (no headless browser in this environment).

- Reviewed by the user, committed and pushed to `main`; Vercel deployed it automatically (pushing to `main` = production deploy).

**Next**
- Step 2 — Charts.

### 2026-11-09 — Planning and Step 1 kickoff
**Done**
- Reviewed the UI and listed polish issues (charts, design system, filters, sections, landing page).
- Interviewed the user; decisions recorded above.
- Created this plan.

**Next**
- Step 1 — Foundation (in progress, see the next entry once done).
