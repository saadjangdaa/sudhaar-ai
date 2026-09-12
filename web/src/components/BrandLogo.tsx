import Link from "next/link";

export default function BrandLogo({
  href = "/",
  size = "md",
  showWordmark = true,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}) {
  const mark = {
    sm: "h-8 w-8 text-[13px]",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  }[size];

  return (
    <Link
      href={href}
      aria-label="Sudhaar home"
      className="group inline-flex items-center gap-2.5 transition-opacity hover:opacity-90"
    >
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--brand)] to-[color-mix(in_oklab,var(--brand)_60%,#6366f1)] font-display font-bold text-white shadow-[var(--shadow-glow)] transition-transform group-active:scale-95 ${mark}`}
      >
        S
      </span>
      {showWordmark && (
        <span
          className={`font-display font-bold tracking-tight ${
            size === "sm" ? "hidden text-[15px] sm:inline" : "text-lg"
          }`}
        >
          Sudhaar
        </span>
      )}
    </Link>
  );
}
