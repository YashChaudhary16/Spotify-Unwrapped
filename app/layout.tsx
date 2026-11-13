import type { Metadata, Viewport } from 'next';
import { Figtree } from 'next/font/google';
import { TimeUnitProvider } from '@/components/providers/TimeUnitProvider';
import { Footer } from '@/components/ui/Footer';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

const TITLE = 'Unwrapped — Your Spotify listening, analyzed';
const DESCRIPTION =
  'A private, in-browser dashboard for your Spotify extended streaming history: top tracks, albums, artists, habits and streaks. Nothing is uploaded or stored.';

// The icon and the Open Graph image come from app/icon.tsx and app/opengraph-image.tsx.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'Unwrapped',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Unwrapped',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: '#121212',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={figtree.variable}>
      <body className="flex min-h-screen flex-col font-sans">
        <TimeUnitProvider>
          <div className="flex-1">{children}</div>
          <Footer />
        </TimeUnitProvider>
      </body>
    </html>
  );
}
