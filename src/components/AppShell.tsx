import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background/50 selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300 overflow-x-hidden">
      {/* Ambient background light orbs for glassmorphic refraction */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[34rem] w-[34rem] rounded-full bg-emerald-500/12 blur-[120px] dark:bg-emerald-500/15 animate-pulse-glow" />
        <div className="absolute top-1/4 -right-32 h-[38rem] w-[38rem] rounded-full bg-teal-400/10 blur-[140px] dark:bg-teal-500/12 animate-float-slow" />
        <div className="absolute -bottom-32 left-1/3 h-[36rem] w-[36rem] rounded-full bg-indigo-500/10 blur-[130px] dark:bg-indigo-600/12 animate-pulse-glow" />
      </div>

      <Navbar />
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      <footer className="relative z-10 mt-12 border-t border-white/40 dark:border-white/10 bg-background/60 backdrop-blur-xl py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Boarding House Vacancy Tracker — ZDSPGC-Dimataling Campus</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Vacancy System
          </span>
        </div>
      </footer>
    </div>
  );
}

