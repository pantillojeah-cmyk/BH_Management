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
      <button onClick={() => history.back()} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarCheck className="h-6 w-6 text-emerald-600" /> My Reservations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Your spot holds — each valid for 48 hours from the time of reservation.</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <CalendarCheck className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">You have no reservations yet.</p>
          <Link to="/browse">
            <Button className="mt-4" variant="outline"><Home className="mr-2 h-4 w-4" /> Browse Listings</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => {
            const isActive = r.status === "pending" && new Date(r.expiresAt) > new Date();
            const effectiveStatus = !isActive && r.status === "pending" ? "expired" : r.status;
            const cfg = statusConfig[effectiveStatus] ?? statusConfig.expired;
            return (
              <div key={r.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex gap-4 p-4">
                  {/* Cover thumbnail */}
                  {r.boardingHouseCover ? (
                    <img src={r.boardingHouseCover} alt={r.boardingHouseName} className="h-20 w-28 flex-shrink-0 rounded-lg object-cover border border-border" />
                  ) : (
                    <div className="h-20 w-28 flex-shrink-0 rounded-lg bg-muted border border-border grid place-items-center text-muted-foreground">
                      <Home className="h-6 w-6" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <Link to="/listing/$id" params={{ id: r.boardingHouseId }} className="font-semibold hover:underline text-foreground">
                          {r.boardingHouseName}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-0.5">{r.boardingHouseAddress}</div>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>{cfg.label}</span>
                    </div>

                    {r.roomDeck && (
                      <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        <BedDouble className="h-3.5 w-3.5" />
                        <span>{r.roomDeck}</span>
                        {r.price && <span>· {peso(r.price)}/mo</span>}
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Reserved {new Date(r.createdAt).toLocaleDateString()} · Expires {new Date(r.expiresAt).toLocaleString()}
                    </div>

                    {isActive && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="font-mono">{getCountdown(r.expiresAt)}</span>
                        <span className="font-normal text-xs text-muted-foreground">remaining</span>
                      </div>
                    )}
                  </div>
                </div>

                {isActive && (
                  <div className="border-t border-border px-4 py-2 bg-muted/30 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Your spot is held. Contact the owner to confirm your move-in.</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive flex-shrink-0"
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
      )}
    </AppShell>
  );
}
