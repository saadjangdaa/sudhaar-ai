"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import BrandLogo from "@/components/BrandLogo";
import { formatCnic, isValidCnic, normalizeCnic, setUser } from "@/lib/auth";
import { AREA_LABELS, AREAS } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [cnic, setCnic] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidCnic(cnic)) {
      setError("Enter a 13-digit CNIC, for example 42101-1234567-8.");
      return;
    }
    setError(null);
    setUser({
      name: name.trim() || "Karachi resident",
      area,
      cnic: normalizeCnic(cnic),
    });
    router.push("/");
  }

  return (
    <div className="animate-page-enter flex min-h-[calc(100dvh-5.5rem)] items-center justify-center px-4 py-10 sm:min-h-0 sm:py-16">
      <div className="panel w-full max-w-md shadow-[var(--shadow-md)]">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo href="/" size="lg" showWordmark={false} />
          <h1 className="font-display mt-4 text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">
            Demo login — stored on this device only. Reporting works without it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block font-display text-sm font-semibold">
              Display name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-line bg-[var(--canvas)] px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="cnic" className="mb-1.5 block font-display text-sm font-semibold">
              CNIC
            </label>
            <input
              id="cnic"
              value={formatCnic(cnic)}
              onChange={(e) => {
                setCnic(normalizeCnic(e.target.value));
                setError(null);
              }}
              placeholder="42101-1234567-8"
              inputMode="numeric"
              autoComplete="off"
              className="w-full rounded-xl border border-line bg-[var(--canvas)] px-4 py-3 font-mono text-sm outline-none transition-colors focus:border-brand"
            />
            <p className="mt-1.5 text-xs text-muted">Never leaves your browser.</p>
          </div>

          <div>
            <label htmlFor="area" className="mb-1.5 block font-display text-sm font-semibold">
              Your area
            </label>
            <select
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-xl border border-line bg-[var(--canvas)] px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
            >
              <option value="">Select an area</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {AREA_LABELS[a]}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-danger-weak px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" className="btn btn-primary w-full !py-3">
            Continue
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Authority staff?{" "}
          <Link href="/admin/login" className="font-semibold text-brand hover:underline">
            Sign in to desk
          </Link>
        </p>
      </div>
    </div>
  );
}
