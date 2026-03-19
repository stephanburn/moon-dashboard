import type { Metadata } from 'next';
import { Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Moon Dashboard',
  description: 'Moon phases, zodiac transits, and the Wheel of the Year',
  openGraph: {
    title: 'Moon Dashboard',
    description: 'Moon phases, zodiac transits, and the Wheel of the Year',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cormorant.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
