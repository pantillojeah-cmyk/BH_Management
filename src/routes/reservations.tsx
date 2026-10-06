import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarCheck, Clock, ArrowLeft, Home, BedDouble } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { peso } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { getCustomerReservations, cancelReservation } from "@/lib/server-fns";

export const Route = createFileRoute("/reservations")({
  head: () => ({ meta: [{ title: "My Reservations" }] }),
  component: ReservationsPage,
});

interface ReservationRow {
  id: string;
  boardingHouseId: string;
  boardingHouseName: string;
  boardingHouseAddress: string;
  boardingHouseCover: string | null;
  roomDeck?: string | null;
  price?: number | null;
  status: string;
  expiresAt: string;
  createdAt: string;
}

function ReservationsPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/customer/login" }); return; }
    if (role && role !== "customer") { navigate({ to: "/" }); return; }
  }, [user, role, loading, navigate]);

  const reload = async () => {
    if (!user) return;
    const data = await getCustomerReservations({ data: { customerId: user.id } });
    setRows(data as ReservationRow[]);
  };

  useEffect(() => { if (user) reload(); }, [user]);

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

  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: "Active", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
    expired: { label: "Expired", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  };

  if (!user || role !== "customer") return null;

  return (
    <AppShell>
      <button onClick={() => history.back()} className="mb-4 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-md border border-transparent hover:border-white/40 dark:hover:border-white/10 transition-all">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 shadow-sm backdrop-blur-md">
            <CalendarCheck className="h-5 w-5" />
          </div>
          My Reservations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Your spot holds — each valid for 48 hours from the time of reservation.</p>
      </div>

      {rows.length === 0 ? (
        <div className="glass-card rounded-3xl border border-dashed border-white/60 dark:border-white/10 p-12 text-center backdrop-blur-xl">
          <CalendarCheck className="mx-auto h-12 w-12 text-emerald-600/40 mb-3" />
          <p className="text-base font-semibold text-foreground">You have no reservations yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Browse boarding houses and reserve a room in advance.</p>
          <Link to="/browse">
            <Button className="mt-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white shadow-md shadow-emerald-600/20 border border-white/20">
              <Home className="mr-2 h-4 w-4" /> Browse Listings
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const isActive = r.status === "pending" && new Date(r.expiresAt) > new Date();
            const effectiveStatus = !isActive && r.status === "pending" ? "expired" : r.status;
            const cfg = statusConfig[effectiveStatus] ?? statusConfig.expired;
            return (
              <div key={r.id} className="glass-card rounded-2xl border border-white/60 dark:border-white/10 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                <div className="flex gap-4 p-4 sm:p-5">
                  {/* Cover thumbnail */}
                  {r.boardingHouseCover ? (
                    <img src={r.boardingHouseCover} alt={r.boardingHouseName} className="h-24 w-32 flex-shrink-0 rounded-xl object-cover border border-white/40 dark:border-white/10 shadow-sm" />
                  ) : (
                    <div className="h-24 w-32 flex-shrink-0 rounded-xl bg-muted/60 border border-white/40 dark:border-white/10 grid place-items-center text-muted-foreground backdrop-blur-sm">
                      <Home className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <Link to="/listing/$id" params={{ id: r.boardingHouseId }} className="font-bold text-base hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-foreground">
                          {r.boardingHouseName}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.boardingHouseAddress}</div>
                      </div>
                      <span className={`rounded-full px-3 py-0.5 text-xs font-semibold border border-white/40 dark:border-white/10 backdrop-blur-md shadow-xs ${cfg.className}`}>{cfg.label}</span>
                    </div>

                    {r.roomDeck && (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 backdrop-blur-sm">
                        <BedDouble className="h-3.5 w-3.5" />
                        <span>{r.roomDeck}</span>
                        {r.price && <span>· {peso(r.price)}/mo</span>}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Reserved {new Date(r.createdAt).toLocaleDateString()} · Expires {new Date(r.expiresAt).toLocaleString()}
                    </div>

                    {isActive && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-sm font-bold text-emerald-800 dark:text-emerald-300 backdrop-blur-md shadow-xs">
                        <Clock className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                        <span className="font-mono tracking-tight">{getCountdown(r.expiresAt)}</span>
                        <span className="font-normal text-xs text-emerald-700/80 dark:text-emerald-300/80">remaining</span>
                      </div>
                    )}
                  </div>
                </div>

                {isActive && (
                  <div className="border-t border-white/50 dark:border-white/10 px-4 py-3 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Your spot is held. Contact the owner to confirm your move-in.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-rose-200 dark:border-rose-900/40 bg-white/60 dark:bg-slate-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex-shrink-0 text-xs shadow-xs"
                      onClick={() => doCancel(r.id)}
                    >
                      Cancel Reservation
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
