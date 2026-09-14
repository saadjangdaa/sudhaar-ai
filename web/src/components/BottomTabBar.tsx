"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/feed",
    label: "Feed",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} strokeWidth={1.75} stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75v-5.25H8.25V21.75H3.75A.75.75 0 013 21V9.75z" />
      </svg>
    ),
    matchFn: (p: string) => p === "/feed",
  },
  {
    href: "/submit",
    label: "Report",
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
      </svg>
    ),
    matchFn: (p: string) => p === "/submit",
  },
  {
    href: "/dashboard",
    label: "Stats",
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} strokeWidth={1.75} stroke="currentColor" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h4v-7H3v7zm7 0h4V6h-4v12zm7 0h4v-4h-4v4z" />
      </svg>
    ),
    matchFn: (p: string) => p.startsWith("/dashboard"),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Main navigation"
      className="tab-bar fixed inset-x-0 bottom-0 z-40 sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex h-[3.75rem] max-w-lg items-stretch px-2">
        {TABS.map((tab) => {
          const active = tab.matchFn(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`tab-item flex flex-1 flex-col items-center justify-center gap-0.5 font-display text-[10px] font-semibold active:scale-95 ${
                active ? "tab-item-active" : ""
              }`}
            >
              {tab.icon(active)}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
