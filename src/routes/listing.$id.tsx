import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Phone, MapPin, Bed, Heart, MessageSquare, ArrowLeft, Star,
  ChevronLeft, ChevronRight, CalendarCheck, Clock, BedDouble, Lock, CheckCircle2, Maximize2
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { peso, vacancyState, toneClass } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  getListingById, getUserFavorites, toggleFavorite, sendInquiry,
  submitReview, getMyReview, createReservation, getActiveReservationForListing,
  cancelReservation, getConfirmedReservationForListing, getListingRoomReservations
} from "@/lib/server-fns";
import { ImageViewerModal } from "@/components/ImageViewerModal";

export const Route = createFileRoute("/listing/$id")({
  component: ListingDetail,
});

interface BH {
  id: string; owner_id: string | null; name: string; address: string; landmark: string | null;
  contact_number: string; description: string | null; monthly_fee: number; num_rooms: number;
  available_vacancies: number; amenities: string[]; cover_photo_url: string | null;
  latitude?: number | null; longitude?: number | null;
  avg_rating: number | null; review_count: number;
}

interface ReviewRow {
  id: string; rating: number; comment: string | null; created_at: string;
  customer_name: string; customer_id: string;
}

export interface RoomDeckItem {
  index: number;
  name: string;
  isOccupied: boolean;
  isReserved: boolean;
  status: string;
}

// ── Image Carousel / Slideshow ────────────────────────────────────────────────
function ImageCarousel({
  images,
  altText,
  current,
  onChange,
}: {
  images: string[];
  altText: string;
  current: number;
  onChange: (index: number) => void;
}) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const prev = useCallback(() => {
    onChange(current === 0 ? images.length - 1 : current - 1);
  }, [current, images.length, onChange]);

  const next = useCallback(() => {
    onChange(current === images.length - 1 ? 0 : current + 1);
  }, [current, images.length, onChange]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  if (images.length === 0) {
    return (
      <div className="relative aspect-[16/9] bg-muted rounded-2xl border border-border overflow-hidden">
        <div className="grid h-full w-full place-items-center text-muted-foreground">No photo</div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden rounded-3xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl shadow-lg">
      {/* Main image with arrows */}
      <div
        className="relative aspect-[16/9] bg-muted group select-none cursor-pointer"
        onClick={() => setIsViewerOpen(true)}
      >
        <img
          src={images[current % images.length]}
          alt={`${altText} - Photo ${current + 1}`}
          className="h-full w-full object-cover transition-all duration-300"
        />

        {/* Full screen View Icon Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md shadow-lg border border-white/20">
            <Maximize2 className="h-4 w-4 text-emerald-400" />
            Click to View Full Screen
          </span>
        </div>

        {/* Left arrow ‹ */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/85 hover:scale-110 z-20"
            aria-label="Previous room photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Right arrow › */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-black/85 hover:scale-110 z-20"
            aria-label="Next room photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}

        {/* Counter badge */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm z-20">
            {current + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3 scrollbar-thin">
          {images.map((url, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i)}
              className={`relative flex-shrink-0 overflow-hidden rounded-xl transition-all ${
                i === (current % images.length)
                  ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background scale-105"
                  : "opacity-60 hover:opacity-100"
              }`}
              aria-label={`View photo ${i + 1}`}
            >
              <img
                src={url}
                alt={`Thumbnail ${i + 1}`}
                className="h-16 w-24 object-cover sm:h-20 sm:w-28"
              />
            </button>
          ))}
        </div>
      )}

      {/* Full-Screen Image Viewer Modal */}
      <ImageViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        images={images}
        currentIndex={current % images.length}
        onIndexChange={onChange}
        title={altText}
      />
    </div>
  );
}

