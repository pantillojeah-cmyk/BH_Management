import { Link, useNavigate } from "@tanstack/react-router";
import { Home, Check, LogOut, Heart, LayoutDashboard, ShieldCheck, UserCircle, CalendarCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md">
            <Home className="h-7 w-7" />
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-background">
              <Check className="h-3 w-3 text-white stroke-[3]" />
            </div>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold text-slate-900 dark:text-white leading-snug">Boarding House</span>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-500 leading-snug">Vacancy Tracker</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">ZDSPGC – Dimataling Campus</span>
          </div>
        </Link>


        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/browse" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">Browse</Link>
          {role === "customer" && (
            <>
              <Link to="/favorites" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
                <Heart className="mr-1 inline h-4 w-4" /> Favorites
              </Link>
              <Link to="/reservations" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
                <CalendarCheck className="mr-1 inline h-4 w-4" /> Reservations
              </Link>
            </>
          )}
          {role === "owner" && (
            <Link to="/owner" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
              <LayoutDashboard className="mr-1 inline h-4 w-4" /> Owner Dashboard
            </Link>
          )}
          {role === "admin" && (
            <Link to="/management" className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
              <ShieldCheck className="mr-1 inline h-4 w-4" /> Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link to="/profile" className="hidden items-center gap-2 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground sm:flex">
                <UserCircle className="h-4 w-4" />
                <span className="max-w-[140px] truncate">{user.email}</span>
                {role && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">{role}</span>}
              </Link>
              <Button size="sm" variant="outline" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
                <LogOut className="mr-1 h-4 w-4" /> Sign out
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => navigate({ to: "/customer/login" })}>Sign in</Button>
          )}
        </div>
      </div>
    </header>
  );
}
