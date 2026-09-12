"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { clearUser, getUser, type CitizenUser } from "@/lib/auth";

/**
 * Sticky header with two states (borrowed from iOS nav / Reddit mobile):
 *
 *  – Expanded (at top):   h-14, logo text visible, border transparent
 *  – Condensed (scrolled): h-12, border visible, subtle shadow
 *
 * Nav links are hidden on mobile — they live in BottomTabBar instead.
 * "+ Report" CTA is hidden on mobile — the FAB takes that role.
 *
 * Zero data-fetching or business-logic changes.
 */

const LINKS = [
  { href: "/", label: "Feed" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const [user, setUserState] = useState<CitizenUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => setUserState(getUser());
    sync();
    window.addEventListener("sudhaar-auth", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("sudhaar-auth", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Condensing-header: listen to scroll and flip a boolean at 4 px
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 4);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 bg-surface/90 backdrop-blur transition-all duration-200 ${
        scrolled ? "border-b border-line shadow-[0_1px_8px_rgb(0_0_0/0.06)]" : "border-b border-transparent"
      }`}
    >
      <nav
        className={`mx-auto flex max-w-5xl items-center gap-3 px-4 transition-all duration-200 ${
          scrolled ? "h-12" : "h-14"
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white">
            S
          </span>
          <span className="hidden sm:inline">Sudhaar</span>
        </Link>

        {/* Nav links — hidden on mobile (BottomTabBar handles that) */}
        <div className="ml-2 hidden items-center gap-1 text-sm sm:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 transition-colors ${
                  active ? "bg-brand-weak text-brand" : "text-muted hover:bg-surface-2"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2">
          {/* CTA — hidden on mobile (FAB handles that) */}
          <Link
            href="/submit"
            className="hidden rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:block"
          >
            + Report
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span
                className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-sm font-semibold"
                title={user.name}
              >
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <button
                onClick={() => clearUser()}
                className="hidden text-sm text-muted transition-colors hover:text-foreground sm:block"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-line px-4 py-1.5 text-sm transition-colors hover:bg-surface-2"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
