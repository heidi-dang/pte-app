import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PTE Academic Platform — Study Smarter, Score Higher',
  description:
    'Commercial PTE Academic preparation platform with AI-estimated scoring, diagnostic assessment, adaptive study plans, and all 22 task types.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
