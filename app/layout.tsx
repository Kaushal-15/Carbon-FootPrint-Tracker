import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const outfit = Outfit({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit'
});

export const metadata: Metadata = {
  title: 'EcoTrace — Understand, Track & Reduce Your Carbon Footprint',
  description: 'Empower yourself to fight climate change. Track your daily transport, energy, food, and waste footprint, view real-time insights, and get AI-personalized recommendations.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

/**
 * The RootLayout component serves as the top-level layout for the entire Next.js application.
 * It wraps the application in the HTML structure, initializes fonts, sets global CSS variables,
 * and provides necessary global contexts (like NextAuth session) via Providers.
 *
 * @param {Object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render inside the layout.
 * @returns {JSX.Element} The HTML structure of the layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body 
        className={`${outfit.variable} font-sans min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-300`}
        id="ecotrace-root"
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
