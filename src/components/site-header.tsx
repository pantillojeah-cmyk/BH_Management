import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, Search, Moon, Sun, LogOut, LayoutDashboard, User as UserIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useAuth, dashboardPath } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const { user, profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  // Hide site header inside admin/owner/customer dashboards (they have sidebars)
  const inDashboard =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/customer");
  if (inDashboard) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const initials = (profile?.full_name || user?.email || "?")
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-card">
            <Home className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display text-base font-bold leading-tight">BH Tracker</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              ZDSPGC-Dimataling
            </div>
          </div>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          <Link
            to="/"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-foreground bg-accent/40" }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>
          <Link
            to="/browse"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-foreground bg-accent/40" }}
          >
            Browse
          </Link>
          <Link
            to="/about"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium text-foreground bg-accent/40" }}
          >
            About
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {initials}
                  </div>
                  <span className="hidden text-sm font-medium sm:inline">
                    {profile?.full_name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Signed in as
                  <div className="truncate text-sm font-medium text-foreground">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={dashboardPath(roles)} className="cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/customer/profile" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden gap-2 sm:flex">
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Sign up
                </Link>
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-8 flex flex-col gap-2">
                <Link to="/" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                  Home
                </Link>
                <Link to="/browse" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                  <Search className="mr-2 inline h-4 w-4" /> Browse
                </Link>
                <Link to="/about" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">
                  About
                </Link>
                {!user && (
                  <>
                    <Link to="/auth" onClick={() => setOpen(false)} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
