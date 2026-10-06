import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit, Upload, X, Minus, Share2, Copy, Building, BedDouble, CircleDollarSign, CalendarCheck, Clock, MapPin, Crosshair, Navigation, ExternalLink, ChevronLeft, ChevronRight, CheckCircle2, XCircle, UserCheck, DoorOpen } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { toast } from "sonner";
import { peso, vacancyState, toneClass } from "@/lib/format";
import { getOwnerListings, deleteListing, upsertListing, getOwnerInquiries, updateInquiryStatus, updateVacancy, getOwnerReservations, cancelReservation, confirmReservation, saveAmenityPhotos, getAmenityPhotos, appendAmenityPhoto, deleteAmenityPhoto, getOwnerRoomStatus, setRoomOccupiedByOwner } from "@/lib/server-fns";
import { compressImage } from "@/lib/storage";

export const Route = createFileRoute("/owner")({
  head: () => ({ meta: [{ title: "Owner Dashboard" }] }),
  component: OwnerPage,
});

const AMENITY_OPTIONS = ["Wi-Fi", "Water", "Electricity", "Air Conditioning", "Kitchen", "Laundry", "Parking", "CCTV", "Study Area", "Generator", "Common Room", "Garden", "Curfew"];

interface BHRow {
  id: string; name: string; address: string; landmark: string | null; contact_number: string;
  description: string | null; monthly_fee: number; num_rooms: number; available_vacancies: number;
  amenities: string[]; cover_photo_url: string | null; status: "pending" | "approved" | "rejected";
  latitude?: number | null; longitude?: number | null;
  extraPhotos?: string[];
}

function OwnerPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/owner/login" });
    else if (role === "pending_owner") navigate({ to: "/owner/login" }); // redirect to pending screen
    else if (role && role !== "owner") navigate({ to: "/" });
  }, [user, role, loading, navigate]);

  if (!user || role !== "owner") return null;
  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3.5">
          <img
            src="/logo.png"
            alt="ZDSPGC BH Tracker Logo"
            className="h-12 w-12 rounded-full object-cover border-2 border-primary/30 shadow-md"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Owner Dashboard</h1>
            <p className="text-xs text-muted-foreground">Manage your boarding house listings, vacancies & inquiries</p>
          </div>
        </div>
      </div>
      <Tabs defaultValue="overview">
        <TabsList className="h-11 rounded-2xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-1 shadow-sm gap-1 flex-wrap">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 font-medium transition-all">📊 Overview</TabsTrigger>
          <TabsTrigger value="listings" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 font-medium transition-all">🏠 My Listings</TabsTrigger>
          <TabsTrigger value="inquiries" className="rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 font-medium transition-all">💬 Inquiries</TabsTrigger>
          <TabsTrigger value="reservations" className="rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 font-medium transition-all">📅 Reservations</TabsTrigger>
          <TabsTrigger value="rooms" className="rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 font-medium transition-all">🛏 Room Status</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OwnerOverview /></TabsContent>
        <TabsContent value="listings"><MyListings /></TabsContent>
        <TabsContent value="inquiries"><OwnerInquiries /></TabsContent>
        <TabsContent value="reservations"><OwnerReservations /></TabsContent>
        <TabsContent value="rooms"><OwnerRoomManagement /></TabsContent>
      </Tabs>
    </AppShell>
  );
}

