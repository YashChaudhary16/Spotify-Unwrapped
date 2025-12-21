# Spotify Analytics Dashboard

A modern, privacy-focused Spotify listening analytics dashboard built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 📊 **Comprehensive Analytics**: View your total listening hours, top tracks, platform usage, and more
- 🎵 **Top Tracks**: See your most-played tracks with embedded Spotify players
- 📈 **Visualizations**: Interactive charts for time series, platform usage, time of day, and more
- 🏆 **Streaks & Milestones**: Track your listening streaks and milestone achievements
- 🎤 **Artist Analytics**: Deep dive into specific artist listening patterns
- 🔒 **Privacy-First**: All data processing happens in-memory; IP addresses are automatically removed
- 📱 **Responsive Design**: Works beautifully on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd spotify-dashboard-nextjs
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

1. **Get Your Spotify Data**:
   - Go to your Spotify account settings
   - Request your extended streaming history
   - Download the JSON files (usually named `Streaming_History_Audio_*.json`)

2. **Upload Your Data**:
   - Drag and drop your JSON files onto the upload area
   - Or click to select files from your computer
   - The dashboard will automatically process and display your analytics

3. **Explore Your Data**:
   - Use the filters to select specific years
   - Adjust the number of top tracks to display
   - Select an artist to see detailed analytics
   - Scroll through various visualizations and insights

## Privacy & Security

- **No Data Storage**: All data is processed entirely in-memory and never saved to disk
- **IP Address Removal**: IP addresses are automatically stripped from your data during preprocessing
- **Client-Side Processing**: Data preprocessing happens on your device or in secure API routes
- **No Tracking**: The application does not track user behavior or collect analytics

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure the build
4. Your dashboard will be live!

### Environment Variables

No environment variables are required for basic functionality.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Date Handling**: date-fns
- **File Upload**: react-dropzone

## Project Structure

```
spotify-dashboard-nextjs/
├── app/
│   ├── api/
│   │   └── preprocess/      # API route for data preprocessing
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page with file upload
├── components/
│   ├── Dashboard.tsx         # Main dashboard component
│   ├── Metrics.tsx            # Overall statistics
│   ├── TopTracks.tsx         # Top tracks display
│   ├── PlatformChart.tsx     # Platform usage chart
│   ├── ShuffleOfflineCharts.tsx
│   ├── CountryMap.tsx
│   ├── TimeSeriesChart.tsx
│   ├── StreaksMilestones.tsx
│   ├── TimeOfDayChart.tsx
│   ├── SkipsReplays.tsx
│   ├── MonthlyWeekdayCharts.tsx
│   └── ArtistAnalytics.tsx
├── lib/
│   ├── preprocessing.ts       # Data preprocessing logic
│   └── analytics.ts           # Analytics calculations
└── package.json
```

## Data Preprocessing

The preprocessing pipeline:

1. **Sanitization**: Removes IP addresses and other sensitive data
2. **Timezone Conversion**: Converts UTC timestamps to local time based on country
3. **Platform Cleaning**: Normalizes platform names (Android, iOS, Windows, etc.)
4. **Track ID Extraction**: Extracts Spotify track IDs from URIs
5. **DateTime Features**: Extracts hour, day, month, year, weekday, etc.
6. **Time Buckets**: Categorizes listening by time of day

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- Inspired by Spotify Wrapped
- Built with privacy and user experience in mind

