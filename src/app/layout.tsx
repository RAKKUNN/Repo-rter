import type { Metadata } from 'next';
import { Pixelify_Sans } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const pixelFont = Pixelify_Sans({ subsets: ['latin'], variable: '--font-pixel' });

export const metadata: Metadata = {
  title: 'GitHub Traffic Dashboard',
  description: 'A beautiful dashboard for your GitHub repositories traffic',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${pixelFont.variable} antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
