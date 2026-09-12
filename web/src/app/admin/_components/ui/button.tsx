import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/admin/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--admin-accent)] focus-visible:ring-offset-2 ring-offset-[var(--admin-paper)]",
  {
    variants: {
      variant: {
        default: "bg-[var(--admin-accent)] text-[var(--admin-accent-fg)] hover:bg-[var(--admin-accent-hover)]",
        outline:
          "border border-[var(--admin-line)] bg-[var(--admin-card)] text-[var(--admin-ink)] hover:bg-[var(--admin-accent-soft)]",
        ghost: "text-[var(--admin-ink)] hover:bg-[var(--admin-accent-soft)]",
        danger: "bg-[var(--admin-danger)] text-white hover:bg-[#7f1d1d]",
      },
      size: {
        default: "h-9 px-3.5",
        sm: "h-8 px-2.5 text-[13px]",
        lg: "h-10 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
