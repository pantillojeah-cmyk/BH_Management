import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BedDouble, MessageSquare, CheckCircle2, Building2, Plus, Trash2, Pencil, Upload, Home, LogOut } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/owner")({
  head: () => ({ meta: [{ title: "Owner Dashboard — BH Tracker" }] }),
  component: OwnerDash,
});

function OwnerDash() {
  const { user, profile, ownerStatus, roles, signOut } = useAuth();
  const isOwner = roles.includes("owner");

  if (!isOwner) {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Owner access required</h1>
        <p className="mt-2 text-muted-foreground">Your account does not have the owner role.</p>
        <Button asChild className="mt-4"><Link to="/">Go home</Link></Button>
      </div>
    );
  }

  if (ownerStatus === "pending") {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Application pending</h1>
        <p className="mt-2 text-muted-foreground">An admin is reviewing your owner registration. You'll be able to post listings once approved.</p>
        <Button variant="outline" onClick={signOut} className="mt-4">Sign out</Button>
      </div>
    );
  }

  if (ownerStatus === "rejected") {
    return (
      <div className="container mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold">Application rejected</h1>
        <p className="mt-2 text-muted-foreground">Please contact the campus administrator for details.</p>
      </div>
    );
  }

  return <OwnerHome />;
}

function OwnerHome() {
  const { user, profile, signOut } = useAuth();

  const { data: houses = [] } = useQuery({
    queryKey: ["owner-houses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("boarding_houses").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const houseIds = houses.map((h) => h.id);

  const { data: rooms = [] } = useQuery({
    queryKey: ["owner-rooms", houseIds],
    enabled: houseIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("rooms").select("*").in("boarding_house_id", houseIds);
      return data ?? [];
    },
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ["owner-inquiries", houseIds],
    enabled: houseIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("inquiries")
        .select("*, boarding_houses(name), profiles!inquiries_customer_id_fkey(full_name,email,phone)")
        .in("boarding_house_id", houseIds)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const vacant = rooms.filter((r) => r.status === "vacant").length;
  const occupied = rooms.filter((r) => r.status === "occupied").length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Owner dashboard</div>
          <h1 className="font-display text-3xl font-bold">{profile?.full_name || user?.email}</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/"><Home className="mr-1 h-4 w-4" />Site</Link></Button>
          <Button variant="outline" onClick={signOut}><LogOut className="mr-1 h-4 w-4" />Sign out</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard icon={<Building2 className="h-5 w-5" />} label="Boarding houses" value={houses.length} />
        <StatCard icon={<BedDouble className="h-5 w-5" />} label="Total rooms" value={rooms.length} />
        <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Vacant" value={vacant} />
        <StatCard icon={<MessageSquare className="h-5 w-5" />} label="Inquiries" value={inquiries.length} />
      </div>

      <Tabs defaultValue="houses" className="mt-8">
        <TabsList>
          <TabsTrigger value="houses">My houses</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
        </TabsList>

        <TabsContent value="houses" className="mt-4">
          <HousesPanel houses={houses} />
        </TabsContent>
        <TabsContent value="rooms" className="mt-4">
          <RoomsPanel houses={houses} rooms={rooms} />
        </TabsContent>
        <TabsContent value="inquiries" className="mt-4">
          <InquiriesPanel inquiries={inquiries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card><CardContent className="flex items-center gap-3 p-5">
      <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div><div className="font-display text-2xl font-bold">{value}</div></div>
    </CardContent></Card>
  );
}

function HousesPanel({ houses }: { houses: any[] }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("boarding_houses").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["owner-houses"] }); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add boarding house</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} boarding house</DialogTitle></DialogHeader>
            <HouseForm initial={editing} onDone={() => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["owner-houses"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      {houses.length === 0 ? (
        <p className="text-muted-foreground">No boarding houses yet. Click "Add boarding house" to get started.</p>
      ) : (
        <div className="grid gap-3">
          {houses.map((h) => (
            <Card key={h.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{h.name}</span>
                    <Badge variant={h.approval === "approved" ? "default" : "secondary"} className={h.approval === "approved" ? "bg-success text-success-foreground" : ""}>
                      {h.approval}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{h.address}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(h); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete this listing?")) del.mutate(h.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function HouseForm({ initial, onDone }: { initial: any | null; onDone: () => void }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    address: initial?.address ?? "",
    landmark: initial?.landmark ?? "",
    description: initial?.description ?? "",
    contact_number: initial?.contact_number ?? "",
    distance_meters: initial?.distance_meters ?? 500,
    house_type: initial?.house_type ?? "mixed",
    cover_photo: initial?.cover_photo ?? "",
  });
  const [saving, setSaving] = useState(false);

  const upload = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("boarding-house-photos").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("boarding-house-photos").getPublicUrl(path);
    setForm((f) => ({ ...f, cover_photo: data.publicUrl }));
    toast.success("Photo uploaded");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const payload = { ...form, owner_id: user.id };
    const { error } = initial
      ? await supabase.from("boarding_houses").update(payload).eq("id", initial.id)
      : await supabase.from("boarding_houses").insert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Updated" : "Created — pending admin approval"); onDone(); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div><Label>Name</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
      <div><Label>Address</Label><Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
      <div><Label>Landmark</Label><Input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} /></div>
      <div><Label>Contact number</Label><Input required value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Distance from campus (meters)</Label>
          <Input type="number" min={0} value={form.distance_meters} onChange={(e) => setForm({ ...form, distance_meters: Number(e.target.value) })} />
        </div>
        <div>
          <Label>Type</Label>
          <Select value={form.house_type} onValueChange={(v) => setForm({ ...form, house_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mixed">Mixed</SelectItem>
              <SelectItem value="male_only">Male only</SelectItem>
              <SelectItem value="female_only">Female only</SelectItem>
              <SelectItem value="family">Family</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div>
        <Label>Cover photo</Label>
        {form.cover_photo && <img src={form.cover_photo} alt="" className="mb-2 h-24 w-full rounded object-cover" />}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload className="mr-1 h-3.5 w-3.5" /> Upload photo</Button>
      </div>
      <DialogFooter><Button type="submit" disabled={saving}>{initial ? "Save" : "Create"}</Button></DialogFooter>
    </form>
  );
}

function RoomsPanel({ houses, rooms }: { houses: any[]; rooms: any[] }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const toggleStatus = useMutation({
    mutationFn: async (r: any) => {
      const next = r.status === "vacant" ? "occupied" : "vacant";
      const { error } = await supabase.from("rooms").update({ status: next }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["owner-rooms"] }); },
    onError: (e) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("rooms").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["owner-rooms"] }); },
  });

  if (houses.length === 0) return <p className="text-muted-foreground">Add a boarding house first.</p>;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" /> Add room</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} room</DialogTitle></DialogHeader>
            <RoomForm houses={houses} initial={editing} onDone={() => { setOpen(false); setEditing(null); qc.invalidateQueries({ queryKey: ["owner-rooms"] }); }} />
          </DialogContent>
        </Dialog>
      </div>
      {rooms.length === 0 ? <p className="text-muted-foreground">No rooms yet.</p> : (
        <div className="grid gap-3">
          {rooms.map((r) => {
            const h = houses.find((h) => h.id === r.boarding_house_id);
            return (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <div className="font-semibold">{r.room_name} <span className="text-xs text-muted-foreground">· {h?.name}</span></div>
                    <div className="text-sm text-muted-foreground">₱{Number(r.monthly_rent).toLocaleString()}/mo · {r.capacity} pax</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={r.status === "vacant" ? "bg-success text-success-foreground cursor-pointer" : "cursor-pointer"} onClick={() => toggleStatus.mutate(r)}>
                      {r.status} (click to toggle)
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="outline" onClick={() => { if (confirm("Delete room?")) del.mutate(r.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RoomForm({ houses, initial, onDone }: { houses: any[]; initial: any | null; onDone: () => void }) {
  const [form, setForm] = useState({
    boarding_house_id: initial?.boarding_house_id ?? houses[0]?.id ?? "",
    room_name: initial?.room_name ?? "",
    monthly_rent: initial?.monthly_rent ?? 2000,
    capacity: initial?.capacity ?? 1,
    status: initial?.status ?? "vacant",
    description: initial?.description ?? "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = initial
      ? await supabase.from("rooms").update(form).eq("id", initial.id)
      : await supabase.from("rooms").insert(form);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success(initial ? "Updated" : "Added"); onDone(); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <Label>Boarding house</Label>
        <Select value={form.boarding_house_id} onValueChange={(v) => setForm({ ...form, boarding_house_id: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{houses.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Room name / number</Label><Input required value={form.room_name} onChange={(e) => setForm({ ...form, room_name: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Monthly rent (₱)</Label><Input type="number" min={0} value={form.monthly_rent} onChange={(e) => setForm({ ...form, monthly_rent: Number(e.target.value) })} /></div>
        <div><Label>Capacity</Label><Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} /></div>
      </div>
      <div>
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as any })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="vacant">Vacant</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <DialogFooter><Button type="submit" disabled={saving}>{initial ? "Save" : "Add"}</Button></DialogFooter>
    </form>
  );
}

function InquiriesPanel({ inquiries }: { inquiries: any[] }) {
  const qc = useQueryClient();
  const mark = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["owner-inquiries"] }); },
  });

  if (inquiries.length === 0) return <p className="text-muted-foreground">No inquiries yet.</p>;
  return (
    <div className="space-y-3">
      {inquiries.map((i) => (
        <Card key={i.id}>
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{i.profiles?.full_name ?? "Customer"} · <span className="text-xs text-muted-foreground">{i.boarding_houses?.name}</span></div>
                <div className="text-xs text-muted-foreground">{i.profiles?.email} {i.profiles?.phone && `· ${i.profiles.phone}`}</div>
              </div>
              <Badge variant={i.status === "new" ? "default" : "secondary"} className="capitalize">{i.status}</Badge>
            </div>
            <p className="text-sm">{i.message}</p>
            <div className="flex gap-2">
              {i.status !== "responded" && <Button size="sm" variant="outline" onClick={() => mark.mutate({ id: i.id, status: "responded" })}>Mark responded</Button>}
              {i.status !== "closed" && <Button size="sm" variant="outline" onClick={() => mark.mutate({ id: i.id, status: "closed" })}>Close</Button>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
