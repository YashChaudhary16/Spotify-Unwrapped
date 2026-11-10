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

### Step 2 — Charts
- [ ] Shuffle/offline → donuts with a center percentage and readable labels
- [ ] Listening over time: Day/Week/Month toggle, data grouped to match, area line with no dots, year/month ticks without rotation (also the album momentum chart and the artist time chart)
- [ ] Bar hover: dim the other bars (remove translateY and shadow everywhere)
- [ ] Time of day: one green ramp in order (no near-black bar)
- [ ] Countries: horizontal bars sorted from largest to smallest
- [ ] Heatmaps: distinct empty cells, stepped green scale with a legend, gaps between cells, text color that contrasts with the cell
- [ ] Album heatmap: scale colors against the whole grid, not per month
- [ ] Chart heights fit their content; put small charts side by side
- [ ] Artist coverage: stacked bar of each artist's album split; fix name truncation; remove the dead `topShare` code

### Step 3 — Layout and navigation
- [ ] Tabs: Overview · Tracks · Habits · Albums · Artist
- [ ] Sticky header filter bar: year chips with "All", top-N, artist search combobox, time-unit toggle
- [ ] Artist tab (replaces the section at the bottom of the page)
- [ ] Searchable pickers for album comparison
- [ ] Handle "no years selected" on purpose

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

**Next**
- User: run `npm run dev` and review the look; note anything to adjust here.
- Step 2 — Charts.

### 2026-11-09 — Planning and Step 1 kickoff
**Done**
- Reviewed the UI and listed polish issues (charts, design system, filters, sections, landing page).
- Interviewed the user; decisions recorded above.
- Created this plan.

**Next**
- Step 1 — Foundation (in progress, see the next entry once done).
