import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

export const metadata: Metadata = {
  title: 'seeya — find a time everyone loves',
  description: 'Share a link. Pick your times. Let the AI find the perfect moment.',
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
