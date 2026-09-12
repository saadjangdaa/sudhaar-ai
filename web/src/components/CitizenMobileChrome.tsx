"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import BottomTabBar from "@/components/BottomTabBar";

/** Mobile-only chrome (tab bar + FAB). Hidden on admin routes. */
export default function CitizenMobileChrome() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <BottomTabBar />
      <Link
        href="/submit"
        aria-label="Report an issue"
        className="fixed bottom-[4.5rem] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white shadow-[0_4px_16px_rgb(0_0_0/0.20)] transition-all hover:opacity-90 active:scale-95 sm:hidden"
      >
        +
      </Link>
    </>
  );
}
