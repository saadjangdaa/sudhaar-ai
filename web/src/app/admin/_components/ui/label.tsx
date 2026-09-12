"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/admin/utils";

export function Label({ className, ...props }: LabelPrimitive.LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn("text-[13px] font-medium text-[var(--admin-ink)]", className)}
      {...props}
    />
  );
}
