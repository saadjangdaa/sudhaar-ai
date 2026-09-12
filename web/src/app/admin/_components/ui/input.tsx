import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/admin/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-md border border-[var(--admin-line)] bg-[var(--admin-card)] px-3 text-sm text-[var(--admin-ink)] outline-none placeholder:text-[var(--admin-muted)] focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)]",
        className,
      )}
      {...props}
    />
  );
}
