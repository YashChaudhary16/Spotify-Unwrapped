# Spotify Analytics

A privacy-first Spotify Wrapped style dashboard built with Next.js and TypeScript.

## Live App

- https://spotify-unwrapped-nine.vercel.app/

## What This App Does

- Uploads one or more `Streaming_History_Audio_*.json` files
- Processes data in-memory (no disk storage)
- Removes IP fields during preprocessing
- Shows listening insights with interactive charts and tables
- Supports year filter, top-tracks range, and artist-level analysis

## Main Features

- **Core metrics:** total hours, total tracks, unique listening days, avg hours/day
- **Track insights:** top tracks with Spotify IDs/embed support
- **Album insights:** album ranking, depth score, top song per album, album trends
- **Usage patterns:** platform usage, shuffle vs non-shuffle, offline vs online
- **Time analytics:** daily series, time-of-day buckets, monthly/weekday breakdown, heatmap
- **Behavior insights:** streaks, milestones, max listening day, first song, skips/replays
- **Drill-downs:** artist analytics (top tracks, time-of-day, time series)

## Components

- `Dashboard.tsx` - orchestration, filters, and section layout
- `Metrics.tsx` - headline stats cards
- `TopTracks.tsx` - ranked tracks view
- `AlbumAnalytics.tsx` - album and artist-album coverage analytics
- `PlatformChart.tsx` - listening hours by platform
- `ShuffleOfflineCharts.tsx` - playback behavior charts
- `CountryMap.tsx` - listening by country
- `TimeSeriesChart.tsx` - daily listening trend
- `StreaksMilestones.tsx` - streak and milestone summaries
- `TimeOfDayChart.tsx` - listening by time bucket
- `SkipsReplays.tsx` - skipped vs replayed tracks
- `MonthlyWeekdayCharts.tsx` - monthly/weekday charts and heatmap
- `ArtistAnalytics.tsx` - selected artist deep dive

## Core Functions

- `lib/preprocessing.ts`
  - `preprocessStreamingHistory()` - sanitizes and enriches raw Spotify records
  - Includes timezone conversion, platform normalization, country expansion, track ID extraction, and time-bucket creation
- `lib/analytics.ts`
  - `calculateAnalytics()` - computes all dashboard-level metrics and chart datasets
  - `getArtistAnalytics()` - computes artist-specific metrics and trends
- `app/api/preprocess/route.ts`
  - `POST` endpoint to preprocess records server-side when needed

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, upload your Spotify JSON files, and explore.

