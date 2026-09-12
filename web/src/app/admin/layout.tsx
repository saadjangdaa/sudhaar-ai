import type { ReactNode } from "react";
import { TooltipProvider } from "./_components/ui/tooltip";
import "./admin.css";

export const metadata = {
  title: "Authority desk — Sudhaar AI",
  description: "Review and close civic complaints for your Karachi desk.",
};

/**
 * The desk used to load its own DM Sans + Source Serif pair. It now inherits the
 * root font from web/src/app/layout.tsx so the desk and the citizen portal read
 * as one product — and two fewer font families cross the wire.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <TooltipProvider>{children}</TooltipProvider>
    </div>
  );
}
