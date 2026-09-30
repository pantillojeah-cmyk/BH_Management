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
  const state = vacancyState(bh.available_vacancies, bh.num_rooms);
  const [images, setImages] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [reservedRoomNames, setReservedRoomNames] = useState<Set<string>>(new Set());
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    const urls = bh.photos?.length ? bh.photos : (bh.cover_photo_url ? [bh.cover_photo_url] : []);
    Promise.all(urls.map(resolvePhoto)).then((resolved) => {
      setImages(resolved.filter(Boolean) as string[]);
      setCurrentIdx(0);
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

  // Compute room/deck list corresponding to photos
  const rooms = useMemo(() => {
    const total = Math.max(images.length, 1);
    const occupiedCount = Math.max(0, bh.num_rooms - bh.available_vacancies);

    return Array.from({ length: total }, (_, i) => {
      const roomNum = Math.floor(i / 2) + 1;
      const deck = i % 2 === 0 ? "Lower Deck" : "Upper Deck";
      const name = total === 1 ? "Room 1 - Standard Unit" : `Room ${roomNum} - ${deck}`;
      const isReserved = reservedRoomNames.has(name);
      const isOccupied = isReserved || (occupiedCount > 0 && i >= (total - occupiedCount));

      return {
        index: i,
        name,
        isOccupied,
        isReserved,
        status: isReserved ? "Reserved" : isOccupied ? "Occupied" : "Available",
      };
    });
  }, [images.length, bh.num_rooms, bh.available_vacancies, reservedRoomNames]);

  const activeRoom = rooms[currentIdx] || rooms[0] || {
    index: 0,
    name: "Room 1 - Lower Deck",
    isOccupied: false,
    isReserved: false,
    status: "Available",
  };

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
    if (activeRoom.isOccupied || activeRoom.isReserved) {
      toast.error(`"${activeRoom.name}" is already occupied or reserved.`);
      return;
    }

    setReserving(true);
    try {
      const res = await createReservation({
        data: {
          boardingHouseId: bh.id,
          customerId: user.id,
          roomDeck: activeRoom.name,
          price: bh.monthly_fee,
        },
      });
      setReservedRoomNames((prev) => new Set([...prev, activeRoom.name]));
      const exp = new Date(res.expiresAt);
      toast.success(
        `Reserved ${activeRoom.name} successfully! Held until ${exp.toLocaleString()}`
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
              src={images[currentIdx]}
              alt={`${bh.name} - ${activeRoom.name}`}
              className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
                activeRoom.isOccupied ? "brightness-75 contrast-90" : ""
              }`}
            />

            {/* Visual Highlight Overlay for Selected Room */}
            <div
              className={`absolute inset-0 pointer-events-none transition-all duration-200 ${
                activeRoom.isOccupied
                  ? "ring-4 ring-rose-500/80 ring-inset bg-rose-950/20"
                  : "ring-4 ring-emerald-500 ring-inset bg-emerald-950/10"
              }`}
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
                    setCurrentIdx((i) => (i - 1 + images.length) % images.length);
                  }}
                  aria-label="Previous room photo"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/85 text-white p-1.5 shadow-md backdrop-blur-sm transition-all z-20 flex items-center justify-center hover:scale-110"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIdx((i) => (i + 1) % images.length);
                  }}
                  aria-label="Next room photo"
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
                        setCurrentIdx(i);
                      }}
                      aria-label={`Select photo ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentIdx ? "w-4 bg-emerald-400" : "w-1.5 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>

                {/* Photo Counter */}
                <div className="absolute bottom-2.5 right-2.5 text-[10px] font-semibold text-white bg-black/60 px-2 py-0.5 rounded shadow z-20 backdrop-blur-sm">
                  {currentIdx + 1} / {images.length}
                </div>
              </>
            )}

            {/* Selected Room Badge on Image */}
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
              <span className={`inline-flex items-center gap-1.5 rounded-full text-white border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-md shadow-md ${
                activeRoom.isOccupied
                  ? "bg-rose-950/90 border-rose-400/30 text-rose-200"
                  : "bg-slate-900/90 border-emerald-400/40 text-emerald-300"
              }`}>
                <BedDouble className="h-3.5 w-3.5 text-emerald-400" />
                <span>Selected: {activeRoom.name}</span>
              </span>
            </div>

            {/* Room Availability Status Overlay Badge */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
              {activeRoom.isOccupied ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-600/95 text-white border border-rose-300/40 px-2.5 py-0.5 text-xs font-bold backdrop-blur-md shadow-md">
                  <Lock className="h-3 w-3" />
                  {activeRoom.status}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 text-white border border-emerald-300/40 px-2.5 py-0.5 text-xs font-bold backdrop-blur-md shadow-md">
                  <CheckCircle2 className="h-3 w-3" />
                  Available
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">No photo</div>
        )}
      </div>

      {/* ── Room Selector Pills ── */}
      {rooms.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2.5 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md border-b border-white/50 dark:border-white/10 scrollbar-none">
          {rooms.map((r, i) => (
            <button
              key={r.name}
              type="button"
              onClick={() => {
                setCurrentIdx(i);
                if (r.isOccupied) {
                  toast.error(`"${r.name}" is already occupied or reserved.`);
                } else {
                  toast.success(`Selected "${r.name}"`);
                }
              }}
              className={`flex-shrink-0 px-2.5 py-1 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 backdrop-blur-md ${
                i === currentIdx
                  ? r.isOccupied
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-105 border border-rose-400/50"
                    : "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105 border border-emerald-400/50"
                  : r.isOccupied
                  ? "bg-muted/60 text-muted-foreground line-through opacity-70 hover:opacity-100 border border-white/20 dark:border-white/5"
                  : "bg-white/60 dark:bg-slate-800/60 border border-white/60 dark:border-white/10 text-foreground hover:bg-white dark:hover:bg-slate-800"
              }`}
            >
              <span>{r.name}</span>
              {r.isOccupied && <span className="text-[9px] font-normal text-rose-200">({r.status})</span>}
            </button>
          ))}
        </div>
      )}

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
              <div className="text-xs text-muted-foreground">Price per room</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {peso(bh.monthly_fee)}
                <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`rounded-full border border-white/60 dark:border-white/15 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur-md shadow-sm ${toneClass[state.tone]}`}>
                {bh.available_vacancies}/{bh.num_rooms} Vacant
              </span>
            </div>
          </div>

          {/* Reserve This Room Button */}
          <Button
            type="button"
            className={`w-full font-semibold shadow-md transition-all text-xs h-9 rounded-xl ${
              activeRoom.isOccupied
                ? "bg-muted/70 text-muted-foreground border border-white/30 dark:border-white/10 cursor-not-allowed hover:bg-muted/70"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25 border border-white/30 hover:scale-[1.01] active:scale-[0.99]"
            }`}
            disabled={activeRoom.isOccupied || reserving}
            onClick={handleReserve}
          >
            <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
            {reserving
              ? "Reserving…"
              : activeRoom.isOccupied
              ? `${activeRoom.name} (${activeRoom.status})`
              : `Reserve ${activeRoom.name}`}
          </Button>
        </div>
      </div>

      {/* Full-Screen Image Viewer Modal */}
      <ImageViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={images}
        currentIndex={currentIdx}
        onIndexChange={setCurrentIdx}
        title={bh.name}
        rooms={rooms}
      />
    </div>
  );
}
