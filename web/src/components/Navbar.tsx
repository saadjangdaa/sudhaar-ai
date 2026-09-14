"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import BrandLogo from "@/components/BrandLogo";
import { clearUser, getUser, type CitizenUser } from "@/lib/auth";

const LINKS = [
  { href: "/feed", label: "Feed" },
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

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header
      className={`glass-nav sticky top-0 z-40 transition-shadow duration-200 ${
        scrolled ? "glass-nav-scrolled" : ""
      }`}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-4 sm:h-16 sm:gap-2 sm:px-6">
        <BrandLogo size="sm" />

        <div className="ml-1 hidden items-center gap-0.5 sm:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3.5 py-2 font-display text-sm font-semibold transition-colors ${
                  active ? "text-foreground" : "text-muted hover:text-foreground"
                }`}
              >
                {link.label}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3.5 -bottom-[17px] h-0.5 rounded-full bg-brand sm:-bottom-[21px]"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/submit" className="btn btn-primary hidden sm:inline-flex">
            Report issue
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <span
                className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface-hover font-display text-sm font-bold"
                title={user.name}
              >
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <button
                onClick={() => clearUser()}
                className="btn btn-ghost hidden sm:inline-flex"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-outline hidden sm:inline-flex">
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
