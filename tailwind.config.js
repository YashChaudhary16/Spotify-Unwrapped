/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Spotify dark app palette — see PLANNING.md "Design tokens".
      colors: {
        // Story cards: text/ink color set per card (white on dark cards, black on bright ones). See components/story/palette.ts.
        ink: 'rgb(var(--story-ink, 255 255 255) / <alpha-value>)',
        spotify: {
          green: '#1ED760',        // accent: data + active state
          'green-dark': '#1DB954', // accent hover/pressed
          black: '#121212',        // page background
          dark: '#181818',         // cards (elevated)
          highlight: '#1F1F1F',    // card hover, inner panels
          gray: '#282828',         // inputs, pressed, progress-bar tracks
          border: '#2A2A2A',       // hairlines, gridlines
          lightgray: '#B3B3B3',    // secondary text (subdued)
          muted: '#7C7C7C',        // tertiary text
          darker: '#0A0A0A',
        },
      },
      fontFamily: {
        sans: ['var(--font-figtree)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
