"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { setUser } from "@/lib/auth";
import { AREA_LABELS, AREAS } from "@/lib/types";

/**
 * Sample citizen login — demo only.
 *
 * No password, no server-side identity: reporting and upvoting stay anonymous
 * by design (see src/lib/session.ts). This exists so the portal has a signed-in
 * state to show. Real authority authentication is a separate portal, under
 * /adminauthority.
 */
export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [area, setArea] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUser({ name: name.trim() || "Karachi resident", area });
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
            Demo login — your name is stored on this device only. Reporting works without it.
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

          <button
            type="submit"
            className="w-full rounded-full bg-brand px-6 py-3 font-medium text-white hover:opacity-90"
          >
            Continue
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Are you an authority?{" "}
          <Link href="/adminauthority/login" className="text-brand hover:underline">
            Authority portal
          </Link>
        </p>
      </div>
    </main>
  );
}
