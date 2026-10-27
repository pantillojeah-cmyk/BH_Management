import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Home, Check, LogOut, Heart, LayoutDashboard, ShieldCheck, UserCircle, CalendarCheck, Menu, X, Compass, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    const currentRole = role;
    await signOut();
    setMobileMenuOpen(false);
    if (currentRole === "admin") {
      navigate({ to: "/management/login" });
    } else if (currentRole === "owner") {
      navigate({ to: "/owner/login" });
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 dark:border-white/10 bg-background/80 backdrop-blur-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 sm:py-3">
        {/* Brand Logo & Name */}
        <Link to="/" className="group flex items-center gap-2.5 sm:gap-3 transition-transform hover:scale-[1.01] min-w-0">
          <img
            src="/logo.png?v=2026"
            alt="Boarding House Vacancy Tracker"
            className="h-9 w-9 sm:h-11 sm:w-11 rounded-full object-contain bg-white p-0.5 shadow-md border-2 border-emerald-500/40 transition-transform group-hover:scale-105 shrink-0"
          />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug tracking-tight truncate">
              Boarding House
            </span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 leading-snug truncate">
              Vacancy Tracker
            </span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 truncate hidden xs:block">
              ZDSPGC – Dimataling Campus
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1.5 md:flex">
          <Link
            to="/browse"
            className="rounded-xl px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/60 hover:backdrop-blur-md border border-transparent hover:border-white/40 dark:hover:border-white/10 transition-all flex items-center gap-1.5"
          >
            <Compass className="h-4 w-4 text-emerald-600" /> Browse
          </Link>
          {role === "customer" && (
            <>
              <Link
                to="/favorites"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/60 hover:backdrop-blur-md border border-transparent hover:border-white/40 dark:hover:border-white/10 transition-all flex items-center gap-1.5"
              >
                <Heart className="h-4 w-4 text-rose-500" /> Favorites
              </Link>
              <Link
                to="/reservations"
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/60 hover:backdrop-blur-md border border-transparent hover:border-white/40 dark:hover:border-white/10 transition-all flex items-center gap-1.5"
              >
                <CalendarCheck className="h-4 w-4 text-emerald-500" /> Reservations
              </Link>
            </>
          )}
          {role === "owner" && (
            <Link
              to="/owner"
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/60 hover:backdrop-blur-md border border-transparent hover:border-white/40 dark:hover:border-white/10 transition-all flex items-center gap-1.5"
            >
              <LayoutDashboard className="h-4 w-4 text-indigo-500" /> Owner Dashboard
            </Link>
          )}
        </nav>

        {/* Right Section / Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to="/profile"
                className="hidden items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-foreground/80 hover:text-foreground bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-sm transition-all sm:flex"
              >
                <UserCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="max-w-[130px] truncate font-medium text-xs">{user.email}</span>
                {role && (
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    {role}
                  </span>
                )}
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="hidden sm:flex rounded-xl border-white/60 dark:border-white/15 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md hover:bg-white/70 dark:hover:bg-slate-800/70 shadow-sm"
                onClick={handleSignOut}
              >
                <LogOut className="mr-1 h-3.5 w-3.5" /> Sign out
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="hidden sm:flex rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 border border-white/20 transition-all"
              onClick={() => navigate({ to: "/customer/login" })}
            >
              Sign in
            </Button>
          )}

          {/* Mobile Hamburger Button */}
          <Button
            size="sm"
            variant="outline"
            aria-label="Toggle navigation menu"
            className="flex md:hidden h-9 w-9 p-0 rounded-xl border-white/60 dark:border-white/15 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
          </Button>
        </div>
      </div>

      {/* Mobile Slide-Down Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/40 dark:border-white/10 bg-background/95 backdrop-blur-2xl px-4 py-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {/* User Status on Mobile */}
          {user && (
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/40 dark:border-white/10"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-foreground truncate">{user.email}</div>
                  <div className="text-[10px] text-muted-foreground capitalize">Signed in as {role || "user"}</div>
                </div>
              </div>
              {role && (
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">
                  {role}
                </span>
              )}
            </Link>
          )}

          {/* Mobile Navigation Links */}
          <div className="grid gap-1">
            <Link
              to="/browse"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
            >
              <Compass className="h-4 w-4 text-emerald-600" />
              <span>Browse Boarding Houses</span>
            </Link>

            {role === "customer" && (
              <>
                <Link
                  to="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-rose-500/10 hover:text-rose-600 transition-colors"
                >
                  <Heart className="h-4 w-4 text-rose-500" />
                  <span>Saved Favorites</span>
                </Link>
                <Link
                  to="/reservations"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
                >
                  <CalendarCheck className="h-4 w-4 text-emerald-500" />
                  <span>My Reservations</span>
                </Link>
              </>
            )}

            {role === "owner" && (
              <Link
                to="/owner"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 text-indigo-500" />
                <span>Owner Dashboard</span>
              </Link>
            )}

            {role === "admin" && (
              <Link
                to="/management"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Admin Management</span>
              </Link>
            )}

            {user && (
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-slate-500/10 transition-colors"
              >
                <UserCircle className="h-4 w-4 text-slate-500" />
                <span>Profile Settings</span>
              </Link>
            )}
          </div>

          {/* Mobile Auth Button */}
          <div className="pt-2 border-t border-border/50">
            {user ? (
              <Button
                variant="outline"
                className="w-full justify-center rounded-xl border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate({ to: "/customer/login" });
                  }}
                >
                  Student Sign In
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate({ to: "/owner/login" });
                  }}
                >
                  Owner Portal
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

