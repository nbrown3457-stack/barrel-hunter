import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { TeamProvider } from '../context/TeamContext';
import TeamSwitcher from '../components/TeamSwitcher'; // Added this import
import './globals.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
});

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
      <body className={`${geist.className} antialiased bg-gray-50`}>
        {/* Global State Provider ensures all pages see your Yahoo Teams */}
        <TeamProvider>
          
          {/* Simple Navigation Header */}
          <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚾</span>
                <h1 className="font-bold text-xl tracking-tight text-gray-900">RotoFilter</h1>
              </div>

              {/* The Dropdown is placed here */}
              <div className="flex items-center gap-4">
                <TeamSwitcher />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto p-4 md:p-6">
            {children}
          </main>

        </TeamProvider>
      </body>
    </html>
  );
}