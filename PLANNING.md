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

### Step 4 — Sections and landing page
- [ ] Top tracks: lazy-loaded players, responsive width, artist name in each row
- [ ] Headline stats: add unique tracks, unique artists, days active, top artist
- [ ] Skips and replays: rank numbers, ellipsis for long names, move the total out of the heading
- [ ] Streaks and milestones: formatted dates; milestone timeline
- [ ] Landing page: one title, a proper upload icon, clearer instructions with a link to Spotify's data request page (mention it can take up to 30 days)
- [ ] "Try with sample data" button plus a generator script for fake history
- [ ] Parse uploads in a Web Worker and show progress (e.g. "Parsed 3 of 8 files"); friendlier error messages
- [ ] Open Graph image and meta tags

### Later / ideas (not committed)
- Milestones are computed in O(n²) over days (`lib/analytics.ts` builds the running total by re-summing a slice for each day); use a running sum
- Weekday averages and the month × weekday heatmap sum all years together; consider normalizing by how many of each day occur
- ~~**Bug:** `weekdayHours` was weighted by play count~~ — fixed 2026-11-09 (see Work Log).
- Timezone map covers only IN, US and QA; other countries fall back to UTC
- Podcast and audiobook rows (null track metadata) are counted in total time; decide how to handle them
- `POST /api/preprocess` is unused

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