function OwnerOverview() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BHRow[]>([]);
  useEffect(() => {
    if (!user) return;
    getOwnerListings({ data: { userId: user.id } }).then((data) => setRows(data as BHRow[]));
  }, [user]);

  const totalListings = rows.length;
  const totalRooms = rows.reduce((acc, r) => acc + r.num_rooms, 0);
  const totalVacancies = rows.reduce((acc, r) => acc + r.available_vacancies, 0);
  const estimatedRevenue = rows.reduce((acc, r) => acc + ((r.num_rooms - r.available_vacancies) * r.monthly_fee), 0);

  return ( <>
    {/* Stat Cards */}
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/60 dark:to-indigo-900/40 p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Total Properties</span>
          <div className="h-9 w-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Building className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-300" />
          </div>
        </div>
        <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-200">{totalListings}</div>
        <div className="mt-1 text-xs text-indigo-500 dark:text-indigo-400">Listings registered</div>
      </div>

      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/40 p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Total Rooms</span>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
            <BedDouble className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
          </div>
        </div>
        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-200">{totalRooms}</div>
        <div className="mt-1 text-xs text-emerald-500 dark:text-emerald-400">Across all properties</div>
      </div>

      <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/40 p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">Available Slots</span>
          <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Plus className="h-4 w-4 text-amber-600 dark:text-amber-300" />
          </div>
        </div>
        <div className="text-3xl font-bold text-amber-700 dark:text-amber-200">{totalVacancies}</div>
        <div className="mt-1 text-xs text-amber-500 dark:text-amber-400">Open for tenants</div>
      </div>

      <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/60 dark:to-rose-900/40 p-5 shadow-sm backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-300">Est. Revenue</span>
          <div className="h-9 w-9 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <CircleDollarSign className="h-4 w-4 text-rose-600 dark:text-rose-300" />
          </div>
        </div>
        <div className="text-2xl font-bold text-rose-700 dark:text-rose-200">{peso(estimatedRevenue)}</div>
        <div className="mt-1 text-xs text-rose-500 dark:text-rose-400">Based on occupied rooms</div>
      </div>
    </div>

    {/* Charts */}
    <div className="mt-8 grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-800/50 backdrop-blur-md p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/70 mb-4">📊 Vacancies per Property</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows.map(r => ({ name: r.name, vacancies: r.available_vacancies, rooms: r.num_rooms }))} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.1} />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }} />
            <Bar dataKey="vacancies" fill="#6366f1" name="Vacancies" radius={[6,6,0,0]} />
            <Bar dataKey="rooms" fill="#10b981" name="Total Rooms" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-800/50 backdrop-blur-md p-5 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground/70 mb-4">🥧 Status Distribution</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={Object.entries(
                rows.reduce((acc, r) => {
                  acc[r.status] = (acc[r.status] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([name, value]) => ({ name, value }))}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={45}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {[0, 1, 2, 3, 4].map((index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? "#6366f1" : index === 1 ? "#10b981" : "#ef4444"} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }} />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </> );
}

interface GroupedBHRow extends BHRow {
  allIds: string[];
  photos: string[];
}