// ── Star picker component ─────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
          aria-label={`Rate ${i} star${i > 1 ? "s" : ""}`}
        >
          <Star
            className={`h-6 w-6 ${
              i <= (hover || value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 self-center text-sm font-medium text-amber-600">
          {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
        </span>
      )}
    </div>
  );
}

// ── Star display (read-only) ──────────────────────────────────────────────────
function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function ListingDetail() {
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [bh, setBh] = useState<BH | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [amenityPhotos, setAmenityPhotos] = useState<Record<string, string[]>>({});
  const [amenityViewerPhotos, setAmenityViewerPhotos] = useState<string[]>([]);
  const [amenityViewerIdx, setAmenityViewerIdx] = useState(0);
  const [amenityViewerOpen, setAmenityViewerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isFav, setIsFav] = useState(false);
  const [sending, setSending] = useState(false);

  // Selected room / photo index
  const [currentPhotoIdx, setCurrentPhotoIdx] = useState(0);
  const [reservedRoomNames, setReservedRoomNames] = useState<Set<string>>(new Set());

  // Review form state
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Reservation state
  const [activeReservation, setActiveReservation] = useState<{ id: string; roomDeck?: string | null; price?: number | null; expiresAt: string } | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [, setTick] = useState(0); // force re-render every second for countdown

  const load = async () => {
    const result = await getListingById({ data: { id } });
    if (!result) { toast.error("Listing not found"); navigate({ to: "/browse" }); return; }
    setBh(result.bh as BH);
    setPhotos(result.photos.filter(Boolean));
    setReviews(result.reviews as ReviewRow[]);
    if (result.amenityPhotos) {
      setAmenityPhotos(result.amenityPhotos as Record<string, string[]>);
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    getListingRoomReservations({ data: { boardingHouseId: id } })
      .then((res) => {
        const names = new Set<string>();
        for (const r of res) {
          if (r.roomDeck) names.add(r.roomDeck);
        }
        setReservedRoomNames(names);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!user) return;
    getUserFavorites({ data: { userId: user.id } }).then((ids) => setIsFav(ids.includes(id)));
    if (role === "customer") {
      getMyReview({ data: { boardingHouseId: id, customerId: user.id } }).then((r) => {
        if (r) { setMyRating(r.rating); setMyComment(r.comment ?? ""); }
      });
      getActiveReservationForListing({ data: { boardingHouseId: id, customerId: user.id } }).then(setActiveReservation);
      getConfirmedReservationForListing({ data: { boardingHouseId: id, customerId: user.id } }).then(setHasConfirmed);
    }
  }, [user, id, role]);

  // Countdown ticker
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const allPhotos = useMemo(() => {
    const arr = [bh?.cover_photo_url, ...photos].filter(Boolean) as string[];
    return Array.from(new Set(arr));
  }, [bh?.cover_photo_url, photos]);

  const [localVacancies, setLocalVacancies] = useState<number>(0);
  useEffect(() => {
    if (bh) setLocalVacancies(bh.available_vacancies);
  }, [bh?.available_vacancies]);

  const [selectedRoomIdx, setSelectedRoomIdx] = useState<number>(0);

  const rooms: RoomDeckItem[] = useMemo(() => {
    const numRooms = Math.max(bh?.num_rooms || 1, 1);
    const vacancies = Math.max(0, Math.min(numRooms, localVacancies ?? 0));

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
  }, [bh?.num_rooms, localVacancies, reservedRoomNames]);

  // Auto-select first available room if currently selected room is occupied
  useEffect(() => {
    if (rooms.length > 0 && rooms[selectedRoomIdx]?.isOccupied) {
      const firstAvail = rooms.findIndex((r) => !r.isOccupied);
      if (firstAvail >= 0) {
        setSelectedRoomIdx(firstAvail);
      }
    }
  }, [rooms, selectedRoomIdx]);

  const activeRoom = rooms[selectedRoomIdx] || rooms[0] || {
    index: 0,
    name: "Room 1",
    isOccupied: false,
    isReserved: false,
    status: "Available",
  };

  const doReserve = async () => {
    if (!user || role !== "customer") { toast.error("Sign in as customer to reserve"); return; }
    if (!bh || localVacancies <= 0) { toast.error("No vacancies available"); return; }
    if (activeRoom.isOccupied) { toast.error("This room is already occupied or reserved."); return; }

    setReserving(true);
    try {
      const res = await createReservation({
        data: {
          boardingHouseId: id,
          customerId: user.id,
          roomDeck: activeRoom.name,
          price: bh.monthly_fee,
        },
      });
      setActiveReservation(res);
      setReservedRoomNames((prev) => new Set([...prev, activeRoom.name]));
      setLocalVacancies((prev) => Math.max(0, prev - 1));
      const exp = new Date(res.expiresAt);
      toast.success(`Spot reserved! Held until ${exp.toLocaleString()}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setReserving(false);
    }
  };

  const doCancelReservation = async () => {
    if (!activeReservation) return;
    setCancelling(true);
    try {
      await cancelReservation({ data: { id: activeReservation.id } });
      if (activeReservation.roomDeck) {
        setReservedRoomNames((prev) => {
          const next = new Set(prev);
          next.delete(activeReservation.roomDeck!);
          return next;
        });
      }
      setLocalVacancies((prev) => Math.min(bh?.num_rooms ?? prev + 1, prev + 1));
      setActiveReservation(null);
      toast.success("Reservation cancelled");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCancelling(false);
    }
  };

  const getCountdown = (expiresAt: string) => {
    const diff = Math.max(0, new Date(expiresAt).getTime() - Date.now());
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (diff === 0) return "Expired";
    return `${h}h ${m}m ${s}s`;
  };

  const favToggle = async () => {
    if (!user || role !== "customer") { toast.error("Sign in as customer to save favorites"); return; }
    await toggleFavorite({ data: { userId: user.id, boardingHouseId: id, add: !isFav } });
    setIsFav(!isFav);
  };

  const doSendInquiry = async () => {
    if (!user) { toast.error("Sign in to send an inquiry"); return; }
    if (role !== "customer") { toast.error("Only customers can send inquiries"); return; }
    if (message.trim().length < 5) { toast.error("Message is too short"); return; }
    if (message.length > 1000) { toast.error("Message must be under 1000 characters"); return; }
    setSending(true);
    try {
      await sendInquiry({
        data: { customerId: user.id, boardingHouseId: id, message: message.trim(), ownerId: bh?.owner_id ?? null, bhName: bh?.name ?? "" },
      });
      toast.success("Inquiry sent!"); setMessage("");
    } catch (e) { toast.error((e as Error).message); }
    finally { setSending(false); }
  };

  const doSubmitReview = async () => {
    if (!user || role !== "customer") { toast.error("Sign in as customer to leave a review"); return; }
    if (myRating === 0) { toast.error("Please select a star rating"); return; }
    setSubmittingReview(true);
    try {
      await submitReview({ data: { boardingHouseId: id, customerId: user.id, rating: myRating, comment: myComment } });
      toast.success("Review submitted!");
      await load(); // refresh reviews and avg rating
    } catch (e) { toast.error((e as Error).message); }
    finally { setSubmittingReview(false); }
  };

  if (!bh) return <AppShell><div className="p-8 text-center text-muted-foreground">Loading…</div></AppShell>;
  const state = vacancyState(localVacancies, bh.num_rooms);
  const cover = bh.cover_photo_url;

  return (
    <AppShell>
      <button onClick={() => history.back()} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Photos - Slideshow Carousel */}
          <div className="relative">
            <ImageCarousel
              images={allPhotos}
              altText={bh.name}
              current={currentPhotoIdx}
              onChange={setCurrentPhotoIdx}
            />
            <span className={`absolute left-4 top-4 z-10 rounded-full border px-3 py-1 text-xs font-semibold ${toneClass[state.tone]}`}>{state.label}</span>
          </div>

          {/* Details */}
          <div className="glass-card rounded-3xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-foreground">{bh.name}</h1>

            {/* Rating summary */}
            {bh.avg_rating && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className={`h-4 w-4 ${i <= Math.round(bh.avg_rating!) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30"}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-amber-600">{bh.avg_rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({bh.review_count} review{bh.review_count !== 1 ? "s" : ""})</span>
              </div>
            )}

            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-emerald-600" /> {bh.address}
            </div>
            {bh.landmark && <div className="text-xs text-muted-foreground">Landmark: {bh.landmark}</div>}
            {bh.description && <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{bh.description}</p>}

            <div className="mt-6">
              <div className="mb-3 text-sm font-semibold">Amenities</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {bh.amenities.map((a) => {
                  const aphotos = amenityPhotos[a] ?? [];
                  return (
                    <div
                      key={a}
                      className="rounded-xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md shadow-xs overflow-hidden"
                    >
                      {/* Amenity label */}
                      <div className="px-3 py-2 text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                        {a}
                      </div>
                      {/* Photos strip */}
                      {aphotos.length > 0 ? (
                        <div className="flex gap-1.5 px-2 pb-2 overflow-x-auto">
                          {aphotos.map((url, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setAmenityViewerPhotos(aphotos);
                                setAmenityViewerIdx(idx);
                                setAmenityViewerOpen(true);
                              }}
                              className="flex-shrink-0 h-16 w-20 rounded-lg overflow-hidden border border-border/50 hover:ring-2 hover:ring-primary/60 transition-all"
                            >
                              <img
                                src={url}
                                alt={`${a} photo ${idx + 1}`}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                onError={(e) => {
                                  // Fallback: hide broken image container if file missing
                                  (e.currentTarget as HTMLImageElement).parentElement?.classList.add("hidden");
                                }}
                              />
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="px-3 pb-2 text-[10px] text-muted-foreground italic">No photos uploaded</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Amenity photo lightbox */}
            {amenityViewerOpen && amenityViewerPhotos.length > 0 && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
                onClick={() => setAmenityViewerOpen(false)}
              >
                <div className="relative max-w-3xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={amenityViewerPhotos[amenityViewerIdx]}
                    alt="Amenity"
                    className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                  />
                  {amenityViewerPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setAmenityViewerIdx((i) => (i === 0 ? amenityViewerPhotos.length - 1 : i - 1))}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAmenityViewerIdx((i) => (i === amenityViewerPhotos.length - 1 ? 0 : i + 1))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 transition"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  <div className="mt-2 text-center text-white/70 text-xs">{amenityViewerIdx + 1} / {amenityViewerPhotos.length} — click outside to close</div>
                </div>
              </div>
            )}
          </div>

          {/* ── Location Map ── */}
          {(() => {
            const hasGps = typeof bh.latitude === "number" && typeof bh.longitude === "number" && !isNaN(bh.latitude) && !isNaN(bh.longitude);
            
            // Clean prepositional prefixes (e.g. "beside San Miguel ES" -> "San Miguel ES")
            const cleanedLandmark = bh.landmark?.trim()
              ? bh.landmark.trim().replace(/^(beside|near|behind|in front of|across|next to|along)\s+/i, "")
              : null;

            const mapSearchParts = [
              cleanedLandmark,
              bh.address,
              !bh.address.toLowerCase().includes("dimataling") ? "Dimataling" : "",
              !bh.address.toLowerCase().includes("zamboanga del sur") ? "Zamboanga del Sur" : "",
              !bh.address.toLowerCase().includes("philippines") ? "Philippines" : "",
            ].filter(Boolean);

            const mapSearchQuery = mapSearchParts.join(", ");

            const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapSearchQuery)}&output=embed&z=16`;

            const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapSearchQuery)}`;

            return (
              <div className="glass-card rounded-3xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl overflow-hidden shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-b border-white/50 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <h2 className="text-base font-semibold">Location</h2>
                    {hasGps && (
                      <span className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-medium">
                        GPS Verified
                      </span>
                    )}
                  </div>
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                  >
                    Open in Google Maps ↗
                  </a>
                </div>
                <iframe
                  title="Boarding House Location"
                  width="100%"
                  height="340"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={mapSrc}
                />
              </div>
            );
          })()}

          {/* ── Reviews section ── */}
          {/* ── Reviews section ── */}
          <div className="glass-card rounded-3xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl p-6 sm:p-8 space-y-5 shadow-sm">
            <h2 className="text-lg font-bold">
              Reviews
              {bh.review_count > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({bh.review_count})</span>}
            </h2>

            {/* Leave / edit review (customers only) */}
            {role === "customer" && (
              <div className="rounded-2xl border border-white/50 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md p-4 space-y-3">
                {hasConfirmed ? (
                  <>
                    <div className="text-sm font-medium">{myRating ? "Your review" : "Leave a review"}</div>
                    <StarPicker value={myRating} onChange={setMyRating} />
                    <Textarea
                      value={myComment}
                      onChange={(e) => setMyComment(e.target.value)}
                      placeholder="Share your experience (optional)"
                      rows={3}
                      maxLength={500}
                      className="rounded-xl border-white/40 dark:border-white/10 bg-white/60 dark:bg-slate-900/60"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{myComment.length}/500</span>
                      <Button size="sm" onClick={doSubmitReview} disabled={submittingReview || myRating === 0} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                        {submittingReview ? "Saving…" : myRating ? "Update review" : "Submit review"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-2">
                    You must have a confirmed reservation to leave a review.
                  </div>
                )}
              </div>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/50 dark:border-white/10 p-8 text-center text-sm text-muted-foreground">
                No reviews yet. Be the first to review this boarding house!
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-white/40 dark:border-white/10 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          {r.customer_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{r.customer_name}</div>
                          <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <StarDisplay rating={r.rating} />
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-5">
          <div className="glass-card rounded-3xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl p-6 shadow-sm">
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {peso(bh.monthly_fee)}
              <span className="text-xs font-normal text-muted-foreground">/month</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Bed className="h-4 w-4 text-emerald-600" />
              <span className="font-medium text-foreground">{localVacancies} of {bh.num_rooms}</span> rooms vacant
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 text-emerald-600" /> <a href={`tel:${bh.contact_number}`} className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">{bh.contact_number}</a>
            </div>
            {bh.avg_rating && (
              <div className="mt-3 flex items-center gap-1.5 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-amber-600">{bh.avg_rating.toFixed(1)}</span>
                <span className="text-muted-foreground">/ 5 · {bh.review_count} review{bh.review_count !== 1 ? "s" : ""}</span>
              </div>
            )}
            <Button
              variant="outline"
              className="mt-5 w-full rounded-xl border-white/60 dark:border-white/15 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md hover:bg-white/80"
              onClick={favToggle}
            >
              <Heart className={`mr-2 h-4 w-4 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} /> {isFav ? "Saved to Favorites" : "Save to Favorites"}
            </Button>
          </div>

          {/* ── Selected Room & Reservation ── */}
          {role === "customer" && (
            <div className="glass-card rounded-3xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl p-6 shadow-sm">
              <div className="mb-3 flex items-center justify-between font-bold text-sm">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-emerald-600" /> Reservation
                </div>
              </div>

              {activeReservation ? (
                <div className="space-y-3">
                  <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-3.5 backdrop-blur-md">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Your Active Reservation</div>
                    <div className="mt-1 flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      <Clock className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                      <span className="font-mono">{getCountdown(activeReservation.expiresAt)}</span> remaining
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Expires {new Date(activeReservation.expiresAt).toLocaleString()}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-rose-600 hover:text-rose-700 border-rose-200 dark:border-rose-900/30" onClick={doCancelReservation} disabled={cancelling}>
                    {cancelling ? "Cancelling…" : "Cancel Reservation"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">Reserve a spot for <span className="font-semibold text-foreground">48 hours</span>. No advance payment required.</p>
                  <Button
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-md shadow-emerald-600/20 border border-white/20 transition-all hover:scale-[1.01]"
                    onClick={doReserve}
                    disabled={reserving || localVacancies <= 0 || activeRoom.isOccupied}
                  >
                    <CalendarCheck className="mr-2 h-4 w-4" />
                    {reserving
                      ? "Reserving…"
                      : localVacancies <= 0
                      ? "No Vacancies"
                      : activeRoom.isOccupied
                      ? "Occupied"
                      : "Reserve"}
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="glass-card rounded-3xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2 font-bold text-sm"><MessageSquare className="h-4 w-4 text-emerald-600" /> Send an inquiry</div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              placeholder="Hi! Is the room still available?"
              rows={4}
              className="rounded-xl border-white/50 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
            />
            <div className="mt-1 text-right text-[11px] text-muted-foreground">{message.length}/1000</div>
            <Button
              onClick={doSendInquiry}
              disabled={sending}
              className="mt-3 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
            >
              {sending ? "Sending…" : "Send Inquiry"}
            </Button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
