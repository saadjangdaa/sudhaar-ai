import type { Metadata } from "next";
import Link from "next/link";

import ReportCard from "@/components/ReportCard";
import { getReports, SUPABASE_CONFIGURED } from "@/lib/reports";
import { AREA_LABELS, AREAS } from "@/lib/types";
import s from "./landing.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sudhaar AI — civic complaints that reach the right desk",
  description:
    "Report a pothole, a nala overflow or uncollected kachra with a photo, a voice note or a line of Urdu. Sudhaar AI validates it, routes it to the authority that actually owns it, and drafts the formal complaint.",
};

/* ── Content ────────────────────────────────────────────────────── */

const STEPS = [
  {
    n: "01",
    title: "Snap it, say it, or type it",
    body: "A photo of the pothole, a ten-second voice note in Urdu, or one line of text. Add your area, drop a GPS pin if you want a crew to find the exact spot.",
    tag: "Citizen · 20 seconds",
  },
  {
    n: "02",
    title: "The agents read it",
    body: "Voice is transcribed, the photo and text are classified into one of five issue types, and a validator agent decides whether this is a real, actionable complaint before anything else runs.",
    tag: "ingest → classifier → validator",
  },
  {
    n: "03",
    title: "Routed to the desk that owns it",
    body: "Karachi has seven bodies with overlapping turf. The router matches your area against the jurisdiction table — cantonment areas override issue type entirely — and records the reason out loud.",
    tag: "router",
  },
  {
    n: "04",
    title: "The letter writes itself",
    body: "A formal complaint in English or Urdu, addressed to the right department, with the issue, the location and the evidence already in it. Send it, or let it sit on the public feed collecting upvotes.",
    tag: "drafter",
  },
];

const ROUTING = [
  { icon: "🕳️", issue: "Potholes, broken roads", to: "KMC", full: "Karachi Metropolitan Corporation" },
  { icon: "🚱", issue: "Sewage, nala overflow", to: "KWSB", full: "Karachi Water & Sewerage Board" },
  { icon: "💧", issue: "Water supply", to: "KWSB", full: "Karachi Water & Sewerage Board" },
  { icon: "🗑️", issue: "Uncollected garbage", to: "SSWMB", full: "Sindh Solid Waste Management Board" },
  { icon: "🚧", issue: "Encroachment", to: "TMA", full: "Town Municipal Administration" },
  {
    icon: "🛡️",
    issue: "Anything in Clifton, DHA, Malir, Faisal",
    to: "Cantonment",
    full: "CBC · Malir CB · Faisal CB",
  },
];

const FEATURES = [
  {
    icon: "🛑",
    title: "Fake reports die early",
    body: "The validator sits before the router. A submission that fails review never gets an authority, never gets a letter, and never appears on the feed — two model calls instead of four.",
  },
  {
    icon: "🗣️",
    title: "Urdu is a first-class input",
    body: "Type it, speak it, read the finished complaint back in Nastaliq. The letter is drafted in the language the citizen chose, not translated after the fact.",
  },
  {
    icon: "⬆️",
    title: "Upvotes you cannot stuff",
    body: "Voting goes through a security-definer RPC keyed on the browser session, so a single tab cannot inflate a count. Pressure on a desk has to be real pressure.",
  },
  {
    icon: "🧾",
    title: "Proof of repair, not a checkbox",
    body: "An authority marks something fixed by uploading an after photo. A vision agent compares it against the original. Status flips to fixed only when verification comes back true.",
  },
  {
    icon: "🎨",
    title: "AI re-design of the street",
    body: "From the desk, generate an image of what the repaired street could look like — a proposal visual that takes a click instead of a contractor.",
  },
  {
    icon: "📍",
    title: "Scoped to one desk",
    body: "Every report carries an authority slug. KWSB staff see sewage and water in their jurisdiction and nothing else — no shared inbox, no triage meeting.",
  },
];

const LIFECYCLE = [
  {
    key: "rejected",
    label: "Rejected",
    icon: "⛔",
    body: "Validator judged it not actionable. Hidden from the public feed and from every desk.",
    tone: "bg-danger-weak text-danger",
    owner: "set by validator",
  },
  {
    key: "pending",
    label: "Pending",
    icon: "⏳",
    body: "Published to the public feed, routed, waiting on the authority to pick it up.",
    tone: "bg-warn-weak text-warn",
    owner: "set by validator",
  },
  {
    key: "in_progress",
    label: "In progress",
    icon: "🔧",
    body: "A desk has accepted the report and started work on it.",
    tone: "bg-info-weak text-info",
    owner: "set by desk",
  },
  {
    key: "fixed",
    label: "Fixed",
    icon: "✅",
    body: "Repair proven with an after photo and confirmed by the verification agent.",
    tone: "bg-ok-weak text-ok",
    owner: "set by desk",
  },
];

