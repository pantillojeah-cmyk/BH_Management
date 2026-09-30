import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users, Search, ShieldCheck, MapPin, ArrowRight, UserCircle, Home, Check } from "lucide-react";
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
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/40 bg-background/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-md">
            <Home className="h-7 w-7" />
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 border-2 border-background">
              <Check className="h-3 w-3 text-white stroke-[3]" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight text-slate-900 dark:text-white">Boarding House</span>
            <span className="text-emerald-700 font-medium leading-tight dark:text-emerald-500">Vacancy Tracker</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">ZDSPGC – Dimataling Campus</span>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link to="/browse" className="text-muted-foreground transition-colors hover:text-primary">
            Browse Listings
          </Link>
          <Link to="/owner/login" className="text-muted-foreground transition-colors hover:text-primary">
            For Owners
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hidden sm:flex gap-2">
                <UserCircle className="h-4 w-4" /> Sign In
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <Link to="/customer/login" className="w-full block">
                <DropdownMenuItem className="cursor-pointer gap-2">
                  <Users className="h-4 w-4" /> Student/Employee
                </DropdownMenuItem>
              </Link>
              <Link to="/owner/login" className="w-full block">
                <DropdownMenuItem className="cursor-pointer gap-2">
                  <Building2 className="h-4 w-4" /> Owner
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link to="/browse">
            <Button className="gap-2 shadow-md hover:shadow-lg transition-all">
              Find a Room <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background pt-24 pb-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="flex flex-col justify-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="space-y-4">
                <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  Smart Campus Living
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl xl:text-7xl">
                  Find Your Perfect <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                    Home Away
                  </span>
                </h1>
                <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Discover top-rated boarding houses, check real-time vacancy statuses, and secure your room effortlessly. The ultimate tool for students and landlords.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/browse" className="flex-1 sm:flex-none">
                  <Button size="lg" className="w-full gap-2 shadow-xl hover:shadow-primary/25 transition-all text-lg h-14 px-8">
                    <Search className="h-5 w-5" /> Browse Now
                  </Button>
                </Link>
                <Link to="/owner/login" className="flex-1 sm:flex-none">
                  <Button size="lg" variant="outline" className="w-full text-lg h-14 px-8 border-primary/20 hover:bg-primary/5">
                    List Your Property
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mx-auto flex w-full max-w-[500px] items-center justify-center lg:max-w-none animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 fill-mode-both">
              <div className="relative aspect-square w-full rounded-3xl overflow-hidden shadow-2xl border border-border/50 bg-card p-2">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent z-10 pointer-events-none rounded-3xl"></div>
                <img
                  src="/hero-realistic.png"
                  alt="Realistic Philippine boarding house"
                  className="h-full w-full object-cover rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
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
              },
              {
                icon: ShieldCheck,
                title: "Verified Listings",
                desc: "All property owners and listings go through an approval process to ensure safety and quality.",
              },
              {
                icon: Building2,
                title: "Real-Time Vacancy",
                desc: "No more dead ends. See exactly how many rooms are available before you even inquire.",
              },
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="group relative overflow-hidden rounded-2xl border border-border bg-background p-8 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12 text-center text-sm text-muted-foreground">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <p>© {new Date().getFullYear()} CampusFinder Vacancy Tracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
