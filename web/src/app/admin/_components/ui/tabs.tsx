"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/admin/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: TabsPrimitive.TabsListProps) {
  return (
    <TabsPrimitive.List
      className={cn(
        "flex gap-6 border-b border-[var(--admin-line)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: TabsPrimitive.TabsTriggerProps) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "admin-meta -mb-px border-b-2 border-transparent pb-2 text-[var(--admin-muted)] transition-colors hover:text-[var(--admin-ink)] data-[state=active]:border-[var(--admin-accent)] data-[state=active]:text-[var(--admin-ink)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({ className, ...props }: TabsPrimitive.TabsContentProps) {
  return <TabsPrimitive.Content className={cn("pt-6 outline-none", className)} {...props} />;
}
