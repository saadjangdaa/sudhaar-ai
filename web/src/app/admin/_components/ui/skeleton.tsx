import type { HTMLAttributes } from "react";
import { cn } from "@/lib/admin/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-[var(--admin-line)]", className)} {...props} />;
}
