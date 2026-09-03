// apps/web/app/layout.tsx — Root layout with sidebar on all pages
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Deebug — AI Code Analyzer & Report Card Agent",
    template: "%s | Deebug",
  },
  description:
    "Autonomous AI code analysis platform. Submit any codebase and receive a detailed Report Card with numeric grades, detected bugs, and AI-generated interview questions.",
  keywords: ["code analysis", "AI", "report card", "bug detection", "LangGraph"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body
        className="antialiased"
        style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <div className="flex min-h-screen">
          {/* Persistent sidebar */}
          <Sidebar />
          {/* Main content — offset by sidebar width */}
          <main className="flex-1 min-h-screen" style={{ marginLeft: "140px" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
