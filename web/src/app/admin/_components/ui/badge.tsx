import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/admin/utils";

const badgeVariants = cva("admin-stamp", {
  variants: {
    tone: {
      pending: "text-[var(--admin-pending)]",
      in_progress: "text-[var(--admin-progress)]",
      fixed: "text-[var(--admin-fixed)]",
      muted: "text-[var(--admin-muted)]",
    },
  },
  defaultVariants: { tone: "muted" },
});

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
