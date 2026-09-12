import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from "next/font/google";

import CitizenMobileChrome from "@/components/CitizenMobileChrome";
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
        <div className="flex-1 pb-24 sm:pb-0">{children}</div>
        <CitizenMobileChrome />
      </body>
    </html>
  );
}
