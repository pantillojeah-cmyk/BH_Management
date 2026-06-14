import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, ShieldCheck, Clock, ArrowRight, BedDouble, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { BoardingHouseCard } from "@/components/boarding-house-card";
import heroImg from "@/assets/hero-boarding.jpg";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Boarding House Vacancy Tracker — ZDSPGC-Dimataling" },
      {
        name: "description",
        content:
          "Find vacant boarding houses near ZDSPGC-Dimataling Campus. Browse photos, compare rent, and contact owners directly — updated in real time.",
      },
      { property: "og:title", content: "Boarding House Vacancy Tracker — ZDSPGC-Dimataling" },
      {
        property: "og:description",
        content:
          "Real-time vacancy listings for boarding houses near ZDSPGC-Dimataling Campus.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data: featured = [] } = useQuery({
    queryKey: ["featured-boarding-houses"],
    queryFn: async () => {
      const { data: houses } = await supabase
        .from("boarding_houses")
        .select("*")
        .eq("approval", "approved")
        .order("created_at", { ascending: false })
        .limit(6);
      if (!houses?.length) return [];
      const ids = houses.map((h) => h.id);
      const { data: rooms } = await supabase
        .from("rooms")
        .select("boarding_house_id,status,monthly_rent")
        .in("boarding_house_id", ids);
      return houses.map((h) => {
        const list = (rooms ?? []).filter((r) => r.boarding_house_id === h.id);
        const vacant = list.filter((r) => r.status === "vacant").length;
        const min = list.length ? Math.min(...list.map((r) => Number(r.monthly_rent))) : null;
        return { house: h, vacant, total: list.length, min };
      });
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const [houses, vacant] = await Promise.all([
        supabase.from("boarding_houses").select("id", { count: "exact", head: true }).eq("approval", "approved"),
        supabase.from("rooms").select("id", { count: "exact", head: true }).eq("status", "vacant"),
      ]);
      return { houses: houses.count ?? 0, vacant: vacant.count ?? 0 };
    },
  });

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/browse", search: { q: q || undefined } as never });
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" width={1536} height={1024} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/40" />
        </div>
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl text-primary-foreground">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-warm/20 px-3 py-1 text-xs font-medium uppercase tracking-wider backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" /> Live vacancy updates
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-tight md:text-6xl">
              Find your boarding house near{" "}
              <span className="text-accent">ZDSPGC-Dimataling</span>
            </h1>
            <p className="mt-4 text-lg text-primary-foreground/90 md:text-xl">
              Browse approved boarding houses, compare rooms and rent, and reach owners directly — all from one place.
            </p>

            <form
              onSubmit={onSearch}
              className="mt-8 flex max-w-xl gap-2 rounded-2xl bg-background/95 p-2 shadow-elegant backdrop-blur"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name, address, or landmark"
                  className="border-0 bg-transparent pl-9 text-foreground focus-visible:ring-0"
                />
              </div>
              <Button type="submit" size="lg" className="shrink-0">
                Search <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-8 grid grid-cols-3 gap-6 text-primary-foreground">
              <Stat label="Approved listings" value={stats?.houses ?? 0} />
              <Stat label="Vacant rooms" value={stats?.vacant ?? 0} />
              <Stat label="Updated" value="Live" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto grid gap-6 px-4 py-16 md:grid-cols-3">
        <Feature
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Verified listings"
          body="Every boarding house and owner is reviewed by campus administrators before going live."
        />
        <Feature
          icon={<Clock className="h-6 w-6" />}
          title="Real-time vacancy"
          body="Owners update room status instantly so you never travel for a room that's already taken."
        />
        <Feature
          icon={<MapPin className="h-6 w-6" />}
          title="Near the campus"
          body="Filter by distance from ZDSPGC-Dimataling — by meters or kilometers, walking or short ride."
        />
      </section>

      {/* Featured */}
      <section className="bg-gradient-warm py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">Featured boarding houses</h2>
              <p className="mt-2 text-muted-foreground">Recently added and approved by admins.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/browse">
                See all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featured.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              <BedDouble className="mx-auto mb-3 h-10 w-10 opacity-40" />
              No listings yet. Be the first owner to register and post a boarding house.
              <div className="mt-4">
                <Button asChild>
                  <Link to="/auth" search={{ mode: "signup", role: "owner" } as never}>
                    Register as owner
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((f) => (
                <BoardingHouseCard
                  key={f.house.id}
                  house={f.house}
                  vacantRooms={f.vacant}
                  totalRooms={f.total}
                  minRent={f.min}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA for owners */}
      <section className="container mx-auto px-4 py-20">
        <div className="overflow-hidden rounded-3xl bg-gradient-hero p-8 md:p-12">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="text-primary-foreground">
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Own a boarding house?
              </h2>
              <p className="mt-3 text-primary-foreground/85">
                List your property, manage rooms, and reach students directly. Free to join — admins approve new owners.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" variant="secondary">
                  <Link to="/auth" search={{ mode: "signup", role: "owner" } as never}>
                    Register as owner
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                  <Link to="/about">Learn more</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-primary-foreground">
              <FeatureMini icon={<BedDouble className="h-5 w-5" />} label="Add unlimited rooms" />
              <FeatureMini icon={<Users className="h-5 w-5" />} label="Get inquiries" />
              <FeatureMini icon={<ShieldCheck className="h-5 w-5" />} label="Verified owner badge" />
              <FeatureMini icon={<Clock className="h-5 w-5" />} label="Instant vacancy toggle" />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Boarding House Vacancy Tracker · ZDSPGC-Dimataling Campus
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="font-display text-3xl font-extrabold">{value}</div>
      <div className="text-xs uppercase tracking-wider text-primary-foreground/80">{label}</div>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function FeatureMini({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-primary-foreground/10 p-3 backdrop-blur">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-foreground/15">
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
