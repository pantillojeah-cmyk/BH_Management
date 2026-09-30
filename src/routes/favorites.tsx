import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BoardingHouseCard, type BHCard } from "@/components/BoardingHouseCard";
import { useAuth } from "@/hooks/use-auth";
import { getFavoriteListings, toggleFavorite } from "@/lib/server-fns";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "My Favorites" }] }),
  component: Favorites,
});

function Favorites() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<BHCard[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/customer/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    getFavoriteListings({ data: { userId: user.id } }).then((data) => {
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
      setItems(Array.from(map.values()));
    });
  }, [user]);

  const remove = async (id: string) => {
    if (!user) return;
    await toggleFavorite({ data: { userId: user.id, boardingHouseId: id, add: false } });
    setItems((s) => s.filter((x) => x.id !== id));
  };

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-500 shadow-sm backdrop-blur-md">
              <span className="text-base">❤️</span>
            </div>
            My Favorites
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Boarding houses you saved for easy access and comparison.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="glass-card rounded-3xl border border-dashed border-white/60 dark:border-white/10 p-12 text-center text-muted-foreground backdrop-blur-xl">
          <p className="text-base font-semibold text-foreground">You haven't saved any boarding houses yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Tap the heart icon on any listing card to keep it here.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((bh) => (
            <BoardingHouseCard key={bh.id} bh={bh} isFavorite onToggleFavorite={() => remove(bh.id)} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
