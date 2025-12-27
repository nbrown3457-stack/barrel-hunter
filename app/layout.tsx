import type { Metadata } from 'next';
import { Geist } from 'next/font/google'; // Optimized font
import { TeamProvider } from '../context/TeamContext';
import './globals.css';

// 1. Optimized Font Loading
const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

// 2. Metadata for SEO (Replaces manual <head> tags)
export const metadata: Metadata = {
  title: 'RotoFilter | Fantasy Baseball Intelligence',
  description: 'Filter your Yahoo Fantasy Baseball leagues with Statcast data.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased`}>
        {/* 3. Global State Provider */}
        <TeamProvider>
          {children}
        </TeamProvider>
      </body>
    </html>
  );
}