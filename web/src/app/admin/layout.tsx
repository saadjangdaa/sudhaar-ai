import { DM_Sans, Source_Serif_4 } from "next/font/google";
import type { ReactNode } from "react";
import { TooltipProvider } from "./_components/ui/tooltip";
import "./admin.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-admin-sans",
});

const display = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-admin-display",
});

export const metadata = {
  title: "Authority desk — Sudhaar AI",
  description: "Review and close civic complaints for your Karachi desk.",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${sans.variable} ${display.variable} admin-shell`}>
      <TooltipProvider>{children}</TooltipProvider>
    </div>
  );
}