const PIPELINE_ROWS = [
  { k: "classifier", v: "pothole", note: "confidence 0.94", tone: "text-brand" },
  { k: "validator", v: "real complaint", note: "evidence: strong", tone: "text-ok" },
  { k: "router", v: "KMC", note: "Gulshan-e-Iqbal · municipal", tone: "text-info" },
  { k: "drafter", v: "letter ready", note: "Urdu · formal", tone: "text-ai" },
];

/* ── Page ───────────────────────────────────────────────────────── */

export default async function LandingPage() {
  // Same read the feed uses, and it falls back to demo rows on its own, so the
  // hero counters are never blank — even with no Supabase credentials set.
  const reports = await getReports({ sort: "top" });

  const total = reports.length;
  const fixed = reports.filter((r) => r.status === "fixed").length;
  const upvotes = reports.reduce((sum, r) => sum + (r.upvotes ?? 0), 0);
  const desks = new Set(reports.map((r) => r.authority_slug).filter(Boolean)).size || 7;
  const preview = reports.slice(0, 3);

  const stats = [
    { value: String(total), label: "reports filed" },
    { value: String(fixed), label: "marked fixed" },
    { value: String(upvotes), label: "citizen upvotes" },
    { value: String(desks), label: "authority desks" },
  ];

  return (
    <div className={`${s.page} animate-page-enter`}>
      <div className={s.aurora} aria-hidden />
      <div className={s.gridlines} aria-hidden />

      <div className={s.content}>
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div>
              <p className={`${s.eyebrow} font-mono text-[11px] uppercase tracking-widest text-muted`}>
                <span className={`${s.eyebrowTag} font-semibold`}>Karachi</span>
                <span className={s.liveDot} aria-hidden />
                <span>Civic reporting, agent-routed</span>
              </p>

              <h1 className="font-display mt-6 text-[2.6rem] font-extrabold leading-[1.04] tracking-tight sm:text-6xl">
                <span className={s.heroTitle}>The complaint that</span>
                <br />
                <span className={s.heroTitle}>actually reaches</span>
                <br />
                <span className="text-brand">the right desk.</span>
              </h1>

              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-muted">
                A pothole on your street, a nala running over, kachra nobody has
                collected in nine days. Photograph it or say it out loud in Urdu.
                Sudhaar AI checks that it is real, works out which of Karachi&apos;s seven
                authorities owns it, and writes the formal complaint for you.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/submit" className="btn btn-primary px-6 py-3 text-[15px]">
                  Report an issue
                </Link>
                <Link href="/feed" className="btn btn-outline px-5 py-3 text-[15px]">
                  Browse the feed
                </Link>
                <Link href="/admin/login" className="btn btn-ghost px-4 py-3 text-[15px]">
                  Authority desk →
                </Link>
              </div>

              <dl className="mt-12 grid max-w-lg grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="sr-only">{stat.label}</dt>
                    <dd className="font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                      {stat.value}
                    </dd>
                    <p className="mt-0.5 text-[12px] leading-tight text-muted">{stat.label}</p>
                  </div>
                ))}
              </dl>

              {!SUPABASE_CONFIGURED && (
                <p className="mt-3 font-mono text-[11px] text-muted">
                  Sample data — live counts once Supabase env vars are set.
                </p>
              )}
            </div>

            {/* Hero mock: one report walking through the pipeline. */}
            <div className={`${s.glass} p-5 sm:p-6`}>
              <div className="flex items-center gap-2">
                <span className={s.liveDot} aria-hidden />
                <span className="font-mono text-[11px] uppercase tracking-widest text-muted">
                  Incoming report · live
                </span>
              </div>

              <div className="mt-4 flex items-start gap-3">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-line bg-[var(--surface-hover)] text-2xl">
                  🕳️
                </div>
                <div className="min-w-0">
                  <p className="urdu text-[15px]" dir="rtl">
                    گلشن اقبال بلاک 13 میں سڑک پر بڑا گڑھا ہے۔
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    voice note · 11s · transcribed
                  </p>
                </div>
              </div>

              <div className={`${s.rule} my-5`} />

              <ol className="space-y-3">
                {PIPELINE_ROWS.map((row) => (
                  <li key={row.k} className="flex items-baseline gap-3">
                    <span className="w-[4.75rem] shrink-0 font-mono text-[11px] text-muted">
                      {row.k}
                    </span>
                    <span className={`font-display text-sm font-bold ${row.tone}`}>{row.v}</span>
                    <span className="ml-auto hidden truncate font-mono text-[11px] text-muted sm:block">
                      {row.note}
                    </span>
                  </li>
                ))}
              </ol>

              <div className={`${s.letterBody} mt-5 p-4`}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  Drafted complaint
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">
                  <span className="text-foreground">To: Karachi Metropolitan Corporation.</span>{" "}
                  A road cavity on Block 13, Gulshan-e-Iqbal has been reported by a
                  resident with photographic evidence. Two-wheeler riders are falling at
                  night. Immediate repair is requested…
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-warn-weak px-2 py-0.5 text-[11px] font-semibold text-warn">
                  ⏳ Pending
                </span>
                <span className="rounded-md bg-brand-weak px-2 py-0.5 text-[11px] font-semibold text-brand">
                  k/Gulshan-e-Iqbal
                </span>
                <span className="ml-auto font-mono text-[11px] text-muted">▲ 128</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── The problem ──────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className={`${s.rule} mb-14`} />
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-brand">
                Why nothing gets fixed
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                The complaint is not the hard part. The paperwork is.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  t: "Nobody knows who owns it",
                  b: "A broken road is KMC. The sewage under it is KWSB. In DHA both are the cantonment board. Most complaints are filed against the wrong body and quietly die there.",
                },
                {
                  t: "The format is a gate",
                  b: "Departments want a formal written complaint. A WhatsApp message or a shouted grievance does not enter the system at all.",
                },
                {
                  t: "One voice is easy to ignore",
                  b: "A single citizen letter carries no weight. Forty people reporting the same nala on a public board does.",
                },
                {
                  t: "Fixed is unverifiable",
                  b: "A file gets closed. Whether the pothole was actually filled is nobody's job to check.",
                },
              ].map((item) => (
                <div key={item.t} className={`${s.card} ${s.cardHover} p-5`}>
                  <h3 className="font-display text-[15px] font-bold tracking-tight">{item.t}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{item.b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <header className="max-w-2xl">
            <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-brand">
              How it works
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Twenty seconds of your time, four agents of ours.
            </h2>
          </header>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {STEPS.map((step) => (
              <div key={step.n} className={`${s.card} ${s.cardHover} flex gap-4 p-5 sm:p-6`}>
                <span className={`${s.stepIndex} font-mono text-xs font-bold`}>{step.n}</span>
                <div className="min-w-0">
                  <h3 className="font-display text-[17px] font-bold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-muted">{step.body}</p>
                  <p className="mt-3 font-mono text-[11px] text-brand">{step.tag}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Routing ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-brand">
                Routing
              </p>
              <h2 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                Seven authorities. One correct answer.
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                Municipal areas route by issue type. Cantonment areas — Clifton, DHA,
                Malir and Faisal — route to their own board for every issue type, which
                is the rule most citizens get wrong. Every report carries the reason it
                was routed the way it was.
              </p>
              <Link href="/dashboard" className="btn btn-soft mt-6 inline-flex">
                See the public board
              </Link>
            </div>

            <div className={`${s.card} overflow-hidden`}>
              {ROUTING.map((row, i) => (
                <div
                  key={row.issue}
                  className={`flex items-center gap-4 px-5 py-4 ${
                    i > 0 ? "border-t border-[var(--border-subtle)]" : ""
                  }`}
                >
                  <span className="text-xl" aria-hidden>
                    {row.icon}
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] font-medium">{row.issue}</span>
                  <span className="hidden shrink-0 text-right font-mono text-[11px] text-muted xl:block">
                    {row.full}
                  </span>
                  <span className="shrink-0 rounded-md bg-brand-weak px-2 py-1 font-display text-[11px] font-bold text-brand">
                    {row.to}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-muted">
              Areas covered
            </p>
            <div className={s.marquee}>
              {[0, 1].map((copy) => (
                <div key={copy} className={s.marqueeTrack} aria-hidden={copy === 1}>
                  {AREAS.map((area) => (
                    <span key={area} className={`${s.areaChip} text-[13px]`}>
                      {AREA_LABELS[area]}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Two surfaces ─────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <header className="max-w-2xl">
            <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-brand">
              Two surfaces
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              A forum for the street. A desk for the department.
            </h2>
          </header>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <div className={`${s.card} ${s.cardHover} p-6 sm:p-8`}>
              <span className="font-mono text-[11px] uppercase tracking-widest text-brand">
                For citizens
              </span>
              <h3 className="font-display mt-3 text-xl font-bold tracking-tight">
                Report it, then watch it
              </h3>
              <ul className={`${s.dotList} mt-5 space-y-2.5 text-[14px] leading-relaxed text-muted`}>
                <li>Photo, voice note or text — plus an optional GPS pin.</li>
                <li>Public feed sorted by upvotes, so the worst problems rise.</li>
                <li>Comments on every complaint, in Urdu or English.</li>
                <li>An AI overview explaining what the agents concluded and why.</li>
                <li>A filterable board by area, authority and issue type.</li>
              </ul>
              <Link href="/submit" className="btn btn-primary mt-7 inline-flex">
                Report an issue
              </Link>
            </div>

            <div className={`${s.card} ${s.cardHover} p-6 sm:p-8`}>
              <span className="font-mono text-[11px] uppercase tracking-widest text-info">
                For authorities
              </span>
              <h3 className="font-display mt-3 text-xl font-bold tracking-tight">
                A queue that is only yours
              </h3>
              <ul className={`${s.dotList} mt-5 space-y-2.5 text-[14px] leading-relaxed text-muted`}>
                <li>Sign up, get approved, see only your authority&apos;s reports.</li>
                <li>Start work to move a report into in progress.</li>
                <li>Mark fixed by uploading proof — a vision agent confirms it.</li>
                <li>Generate an AI re-design of the street as a repair proposal.</li>
                <li>Rejected submissions never reach the queue at all.</li>
              </ul>
              <Link href="/admin/login" className="btn btn-outline mt-7 inline-flex">
                Authority login
              </Link>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <header className="max-w-2xl">
            <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-brand">
              Details that matter
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Built so it survives contact with real users.
            </h2>
          </header>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className={`${s.card} ${s.cardHover} p-5 sm:p-6`}>
                <span className="text-2xl" aria-hidden>
                  {f.icon}
                </span>
                <h3 className="font-display mt-3 text-[15.5px] font-bold tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Lifecycle ────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className={`${s.rule} mb-14`} />
          <header className="max-w-2xl">
            <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-brand">
              Lifecycle
            </p>
            <h2 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              One status, two owners.
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              The validator agent sets the first state. After that only the authority
              desk can move it — and it cannot skip the proof step.
            </p>
          </header>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LIFECYCLE.map((st) => (
              <div key={st.key} className={`${s.card} p-5`}>
                <span
                  className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ${st.tone}`}
                >
                  {st.icon} {st.label}
                </span>
                <p className="mt-3 text-[13.5px] leading-relaxed text-muted">{st.body}</p>
                <p className="mt-3 font-mono text-[10.5px] uppercase tracking-widest text-muted">
                  {st.owner}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Live feed preview ────────────────────────────────── */}
        {preview.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div className="max-w-2xl">
                <p className="font-mono text-[11px] font-medium uppercase tracking-widest text-brand">
                  Live from the feed
                </p>
                <h2 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  What Karachi is reporting right now.
                </h2>
              </div>
              <Link href="/feed" className="btn btn-outline">
                Open the feed
              </Link>
            </header>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((report) => (
                <ReportCard key={report.id} report={report} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-24">
          <div className={`${s.ctaPanel} px-6 py-14 text-center sm:px-12 sm:py-20`}>
            <h2 className="font-display mx-auto max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.75rem]">
              There is a pothole on your street right now.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
              Take one photo. We will handle the department, the jurisdiction and the
              letter.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/submit" className="btn btn-primary px-7 py-3.5 text-[15px]">
                Report an issue
              </Link>
              <Link href="/feed" className="btn btn-outline px-6 py-3.5 text-[15px]">
                Browse the feed
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className={`${s.rule} mb-8`} />
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-sm font-bold tracking-tight">Sudhaar AI</p>
              <p className="mt-1 text-[13px] text-muted">
                Civic issue reporting and routing for Karachi · CWA Ship Karachi 2026
              </p>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
              <Link href="/feed" className="transition-colors hover:text-foreground">
                Feed
              </Link>
              <Link href="/dashboard" className="transition-colors hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/submit" className="transition-colors hover:text-foreground">
                Report
              </Link>
              <Link href="/admin/login" className="transition-colors hover:text-foreground">
                Authority desk
              </Link>
            </nav>
          </div>
          <p className="mt-8 font-mono text-[11px] leading-relaxed text-muted">
            Demo build. Authority contact addresses in the seed data are placeholders —
            no real department is emailed from this deployment.
          </p>
        </footer>
      </div>
    </div>
  );
}
