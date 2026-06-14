import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Users, BedDouble, CheckCircle2, Home, LogOut, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard — BH Tracker" }] }),
  component: AdminDash,
});

function AdminDash() {
  const { user, profile, roles, signOut } = useAuth();
  if (!roles.includes("admin")) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Admin only</h1>
        <p className="mt-2 text-muted-foreground">Your account doesn't have admin access. If you're the first admin, ask a developer to grant you the admin role in the user_roles table.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button asChild variant="outline"><Link to="/">Home</Link></Button>
          <Button variant="outline" onClick={signOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [bh, owners, customers, vacant, occupied] = await Promise.all([
        supabase.from("boarding_houses").select("id", { count: "exact", head: true }),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "owner"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "customer"),
        supabase.from("rooms").select("id", { count: "exact", head: true }).eq("status", "vacant"),
        supabase.from("rooms").select("id", { count: "exact", head: true }).eq("status", "occupied"),
      ]);
      return { bh: bh.count ?? 0, owners: owners.count ?? 0, customers: customers.count ?? 0, vacant: vacant.count ?? 0, occupied: occupied.count ?? 0 };
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Admin</div>
          <h1 className="font-display text-3xl font-bold">{profile?.full_name || user?.email}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/"><Home className="mr-1 h-4 w-4" />Site</Link></Button>
          <Button variant="outline" onClick={signOut}><LogOut className="mr-1 h-4 w-4" />Sign out</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Boarding houses" value={stats?.bh ?? 0} icon={<Building2 className="h-5 w-5" />} />
        <Stat label="Owners" value={stats?.owners ?? 0} icon={<Users className="h-5 w-5" />} />
        <Stat label="Customers" value={stats?.customers ?? 0} icon={<Users className="h-5 w-5" />} />
        <Stat label="Vacant rooms" value={stats?.vacant ?? 0} icon={<CheckCircle2 className="h-5 w-5" />} />
        <Stat label="Occupied rooms" value={stats?.occupied ?? 0} icon={<BedDouble className="h-5 w-5" />} />
      </div>

      <Tabs defaultValue="owners" className="mt-8">
        <TabsList>
          <TabsTrigger value="owners">Owners</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="logs">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="owners" className="mt-4"><OwnersTab /></TabsContent>
        <TabsContent value="listings" className="mt-4"><ListingsTab /></TabsContent>
        <TabsContent value="reports" className="mt-4"><ReportsTab /></TabsContent>
        <TabsContent value="logs" className="mt-4"><LogsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card><CardContent className="flex items-center gap-3 p-5">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div><div className="font-display text-2xl font-bold">{value}</div></div>
    </CardContent></Card>
  );
}

function OwnersTab() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-owners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("owner_status")
        .select("*, profiles(full_name,email,phone)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("owner_status").update({ status, decided_at: new Date().toISOString() }).eq("user_id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-owners"] }); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      {data.length === 0 ? <p className="text-muted-foreground">No owner applications yet.</p> : data.map((o: any) => (
        <Card key={o.user_id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="font-semibold">{o.profiles?.full_name ?? "Owner"}</div>
            <div className="text-xs text-muted-foreground">{o.profiles?.email}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={o.status === "approved" ? "bg-success text-success-foreground" : ""}>{o.status}</Badge>
            {o.status === "pending" && <>
              <Button size="sm" onClick={() => decide.mutate({ id: o.user_id, status: "approved" })}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: o.user_id, status: "rejected" })}>Reject</Button>
            </>}
          </div>
        </CardContent></Card>
      ))}
    </div>
  );
}

function ListingsTab() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-listings"],
    queryFn: async () => {
      const { data } = await supabase.from("boarding_houses").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const decide = useMutation({
    mutationFn: async ({ id, approval }: { id: string; approval: "approved" | "rejected" }) => {
      const { error } = await supabase.from("boarding_houses").update({ approval }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-listings"] }); },
  });

  return (
    <div className="space-y-3">
      {data.length === 0 ? <p className="text-muted-foreground">No listings yet.</p> : data.map((h: any) => (
        <Card key={h.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="font-semibold">{h.name}</div>
            <div className="text-xs text-muted-foreground">{h.address}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={h.approval === "approved" ? "bg-success text-success-foreground" : ""}>{h.approval}</Badge>
            {h.approval !== "approved" && <Button size="sm" onClick={() => decide.mutate({ id: h.id, approval: "approved" })}>Approve</Button>}
            {h.approval !== "rejected" && <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: h.id, approval: "rejected" })}>Reject</Button>}
          </div>
        </CardContent></Card>
      ))}
    </div>
  );
}

function ReportsTab() {
  const { data: rooms = [] } = useQuery({
    queryKey: ["report-rooms"],
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("*, boarding_houses(name,address)");
      return data ?? [];
    },
  });

  const printReport = () => window.print();

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button onClick={printReport}><Printer className="mr-1 h-4 w-4" /> Print / Save as PDF</Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-3 font-display text-xl font-bold">Vacancy Report</h2>
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="py-2">Boarding house</th><th>Room</th><th>Rent</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rooms.map((r: any) => (
                <tr key={r.id} className="border-b border-border/40">
                  <td className="py-2">{r.boarding_houses?.name}</td>
                  <td>{r.room_name}</td>
                  <td>₱{Number(r.monthly_rent).toLocaleString()}</td>
                  <td className="capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function LogsTab() {
  const { data = [] } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });
  if (data.length === 0) return <p className="text-muted-foreground">No activity yet.</p>;
  return (
    <div className="space-y-2">
      {data.map((l: any) => (
        <Card key={l.id}><CardContent className="flex justify-between p-3 text-sm">
          <span>{l.action}</span><span className="text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
        </CardContent></Card>
      ))}
    </div>
  );
}
