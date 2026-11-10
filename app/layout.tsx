import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import { TimeUnitProvider } from '@/components/providers/TimeUnitProvider';
import { Footer } from '@/components/ui/Footer';
import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Unwrapped — Your Spotify listening, analyzed',
  description:
    'A private, in-browser dashboard for your Spotify extended streaming history. Nothing is uploaded or stored.',
  icons: {
    icon: '/favicon.ico',
  },
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
