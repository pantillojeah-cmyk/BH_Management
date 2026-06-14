import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BoardingHouseCard } from "@/components/boarding-house-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const searchSchema = z.object({
  q: fallback(z.string().optional(), undefined),
});

export const Route = createFileRoute("/browse")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Browse Boarding Houses — ZDSPGC-Dimataling" },
      { name: "description", content: "Search and filter approved boarding houses near ZDSPGC-Dimataling Campus by price, vacancy, distance, and type." },
      { property: "og:title", content: "Browse Boarding Houses — ZDSPGC-Dimataling" },
      { property: "og:description", content: "Filter approved boarding houses by price, vacancy, distance, and type." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const { q: initialQ } = Route.useSearch();
  const [search, setSearch] = useState(initialQ ?? "");
  const [maxRent, setMaxRent] = useState<number>(10000);
  const [onlyVacant, setOnlyVacant] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(5);
  const [houseType, setHouseType] = useState<string>("any");

  const { data, isLoading } = useQuery({
    queryKey: ["browse-houses"],
    queryFn: async () => {
      const { data: houses } = await supabase
        .from("boarding_houses")
        .select("*")
        .eq("approval", "approved")
        .order("created_at", { ascending: false });
      const ids = (houses ?? []).map((h) => h.id);
      const { data: rooms } = ids.length
        ? await supabase.from("rooms").select("boarding_house_id,status,monthly_rent").in("boarding_house_id", ids)
        : { data: [] };
      return (houses ?? []).map((h) => {
        const list = (rooms ?? []).filter((r) => r.boarding_house_id === h.id);
        const vacant = list.filter((r) => r.status === "vacant").length;
        const min = list.length ? Math.min(...list.map((r) => Number(r.monthly_rent))) : null;
        return { house: h, vacant, total: list.length, min };
      });
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter(({ house, vacant, min }) => {
      if (term && ![house.name, house.address, house.landmark ?? ""].some((s) => s.toLowerCase().includes(term))) return false;
      if (onlyVacant && vacant === 0) return false;
      if (min != null && min > maxRent) return false;
      if (house.distance_meters > maxDistanceKm * 1000) return false;
      if (houseType !== "any" && house.house_type !== houseType) return false;
      return true;
    });
  }, [data, search, onlyVacant, maxRent, maxDistanceKm, houseType]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Browse boarding houses</h1>
        <p className="text-muted-foreground">Approved listings near ZDSPGC-Dimataling Campus.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters */}
        <aside className="space-y-6 rounded-2xl border border-border bg-card p-5 shadow-card lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </div>

          <div>
            <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, address…" className="pl-9" />
            </div>
          </div>

          <div>
            <Label className="mb-2 flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
              Max monthly rent <span className="font-bold text-foreground">₱{maxRent.toLocaleString()}</span>
            </Label>
            <Slider min={500} max={10000} step={250} value={[maxRent]} onValueChange={(v) => setMaxRent(v[0])} />
          </div>

          <div>
            <Label className="mb-2 flex justify-between text-xs uppercase tracking-wider text-muted-foreground">
              Max distance <span className="font-bold text-foreground">{maxDistanceKm} km</span>
            </Label>
            <Slider min={0.1} max={10} step={0.1} value={[maxDistanceKm]} onValueChange={(v) => setMaxDistanceKm(v[0])} />
          </div>

          <div>
            <Label className="mb-2 block text-xs uppercase tracking-wider text-muted-foreground">Type</Label>
            <Select value={houseType} onValueChange={setHouseType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any type</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
                <SelectItem value="male_only">Male only</SelectItem>
                <SelectItem value="female_only">Female only</SelectItem>
                <SelectItem value="family">Family</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox checked={onlyVacant} onCheckedChange={(c) => setOnlyVacant(c === true)} />
            <span className="text-sm">Only show with vacant rooms</span>
          </label>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setSearch("");
              setMaxRent(10000);
              setMaxDistanceKm(5);
              setHouseType("any");
              setOnlyVacant(false);
            }}
          >
            Reset filters
          </Button>
        </aside>

        {/* Results */}
        <div>
          <div className="mb-4 text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${filtered.length} of ${data?.length ?? 0} listings`}
          </div>

          {!isLoading && filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
              No boarding houses match your filters.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {filtered.map((f) => (
                <BoardingHouseCard key={f.house.id} house={f.house} vacantRooms={f.vacant} totalRooms={f.total} minRent={f.min} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
