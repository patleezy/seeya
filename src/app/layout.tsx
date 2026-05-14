import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  metadataBase: new URL('https://seeyasoon.digital'),
  title: 'seeya — find a time everyone loves',
  description: "Seeya handles the back-and-forth. Share a link, everyone marks when they're free, and the best time finds itself.",
  icons: {
    icon: [
      { url: '/favicon-32x32.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.svg', type: 'image/svg+xml', sizes: '16x16' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'seeya — find a time everyone loves',
    description: "Seeya handles the back-and-forth. Share a link, everyone marks when they're free, and the best time finds itself.",
    url: 'https://seeyasoon.digital',
    siteName: 'seeya',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'seeya — find a time everyone loves' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'seeya — find a time everyone loves',
    description: "Seeya handles the back-and-forth. Share a link, everyone marks when they're free, and the best time finds itself.",
    images: ['/og-image.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
