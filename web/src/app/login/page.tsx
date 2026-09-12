"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatCnic, isValidCnic, normalizeCnic, setUser } from "@/lib/auth";
import { AREA_LABELS, AREAS } from "@/lib/types";

/**
 * Sample citizen login — demo only.
 *
 * No password, no server-side identity: reporting and upvoting stay anonymous by
 * design (see src/lib/session.ts). This exists so the portal has a signed-in
 * state to show. Real authority authentication is a separate portal, under /admin.
 *
 * The CNIC collected here is stored on this device and nowhere else — see the
 * note at the top of src/lib/auth.ts for why it must never reach public.reports.
 */
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
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-lg border border-line bg-surface p-6">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand text-lg font-semibold text-white">
            S
          </span>
          <h1 className="text-xl font-semibold">Log in to Sudhaar</h1>
          <p className="mt-1 text-sm text-muted">
            Demo login — your details are stored on this device only. Reporting works
            without it.
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
              className="w-full rounded-lg border border-line bg-background p-3 text-sm outline-none focus:border-brand"
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
              className="w-full rounded-lg border border-line bg-background p-3 text-sm tabular-nums outline-none focus:border-brand"
            />
            <p id="cnic-help" className="mt-1.5 text-xs text-muted">
              Stored on this device only. It is never attached to your complaints and
              never leaves your browser.
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
              className="w-full rounded-lg border border-line bg-background p-3 text-sm outline-none focus:border-brand"
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
            <p role="alert" className="rounded-lg bg-danger-weak px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-brand px-6 py-3 font-medium text-white hover:opacity-90"
          >
            Continue
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Are you an authority?{" "}
          <Link href="/admin/login" className="text-brand hover:underline">
            Authority portal
          </Link>
        </p>
      </div>
    </main>
  );
}
