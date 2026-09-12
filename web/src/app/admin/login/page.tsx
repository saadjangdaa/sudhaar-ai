"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import BrandLogo from "@/components/BrandLogo";
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
    <main className="animate-page-enter mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-[var(--shadow-card-resting)]">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo href="/admin/login" size="lg" showWordmark={false} />
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Restricted portal
          </p>
          <h1 className="mt-1 text-xl font-semibold">Authority sign-in</h1>
          <p className="mt-2 text-sm text-muted">
            For municipal desk staff only. New accounts wait for a super-admin to assign your
            authority before the dashboard opens.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex gap-4 border-b border-line pb-3">
            <button
              type="button"
              className={`text-sm font-medium transition-colors ${
                mode === "signin" ? "text-brand" : "text-muted hover:text-foreground"
              }`}
              onClick={() => setMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`text-sm font-medium transition-colors ${
                mode === "signup" ? "text-brand" : "text-muted hover:text-foreground"
              }`}
              onClick={() => setMode("signup")}
            >
              Request access
            </button>
          </div>

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
            <Label htmlFor="email">Work email</Label>
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
            <p className="rounded-xl bg-danger-weak px-3 py-2 text-sm text-danger">{error}</p>
          ) : null}
          {notice ? (
            <p className="rounded-xl bg-brand-weak px-3 py-2 text-sm text-brand">{notice}</p>
          ) : null}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Working…" : mode === "signup" ? "Submit request" : "Enter desk"}
          </Button>

          {mode === "signin" ? (
            <button
              type="button"
              onClick={onMagicLink}
              disabled={busy || !email}
              className="text-left text-sm text-muted underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
            >
              Email me a login link instead
            </button>
          ) : null}
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Citizen reporting?{" "}
          <Link href="/" className="text-brand hover:underline">
            Back to public app
          </Link>
        </p>
      </div>
    </main>
  );
}
