import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BoardingHouseCard, type BHCard } from "@/components/BoardingHouseCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { getApprovedListings, getUserFavorites, toggleFavorite } from "@/lib/server-fns";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse Boarding Houses — ZDSPGC-Dimataling" },
      { name: "description", content: "Search and filter available boarding houses near ZDSPGC-Dimataling Campus." },
    ],
  }),
  component: Browse,
});

const COMMON_AMENITIES = ["Wi-Fi", "Water", "Electricity", "Air Conditioning", "Kitchen", "Laundry", "Parking", "CCTV", "Study Area", "Generator"];

function Browse() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/customer/login" });
    }
  }, [user, authLoading, navigate]);
  const [houses, setHouses] = useState<BHCard[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [maxFee, setMaxFee] = useState(5000);
  const [onlyVacant, setOnlyVacant] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [selectedName, setSelectedName] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc" | "rating" | "vacancies">("default");

  useEffect(() => {
    getApprovedListings().then((data) => {
      const raw = data as BHCard[];
      const map = new Map<string, BHCard>();
      for (const h of raw) {
        const key = `${h.name.trim().toLowerCase()}:::${h.address.trim().toLowerCase()}`;
        const itemPhotos = [h.cover_photo_url, ...(h.photos || [])].filter(Boolean) as string[];
        const existing = map.get(key);
        if (!existing) {
          map.set(key, {
            ...h,
            photos: Array.from(new Set(itemPhotos)),
          });
        } else {
          existing.photos = Array.from(new Set([...(existing.photos || []), ...itemPhotos]));
          if (!existing.cover_photo_url && h.cover_photo_url) {
            existing.cover_photo_url = h.cover_photo_url;
          }
        }
      }
      setHouses(Array.from(map.values()));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) { setFavorites(new Set()); return; }
    getUserFavorites({ data: { userId: user.id } }).then((ids) => {
      setFavorites(new Set(ids));
    });
  }, [user]);

  const filtered = useMemo(() => {
    let result = houses.filter((h) => {
      if (selectedName && h.name !== selectedName) return false;
      if (q && !`${h.name} ${h.address} ${h.landmark ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (h.monthly_fee > maxFee) return false;
      if (onlyVacant && h.available_vacancies <= 0) return false;
      if (selectedAmenities.length && !selectedAmenities.every((a) => h.amenities.includes(a))) return false;
      return true;
    });
    if (sortBy === "price_asc") result = [...result].sort((a, b) => a.monthly_fee - b.monthly_fee);
    else if (sortBy === "price_desc") result = [...result].sort((a, b) => b.monthly_fee - a.monthly_fee);
    else if (sortBy === "rating") result = [...result].sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
    else if (sortBy === "vacancies") result = [...result].sort((a, b) => b.available_vacancies - a.available_vacancies);
    return result;
  }, [houses, q, maxFee, onlyVacant, selectedAmenities, sortBy, selectedName]);

  const uniqueNames = useMemo(() => Array.from(new Set(houses.map(h => h.name))).sort(), [houses]);

  const toggleFav = async (id: string) => {
    if (!user) { toast.error("Sign in as a customer to save favorites"); return; }
    if (role !== "customer") { toast.error("Only customers can save favorites"); return; }
    const has = favorites.has(id);
    const next = new Set(favorites);
    if (has) {
      next.delete(id);
      await toggleFavorite({ data: { userId: user.id, boardingHouseId: id, add: false } });
    } else {
      next.add(id);
      await toggleFavorite({ data: { userId: user.id, boardingHouseId: id, add: true } });
    }
    setFavorites(next);
  };

  if (authLoading || !user) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          Checking authentication...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mb-6 rounded-2xl bg-gradient-to-br from-primary to-primary/80 px-6 py-10 text-primary-foreground">
        <div className="max-w-3xl">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs">
            <MapPin className="h-3.5 w-3.5" /> Near ZDSPGC-Dimataling Campus
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">Find your next boarding house</h1>
          <p className="mt-2 text-sm opacity-90">Browse vacancies, compare amenities, and message owners directly.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, address, or landmark"
                className="bg-background pl-9 text-foreground"
              />
            </div>
            <Button variant="secondary" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters
            </Button>
            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="default">Sort: Default</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Highest Rated</option>
              <option value="vacancies">Most Vacancies</option>
            </select>
          </div>
        </div>
      </section>

      {showFilters && (
        <section className="mb-6 grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">Max rental fee: ₱{maxFee.toLocaleString()}</label>
            <Slider value={[maxFee]} min={500} max={10000} step={100} onValueChange={(v) => setMaxFee(v[0])} />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Specific Boarding House</label>
              <select
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All boarding houses</option>
                {uniqueNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="vacant" checked={onlyVacant} onCheckedChange={(v) => setOnlyVacant(!!v)} />
              <label htmlFor="vacant" className="text-sm">Only show with vacancies</label>
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">Amenities</div>
            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map((a) => {
                const on = selectedAmenities.includes(a);
                return (
                  <button
                    key={a}
                    onClick={() => setSelectedAmenities((s) => (on ? s.filter((x) => x !== a) : [...s, a]))}
                    className={`rounded-full border px-3 py-1 text-xs ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <div className="mb-3 text-sm text-muted-foreground">{loading ? "Loading…" : `${filtered.length} boarding house${filtered.length === 1 ? "" : "s"} found`}</div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((bh) => (
          <BoardingHouseCard key={bh.id} bh={bh} isFavorite={favorites.has(bh.id)} onToggleFavorite={() => toggleFav(bh.id)} />
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No boarding houses match your filters.
        </div>
      )}
    </AppShell>
  );
}
