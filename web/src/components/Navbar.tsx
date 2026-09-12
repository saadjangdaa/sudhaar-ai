"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import BrandLogo from "@/components/BrandLogo";
import { clearUser, getUser, type CitizenUser } from "@/lib/auth";

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

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 4);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null;

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
        <BrandLogo size="sm" />

        <div className="ml-2 hidden items-center gap-1 text-sm sm:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`interactive-chip rounded-full px-3 py-1.5 ${
                  active ? "bg-brand-weak text-brand" : "text-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/submit"
            className="hidden rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-95 sm:block"
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
              className="interactive-chip rounded-full border border-line px-4 py-1.5 text-sm"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
