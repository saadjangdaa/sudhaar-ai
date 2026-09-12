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
    <main className="animate-page-enter mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card-resting)]">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo href="/" size="lg" showWordmark={false} />
          <h1 className="mt-3 text-xl font-semibold">Log in to Sudhaar</h1>
          <p className="mt-1 text-sm text-muted">
            Demo login — your details stay on this device only. Reporting works without it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              Display name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-line bg-background p-3 text-sm outline-none transition-colors focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="cnic" className="mb-1.5 block text-sm font-medium">
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
              aria-describedby="cnic-help"
              aria-invalid={error ? true : undefined}
              className="w-full rounded-xl border border-line bg-background p-3 text-sm tabular-nums outline-none transition-colors focus:border-brand"
            />
            <p id="cnic-help" className="mt-1.5 text-xs text-muted">
              Stored on this device only. Never attached to complaints or sent anywhere.
            </p>
          </div>

          <div>
            <label htmlFor="area" className="mb-1.5 block text-sm font-medium">
              Your area
            </label>
            <select
              id="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-xl border border-line bg-background p-3 text-sm outline-none transition-colors focus:border-brand"
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
            <p role="alert" className="rounded-xl bg-danger-weak px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-brand px-6 py-3 font-medium text-white transition-all hover:opacity-90 active:scale-95"
          >
            Continue
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Are you an authority?{" "}
          <Link href="/admin/login" className="text-brand hover:underline">
            Authority sign-in
          </Link>
        </p>
      </div>
    </main>
  );
}
