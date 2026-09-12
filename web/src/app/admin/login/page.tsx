"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "../_components/ui/button";
import { Input } from "../_components/ui/input";
import { Label } from "../_components/ui/label";

type Mode = "signin" | "signup";

export default function AdminLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "signup") {
        const response = await fetch("/api/admin/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName }),
        });
        const payload = (await response.json()) as { error?: string; needsConfirmation?: boolean };
        if (!response.ok) {
          setError(payload.error ?? "Could not create the account.");
          return;
        }
        if (payload.needsConfirmation) {
          setNotice("Check your email to confirm the account, then sign in.");
          setMode("signin");
          return;
        }
        router.replace("/admin/pending-approval");
        router.refresh();
        return;
      }

      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not sign in.");
        return;
      }
      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onMagicLink() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Could not send the link.");
        return;
      }
      setNotice("Login link sent. Check your inbox.");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="admin-meta tracking-wide uppercase">Sudhaar AI</p>
      <h1 className="admin-title mt-2">Authority desk</h1>
      <p className="admin-meta mt-2">
        Sign in to the complaints assigned to your municipal desk. New accounts wait for a
        super-admin to assign an authority.
      </p>

      <form onSubmit={onSubmit} className="admin-card mt-8 p-6 hover:transform-none hover:shadow-none">
        <div className="flex gap-4 border-b border-[var(--admin-line)] pb-3">
          <button
            type="button"
            className={`admin-meta ${mode === "signin" ? "text-[var(--admin-ink)]" : ""}`}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`admin-meta ${mode === "signup" ? "text-[var(--admin-ink)]" : ""}`}
            onClick={() => setMode("signup")}
          >
            Create account
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {mode === "signup" ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                autoComplete="name"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error ? (
            <p className="rounded-md bg-[var(--admin-danger-soft)] px-3 py-2 text-sm text-[var(--admin-danger)]">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="rounded-md bg-[var(--admin-accent-soft)] px-3 py-2 text-sm text-[var(--admin-accent)]">
              {notice}
            </p>
          ) : null}

          <Button type="submit" disabled={busy}>
            {busy ? "Working…" : mode === "signup" ? "Request access" : "Enter desk"}
          </Button>

          {mode === "signin" ? (
            <button
              type="button"
              onClick={onMagicLink}
              disabled={busy || !email}
              className="admin-meta text-left underline-offset-2 hover:underline disabled:opacity-50"
            >
              Email me a login link instead
            </button>
          ) : null}
        </div>
      </form>
    </main>
  );
}
