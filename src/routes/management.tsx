import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2, Users, UserCheck, Home, CheckCircle2, XCircle, Search,
  MoreVertical, Edit2, Trash2, Shield, UserCog, Check
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton } from "@/components/ui/export-button";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { peso } from "@/lib/format";
import {
  getAdminStats, getAdminListings, setListingStatus, adminDeleteListing,
  getAdminUsers, getVacancyReport,
  adminUpdateUserRole, adminDeleteUser, adminUpdateUserProfile,
  getPendingOwners, approveOwner, rejectOwner,
} from "@/lib/server-fns";

export const Route = createFileRoute("/management")({
  head: () => ({ meta: [{ title: "Admin Dashboard" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/management/login" });
    else if (role && role !== "admin") navigate({ to: "/" });
  }, [user, role, loading, navigate]);

  if (!user || role !== "admin") return null;
  return (
    <AppShell>
      <div className="flex items-center gap-3.5 mb-6">
        <img
          src="/logo.png"
          alt="ZDSPGC BH Tracker Logo"
          className="h-12 w-12 rounded-full object-cover border-2 border-primary/30 shadow-md"
        />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">ZDSPGC Dimataling Campus · System overview & management</p>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <Tabs defaultValue="overview" className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <TabsList className="h-11 rounded-2xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md px-1 shadow-sm gap-1 flex-wrap">
              <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 font-medium transition-all">📊 Overview</TabsTrigger>
              <TabsTrigger value="listings" className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 font-medium transition-all">🏠 Listings</TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 font-medium transition-all">👥 Users</TabsTrigger>
              <TabsTrigger value="report" className="rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 font-medium transition-all">📋 Vacancy Report</TabsTrigger>
              <TabsTrigger value="pendingowners" className="rounded-xl data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 font-medium transition-all">🔑 Pending Owners</TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <PrintButton />
              <ExportButton fetchUrl="/api/management/export-listings" fileName="listings.csv" />
            </div>
          </div>
          <TabsContent value="overview"><Overview /></TabsContent>
          <TabsContent value="listings"><Listings /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="report"><VacancyReport /></TabsContent>
          <TabsContent value="pendingowners"><PendingOwnersTab /></TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}

function Overview() {
  const [stats, setStats] = useState({ houses: 0, owners: 0, customers: 0, vacancies: 0, pending: 0, pendingOwners: 0 });
  useEffect(() => {
    getAdminStats().then((data) => setStats(data));
  }, []);

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Boarding Houses */}
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/60 dark:to-indigo-900/40 p-5 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Boarding Houses</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-200">{stats.houses}</div>
          <div className="mt-1 text-xs text-indigo-500 dark:text-indigo-400">Total registered</div>
        </div>

        {/* Owners */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/40 p-5 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Owners</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-200">{stats.owners}</div>
          <div className="mt-1 text-xs text-emerald-500 dark:text-emerald-400">Verified property owners</div>
        </div>

        {/* Customers */}
        <div className="rounded-2xl border border-blue-200 dark:border-blue-500/30 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/60 dark:to-blue-900/40 p-5 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-300">Customers</span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-700 dark:text-blue-200">{stats.customers}</div>
          <div className="mt-1 text-xs text-blue-500 dark:text-blue-400">Students & staff</div>
        </div>

        {/* Vacancies */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/40 p-5 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">Available Slots</span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Home className="h-4 w-4 text-amber-600 dark:text-amber-300" />
            </div>
          </div>
          <div className="text-3xl font-bold text-amber-700 dark:text-amber-200">{stats.vacancies}</div>
          <div className="mt-1 text-xs text-amber-500 dark:text-amber-400">Open for tenants</div>
        </div>
      </div>

      {/* Pending listings banner */}
      {stats.pending > 0 ? (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-gradient-to-r from-rose-50 to-orange-50 dark:from-rose-950/40 dark:to-orange-950/30 p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-2xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">⏳</span>
          </div>
          <div>
            <div className="font-bold text-rose-700 dark:text-rose-300 text-base">{stats.pending} listing{stats.pending === 1 ? "" : "s"} awaiting approval</div>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">Go to the <strong>Listings</strong> tab to review and approve or reject submissions.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">✅</span>
          </div>
          <div>
            <div className="font-bold text-emerald-700 dark:text-emerald-300">All listings reviewed</div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">No listings are currently pending approval.</p>
          </div>
        </div>
      )}

      {/* Pending owners banner */}
      {stats.pendingOwners > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/30 p-5 flex items-center gap-4">
          <div className="h-11 w-11 rounded-2xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">🔑</span>
          </div>
          <div>
            <div className="font-bold text-amber-700 dark:text-amber-300 text-base">{stats.pendingOwners} owner account{stats.pendingOwners === 1 ? "" : "s"} awaiting approval</div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">Go to the <strong>Pending Owners</strong> tab to approve or reject new owner registrations.</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface AdminBH {
  id: string; name: string; address: string; monthly_fee: number;
  available_vacancies: number; num_rooms: number; status: "pending" | "approved" | "rejected"; owner_id: string | null;
  created_at: string;
  cover_photo_url: string | null;
  photos: string[];
}

function Listings() {
  const [rows, setRows] = useState<AdminBH[]>([]);
  const reload = async () => {
    const data = await getAdminListings({ data: { filter: "all" } });
    setRows(data as AdminBH[]);
  };
  useEffect(() => { reload(); }, []);
  const doSetStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      await setListingStatus({ data: { id, status } });
      toast.success(`Listing ${status}`);
      reload();
    } catch (e) { toast.error((e as Error).message); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this listing?")) return;
    try {
      await adminDeleteListing({ data: { id } });
      toast.success("Deleted");
      reload();
    } catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="mt-4 space-y-3">
      {rows.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-700/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-14 text-center">
          <div className="text-4xl mb-3">🏠</div>
          <div className="font-semibold text-foreground">No listings yet</div>
          <div className="text-sm text-muted-foreground mt-1">Submitted boarding house listings will appear here.</div>
        </div>
      ) : (
        rows.map((r) => {
          const allPhotos = [r.cover_photo_url, ...r.photos].filter(Boolean) as string[];
          const statusStyle = r.status === "approved"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
            : r.status === "pending"
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
            : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-700";
          return (
            <div key={r.id} className="rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {/* Photo strip */}
              {allPhotos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto bg-muted/30 p-3 border-b border-border/40">
                  {allPhotos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`${r.name} photo ${i + 1}`}
                      className={`h-20 w-28 flex-shrink-0 rounded-xl object-cover border border-border/60 shadow-sm ${
                        i === 0 ? "ring-2 ring-indigo-400/50" : ""
                      }`}
                    />
                  ))}
                </div>
              )}
              {/* Info row */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-[200px]">
                  <div className="font-bold text-base text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.address}</div>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-700 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                      ₱{peso(r.monthly_fee).replace('₱','')}/mo
                    </span>
                    <span className="text-muted-foreground">{r.available_vacancies}/{r.num_rooms} slots open</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusStyle}`}>{r.status}</span>
                  <Button size="sm" onClick={() => doSetStatus(r.id, "approved")}
                    disabled={r.status === "approved"}
                    className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => doSetStatus(r.id, "rejected")}
                    disabled={r.status === "rejected"}
                    className="gap-1.5 rounded-xl border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed">
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(r.id)}
                    className="gap-1.5 rounded-xl border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  phone?: string | null;
  role: string;
}

const ROLE_FILTERS = ["all", "customer", "owner", "admin"] as const;
type RoleFilter = typeof ROLE_FILTERS[number];

function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [loading, setLoading] = useState(false);

  // Edit dialog state
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "customer" as "customer" | "owner" | "admin",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const reloadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers();
      setUsers(data as UserRow[]);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadUsers();
  }, []);

  const openEditDialog = (u: UserRow) => {
    setEditingUser(u);
    setEditForm({
      fullName: u.full_name === "—" ? "" : u.full_name,
      email: u.email ?? "",
      phone: u.phone ?? "",
      role: (u.role === "admin" || u.role === "owner" || u.role === "customer") ? u.role : "customer",
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editForm.fullName.trim()) {
      toast.error("Name is required");
      return;
    }
    setIsSaving(true);
    try {
      await adminUpdateUserProfile({
        data: {
          userId: editingUser.id,
          fullName: editForm.fullName.trim(),
          email: editForm.email.trim() || undefined,
          phone: editForm.phone.trim() || undefined,
          role: editForm.role,
        },
      });
      toast.success("User updated successfully");
      setEditingUser(null);
      reloadUsers();
    } catch (err) {
      toast.error((err as Error).message || "Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickRoleChange = async (userId: string, newRole: "customer" | "owner" | "admin") => {
    if (userId === currentUser?.id && newRole !== "admin") {
      if (!confirm("Warning: Changing your own role will remove your admin access. Are you sure?")) {
        return;
      }
    }
    try {
      await adminUpdateUserRole({ data: { userId, role: newRole } });
      toast.success(`Role updated to ${newRole.toUpperCase()}`);
      reloadUsers();
    } catch (err) {
      toast.error((err as Error).message || "Failed to change user role");
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    if (deletingUser.id === currentUser?.id) {
      toast.error("You cannot delete your own admin account.");
      return;
    }
    setIsDeleting(true);
    try {
      await adminDeleteUser({ data: { userId: deletingUser.id } });
      toast.success("User deleted successfully");
      setDeletingUser(null);
      reloadUsers();
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.full_name.toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="mt-4 space-y-4">
      {/* Search + filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-800/50 backdrop-blur-md p-4 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-background/80 backdrop-blur-sm py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-purple-400/40 dark:focus:ring-purple-600/40 transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold capitalize transition-all border ${
                roleFilter === r
                  ? r === "all" ? "bg-slate-700 text-white border-slate-600 shadow-sm"
                    : r === "admin" ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                    : r === "owner" ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                    : "bg-blue-600 text-white border-blue-500 shadow-sm"
                  : "bg-muted/60 text-muted-foreground border-border/50 hover:bg-accent hover:text-foreground"
              }`}
            >
              {r === "admin" ? "🛡 Admin" : r === "owner" ? "🏠 Owner" : r === "customer" ? "👤 Customer" : "All"}
            </button>
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap bg-muted/50 rounded-lg px-2.5 py-1.5 border border-border/40">
          {filtered.length} / {users.length} users
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border/50 text-left text-xs uppercase text-muted-foreground bg-muted/30">
            <tr>
              <th className="px-5 py-3.5 font-bold tracking-wider">Name</th>
              <th className="px-5 py-3.5 font-bold tracking-wider">Email</th>
              <th className="px-5 py-3.5 font-bold tracking-wider">Role</th>
              <th className="px-5 py-3.5 text-right font-bold tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <div className="font-medium text-foreground">{users.length === 0 ? "No users yet" : "No users match your search"}</div>
                  <div className="text-xs text-muted-foreground mt-1">{users.length > 0 ? "Try a different search term or filter" : "Users will appear here once they sign up"}</div>
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const roleBadgeClass =
                  u.role === "admin"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
                    : u.role === "owner"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700";

                return (
                  <tr key={u.id} className="border-t border-border/40 hover:bg-muted/30 dark:hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(u.full_name || "?")[0].toUpperCase()}
                        </div>
                        <span className="font-semibold text-foreground">{u.full_name}</span>
                        {isCurrent && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                            You
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-sm">{u.email ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${roleBadgeClass}`}>
                        {u.role === "admin" ? "🛡 Admin" : u.role === "owner" ? "🏠 Owner" : "👤 Customer"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs font-medium rounded-xl border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          onClick={() => openEditDialog(u)}
                        >
                          <Edit2 className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl border-slate-200 dark:border-slate-700" title="More Actions">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(u)}>
                              <Edit2 className="mr-2 h-4 w-4 text-muted-foreground" />
                              Edit Profile & Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Change Role
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              disabled={u.role === "customer"}
                              onClick={() => handleQuickRoleChange(u.id, "customer")}
                            >
                              <Users className="mr-2 h-4 w-4 text-blue-500" />
                              Set as Customer
                              {u.role === "customer" && <Check className="ml-auto h-3.5 w-3.5" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={u.role === "owner"}
                              onClick={() => handleQuickRoleChange(u.id, "owner")}
                            >
                              <UserCheck className="mr-2 h-4 w-4 text-emerald-500" />
                              Set as Owner
                              {u.role === "owner" && <Check className="ml-auto h-3.5 w-3.5" />}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={u.role === "admin"}
                              onClick={() => handleQuickRoleChange(u.id, "admin")}
                            >
                              <Shield className="mr-2 h-4 w-4 text-purple-500" />
                              Set as Admin
                              {u.role === "admin" && <Check className="ml-auto h-3.5 w-3.5" />}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                              disabled={isCurrent}
                              onClick={() => setDeletingUser(u)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                Edit User
              </DialogTitle>
              <DialogDescription>
                Update user information and assign system roles.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">Phone Number (Optional)</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="09123456789"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(val: "customer" | "owner" | "admin") =>
                    setEditForm({ ...editForm, role: val })
                  }
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer (Search & Bookings)</SelectItem>
                    <SelectItem value="owner">Owner (Listings Management)</SelectItem>
                    <SelectItem value="admin">Admin (Full System Access)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user <strong className="text-foreground">{deletingUser?.full_name}</strong>? This action will permanently remove their profile, roles, and related records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeletingUser(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



function VacancyReport() {
  const [rows, setRows] = useState<{ name: string; available_vacancies: number; num_rooms: number; monthly_fee: number }[]>([]);
  useEffect(() => {
    getVacancyReport().then((data) => setRows(data));
  }, []);
  const totalVac = rows.reduce((s, r) => s + r.available_vacancies, 0);
  const totalRooms = rows.reduce((s, r) => s + r.num_rooms, 0);
  const occupancyPct = totalRooms ? Math.round(((totalRooms - totalVac) / totalRooms) * 100) : 0;

  return (
    <div className="mt-4 space-y-5">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/60 dark:to-indigo-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Total Rooms</span>
            <span className="text-xl">🛏</span>
          </div>
          <div className="text-3xl font-bold text-indigo-700 dark:text-indigo-200">{totalRooms}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-300">Available Slots</span>
            <span className="text-xl">🔓</span>
          </div>
          <div className="text-3xl font-bold text-amber-700 dark:text-amber-200">{totalVac}</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/40 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Occupancy Rate</span>
            <span className="text-xl">📈</span>
          </div>
          <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-200">{occupancyPct}%</div>
          {/* Occupancy progress bar */}
          <div className="mt-2 h-2 rounded-full bg-emerald-200/60 dark:bg-emerald-900/40 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${occupancyPct}%` }} />
          </div>
        </div>
      </div>

      {/* Report table */}
      <div className="overflow-hidden rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border/50 text-left text-xs uppercase text-muted-foreground bg-muted/30">
            <tr>
              <th className="px-5 py-3.5 font-bold tracking-wider">Boarding House</th>
              <th className="px-5 py-3.5 font-bold tracking-wider">Monthly Fee</th>
              <th className="px-5 py-3.5 font-bold tracking-wider">Rooms</th>
              <th className="px-5 py-3.5 font-bold tracking-wider">Vacancies</th>
              <th className="px-5 py-3.5 font-bold tracking-wider">Occupancy</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No listings data available.</td></tr>
            ) : rows.map((r, i) => {
              const occ = r.num_rooms ? Math.round(((r.num_rooms - r.available_vacancies) / r.num_rooms) * 100) : 0;
              return (
                <tr key={i} className="border-t border-border/40 hover:bg-muted/20 dark:hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-foreground">{r.name}</td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-700 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      {peso(r.monthly_fee)}/mo
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-foreground">{r.num_rooms}</td>
                  <td className="px-5 py-3.5">
                    <span className={`font-bold ${r.available_vacancies > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                      {r.available_vacancies}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[80px] h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all" style={{ width: `${occ}%` }} />
                      </div>
                      <span className="text-xs font-bold text-foreground">{occ}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} // End of file

// ─── Pending Owners Tab ───────────────────────────────────────────────────────
interface PendingOwnerRow {
  roleId: string;
  userId: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

function PendingOwnersTab() {
  const [rows, setRows] = useState<PendingOwnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await getPendingOwners();
      setRows(data as PendingOwnerRow[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const doApprove = async (row: PendingOwnerRow) => {
    setBusy(row.roleId);
    try {
      await approveOwner({ data: { roleId: row.roleId } });
      toast.success(`${row.full_name} has been approved as an owner.`);
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const doReject = async (row: PendingOwnerRow) => {
    if (!confirm(`Reject ${row.full_name}'s owner application? Their account will remain but without the owner role.`)) return;
    setBusy(row.roleId);
    try {
      await rejectOwner({ data: { roleId: row.roleId, userId: row.userId } });
      toast.success(`${row.full_name}'s application rejected.`);
      reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="mt-4 flex items-center justify-center py-16 text-muted-foreground">
        <span className="mr-2 text-lg animate-spin">⏳</span> Loading pending applications…
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20 p-14 text-center">
        <div className="text-4xl mb-3">🔑</div>
        <div className="font-semibold text-foreground">No pending owner applications</div>
        <div className="text-sm text-muted-foreground mt-1">All owner accounts have been reviewed.</div>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="text-sm text-muted-foreground mb-2">
        {rows.length} owner application{rows.length === 1 ? "" : "s"} awaiting your review
      </div>
      {rows.map((row) => {
        const isBusy = busy === row.roleId;
        return (
          <div
            key={row.roleId}
            className="rounded-2xl border border-amber-200/70 dark:border-amber-700/40 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1.5">
                {/* Avatar placeholder + name */}
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-300 dark:border-amber-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-base font-bold text-amber-700 dark:text-amber-300">
                      {row.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-base text-foreground">{row.full_name}</div>
                    <div className="text-xs text-muted-foreground">{row.email ?? "No email"}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1 ml-[52px]">
                  {row.phone && (
                    <span>📞 {row.phone}</span>
                  )}
                  <span>📅 Applied {new Date(row.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  disabled={isBusy}
                  onClick={() => doApprove(row)}
                  className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isBusy ? "Processing…" : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => doReject(row)}
                  className="gap-1.5 rounded-xl border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
