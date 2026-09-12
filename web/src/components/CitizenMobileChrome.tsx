"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import BottomTabBar from "@/components/BottomTabBar";

export default function CitizenMobileChrome() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      <BottomTabBar />
      {pathname !== "/submit" && (
        <Link
          href="/submit"
          aria-label="Report an issue"
          className="fab fixed bottom-[4.75rem] right-5 z-40 grid h-14 w-14 place-items-center rounded-full text-2xl font-light sm:hidden"
        >
          +
        </Link>
      )}
    </>
  );
}
