import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth, dashboardPath } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BoardingHouseCard } from "@/components/boarding-house-card";
import { Heart, MessageSquare, User as UserIcon, LogOut, Home } from "lucide-react";

export const Route = createFileRoute("/_authenticated/customer")({
  head: () => ({ meta: [{ title: "My Dashboard — BH Tracker" }] }),
  component: CustomerDash,
});

function CustomerDash() {
  const { user, profile, signOut } = useAuth();

  const { data: favorites = [] } = useQuery({
    queryKey: ["my-favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("boarding_house_id, boarding_houses(*)")
        .eq("customer_id", user!.id);
      return (data ?? []).map((r: any) => r.boarding_houses).filter(Boolean);
    },
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ["my-inquiries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("inquiries")
        .select("*, boarding_houses(name)")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Welcome back</div>
          <h1 className="font-display text-3xl font-bold">{profile?.full_name || user?.email}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/"><Home className="mr-1 h-4 w-4" />Site</Link></Button>
          <Button asChild variant="outline"><Link to="/browse">Browse</Link></Button>
          <Button variant="outline" onClick={signOut}><LogOut className="mr-1 h-4 w-4" />Sign out</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Heart className="h-5 w-5" />} label="Favorites" value={favorites.length} />
        <StatCard icon={<MessageSquare className="h-5 w-5" />} label="Inquiries sent" value={inquiries.length} />
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><UserIcon className="h-5 w-5" /></div>
            <Button asChild variant="link" className="px-0"><Link to="/customer/profile">Edit profile</Link></Button>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-bold">Saved boarding houses</h2>
        {favorites.length === 0 ? (
          <p className="text-muted-foreground">No favorites yet. <Link to="/browse" className="text-primary hover:underline">Browse listings</Link>.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((h: any) => <BoardingHouseCard key={h.id} house={h} />)}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-xl font-bold">My inquiries</h2>
        {inquiries.length === 0 ? (
          <p className="text-muted-foreground">No inquiries sent yet.</p>
        ) : (
          <div className="space-y-3">
            {inquiries.map((i: any) => (
              <Card key={i.id}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <div className="font-semibold">{i.boarding_houses?.name ?? "Listing"}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{i.message}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</div>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium capitalize">{i.status}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-5">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-2xl font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
