import { Link, useNavigate } from "@tanstack/react-router";
import {
  MapPin, Bed, Heart, Star, ChevronLeft, ChevronRight,
  CheckCircle2, BedDouble, CalendarCheck, Lock, Maximize2
} from "lucide-react";
import { peso, vacancyState, toneClass } from "@/lib/format";
import { useEffect, useState, useMemo } from "react";
import { resolvePhoto } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { createReservation, getListingRoomReservations } from "@/lib/server-fns";
import { ImageViewerModal } from "@/components/ImageViewerModal";

export interface BHCard {
  id: string;
  name: string;
  address: string;
  landmark: string | null;
  monthly_fee: number;
  num_rooms: number;
  available_vacancies: number;
  room_capacity?: number;
  price_type?: string;
  amenities: string[];
  cover_photo_url: string | null;
  photos?: string[];
  avg_rating?: number | null;
  review_count?: number;
}

function StarRating({ rating, count }: { rating: number | null | undefined; count?: number }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i <= full
                ? "fill-amber-400 text-amber-400"
                : i === full + 1 && half
                ? "fill-amber-200 text-amber-400"
                : "fill-muted text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-amber-600">{rating.toFixed(1)}</span>
      {count !== undefined && count > 0 && (
        <span className="text-[11px] text-muted-foreground">({count})</span>
      )}
    </div>
  );
}

