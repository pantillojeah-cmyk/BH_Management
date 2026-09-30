import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Edit, Upload, X, Minus, Share2, Copy, Building, BedDouble, CircleDollarSign, CalendarCheck, Clock, MapPin, Crosshair, Navigation, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
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
import { getOwnerListings, deleteListing, upsertListing, getOwnerInquiries, updateInquiryStatus, updateVacancy, getOwnerReservations, cancelReservation, confirmReservation } from "@/lib/server-fns";

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
    else if (role && role !== "owner") navigate({ to: "/" });
  }, [user, role, loading, navigate]);

  if (!user || role !== "owner") return null;
  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Owner Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your boarding house listings and inquiries</p>
        </div>
      </div>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">My Listings</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OwnerOverview /></TabsContent>
        <TabsContent value="listings"><MyListings /></TabsContent>
        <TabsContent value="inquiries"><OwnerInquiries /></TabsContent>
        <TabsContent value="reservations"><OwnerReservations /></TabsContent>
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
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalListings}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
          <BedDouble className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalRooms}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Total Vacancies</CardTitle>
          <Plus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalVacancies}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">Est. Monthly Revenue</CardTitle>
          <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{peso(estimatedRevenue)}</div>
          <p className="text-xs text-muted-foreground mt-1">Based on occupied rooms</p>
        </CardContent>
      </Card>
    </div>
  <div className="mt-8 grid gap-8 md:grid-cols-2">
    {/* Vacancies per Property Bar Chart */}
    <div>
      <h3 className="text-lg font-semibold mb-4">Vacancies per Property</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={rows.map(r => ({ name: r.name, vacancies: r.available_vacancies, rooms: r.num_rooms }))}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="vacancies" fill="#3b82f6" name="Vacancies" />
          <Bar dataKey="rooms" fill="#10b981" name="Total Rooms" />
        </BarChart>
      </ResponsiveContainer>
    </div>
    {/* Status Distribution Pie Chart */}
    <div>
      <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
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
            outerRadius={80}
            label
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <Cell key={`cell-${index}`} fill={index === 0 ? "#3b82f6" : index === 1 ? "#10b981" : "#ef4444"} />
            ))}
          </Pie>
          <Tooltip />
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
    <Card className="overflow-hidden flex flex-col group transition-all hover:shadow-md">
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

      <CardContent className="flex flex-col flex-1 p-5">
        <div className="mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{r.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{r.address}</p>
        </div>
        <div className="mb-4 text-primary font-medium">{peso(r.monthly_fee)} / mo</div>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 rounded-full"
              disabled={r.available_vacancies <= 0}
              onClick={() => onChangeVacancy(-1)}
              title="Decrease vacancy"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-14 text-center text-sm font-medium">
              {r.available_vacancies}/{r.num_rooms}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 rounded-full"
              disabled={r.available_vacancies >= r.num_rooms}
              onClick={() => onChangeVacancy(+1)}
              title="Increase vacancy"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/browse?q=${encodeURIComponent(r.name)}`);
                toast.success("Link copied to clipboard");
              }}
              title="Share Listing"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              onClick={onEdit}
              title="Edit Listing"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
              onClick={onRemove}
              title="Delete Listing"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
            <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="mr-1 h-4 w-4" /> New listing</Button>
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
  const [extraPhotos, setExtraPhotos] = useState<string[]>(initial?.extraPhotos ?? []);
  const [coverPreview, setCoverPreview] = useState<string | null>(initial?.cover_photo_url ?? null);
  const [coverPath, setCoverPath] = useState<string | null>(initial?.cover_photo_url ?? null);
  const [busy, setBusy] = useState(false);

  const toggleAmenity = (a: string) => setAmenities((s) => s.includes(a) ? s.filter((x) => x !== a) : [...s, a]);

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
      await upsertListing({
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
          <div className="mt-1 flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <button type="button" key={a} onClick={() => toggleAmenity(a)}
                className={`rounded-full border px-3 py-1 text-xs ${amenities.includes(a) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                {a}
              </button>
            ))}
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
      {rows.length === 0 && <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">No inquiries yet.</div>}
      {rows.map((i) => (
        <div key={i.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">{i.boarding_houses?.name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{new Date(i.created_at).toLocaleString()}</div>
            </div>
            <Badge variant={i.status === "new" ? "default" : i.status === "responded" ? "secondary" : "outline"}>{i.status}</Badge>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm">{i.message}</p>
          {i.profiles && (
            <div className="mt-2 text-xs text-muted-foreground">
              From <span className="font-medium text-foreground">{i.profiles.full_name || "—"}</span>
              {i.profiles.email && ` · ${i.profiles.email}`}
              {i.profiles.phone && ` · ${i.profiles.phone}`}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            {i.status !== "responded" && <Button size="sm" variant="outline" onClick={() => setStatus(i.id, "responded")}>Mark responded</Button>}
            {i.status !== "closed" && <Button size="sm" variant="ghost" onClick={() => setStatus(i.id, "closed")}>Close</Button>}
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
      <div className="mt-4 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
        No reservations yet.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {rows.map((r) => {
        const isPending = r.status === "pending" && new Date(r.expiresAt) > new Date();
        return (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="font-semibold text-base">{r.boardingHouseName}</div>
                {r.roomDeck && (
                  <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    <BedDouble className="h-3.5 w-3.5" />
                    <span>{r.roomDeck}</span>
                    {r.price && <span>· {peso(r.price)}/mo</span>}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  {r.customerName} · <span className="text-xs">{r.customerEmail}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Reserved {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {statusBadge(r.status, r.expiresAt)}
                {isPending && (
                  <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                    <Clock className="h-3 w-3" />
                    <span className="font-mono font-semibold">{getCountdown(r.expiresAt)}</span>
                  </div>
                )}
              </div>
            </div>
            {isPending && (
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => doConfirm(r.id)}
                >
                  Confirm Reservation
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => doCancel(r.id)}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
