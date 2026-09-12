"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Mobile-only fixed bottom navigation (iOS HIG / Material thumb-zone pattern).
 *
 * – Visible only below the `sm` breakpoint (640 px).
 * – Hidden on /admin/* routes (the authority dashboard has its own shell).
 * – Three tabs: Feed (home), Report (primary CTA), Dashboard.
 * – Safe-area padding handles notched phones.
 *
 * This component is purely presentational — it contains zero data-fetching,
 * state management, or side-effects beyond reading the current pathname.
 */

const TABS = [
  {
    href: "/",
    label: "Feed",
    // Home / feed icon
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9.75L12 3l9 6.75V21a.75.75 0 01-.75.75H15.75v-5.25H8.25V21.75H3.75A.75.75 0 013 21V9.75z" />
      </svg>
    ),
    // Active: exact match only for "/"
    matchFn: (p: string) => p === "/",
  },
  {
    href: "/submit",
    label: "Report",
    // Plus-circle icon — the primary action
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <circle cx="12" cy="12" r="9.25" />
        <path strokeLinecap="round" d="M12 8.5v7M8.5 12h7" />
      </svg>
    ),
    matchFn: (p: string) => p === "/submit",
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    // Bar-chart icon
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 18h4v-7H3v7zm7 0h4V6h-4v12zm7 0h4v-4h-4v4z" />
      </svg>
    ),
    matchFn: (p: string) => p.startsWith("/dashboard"),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  // Don't render on admin routes — the authority shell has its own navigation.
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-md sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-stretch">
        {TABS.map((tab) => {
          const active = tab.matchFn(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors active:scale-95 ${
                active
                  ? "text-brand"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {/* Indicator dot above active tab (subtle, not a full pill) */}
              <span
                className={`mb-0.5 h-0.5 w-4 rounded-full transition-all duration-200 ${
                  active ? "bg-brand" : "bg-transparent"
                }`}
                aria-hidden
              />
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
