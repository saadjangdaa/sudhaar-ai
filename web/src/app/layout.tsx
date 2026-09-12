import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from "next/font/google";

import BottomTabBar from "@/components/BottomTabBar";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const nastaliq = Noto_Nastaliq_Urdu({ variable: "--font-nastaliq", subsets: ["arabic"] });

export const metadata: Metadata = {
  title: "Sudhaar — Karachi civic reports",
  description:
    "Report a civic issue in Karachi. AI classifies it, routes it to the right authority, and drafts the complaint.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${nastaliq.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Navbar />

        {/*
         * Bottom padding on mobile reserves space above the BottomTabBar
         * and FAB so the last feed card is never covered.
         * On ≥ sm the tab bar and FAB are hidden so no padding needed.
         */}
        <div className="flex-1 pb-24 sm:pb-0">{children}</div>

        {/* ── Mobile: bottom tab bar (Feed / Report / Dashboard) ── */}
        <BottomTabBar />

        {/* ── Mobile: floating action button for "Report Issue" ──
            Sits above the tab bar (bottom-[4.5rem] ≈ 72 px, above h-16=64 px).
            Hidden on ≥ sm — the header "+ Report" button handles desktop.
            Purely a navigational link; no data-fetching.
        ── */}
        <Link
          href="/submit"
          aria-label="Report an issue"
          className="fixed bottom-[4.5rem] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white shadow-[0_4px_16px_rgb(0_0_0/0.20)] transition-all hover:opacity-90 active:scale-95 sm:hidden"
        >
          +
        </Link>
      </body>
    </html>
  );
}