export function BoardingHouseCard({
  bh,
  isFavorite,
  onToggleFavorite,
}: {
  bh: BHCard;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [reservedRoomNames, setReservedRoomNames] = useState<Set<string>>(new Set());
  const [reserving, setReserving] = useState(false);
  const [localVacancies, setLocalVacancies] = useState<number>(bh.available_vacancies);

  useEffect(() => {
    setLocalVacancies(bh.available_vacancies);
  }, [bh.available_vacancies]);

  const state = vacancyState(localVacancies, bh.num_rooms);

  useEffect(() => {
    const urls = bh.photos?.length ? bh.photos : (bh.cover_photo_url ? [bh.cover_photo_url] : []);
    Promise.all(urls.map(resolvePhoto)).then((resolved) => {
      setImages(resolved.filter(Boolean) as string[]);
      setPhotoIdx(0);
    });
  }, [bh.photos, bh.cover_photo_url]);

  useEffect(() => {
    if (!bh.id) return;
    getListingRoomReservations({ data: { boardingHouseId: bh.id } })
      .then((res) => {
        const names = new Set<string>();
        for (const r of res) {
          if (r.roomDeck) names.add(r.roomDeck);
        }
        setReservedRoomNames(names);
      })
      .catch(() => {});
  }, [bh.id]);

  // Compute room list corresponding to boarding house capacity
  const rooms = useMemo(() => {
    const numRooms = Math.max(bh.num_rooms || 1, 1);
    const vacancies = Math.max(0, Math.min(numRooms, localVacancies ?? 0));

    // First pass: create room items and identify already reserved rooms
    const items = Array.from({ length: numRooms }, (_, i) => {
      const name = `Room ${i + 1}`;
      const isReserved = reservedRoomNames.has(name);

      return {
        index: i,
        name,
        isReserved,
        isOccupied: isReserved,
        status: isReserved ? "Reserved" : "Available",
      };
    });

    // Exactly `vacancies` rooms should be Available. The remaining rooms are Occupied.
    let availableSlotsRemaining = vacancies;
    for (let i = 0; i < items.length; i++) {
      if (items[i].isReserved) continue;
      if (availableSlotsRemaining > 0) {
        items[i].isOccupied = false;
        items[i].status = "Available";
        availableSlotsRemaining--;
      } else {
        items[i].isOccupied = true;
        items[i].status = "Occupied";
      }
    }

    return items;
  }, [bh.num_rooms, localVacancies, reservedRoomNames]);

  const firstAvailableRoom = rooms.find((r) => !r.isOccupied);

  const handleReserve = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in as a student/employee to reserve a room.");
      navigate({ to: "/customer/login" });
      return;
    }
    if (role !== "customer") {
      toast.error("Only customers can make room reservations.");
      return;
    }
    if (!firstAvailableRoom || localVacancies <= 0) {
      toast.error("No rooms currently available.");
      return;
    }

    setReserving(true);
    try {
      const res = await createReservation({
        data: {
          boardingHouseId: bh.id,
          customerId: user.id,
          roomDeck: firstAvailableRoom.name,
          price: bh.monthly_fee,
        },
      });
      setReservedRoomNames((prev) => new Set([...prev, firstAvailableRoom.name]));
      setLocalVacancies((prev) => Math.max(0, prev - 1));
      const exp = new Date(res.expiresAt);
      toast.success(
        `Reserved successfully! Held until ${exp.toLocaleString()}`
      );
    } catch (err) {
      toast.error((err as Error).message || "Failed to reserve room");
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="glass-card group overflow-hidden rounded-2xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* ── Photo Section with Carousel & Room Selection ── */}
      <div
        className="relative aspect-[16/10] overflow-hidden bg-muted group/img select-none cursor-pointer"
        onClick={() => {
          setIsViewerOpen(true);
        }}
      >
        {images.length > 0 ? (
          <>
            <img
              src={images[photoIdx % images.length]}
              alt={bh.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />

            {/* Full screen View Icon Badge */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md shadow-lg border border-white/20">
                <Maximize2 className="h-3.5 w-3.5 text-emerald-400" />
                View Full Screen
              </span>
            </div>

            {/* Left & Right Carousel Arrows ‹ and › */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPhotoIdx((i) => (i - 1 + images.length) % images.length);
                  }}
                  aria-label="Previous photo"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/85 text-white p-1.5 shadow-md backdrop-blur-sm transition-all z-20 flex items-center justify-center hover:scale-110"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPhotoIdx((i) => (i + 1) % images.length);
                  }}
                  aria-label="Next photo"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/85 text-white p-1.5 shadow-md backdrop-blur-sm transition-all z-20 flex items-center justify-center hover:scale-110"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5 z-20 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setPhotoIdx(i);
                      }}
                      aria-label={`Select photo ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === (photoIdx % images.length) ? "w-4 bg-emerald-400" : "w-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>

                {/* Photo Counter */}
                <div className="absolute bottom-2.5 right-2.5 text-[10px] font-semibold text-white bg-black/60 px-2 py-0.5 rounded shadow z-20 backdrop-blur-sm">
                  {(photoIdx % images.length) + 1} / {images.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">No photo</div>
        )}
      </div>

      {/* ── Card Information ── */}
      <div className="space-y-3 p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Link to="/listing/$id" params={{ id: bh.id }} className="text-base font-bold text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1">
              {bh.name}
            </Link>
            {onToggleFavorite && (
              <button
                onClick={onToggleFavorite}
                aria-label="Toggle favorite"
                className="rounded-full p-1.5 hover:bg-white/60 dark:hover:bg-slate-800/60 backdrop-blur-md text-muted-foreground hover:text-rose-500 transition-all flex-shrink-0"
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
              </button>
            )}
          </div>

          <StarRating rating={bh.avg_rating} count={bh.review_count} />

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="line-clamp-1">{bh.address}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {bh.amenities.slice(0, 3).map((a) => (
              <span key={a} className="rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-white/10 px-2 py-0.5 text-[10px] text-foreground/80 font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                {a}
              </span>
            ))}
            {bh.amenities.length > 3 && (
              <span className="text-[10px] text-muted-foreground flex items-center">+{bh.amenities.length - 3} more</span>
            )}
          </div>
        </div>

        {/* ── Price & Reservation Action ── */}
        <div className="pt-3 border-t border-white/50 dark:border-white/10 space-y-2.5">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-muted-foreground">
                {bh.price_type === "per_room" ? "Price per room" : "Price per person"}
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {peso(bh.monthly_fee)}
                <span className="text-xs font-normal text-muted-foreground">
                  {bh.price_type === "per_room" ? " / room" : " / person"}
                </span>
              </div>
            </div>
            <div className="text-right space-y-1">
              <span className={`inline-block rounded-full border border-white/60 dark:border-white/15 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md shadow-sm ${toneClass[state.tone]}`}>
                {localVacancies}/{bh.num_rooms} Vacant
              </span>
              <div className="text-[10px] text-muted-foreground font-medium">
                Good for {bh.room_capacity ?? 1} {(bh.room_capacity ?? 1) === 1 ? "person" : "persons"}
              </div>
            </div>
          </div>

          {/* Reserve This Room Button */}
          <Button
            type="button"
            className={`w-full font-semibold shadow-md transition-all text-xs h-9 rounded-xl ${
              !firstAvailableRoom || localVacancies <= 0
                ? "bg-muted/70 text-muted-foreground border border-white/30 dark:border-white/10 cursor-not-allowed hover:bg-muted/70"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25 border border-white/30 hover:scale-[1.01] active:scale-[0.99]"
            }`}
            disabled={!firstAvailableRoom || reserving || localVacancies <= 0}
            onClick={handleReserve}
          >
            <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
            {reserving
              ? "Reserving…"
              : localVacancies <= 0 || !firstAvailableRoom
              ? "Fully Occupied"
              : "Reserve"}
          </Button>
        </div>
      </div>

      {/* Full-Screen Image Viewer Modal */}
      <ImageViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={images}
        currentIndex={photoIdx % Math.max(images.length, 1)}
        onIndexChange={setPhotoIdx}
        title={bh.name}
      />
    </div>
  );
}
