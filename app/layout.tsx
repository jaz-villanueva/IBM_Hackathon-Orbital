import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ORBITAL — AI Mission Atlas',
  description: 'See what humanity is doing in space. An AI-powered atlas of active space missions across Earth, Moon, and Mars.',
  keywords: ['space', 'missions', 'NASA', 'Mars', 'Moon', 'AI', 'satellites', 'Artemis', 'Perseverance'],
  authors: [{ name: 'ORBITAL' }],
  openGraph: {
    title: 'ORBITAL — AI Mission Atlas',
    description: 'See what humanity is doing in space.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="bg-space-black text-orbit-white antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
