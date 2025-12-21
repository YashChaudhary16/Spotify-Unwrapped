# Quick Start Guide

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Upload your Spotify data:**
   - Drag and drop your `Streaming_History_Audio_*.json` files
   - Or click to select files
   - Wait for processing to complete

## Deployment to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

3. **Your dashboard is live!**
   - Share the Vercel URL with users
   - They can upload their Spotify data and see analytics

## Testing with Sample Data

If you have the `Streaming_History_Audio_2024_12.json` file in the parent directory, you can test locally by uploading it through the web interface.

## Troubleshooting

### Build Errors
- Make sure Node.js 18+ is installed
- Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Type Errors
- Run `npm run build` to check for TypeScript errors
- Ensure all dependencies are installed

### Runtime Errors
- Check browser console for errors
- Verify JSON files are valid Spotify streaming history format
- Ensure files are not corrupted

## Project Structure Overview

- `app/` - Next.js app router pages and API routes
- `components/` - React components for dashboard
- `lib/` - Utility functions (preprocessing, analytics)
- `public/` - Static assets

## Key Features

✅ Privacy-first (no IP tracking, in-memory processing)
✅ Responsive design (works on mobile and desktop)
✅ Interactive charts and visualizations
✅ Artist-specific analytics
✅ Streaks and milestones tracking
✅ Spotify embed integration

