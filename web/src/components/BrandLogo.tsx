import Link from "next/link";

/**
 * Single brand mark used in the header and auth pages.
 * The circle "S" is decorative; the link label is always "Sudhaar" for
 * screen readers so we never announce "S Sudhaar" as "SSudhaar".
 */
export default function BrandLogo({
  href = "/",
  size = "md",
  showWordmark = true,
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
}) {
  const sizes = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
  };

  return (
    <Link
      href={href}
      aria-label="Sudhaar home"
      className="inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-90 active:scale-95"
    >
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center rounded-full bg-brand font-bold text-white ${sizes[size]}`}
      >
        S
      </span>
      {showWordmark && (
        <span className={size === "sm" ? "hidden sm:inline" : "inline"}>Sudhaar</span>
      )}
    </Link>
  );
}
