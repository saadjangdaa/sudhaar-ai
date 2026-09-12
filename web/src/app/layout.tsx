import type { Metadata } from "next";
import { Geist_Mono, Inter, Noto_Nastaliq_Urdu, Plus_Jakarta_Sans } from "next/font/google";

import CitizenMobileChrome from "@/components/CitizenMobileChrome";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

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
      className={`${inter.variable} ${jakarta.variable} ${geistMono.variable} ${nastaliq.variable} h-full`}
    >
      <body className="app-shell flex min-h-full flex-col font-sans antialiased">
        <Navbar />
        <div className="flex-1 pb-[5.5rem] sm:pb-0">{children}</div>
        <CitizenMobileChrome />
      </body>
    </html>
  );
}
