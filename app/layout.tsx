import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Script & Social Generator',
  description: 'Generate engaging scripts and social posts from a topic',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
