import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Boarding House Vacancy Tracker" },
      { name: "description", content: "Learn about the Boarding House Vacancy Tracker for ZDSPGC-Dimataling Campus and how students, owners, and admins use it." },
      { property: "og:title", content: "About — Boarding House Vacancy Tracker" },
      { property: "og:description", content: "How the Boarding House Vacancy Tracker serves ZDSPGC-Dimataling Campus." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold md:text-5xl">About this system</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        The Boarding House Vacancy Tracker helps students, faculty, staff, and visitors of
        Zamboanga del Sur Provincial Government College — Dimataling Campus easily find
        available boarding houses nearby.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <Role icon={<Users className="h-6 w-6" />} title="For students">
          Browse approved listings, filter by price, vacancy and distance, save favorites, and send inquiries directly to owners.
        </Role>
        <Role icon={<Building2 className="h-6 w-6" />} title="For owners">
          Register your boarding house, manage rooms, toggle vacancy in real time, and receive student inquiries.
        </Role>
        <Role icon={<ShieldCheck className="h-6 w-6" />} title="For admins">
          Approve owners and listings, monitor vacancy reports, and export printable PDF reports.
        </Role>
      </div>

      <div className="mt-12 rounded-2xl bg-gradient-warm p-8">
        <h2 className="font-display text-2xl font-bold">Ready to get started?</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild><Link to="/browse">Browse listings <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          <Button asChild variant="outline"><Link to="/auth" search={{ mode: "signup" } as never}>Create account</Link></Button>
        </div>
      </div>
    </div>
  );
}

function Role({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
