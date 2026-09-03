// apps/web/app/layout.tsx — Root layout with JetBrains Mono + Inter via next/font
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CodeJudge — AI Hackathon Evaluation Platform',
    template: '%s | CodeJudge',
  },
  description:
    'AI-powered code analysis and candidate shortlisting platform for enterprise hackathons.',
  keywords: ['hackathon', 'code analysis', 'AI judging', 'shortlisting'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-[#0D1117] text-[#E6EDF3] antialiased">
        {children}
      </body>
    </html>
  );
}
