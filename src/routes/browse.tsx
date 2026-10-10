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
  const [maxFee, setMaxFee] = useState(10000);
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
      {/* ── High-Contrast Vibrant Search Banner ── */}
      <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 px-6 py-9 sm:px-8 text-white shadow-xl shadow-emerald-950/20 border border-emerald-600/40">
        {/* Glow sheen reflections */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-950/50 border border-emerald-400/35 px-3.5 py-1 text-xs font-semibold text-emerald-100 backdrop-blur-md shadow-xs">
            <MapPin className="h-3.5 w-3.5 text-emerald-300" /> Near ZDSPGC-Dimataling Campus
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
            {role === "owner" ? "Explore other boarding houses" : "Find your next boarding house"}
          </h1>
          <p className="mt-2 text-sm text-emerald-100 leading-relaxed font-medium">
            {role === "owner" 
              ? "See other properties, compare amenities, and check current market rates."
              : "Browse vacancies, compare amenities, and message owners directly in real-time."}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, address, or landmark"
                className="h-12 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 pl-10 pr-4 shadow-sm border border-white/80 focus-visible:ring-2 focus-visible:ring-emerald-400 text-sm font-medium"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters((v) => !v)}
              className="h-12 px-5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-950/80 text-white hover:text-white border border-emerald-400/50 backdrop-blur-md shadow-sm transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal className="h-4 w-4 text-emerald-300" />
              <span>Filters</span>
              <span className="text-xs text-emerald-300 font-bold">{showFilters ? "▲" : "▼"}</span>
            </Button>
            {/* Sort selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="h-12 rounded-2xl border border-white/80 bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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

      {/* ── Filters Drawer ── */}
      {showFilters && (
        <section className="glass-card mb-8 grid gap-6 rounded-3xl p-6 sm:grid-cols-3 border border-white/80 dark:border-white/10 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-bold text-foreground">Max rental fee</label>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">₱{maxFee.toLocaleString()}/mo</span>
            </div>
            <Slider value={[maxFee]} min={500} max={10000} step={100} onValueChange={(v) => setMaxFee(v[0])} className="mt-4" />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-foreground">Specific Boarding House</label>
              <select
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
                className="w-full rounded-xl border border-input/60 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              >
                <option value="">All boarding houses</option>
                {uniqueNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Checkbox id="vacant" checked={onlyVacant} onCheckedChange={(v) => setOnlyVacant(!!v)} />
              <label htmlFor="vacant" className="text-sm font-medium text-foreground cursor-pointer">Only show with available vacancies</label>
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-bold text-foreground">Amenities</div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_AMENITIES.map((a) => {
                const on = selectedAmenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setSelectedAmenities((s) => (on ? s.filter((x) => x !== a) : [...s, a]))}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-all backdrop-blur-md cursor-pointer ${
                      on
                        ? "border border-emerald-500 bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 scale-105"
                        : "border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Count & Results ── */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground/80">
          {loading ? "Searching boarding houses…" : `${filtered.length} boarding house${filtered.length === 1 ? "" : "s"} found`}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((bh) => (
          <BoardingHouseCard key={bh.id} bh={bh} isFavorite={favorites.has(bh.id)} onToggleFavorite={() => toggleFav(bh.id)} />
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="glass-card rounded-3xl p-12 text-center text-muted-foreground border border-dashed border-slate-300 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl">
          <p className="text-base font-bold text-foreground">No boarding houses match your filters.</p>
          <p className="text-xs text-muted-foreground mt-1">Try clearing some amenities or adjusting your search keyword.</p>
          <Button
            variant="outline"
            className="mt-4 rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold"
            onClick={() => {
              setQ("");
              setMaxFee(10000);
              setOnlyVacant(false);
              setSelectedAmenities([]);
              setSelectedName("");
            }}
          >
            Reset Filters
          </Button>
        </div>
      )}
    </AppShell>
  );
}
