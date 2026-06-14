import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, MapPin, Phone, BedDouble, Heart, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/boarding-house/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Boarding House Details — ZDSPGC-Dimataling` },
      { name: "description", content: "View boarding house details: rooms, rent, vacancy, photos, and contact info." },
    ],
  }),
  component: HousePage,
});

function HousePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [revealed, setRevealed] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["bh", id],
    queryFn: async () => {
      const { data: house, error } = await supabase.from("boarding_houses").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!house) return null;
      const { data: rooms } = await supabase.from("rooms").select("*").eq("boarding_house_id", id).order("monthly_rent");
      return { house, rooms: rooms ?? [] };
    },
  });

  const { data: fav } = useQuery({
    queryKey: ["fav", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("id").eq("boarding_house_id", id).eq("customer_id", user!.id).maybeSingle();
      return data;
    },
  });

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      if (fav) {
        await supabase.from("favorites").delete().eq("id", fav.id);
      } else {
        await supabase.from("favorites").insert({ customer_id: user.id, boarding_house_id: id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fav", id] });
      toast.success(fav ? "Removed from favorites" : "Saved to favorites");
    },
    onError: (e) => toast.error(e.message),
  });

  const sendInquiry = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      if (message.trim().length < 5) throw new Error("Message too short");
      const { error } = await supabase.from("inquiries").insert({
        customer_id: user.id,
        boarding_house_id: id,
        message: message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inquiry sent! The owner will see it in their dashboard.");
      setMessage("");
      setRevealed(true);
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <div className="container mx-auto px-4 py-12 text-muted-foreground">Loading…</div>;
  if (!data?.house) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Boarding house not found.</p>
        <Button asChild className="mt-4"><Link to="/browse">Back to browse</Link></Button>
      </div>
    );
  }

  const { house, rooms } = data;
  const vacant = rooms.filter((r) => r.status === "vacant").length;
  const photos = house.cover_photo ? [house.cover_photo, ...house.photos] : house.photos;
  const cover = photos[0] || "https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200";
  const distance = house.distance_meters < 1000 ? `${house.distance_meters} m` : `${(house.distance_meters / 1000).toFixed(1)} km`;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/browse" })} className="mb-4">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to browse
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          {/* Photo gallery */}
          <div className="overflow-hidden rounded-2xl shadow-card">
            <div className="relative aspect-[16/9] bg-muted">
              <img src={cover} alt={house.name} className="h-full w-full object-cover" />
            </div>
            {photos.length > 1 && (
              <div className="grid grid-cols-4 gap-1 bg-card p-1">
                {photos.slice(1, 5).map((p, i) => (
                  <div key={i} className="aspect-square overflow-hidden rounded">
                    <img src={p} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold">{house.name}</h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {house.address}
              </div>
              {house.landmark && <div className="mt-1 text-sm text-muted-foreground">Landmark: {house.landmark}</div>}
            </div>
            <div className="flex gap-2">
              <Badge className="bg-success text-success-foreground">{vacant} vacant</Badge>
              <Badge variant="outline">{distance} from campus</Badge>
            </div>
          </div>

          {house.description && (
            <div className="mt-6">
              <h2 className="mb-2 font-display text-xl font-bold">About this boarding house</h2>
              <p className="whitespace-pre-line text-muted-foreground">{house.description}</p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="mb-3 font-display text-xl font-bold">Rooms</h2>
            {rooms.length === 0 ? (
              <p className="text-muted-foreground">No rooms listed yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {rooms.map((r) => (
                  <Card key={r.id} className="border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{r.room_name}</div>
                        <Badge
                          className={r.status === "vacant" ? "bg-success text-success-foreground" : ""}
                          variant={r.status === "vacant" ? "default" : "secondary"}
                        >
                          {r.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground"><BedDouble className="mr-1 inline h-3.5 w-3.5" />{r.capacity} pax</span>
                        <span className="font-bold text-primary">₱{Number(r.monthly_rent).toLocaleString()}/mo</span>
                      </div>
                      {r.description && <div className="mt-2 text-xs text-muted-foreground">{r.description}</div>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inquiry sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Contact owner</div>
                {revealed || !user ? (
                  <div className="mt-1 flex items-center gap-2 text-lg font-bold text-primary">
                    <Phone className="h-4 w-4" /> {house.contact_number}
                  </div>
                ) : (
                  <Button variant="link" className="px-0" onClick={() => setRevealed(true)}>
                    <Phone className="mr-1 h-4 w-4" /> Show phone number
                  </Button>
                )}
              </div>

              {user ? (
                <div className="space-y-2">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hi! I'm interested in your boarding house. Is the room still available?"
                    rows={4}
                    maxLength={1000}
                  />
                  <Button
                    onClick={() => sendInquiry.mutate()}
                    disabled={sendInquiry.isPending}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" /> Send inquiry
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toggleFav.mutate()}
                    disabled={toggleFav.isPending}
                    className="w-full"
                  >
                    <Heart className={`mr-2 h-4 w-4 ${fav ? "fill-destructive text-destructive" : ""}`} />
                    {fav ? "Saved" : "Save to favorites"}
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm">
                  <p className="text-muted-foreground">Sign in to send an inquiry or save this listing.</p>
                  <Button asChild className="mt-3 w-full">
                    <Link to="/auth">Sign in</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
