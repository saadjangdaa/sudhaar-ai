"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { clearUser, getUser, type CitizenUser } from "@/lib/auth";

const LINKS = [
  { href: "/", label: "Feed" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const [user, setUserState] = useState<CitizenUser | null>(null);
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

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm text-white">S</span>
          <span className="hidden sm:inline">Sudhaar</span>
        </Link>

        <div className="ml-2 flex items-center gap-1 text-sm">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 transition ${
                  active ? "bg-brand-weak text-brand" : "text-muted hover:bg-surface-2"
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
            className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
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
                className="hidden text-sm text-muted hover:text-foreground sm:block"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-line px-4 py-1.5 text-sm hover:bg-surface-2"
            >
              Log in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
