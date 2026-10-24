import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, Users, Search, ShieldCheck, MapPin, ArrowRight, UserCircle, Home, Check, Menu, X, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Boarding House Vacancy Tracker" },
      { name: "description", content: "Find the perfect boarding house near your campus quickly and securely." },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background/50 font-sans text-foreground overflow-x-hidden selection:bg-emerald-500/20 selection:text-emerald-700">
      {/* Ambient background light orbs for glassmorphism */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[36rem] w-[36rem] rounded-full bg-emerald-500/15 blur-[120px] dark:bg-emerald-500/15 animate-pulse-glow" />
        <div className="absolute top-1/3 -right-32 h-[40rem] w-[40rem] rounded-full bg-teal-400/12 blur-[140px] dark:bg-teal-500/12 animate-float-slow" />
        <div className="absolute -bottom-32 left-1/4 h-[38rem] w-[38rem] rounded-full bg-indigo-500/10 blur-[130px] dark:bg-indigo-600/12 animate-pulse-glow" />
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/50 dark:border-white/10 bg-background/80 backdrop-blur-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 sm:py-3.5">
          <Link to="/" className="group flex items-center gap-2.5 sm:gap-3 transition-transform hover:scale-[1.01] min-w-0">
            <img
              src="/logo.png?v=2026"
              alt="Boarding House Vacancy Tracker"
              className="h-9 w-9 sm:h-11 sm:w-11 rounded-full object-contain bg-white p-0.5 shadow-md border-2 border-emerald-500/40 transition-transform group-hover:scale-105 shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm sm:text-base font-bold leading-tight text-slate-900 dark:text-white tracking-tight truncate">
                Boarding House
              </span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 leading-tight truncate">
                Vacancy Tracker
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 truncate hidden xs:block">
                ZDSPGC – Dimataling Campus
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
            <Link
              to="/browse"
              className="rounded-xl px-4 py-2 text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/60 hover:backdrop-blur-md border border-transparent hover:border-white/40 dark:hover:border-white/10 transition-all"
            >
              Browse Listings
            </Link>
            <Link
              to="/owner/login"
              className="rounded-xl px-4 py-2 text-foreground/80 hover:text-foreground hover:bg-white/60 dark:hover:bg-slate-800/60 hover:backdrop-blur-md border border-transparent hover:border-white/40 dark:hover:border-white/10 transition-all"
            >
              For Owners
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="hidden sm:flex gap-2 rounded-xl border-white/60 dark:border-white/15 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md hover:bg-white/70 shadow-sm"
                >
                  <UserCircle className="h-4 w-4 text-emerald-600" /> Sign In
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 rounded-2xl border-white/60 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-xl p-1.5">
                <Link to="/customer/login" className="w-full block">
                  <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-xl py-2.5 text-sm font-medium">
                    <Users className="h-4 w-4 text-emerald-600" /> Student
                  </DropdownMenuItem>
                </Link>
                <Link to="/owner/login" className="w-full block">
                  <DropdownMenuItem className="cursor-pointer gap-2.5 rounded-xl py-2.5 text-sm font-medium">
                    <Building2 className="h-4 w-4 text-indigo-600" /> Property Owner
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/browse">
              <Button className="gap-1.5 sm:gap-2 text-xs sm:text-sm px-3 sm:px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 border border-white/30 transition-all hover:scale-[1.02]">
                Find a Room <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </Link>

            {/* Mobile Hamburger Menu Toggle */}
            <Button
              size="sm"
              variant="outline"
              aria-label="Toggle menu"
              className="flex md:hidden h-9 w-9 p-0 rounded-xl border-white/60 dark:border-white/15 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md"
              onClick={() => setMobileMenuOpen((p) => !p)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/40 dark:border-white/10 bg-background/95 backdrop-blur-2xl px-4 py-4 space-y-3 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            <div className="grid gap-1.5">
              <Link
                to="/browse"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-emerald-500/10 hover:text-emerald-600"
              >
                <Compass className="h-4 w-4 text-emerald-600" /> Browse Listings
              </Link>
              <Link
                to="/customer/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-emerald-500/10 hover:text-emerald-600"
              >
                <Users className="h-4 w-4 text-emerald-600" /> Student Sign In / Register
              </Link>
              <Link
                to="/owner/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-indigo-500/10 hover:text-indigo-600"
              >
                <Building2 className="h-4 w-4 text-indigo-600" /> Property Owner Portal
              </Link>
              <Link
                to="/management/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-slate-500/10"
              >
                <ShieldCheck className="h-4 w-4 text-primary" /> Campus Admin
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 items-center">
            <div className="flex flex-col justify-center space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 sm:px-4 sm:py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 backdrop-blur-md shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Smart Campus Living · ZDSPGC Dimataling
                </div>
                <h1 className="text-3xl sm:text-5xl md:text-6xl xl:text-7xl font-extrabold tracking-tight leading-[1.12]">
                  Find Your Perfect <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 dark:from-emerald-400 dark:via-teal-400 dark:to-blue-400">
                    Home Away
                  </span>
                </h1>
                <p className="max-w-[580px] text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                  Discover verified boarding houses, check live room vacancy statuses, and reserve your bed with instant peace of mind.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/browse" className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    className="w-full gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/25 border border-white/30 text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 transition-all hover:scale-[1.01]"
                  >
                    <Search className="h-5 w-5" /> Browse Vacancies
                  </Button>
                </Link>
                <Link to="/owner/login" className="flex-1 sm:flex-none">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8 rounded-2xl border-white/70 dark:border-white/15 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-slate-800/80 shadow-sm transition-all"
                  >
                    List Your Property
                  </Button>
                </Link>
              </div>

              {/* Quick stats glass pills */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
                <div className="glass-card rounded-2xl p-2.5 sm:p-3.5 text-center">
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">100%</div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">Verified listings</div>
                </div>
                <div className="glass-card rounded-2xl p-2.5 sm:p-3.5 text-center">
                  <div className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400">Real-Time</div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">Vacancy tracking</div>
                </div>
                <div className="glass-card rounded-2xl p-2.5 sm:p-3.5 text-center">
                  <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">Hold Lock</div>
                  <div className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">Protected hold</div>
                </div>
              </div>
            </div>

            {/* Hero Image with Floating Glass Badges */}
            <div className="mx-auto flex w-full max-w-[520px] items-center justify-center lg:max-w-none animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 fill-mode-both">
              <div className="relative aspect-square w-full rounded-3xl overflow-hidden shadow-2xl border border-white/60 dark:border-white/15 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-3">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/15 via-transparent to-teal-500/10 z-10 pointer-events-none rounded-3xl"></div>
                <img
                  src="/hero-realistic.jpg?v=2"
                  alt="Boarding house"
                  className="h-full w-full object-cover rounded-2xl shadow-inner"
                />

                {/* Floating glassmorphic badges on hero card */}
                <div className="absolute top-7 left-7 z-20 glass rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg animate-float-slow">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Verified Campus Area</div>
                    <div className="text-[10px] text-muted-foreground">ZDSPGC Dimataling</div>
                  </div>
                </div>

                <div className="absolute bottom-7 right-7 z-20 glass rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Instant Reservation</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Spots Available Now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-block rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3">
              Built for Campus Community
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Why Choose CampusFinder?</h2>
            <p className="mx-auto mt-4 max-w-[700px] text-muted-foreground text-lg">
              We streamline the search process for students and provide powerful tools for property owners to manage their vacancies.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MapPin,
                title: "Location-Based Search",
                desc: "Find boarding houses situated perfectly around your campus with precise location tracking and maps.",
                color: "text-emerald-600 bg-emerald-500/15 border-emerald-500/30",
              },
              {
                icon: ShieldCheck,
                title: "Verified Listings",
                desc: "All property owners and listings go through an approval process to ensure safety, legitimacy, and quality.",
                color: "text-teal-600 bg-teal-500/15 border-teal-500/30",
              },
              {
                icon: Building2,
                title: "Real-Time Vacancy",
                desc: "No more dead ends or wasted trips. See exactly how many rooms are available before inquiring.",
                color: "text-blue-600 bg-blue-500/15 border-blue-500/30",
              },
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="glass-card group relative overflow-hidden rounded-3xl p-8 transition-all hover:scale-[1.02]"
              >
                <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${feature.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/40 dark:border-white/10 bg-background/60 backdrop-blur-xl py-10 text-center text-sm text-muted-foreground">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <p>© {new Date().getFullYear()} CampusFinder Vacancy Tracker · ZDSPGC-Dimataling Campus. All rights reserved.</p>
          <div className="flex gap-4 text-xs">
            <Link to="/browse" className="hover:text-foreground transition-colors">Browse</Link>
            <Link to="/owner/login" className="hover:text-foreground transition-colors">Owner Portal</Link>
            <Link to="/management/login" className="hover:text-foreground transition-colors">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
