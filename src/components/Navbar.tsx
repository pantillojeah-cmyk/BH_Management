import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Check, LogOut, Heart, LayoutDashboard, ShieldCheck, UserCircle, CalendarCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 dark:border-white/10 bg-background/70 backdrop-blur-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex items-center gap-3 transition-transform hover:scale-[1.02]">
          <img
            src="/logo.png"
            alt="Boarding House Vacancy Tracker"
            className="h-11 w-11 rounded-full object-cover shadow-md border-2 border-emerald-500/40 transition-transform group-hover:scale-105"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-slate-900 dark:text-white leading-snug tracking-tight">Boarding House</span>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 leading-snug">Vacancy Tracker</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">ZDSPGC – Dimataling Campus</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1.5 md:flex">
          <Link
            to="/browse"
            className="rounded-xl px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/60 hover:backdrop-blur-md border border-transparent hover:border-white/40 dark:hover:border-white/10 transition-all"
          >
            Browse
          </Link>
          {role === "customer" && (
            <>
              <Link
                to="/favorites"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/60 hover:backdrop-blur-md border border-transparent hover:border-white/40 dark:hover:border-white/10 transition-all flex items-center"
              >
                <Heart className="mr-1.5 inline h-4 w-4 text-rose-500" /> Favorites
              </Link>
              <Link
                to="/reservations"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/60 hover:backdrop-blur-md border border-transparent hover:border-white/40 dark:hover:border-white/10 transition-all flex items-center"
              >
                <CalendarCheck className="mr-1.5 inline h-4 w-4 text-emerald-500" /> Reservations
              </Link>
            </>
          )}
          {role === "owner" && (
            <Link
              to="/owner"
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/60 hover:backdrop-blur-md border border-transparent hover:border-white/40 dark:hover:border-white/10 transition-all flex items-center"
            >
              <LayoutDashboard className="mr-1.5 inline h-4 w-4 text-indigo-500" /> Owner Dashboard
            </Link>
          )}
          {role === "admin" && (
            <Link
              to="/management"
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/60 hover:backdrop-blur-md border border-transparent hover:border-white/40 dark:hover:border-white/10 transition-all flex items-center"
            >
              <ShieldCheck className="mr-1.5 inline h-4 w-4 text-primary" /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <Link
                to="/profile"
                className="hidden items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-foreground/80 hover:text-foreground bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-sm transition-all sm:flex"
              >
                <UserCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="max-w-[140px] truncate font-medium text-xs">{user.email}</span>
                {role && (
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {role}
                  </span>
                )}
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-white/60 dark:border-white/15 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md hover:bg-white/70 dark:hover:bg-slate-800/70 shadow-sm"
                onClick={async () => {
                  const currentRole = role;
                  await signOut();
                  if (currentRole === "admin") {
                    navigate({ to: "/management/login" });
                  } else if (currentRole === "owner") {
                    navigate({ to: "/owner/login" });
                  } else {
                    navigate({ to: "/" });
                  }
                }}
              >
                <LogOut className="mr-1 h-3.5 w-3.5" /> Sign out
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 border border-white/20 transition-all"
              onClick={() => navigate({ to: "/customer/login" })}
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