function OwnerListingCard({
  r,
  onEdit,
  onRemove,
  onChangeVacancy,
}: {
  r: GroupedBHRow;
  onEdit: () => void;
  onRemove: () => void;
  onChangeVacancy: (delta: number) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const state = vacancyState(r.available_vacancies, r.num_rooms);
  const photos = r.photos.length > 0 ? r.photos : (r.cover_photo_url ? [r.cover_photo_url] : []);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIdx((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIdx((prev) => (prev + 1) % photos.length);
  };

  return (
    <div className="group flex flex-col rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md shadow-md hover:shadow-xl hover:scale-[1.01] transition-all overflow-hidden">
      {/* Photo carousel container */}
      <div className="relative aspect-video bg-muted border-b overflow-hidden group/photo">
        {photos.length > 0 ? (
          <img
            src={photos[currentIdx]}
            alt={`${r.name} photo ${currentIdx + 1}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Building className="h-10 w-10 opacity-20" />
          </div>
        )}

        {/* Navigation Arrows ‹ and › */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/85 text-white p-1.5 shadow-md backdrop-blur-sm transition-all z-20 flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/85 text-white p-1.5 shadow-md backdrop-blur-sm transition-all z-20 flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Photo Counter & Dot Indicators */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setCurrentIdx(i);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIdx ? "w-4 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"
                  }`}
                  aria-label={`Go to photo ${i + 1}`}
                />
              ))}
            </div>

            <div className="absolute bottom-2 right-2 text-[10px] font-medium text-white bg-black/60 px-1.5 py-0.5 rounded shadow z-20 backdrop-blur-sm">
              {currentIdx + 1} / {photos.length}
            </div>
          </>
        )}

        {/* Status Badges */}
        <div className="absolute top-2 right-2 flex gap-2 z-20">
          <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold shadow-sm backdrop-blur-md bg-white/90 dark:bg-slate-900/90 ${toneClass[state.tone]}`}>
            {state.label}
          </span>
          <Badge variant={r.status === "approved" ? "default" : r.status === "pending" ? "secondary" : "destructive"} className="shadow-sm">
            {r.status}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-5">
        <div className="mb-2">
          <h3 className="font-bold text-base line-clamp-1 text-foreground">{r.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.address}</p>
        </div>
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 w-fit">
          <CircleDollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{peso(r.monthly_fee)}<span className="text-xs font-normal text-emerald-600/70 dark:text-emerald-400/70"> / mo</span></span>
        </div>

        {/* Vacancy stepper */}
        <div className="rounded-xl border border-border/60 bg-muted/40 p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vacancy Slots</span>
            <span className="text-xs font-bold text-foreground">{r.available_vacancies} / {r.num_rooms} open</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-full border-rose-300 dark:border-rose-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
              disabled={r.available_vacancies <= 0}
              onClick={() => onChangeVacancy(-1)}
              title="Decrease vacancy"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                style={{ width: `${r.num_rooms > 0 ? (r.available_vacancies / r.num_rooms) * 100 : 0}%` }}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-full border-emerald-300 dark:border-emerald-700 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              disabled={r.available_vacancies >= r.num_rooms}
              onClick={() => onChangeVacancy(+1)}
              title="Increase vacancy"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 gap-1.5 rounded-xl border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
            onClick={onEdit}
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/browse?q=${encodeURIComponent(r.name)}`);
              toast.success("Link copied!");
            }}
            title="Share"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 rounded-xl border-rose-200 dark:border-rose-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            onClick={onRemove}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MyListings() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BHRow[]>([]);
  const [editing, setEditing] = useState<BHRow | null>(null);
  const [open, setOpen] = useState(false);

  const reload = async () => {
    if (!user) return;
    const data = await getOwnerListings({ data: { userId: user.id } });
    setRows(data as BHRow[]);
  };
  useEffect(() => { reload(); }, [user]);

  const groupedRows = useMemo(() => {
    const map = new Map<string, GroupedBHRow>();
    for (const r of rows) {
      const key = `${r.name.trim().toLowerCase()}:::${r.address.trim().toLowerCase()}`;
      const rowPhotos = [r.cover_photo_url, ...(r.extraPhotos || [])].filter(Boolean) as string[];
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          ...r,
          allIds: [r.id],
          photos: Array.from(new Set(rowPhotos)),
        });
      } else {
        for (const p of rowPhotos) {
          if (!existing.photos.includes(p)) {
            existing.photos.push(p);
          }
        }
        if (!existing.allIds.includes(r.id)) {
          existing.allIds.push(r.id);
        }
        if (!existing.cover_photo_url && r.cover_photo_url) {
          existing.cover_photo_url = r.cover_photo_url;
        }
      }
    }
    return Array.from(map.values());
  }, [rows]);

  const remove = async (ids: string[]) => {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    try {
      for (const id of ids) {
        await deleteListing({ data: { id } });
      }
      toast.success("Listing deleted");
      reload();
    } catch (e) { toast.error((e as Error).message); }
  };

  const changeVacancy = async (id: string, delta: number) => {
    try {
      const result = await updateVacancy({ data: { id, delta } });
      setRows((prev) =>
        prev.map((r) => r.id === id ? { ...r, available_vacancies: result.availableVacancies } : r)
      );
      toast.success(delta > 0 ? "Vacancy increased" : "Vacancy decreased");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditing(null); setOpen(true); }} className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 px-5">
              <Plus className="h-4 w-4" /> New Listing
            </Button>
          </DialogTrigger>
          <ListingDialog
            key={editing?.id ?? "new"}
            initial={editing}
            onSaved={() => { setOpen(false); reload(); }}
          />
        </Dialog>
      </div>

      {groupedRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No listings yet. Click "New listing" to create one.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {groupedRows.map((r) => (
            <OwnerListingCard
              key={r.id}
              r={r}
              onEdit={() => {
                setEditing({
                  ...r,
                  extraPhotos: r.photos.filter((p) => p !== r.cover_photo_url),
                });
                setOpen(true);
              }}
              onRemove={() => remove(r.allIds)}
              onChangeVacancy={(delta) => changeVacancy(r.id, delta)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingDialog({ initial, onSaved }: { initial: BHRow | null; onSaved: () => void }) {
  const { user } = useAuth();
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [landmark, setLandmark] = useState(initial?.landmark ?? "");
  const [latitude, setLatitude] = useState(initial?.latitude !== undefined && initial?.latitude !== null ? initial.latitude.toString() : "");
  const [longitude, setLongitude] = useState(initial?.longitude !== undefined && initial?.longitude !== null ? initial.longitude.toString() : "");
  const [locating, setLocating] = useState(false);
  const [contact, setContact] = useState(initial?.contact_number ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [fee, setFee] = useState(initial?.monthly_fee?.toString() ?? "");
  const [rooms, setRooms] = useState(initial?.num_rooms?.toString() ?? "");
  const [vacancies, setVacancies] = useState(initial?.available_vacancies?.toString() ?? "");
  const [amenities, setAmenities] = useState<string[]>(initial?.amenities ?? []);
  const [amenityPhotos, setAmenityPhotos] = useState<Record<string, string[]>>({});
  const [extraPhotos, setExtraPhotos] = useState<string[]>(initial?.extraPhotos ?? []);
  const [coverPreview, setCoverPreview] = useState<string | null>(initial?.cover_photo_url ?? null);
  const [coverPath, setCoverPath] = useState<string | null>(initial?.cover_photo_url ?? null);
  const [busy, setBusy] = useState(false);

  // Load existing amenity photos on edit
  useEffect(() => {
    if (initial?.id) {
      getAmenityPhotos({ data: { boardingHouseId: initial.id } }).then((data) => {
        setAmenityPhotos(data as Record<string, string[]>);
      });
    }
  }, [initial?.id]);

  const toggleAmenity = (a: string) => setAmenities((s) => s.includes(a) ? s.filter((x) => x !== a) : [...s, a]);

  const handleAmenityPhoto = async (amenityName: string, file: File) => {
    if (!user) return;
    try {
      setBusy(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      // Update local state
      setAmenityPhotos((prev) => ({
        ...prev,
        [amenityName]: [...(prev[amenityName] ?? []), url],
      }));
      // If editing an existing listing, append directly to DB
      if (isEdit && initial?.id) {
        await appendAmenityPhoto({ data: { boardingHouseId: initial.id, amenityName, url } });
      }
      toast.success(`Photo added for ${amenityName}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const removeAmenityPhoto = async (amenityName: string, idx: number) => {
    const photoUrl = amenityPhotos[amenityName]?.[idx];
    setAmenityPhotos((prev) => ({
      ...prev,
      [amenityName]: (prev[amenityName] ?? []).filter((_, i) => i !== idx),
    }));
    // If editing existing listing, delete from DB immediately
    if (isEdit && initial?.id && photoUrl) {
      try {
        await deleteAmenityPhoto({ data: { boardingHouseId: initial.id, amenityName, url: photoUrl } });
      } catch {}
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success("GPS location captured from your device!");
      },
      (err) => {
        setLocating(false);
        toast.error(`Could not retrieve location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePasteCoords = (val: string) => {
    const match = val.match(/([+-]?\d+\.\d+)[,\s]+([+-]?\d+\.\d+)/);
    if (match) {
      setLatitude(match[1]);
      setLongitude(match[2]);
      toast.success("Coordinates parsed from text!");
    }
  };

  const handleCover = async (file: File) => {
    if (!user) return;
    try {
      setBusy(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", user.id);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setCoverPath(url);
      setCoverPreview(url);
      toast.success("Cover photo uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const handleExtraPhotos = async (files: FileList) => {
    if (!user) return;
    try {
      setBusy(true);
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", user.id);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) continue;
        const { url } = await res.json();
        uploaded.push(url);
      }
      setExtraPhotos((prev) => [...prev, ...uploaded]);
      toast.success(`${uploaded.length} extra photo(s) uploaded`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  const save = async () => {
    if (!user) return;
    if (!name.trim() || !address.trim() || !contact.trim()) { toast.error("Name, address, and contact are required"); return; }
    setBusy(true);
    try {
      const latNum = latitude.trim() ? parseFloat(latitude) : null;
      const lngNum = longitude.trim() ? parseFloat(longitude) : null;
      const result = await upsertListing({
        data: {
          id: isEdit ? initial!.id : undefined,
          ownerId: user.id, name: name.trim(), address: address.trim(),
          landmark: landmark.trim() || null, contactNumber: contact.trim(),
          description: description.trim() || null, monthlyFee: Number(fee) || 0,
          numRooms: Number(rooms) || 0, availableVacancies: Number(vacancies) || 0,
          amenities, coverPhotoUrl: coverPath, extraPhotos: extraPhotos,
          latitude: latNum, longitude: lngNum,
        },
      });
      // Save amenity photos if any exist
      const bhId = isEdit ? initial!.id : (result as any)?.id;
      const amenityPhotoEntries: { amenityName: string; url: string }[] = [];
      for (const [amenityName, urls] of Object.entries(amenityPhotos)) {
        for (const url of urls) {
          amenityPhotoEntries.push({ amenityName, url });
        }
      }
      if (bhId && amenityPhotoEntries.length > 0) {
        await saveAmenityPhotos({ data: { boardingHouseId: bhId, photos: amenityPhotoEntries } });
      }
      toast.success(isEdit ? "Updated" : "Submitted for admin approval");
      onSaved();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  };

  // Preview map calculation
  const parsedLat = parseFloat(latitude);
  const parsedLng = parseFloat(longitude);
  const hasValidCoords = !isNaN(parsedLat) && !isNaN(parsedLng);
  const cleanedLandmark = landmark.trim()
    ? landmark.trim().replace(/^(beside|near|behind|in front of|across|next to|along)\s+/i, "")
    : null;
  const previewMapQuery = [
    cleanedLandmark,
    address,
    !address.toLowerCase().includes("dimataling") ? "Dimataling" : "",
    !address.toLowerCase().includes("zamboanga del sur") ? "Zamboanga del Sur" : "",
    !address.toLowerCase().includes("philippines") ? "Philippines" : "",
  ].filter(Boolean).join(", ");

  const previewMapSrc = hasValidCoords
    ? `https://maps.google.com/maps?q=${parsedLat},${parsedLng}&hl=en&z=17&output=embed`
    : address.trim() || landmark.trim()
    ? `https://maps.google.com/maps?q=${encodeURIComponent(previewMapQuery)}&output=embed&z=16`
    : "";

  return (
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit listing" : "New boarding house listing"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Purok 2 Kagawasan, Dimataling, Zamboanga del Sur" /></div>
        <div><Label>Landmark</Label><Input value={landmark ?? ""} onChange={(e) => setLandmark(e.target.value)} placeholder="e.g. Beside San Miguel Elementary School" /></div>
        <div><Label>Contact number</Label><Input value={contact} onChange={(e) => setContact(e.target.value)} /></div>

        {/* GPS Location & Landmark Matching Section */}
        <div className="sm:col-span-2 rounded-xl border border-border/80 bg-muted/30 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                <MapPin className="h-4 w-4 text-emerald-600" /> GPS Pinpoint & Map Location
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set exact GPS coordinates so guests see the precise location of your boarding house.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              disabled={locating}
              className="h-8 gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              <Crosshair className="h-3.5 w-3.5" />
              {locating ? "Locating…" : "Use My Current GPS"}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Latitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 7.531840"
                value={latitude}
                onChange={(e) => { setLatitude(e.target.value); handlePasteCoords(e.target.value); }}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Longitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="e.g. 123.364920"
                value={longitude}
                onChange={(e) => { setLongitude(e.target.value); handlePasteCoords(e.target.value); }}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>

          {previewMapSrc && (
            <div className="mt-2 rounded-lg overflow-hidden border border-border">
              <div className="bg-muted px-3 py-1.5 text-[11px] font-medium flex items-center justify-between text-muted-foreground">
                <span>{hasValidCoords ? "📍 Live Preview (Exact GPS Pin)" : "🗺️ Live Preview (Landmark + Address Search)"}</span>
                {hasValidCoords ? (
                  <span className="text-emerald-600 font-mono text-[10px]">({parsedLat.toFixed(5)}, {parsedLng.toFixed(5)})</span>
                ) : (
                  <span className="truncate max-w-[200px]">{previewMapQuery}</span>
                )}
              </div>
              <iframe
                title="Map preview"
                width="100%"
                height="160"
                style={{ border: 0 }}
                loading="lazy"
                src={previewMapSrc}
              />
            </div>
          )}
        </div>

        <div><Label>Monthly fee (₱)</Label><Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} /></div>
        <div><Label>Number of rooms</Label><Input type="number" value={rooms} onChange={(e) => setRooms(e.target.value)} /></div>
        <div><Label>Available vacancies</Label><Input type="number" value={vacancies} onChange={(e) => setVacancies(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} maxLength={2000} /></div>
        <div className="sm:col-span-2">
          <Label>Amenities</Label>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">Select amenities your boarding house offers, then optionally upload photos so tenants can see what each amenity looks like.</p>
          <div className="space-y-2">
            {AMENITY_OPTIONS.map((a) => {
              const selected = amenities.includes(a);
              const photos = amenityPhotos[a] ?? [];
              return (
                <div key={a} className={`rounded-xl border transition-all ${
                  selected
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-background/60"
                }`}>
                  {/* Amenity header row */}
                  <button
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
                  >
                    <span className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      selected ? "border-primary bg-primary" : "border-muted-foreground/40"
                    }`}>
                      {selected && <span className="text-white text-[10px] leading-none font-bold">✓</span>}
                    </span>
                    <span className={`text-sm font-medium flex-1 ${selected ? "text-primary" : "text-foreground"}`}>{a}</span>
                    {selected && photos.length > 0 && (
                      <span className="text-[10px] text-muted-foreground rounded-full bg-muted px-2 py-0.5">
                        {photos.length} photo{photos.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                  {/* Photo upload area — only visible when amenity is selected */}
                  {selected && (
                    <div className="px-3 pb-3">
                      <div className="flex flex-wrap gap-2 items-start">
                        {photos.map((url, idx) => (
                          <div key={idx} className="relative group h-20 w-28 rounded-lg overflow-hidden border border-border/60">
                            <img src={url} alt={`${a} ${idx + 1}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeAmenityPhoto(a, idx)}
                              className="absolute top-1 right-1 bg-black/60 hover:bg-destructive text-white rounded-full p-1 transition duration-200 opacity-0 group-hover:opacity-100"
                              title="Remove photo"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <label className="h-20 w-28 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors text-primary">
                          <Upload className="h-4 w-4" />
                          <span className="text-[10px] font-medium">Add photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleAmenityPhoto(a, f);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label>Cover photo</Label>
          <div className="mt-2 flex items-center gap-3">
            {coverPreview && <img src={coverPreview} alt="" className="h-20 w-28 rounded object-cover" />}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
              <Upload className="h-4 w-4" />
              <span>{coverPreview ? "Replace" : "Upload"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCover(f); }} />
            </label>
            {coverPath && <Button type="button" variant="ghost" size="sm" onClick={() => { setCoverPath(null); setCoverPreview(null); }}><X className="h-4 w-4" /></Button>}
          </div>
          {/* Extra photos */}
          <div className="mt-4">
            <Label>Additional Photos</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {extraPhotos.map((url, idx) => (
                <div key={idx} className="relative group h-20 w-28 rounded overflow-hidden border border-border">
                  <img src={url} alt={"extra"+idx} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setExtraPhotos((prev) => prev.filter((_, i) => i !== idx));
                      toast.success("Photo removed from listing");
                    }}
                    className="absolute top-1 right-1 bg-black/60 hover:bg-destructive text-white rounded-full p-1 transition duration-200 opacity-0 group-hover:opacity-100"
                    title="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                <Upload className="h-4 w-4" />
                <span>Upload more</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { const files = e.target.files; if (files) handleExtraPhotos(files); }} />
              </label>
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={busy}>{busy ? "Saving…" : isEdit ? "Save changes" : "Submit for approval"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

interface InquiryRow {
  id: string; message: string; status: "new" | "responded" | "closed"; created_at: string;
  customer_id: string;
  boarding_houses: { id: string; name: string } | null;
  profiles?: { full_name: string; email: string | null; phone: string | null } | null;
}

function OwnerInquiries() {
  const { user } = useAuth();
  const [rows, setRows] = useState<InquiryRow[]>([]);

  const reload = async () => {
    if (!user) return;
    const data = await getOwnerInquiries({ data: { userId: user.id } });
    setRows(data as InquiryRow[]);
  };
  useEffect(() => { reload(); }, [user]);

  const setStatus = async (id: string, status: "responded" | "closed") => {
    try {
      await updateInquiryStatus({ data: { id, status } });
      toast.success("Updated"); reload();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="mt-4 space-y-3">
      {rows.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20 p-12 text-center">
          <div className="text-4xl mb-3">💬</div>
          <div className="font-semibold text-foreground">No inquiries yet</div>
          <div className="text-sm text-muted-foreground mt-1">When customers message you, they'll appear here.</div>
        </div>
      )}
      {rows.map((i) => (
        <div key={i.id} className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-bold text-base text-foreground">{i.boarding_houses?.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{new Date(i.created_at).toLocaleString()}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              i.status === "new" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
              : i.status === "responded" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}>{i.status}</span>
          </div>
          <div className="mt-3 rounded-xl bg-muted/50 border border-border/50 p-3">
            <p className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">{i.message}</p>
          </div>
          {i.profiles && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 font-semibold border border-indigo-200 dark:border-indigo-700">
                👤 {i.profiles.full_name || "Unknown"}
              </span>
              {i.profiles.email && <span className="text-muted-foreground">✉ {i.profiles.email}</span>}
              {i.profiles.phone && <span className="text-muted-foreground">📞 {i.profiles.phone}</span>}
            </div>
          )}
          <div className="mt-4 flex gap-2 pt-3 border-t border-border/40">
            {i.status !== "responded" && (
              <Button size="sm" onClick={() => setStatus(i.id, "responded")}
                className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                ✓ Mark Responded
              </Button>
            )}
            {i.status !== "closed" && (
              <Button size="sm" variant="outline" onClick={() => setStatus(i.id, "closed")}
                className="gap-1.5 rounded-xl border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                Close
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Owner Reservations Tab ───────────────────────────────────────────────────
interface ReservationRow {
  id: string;
  boardingHouseName: string;
  customerName: string;
  customerEmail: string;
  roomDeck?: string | null;
  price?: number | null;
  status: string;
  expiresAt: string;
  createdAt: string;
}

function OwnerReservations() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [, setTick] = useState(0);

  const reload = async () => {
    if (!user) return;
    const data = await getOwnerReservations({ data: { ownerId: user.id } });
    setRows(data as ReservationRow[]);
  };

  useEffect(() => { reload(); }, [user]);

  // Countdown ticker
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const getCountdown = (expiresAt: string) => {
    const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    if (diff === 0) return "Expired";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const doCancel = async (id: string) => {
    try {
      await cancelReservation({ data: { id } });
      toast.success("Reservation cancelled");
      reload();
    } catch (e) { toast.error((e as Error).message); }
  };

  const doConfirm = async (id: string) => {
    try {
      await confirmReservation({ data: { id } });
      toast.success("Reservation confirmed");
      reload();
    } catch (e) { toast.error((e as Error).message); }
  };

  const statusBadge = (status: string, expiresAt: string) => {
    const isExpiredByTime = new Date(expiresAt) < new Date();
    const effective = isExpiredByTime && status === "pending" ? "expired" : status;
    const map: Record<string, string> = {
      pending: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      cancelled: "bg-muted text-muted-foreground",
      expired: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    };
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${map[effective] ?? map.expired}`}>
        {effective}
      </span>
    );
  };

  if (rows.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border-2 border-dashed border-blue-200 dark:border-blue-700/40 bg-blue-50/50 dark:bg-blue-950/20 p-12 text-center">
        <div className="text-4xl mb-3">📅</div>
        <div className="font-semibold text-foreground">No reservations yet</div>
        <div className="text-sm text-muted-foreground mt-1">Reservation requests from customers will appear here.</div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {rows.map((r) => {
        const isPending = r.status === "pending" && new Date(r.expiresAt) > new Date();
        return (
          <div key={r.id} className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="font-bold text-base text-foreground">{r.boardingHouseName}</div>
                {r.roomDeck && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/10 border border-indigo-200 dark:border-indigo-700 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                    <BedDouble className="h-3.5 w-3.5" />
                    <span>{r.roomDeck}</span>
                    {r.price && <span className="opacity-70">· {peso(r.price)}/mo</span>}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{r.customerName}</span>
                  <span className="text-xs text-muted-foreground">{r.customerEmail}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  📌 Reserved {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {statusBadge(r.status, r.expiresAt)}
                {isPending && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1">
                    <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">{getCountdown(r.expiresAt)}</span>
                  </div>
                )}
              </div>
            </div>
            {isPending && (
              <div className="mt-4 pt-4 border-t border-border/40 flex gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20"
                  onClick={() => doConfirm(r.id)}
                >
                  ✓ Confirm Reservation
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 rounded-xl border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  onClick={() => doCancel(r.id)}
                >
                  ✕ Cancel
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Owner Room Management ────────────────────────────────────────────────────
interface RoomStatusItem {
  index: number;
  name: string;
  isOccupied: boolean;
  status: string;
  reservationId: string | null;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  expiresAt: string | null;
}

function OwnerRoomManagement() {
  const { user } = useAuth();
  const [listings, setListings] = useState<BHRow[]>([]);
  const [selectedBH, setSelectedBH] = useState<string>("");
  const [rooms, setRooms] = useState<RoomStatusItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getOwnerListings({ data: { userId: user.id } }).then((data) => {
      const approved = (data as BHRow[]).filter((b) => b.status === "approved");
      setListings(approved);
      if (approved.length > 0) setSelectedBH(approved[0].id);
    });
  }, [user]);

  const loadRooms = async (bhId: string) => {
    if (!bhId) return;
    setLoading(true);
    try {
      const result = await getOwnerRoomStatus({ data: { boardingHouseId: bhId } }) as { rooms: RoomStatusItem[]; numRooms: number; availableVacancies: number };
      setRooms(result.rooms);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBH) loadRooms(selectedBH);
  }, [selectedBH]);

  const toggleRoom = async (room: RoomStatusItem) => {
    if (!user || !selectedBH) return;
    setToggling(room.name);
    try {
      await setRoomOccupiedByOwner({
        data: {
          boardingHouseId: selectedBH,
          roomName: room.name,
          occupied: !room.isOccupied,
          ownerId: user.id,
        },
      });
      toast.success(
        !room.isOccupied
          ? `${room.name} marked as Occupied (Walk-in)`
          : `${room.name} marked as Available`
      );
      await loadRooms(selectedBH);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setToggling(null);
    }
  };

  if (listings.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border-2 border-dashed border-violet-200 dark:border-violet-700/40 bg-violet-50/50 dark:bg-violet-950/20 p-12 text-center">
        <div className="text-4xl mb-3">🛏</div>
        <div className="font-semibold text-foreground">No approved listings</div>
        <div className="text-sm text-muted-foreground mt-1">You need an approved listing to manage rooms.</div>
      </div>
    );
  }

  const bhInfo = listings.find(b => b.id === selectedBH);
  const available = rooms.filter(r => !r.isOccupied).length;

  return (
    <div className="mt-4 space-y-5">
      {/* Listing selector */}
      <div className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <DoorOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          <span className="font-semibold text-foreground">Select Boarding House</span>
          <select
            value={selectedBH}
            onChange={(e) => setSelectedBH(e.target.value)}
            className="ml-auto rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-400"
          >
            {listings.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        {bhInfo && (
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" /> {bhInfo.num_rooms} total rooms</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="h-4 w-4" /> {available} available
            </span>
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
              <XCircle className="h-4 w-4" /> {rooms.length - available} occupied / reserved
            </span>
          </div>
        )}
      </div>

      {/* Room grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <span className="animate-spin mr-2 text-lg">⏳</span> Loading rooms…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rooms.map((room) => {
            const isToggling = toggling === room.name;
            return (
              <div
                key={room.name}
                className={`relative rounded-2xl border-2 p-5 shadow-sm transition-all ${
                  room.isOccupied
                    ? "border-rose-300 dark:border-rose-700 bg-rose-50/60 dark:bg-rose-950/25"
                    : "border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/25"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <BedDouble className={`h-5 w-5 ${room.isOccupied ? "text-rose-500" : "text-emerald-500"}`} />
                    <span className="font-bold text-sm text-foreground">{room.name}</span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      room.isOccupied
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    }`}
                  >
                    {room.isOccupied ? room.status : "Available"}
                  </span>
                </div>

                {room.isOccupied && room.customerName && (
                  <div className="mb-3 rounded-xl bg-white/60 dark:bg-slate-800/60 p-2.5 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                      {room.customerName}
                    </div>
                    {room.customerEmail && (
                      <div className="text-muted-foreground truncate">{room.customerEmail}</div>
                    )}
                  </div>
                )}

                <Button
                  size="sm"
                  disabled={isToggling}
                  onClick={() => toggleRoom(room)}
                  className={`w-full rounded-xl text-xs font-semibold transition-all ${
                    room.isOccupied
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                      : "bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20"
                  }`}
                >
                  {isToggling
                    ? "Updating…"
                    : room.isOccupied
                    ? "✓ Mark as Available"
                    : "⊘ Mark as Occupied"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center pt-1">
        💡 Use this panel to manually manage walk-in occupants. Changes are reflected immediately in the reservation system.
      </p>
    </div>
  );
}
