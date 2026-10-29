import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Building2, Users, UserCheck, Home, CheckCircle2, XCircle, Search,
  MoreVertical, Edit2, Trash2, Shield, UserCog, Check, RotateCcw, CheckSquare,
  ExternalLink, FileText,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { PrintButton } from "@/components/ui/print-button";
import { ExportPdfButton } from "@/components/ui/export-pdf-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  adminUpdateUserRole, adminDeleteUser, adminDeleteUsers, adminUpdateUserProfile,
  getPendingOwners, approveOwner, rejectOwner,
  getRejectedOwners, reapproveRejectedOwner, deleteRejectedOwner,
} from "@/lib/server-fns";

export const Route = createFileRoute("/management")({
  head: () => ({ meta: [{ title: "Admin Dashboard" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  const refreshCounts = async () => {
    try {
      const [pending, rejected] = await Promise.all([
        getPendingOwners(),
        getRejectedOwners(),
      ]);
      setPendingCount(pending.length);
      setRejectedCount(rejected.length);
    } catch { }
  };

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/management/login" });
    else if (role && role !== "admin") navigate({ to: "/" });
    else refreshCounts();
  }, [user, role, loading, navigate]);

  if (!user || role !== "admin") return null;
  return (
    <AppShell>
      <div className="flex flex-wrap items-center gap-3.5 mb-6">
        <img
          src="/logo.png?v=2026"
          alt="ZDSPGC BH Tracker Logo"
          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border-2 border-primary/30 shadow-md shrink-0"
        />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">ZDSPGC-Dimataling Campus · System overview & management</p>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <Tabs defaultValue="overview" className="flex-1 w-full">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <TabsList className="h-auto min-h-11 flex-wrap sm:flex-nowrap w-full sm:w-auto rounded-2xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md p-1 shadow-sm gap-1 overflow-x-auto">
              <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap">📊 Overview</TabsTrigger>
              <TabsTrigger value="listings" className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap">🏠 Listings</TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap">👥 Users</TabsTrigger>
              <TabsTrigger value="report" className="rounded-xl data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap">📋 Vacancy Report</TabsTrigger>
              <TabsTrigger value="pendingowners" className="rounded-xl data-[state=active]:bg-rose-600 data-[state=active]:text-white data-[state=active]:shadow-md px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 whitespace-nowrap">
                🔑 Owner Approvals
                {pendingCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-amber-500 rounded-full border border-white/40" title={`${pendingCount} pending approval`}>
                    {pendingCount}
                  </span>
                )}
                {rejectedCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-rose-800 rounded-full border border-white/40" title={`${rejectedCount} rejected`}>
                    {rejectedCount} rej
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <PrintButton />
              <ExportPdfButton />
            </div>
          </div>
          <TabsContent value="overview"><Overview /></TabsContent>
          <TabsContent value="listings"><Listings /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="report"><VacancyReport /></TabsContent>
          <TabsContent value="pendingowners"><PendingOwnersTab onActionDone={refreshCounts} /></TabsContent>
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
          <div className="mt-1 text-xs text-blue-500 dark:text-blue-400">Students</div>
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
  available_vacancies: number; num_rooms: number;
  room_capacity?: number; price_type?: string;
  status: "pending" | "approved" | "rejected"; owner_id: string | null;
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
                      className={`h-20 w-28 flex-shrink-0 rounded-xl object-cover border border-border/60 shadow-sm ${i === 0 ? "ring-2 ring-indigo-400/50" : ""
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
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-200 dark:border-emerald-700 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                      ₱{peso(r.monthly_fee).replace('₱', '')}{r.price_type === "per_room" ? "/room" : "/person"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 border border-indigo-200 dark:border-indigo-700 px-2 py-0.5 font-semibold text-indigo-700 dark:text-indigo-300">
                      Good for {r.room_capacity ?? 1} {(r.room_capacity ?? 1) === 1 ? "person" : "persons"}
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
  is_approved?: boolean;
  avatarUrl?: string | null;
  documents?: string[];
}

const ROLE_FILTERS = ["all", "customer", "owner", "admin"] as const;
type RoleFilter = typeof ROLE_FILTERS[number];

function UsersTab() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [loading, setLoading] = useState(false);

  // Full-screen document & avatar viewer
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);

  const openViewer = (images: string[], index = 0, title = "") => {
    if (!images || images.length === 0) return;
    setViewerImages(images);
    setViewerIndex(index);
    setViewerTitle(title);
    setViewerOpen(true);
  };

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

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
    if (editForm.phone && editForm.phone.trim() && !/^\d{11}$/.test(editForm.phone.trim())) {
      toast.error("Phone number must be exactly 11 digits");
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

  const selectableUsers = filtered.filter((u) => u.id !== currentUser?.id);
  const allSelectableSelected =
    selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.includes(u.id));
  const someSelectableSelected =
    selectableUsers.some((u) => selectedIds.includes(u.id));

  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      const selectableIdSet = new Set(selectableUsers.map((u) => u.id));
      setSelectedIds((prev) => prev.filter((id) => !selectableIdSet.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...selectableUsers.map((u) => u.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const selectByRole = (role: "customer" | "owner" | "both") => {
    const targetUsers = users.filter((u) => {
      if (u.id === currentUser?.id) return false;
      if (role === "both") return u.role === "customer" || u.role === "owner";
      return u.role === role;
    });
    const targetIds = targetUsers.map((u) => u.id);
    setSelectedIds(Array.from(new Set([...selectedIds, ...targetIds])));
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await adminDeleteUsers({ data: { userIds: selectedIds } });
      toast.success(`${res.count} user(s) deleted successfully`);
      setSelectedIds([]);
      setBulkDeleteDialogOpen(false);
      reloadUsers();
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete selected users");
    } finally {
      setIsBulkDeleting(false);
    }
  };

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
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold capitalize transition-all border ${roleFilter === r
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

      {/* Quick Select Buttons & Bulk Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-800/50 backdrop-blur-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1.5 mr-1">
            <CheckSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Quick Select:
          </span>
          <button
            type="button"
            onClick={toggleSelectAll}
            className={`px-3 py-1.5 rounded-xl border font-medium transition-all ${allSelectableSelected
                ? "bg-slate-800 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-900 shadow-sm"
                : "bg-background/80 hover:bg-muted border-border/60 text-foreground"
              }`}
          >
            {allSelectableSelected ? "✓ Deselect All" : "Select All Filtered"}
          </button>
          <button
            type="button"
            onClick={() => selectByRole("customer")}
            className="px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium transition-all"
          >
            Select All Customers
          </button>
          <button
            type="button"
            onClick={() => selectByRole("owner")}
            className="px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-medium transition-all"
          >
            Select All Owners
          </button>
          <button
            type="button"
            onClick={() => selectByRole("both")}
            className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-medium transition-all"
          >
            Select Customers & Owners
          </button>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground underline transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2.5 animate-in fade-in zoom-in-95 duration-150">
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-3 py-1.5 rounded-xl">
              {selectedIds.length} user{selectedIds.length === 1 ? "" : "s"} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
              className="gap-2 rounded-xl shadow-md shadow-rose-600/20 font-bold px-4"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedIds.length})
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border/50 text-left text-xs uppercase text-muted-foreground bg-muted/30">
            <tr>
              <th className="w-12 px-4 py-3.5 text-center">
                <Checkbox
                  checked={allSelectableSelected ? true : someSelectableSelected ? "indeterminate" : false}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all users"
                  title="Select all"
                />
              </th>
              <th className="px-5 py-3.5 font-bold tracking-wider">Name</th>
              <th className="px-5 py-3.5 font-bold tracking-wider">Email</th>
              <th className="px-5 py-3.5 font-bold tracking-wider">Role</th>
              <th className="px-5 py-3.5 text-right font-bold tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center">
                  <div className="text-3xl mb-2">🔍</div>
                  <div className="font-medium text-foreground">{users.length === 0 ? "No users yet" : "No users match your search"}</div>
                  <div className="text-xs text-muted-foreground mt-1">{users.length > 0 ? "Try a different search term or filter" : "Users will appear here once they sign up"}</div>
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const isSelected = selectedIds.includes(u.id);
                const roleBadgeClass =
                  u.role === "admin"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700"
                    : u.role === "owner"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700";

                return (
                  <tr
                    key={u.id}
                    className={`border-t border-border/40 transition-colors ${isSelected
                        ? "bg-rose-50/70 dark:bg-rose-950/30"
                        : "hover:bg-muted/30 dark:hover:bg-white/5"
                      }`}
                  >
                    <td className="w-12 px-4 py-3.5 text-center">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleUser(u.id)}
                        disabled={isCurrent}
                        title={isCurrent ? "Cannot delete your own admin account" : `Select ${u.full_name}`}
                        aria-label={`Select ${u.full_name}`}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {u.avatarUrl ? (
                          <button
                            type="button"
                            onClick={() => openViewer([u.avatarUrl!], 0, `${u.full_name} — Profile Picture`)}
                            className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs hover:ring-2 hover:ring-indigo-400 transition-all shrink-0 cursor-pointer"
                            title="Click to view full profile picture"
                          >
                            <img src={u.avatarUrl} alt={u.full_name} className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
                            {(u.full_name || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground">{u.full_name}</span>
                            {isCurrent && (
                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                                You
                              </Badge>
                            )}
                          </div>
                          {u.phone && <div className="text-[11px] text-muted-foreground">{u.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-sm">{u.email ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1 items-start">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${roleBadgeClass}`}>
                            {u.role === "admin" ? "🛡 Admin" : u.role === "owner" ? "🏠 Owner" : "👤 Customer"}
                          </span>
                          {u.role === "owner" && u.is_approved === false && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                              ⏳ Pending
                            </span>
                          )}
                        </div>

                        {/* For owners, show attached permits quick preview badge */}
                        {u.role === "owner" && (
                          u.documents && u.documents.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => openViewer(u.documents!, 0, `${u.full_name} — Boarding House Permits & Documents`)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 transition-all shadow-xs cursor-pointer"
                              title="Click to inspect uploaded permit documents"
                            >
                              <FileText className="h-3 w-3" />
                              <span>{u.documents.length} Permit{u.documents.length === 1 ? "" : "s"}</span>
                              <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                              No permits
                            </span>
                          )
                        )}
                      </div>
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
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => openEditDialog(u)}>
                              <Edit2 className="mr-2 h-4 w-4 text-muted-foreground" />
                              Edit Profile
                            </DropdownMenuItem>
                            {u.role === "owner" && u.documents && u.documents.length > 0 && (
                              <DropdownMenuItem onClick={() => openViewer(u.documents!, 0, `${u.full_name} — Boarding House Permits & Documents`)}>
                                <FileText className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                View Permits ({u.documents.length})
                              </DropdownMenuItem>
                            )}
                            {u.avatarUrl && (
                              <DropdownMenuItem onClick={() => openViewer([u.avatarUrl!], 0, `${u.full_name} — Profile Picture`)}>
                                <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
                                View Profile Photo
                              </DropdownMenuItem>
                            )}
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
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl p-5 sm:p-6">
          {editingUser && (
            <form onSubmit={handleSaveEdit}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-primary" />
                  Edit User Profile
                </DialogTitle>
                <DialogDescription>
                  View profile details, uploaded permits, and update account information.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* User Profile Card with Avatar preview */}
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-muted/40 border border-border/50">
                  {editingUser.avatarUrl ? (
                    <button
                      type="button"
                      onClick={() => openViewer([editingUser.avatarUrl!], 0, `${editingUser.full_name} — Profile Picture`)}
                      className="relative group h-14 w-14 rounded-2xl overflow-hidden border border-border shadow-xs shrink-0 cursor-pointer"
                      title="Click to view full photo"
                    >
                      <img
                        src={editingUser.avatarUrl}
                        alt={editingUser.full_name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                    </button>
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-xs">
                      {(editingUser.full_name || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-foreground text-sm truncate">{editingUser.full_name}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${editingUser.role === "admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300"
                            : editingUser.role === "owner"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300"
                          }`}
                      >
                        {editingUser.role === "owner" ? "🏠 Owner" : editingUser.role === "admin" ? "🛡 Admin" : "👤 Customer"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{editingUser.email || "No email"}</p>
                    {editingUser.avatarUrl ? (
                      <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5 flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" /> Click avatar to view full image
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground mt-0.5">No custom profile photo</p>
                    )}
                  </div>
                </div>

                {/* If owner: Uploaded Boarding House Permits & Documents section */}
                {editingUser.role === "owner" && (
                  <div className="rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        Uploaded Permits & Documents
                      </div>
                      {editingUser.documents && editingUser.documents.length > 0 ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300 font-medium">
                          ✓ {editingUser.documents.length} File{editingUser.documents.length === 1 ? "" : "s"} attached
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                          ⚠️ No permits uploaded
                        </span>
                      )}
                    </div>

                    {editingUser.documents && editingUser.documents.length > 0 ? (
                      <>
                        <p className="text-[11px] text-muted-foreground">
                          Click any document photo below to inspect in full screen (Business Permit, Barangay Clearance, Fire Safety):
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-0.5">
                          {editingUser.documents.map((docUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => openViewer(editingUser.documents!, idx, `${editingUser.full_name} — Permit Document ${idx + 1}`)}
                              className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all text-left cursor-pointer"
                              title={`Inspect Document ${idx + 1}`}
                            >
                              <img
                                src={docUrl}
                                alt={`Permit document ${idx + 1}`}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                                <span className="text-[10px] text-white font-medium truncate flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" /> View full
                                </span>
                              </div>
                              <div className="absolute top-1 left-1 bg-black/65 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded-md font-medium">
                                Doc {idx + 1}
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-muted-foreground p-3 rounded-xl bg-background/50 border border-dashed border-border/60">
                        This owner has not uploaded any business permit, barangay clearance, or fire safety documents.
                      </div>
                    )}
                  </div>
                )}

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
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">Role</Label>
                  <div className="pt-0.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider border shadow-xs ${editForm.role === "admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-700"
                          : editForm.role === "owner"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                        }`}
                    >
                      {editForm.role === "admin" ? "🛡 Admin" : editForm.role === "owner" ? "🏠 Owner" : "👤 Customer"}
                    </span>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
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

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={(open) => !open && setBulkDeleteDialogOpen(false)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete {selectedIds.length} Users
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete these <strong className="text-foreground">{selectedIds.length}</strong> selected user accounts? This action will permanently remove their accounts, credentials, profiles, and associated records. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {/* List preview of selected users */}
          <div className="max-h-52 overflow-y-auto rounded-xl border border-border/60 bg-muted/40 p-2.5 space-y-1.5 my-2">
            {users
              .filter((u) => selectedIds.includes(u.id))
              .map((u) => (
                <div key={u.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-background/90 border border-border/40">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-foreground truncate">{u.full_name}</span>
                    <span className="text-muted-foreground truncate">({u.email ?? "No email"})</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${u.role === "admin" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40"
                      : u.role === "owner" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900/40"
                    }`}>
                    {u.role}
                  </span>
                </div>
              ))}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)} disabled={isBulkDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isBulkDeleting} className="gap-2">
              {isBulkDeleting ? "Deleting..." : `Yes, Delete ${selectedIds.length} Users`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-Screen Document / Photo Viewer */}
      <ImageViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={viewerImages}
        currentIndex={viewerIndex}
        onIndexChange={setViewerIndex}
        title={viewerTitle}
      />
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
      <div className="overflow-x-auto rounded-2xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
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
interface PendingOwnerListing {
  id: string;
  name: string;
  address: string;
  landmark: string | null;
  contactNumber: string;
  monthlyFee: number;
  numRooms: number;
  availableVacancies: number;
  coverPhotoUrl: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface PendingOwnerRow {
  roleId: string | null;
  userId: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatarUrl?: string | null;
  documents?: string[];
  createdAt: string;
  listings: PendingOwnerListing[];
}

interface RejectedOwnerRow {
  logId: string;
  userId: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  avatarUrl?: string | null;
  documents?: string[];
  rejectedAt: string;
  reason: string;
  listingsCount: number;
}

function PendingOwnersTab({ onActionDone }: { onActionDone?: () => void }) {
  const [subTab, setSubTab] = useState<"pending" | "rejected">("pending");
  const [rows, setRows] = useState<PendingOwnerRow[]>([]);
  const [rejectedRows, setRejectedRows] = useState<RejectedOwnerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // Full-screen document & avatar viewer
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);

  // Reject confirmation modal
  const [rejectDialogTarget, setRejectDialogTarget] = useState<PendingOwnerRow | null>(null);
  const [rejectReason, setRejectReason] = useState("Incomplete or invalid documents / permits.");

  const openViewer = (images: string[], index = 0, title = "") => {
    setViewerImages(images);
    setViewerIndex(index);
    setViewerTitle(title);
    setViewerOpen(true);
  };

  const reload = async () => {
    setLoading(true);
    try {
      const [pending, rejected] = await Promise.all([
        getPendingOwners(),
        getRejectedOwners(),
      ]);
      setRows(pending as PendingOwnerRow[]);
      setRejectedRows(rejected as RejectedOwnerRow[]);
      onActionDone?.();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const doApproveOwner = async (row: PendingOwnerRow) => {
    setBusy(row.userId);
    try {
      await approveOwner({ data: { roleId: row.roleId, userId: row.userId } });
      toast.success(`${row.full_name} has been approved! Their uploaded listings are now automatically published.`);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const confirmReject = async () => {
    if (!rejectDialogTarget) return;
    setBusy(rejectDialogTarget.userId);
    try {
      await rejectOwner({
        data: {
          roleId: rejectDialogTarget.roleId,
          userId: rejectDialogTarget.userId,
          reason: rejectReason.trim() || "Incomplete or invalid documents / permits.",
        },
      });
      toast.success(`${rejectDialogTarget.full_name}'s application has been rejected.`);
      setRejectDialogTarget(null);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const doReapprove = async (row: RejectedOwnerRow) => {
    setBusy(row.userId);
    try {
      await reapproveRejectedOwner({ data: { userId: row.userId, logId: row.logId } });
      toast.success(`${row.full_name} has been restored and approved as Owner!`);
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const doDeleteRejected = async (row: RejectedOwnerRow) => {
    if (!confirm(`Permanently delete the record for ${row.full_name}?`)) return;
    setBusy(row.userId);
    try {
      await deleteRejectedOwner({ data: { logId: row.logId, userId: row.userId } });
      toast.success("Rejected application record removed.");
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (loading && rows.length === 0 && rejectedRows.length === 0) {
    return (
      <div className="mt-4 flex items-center justify-center py-16 text-muted-foreground">
        <span className="mr-2 text-lg animate-spin">⏳</span> Loading owner applications…
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Sub-navigation Switcher: Pending vs Rejected */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-border/50">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab("pending")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${subTab === "pending"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
              }`}
          >
            <span>⏳ Pending Approval</span>
            <span
              className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${subTab === "pending"
                  ? "bg-white/20 text-white"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
            >
              {rows.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("rejected")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${subTab === "rejected"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                : "bg-slate-100 dark:bg-slate-800 text-muted-foreground hover:text-foreground"
              }`}
          >
            <span>❌ Rejected Owners</span>
            <span
              className={`px-2 py-0.5 text-[11px] rounded-full font-bold ${subTab === "rejected"
                  ? "bg-white/20 text-white"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                }`}
            >
              {rejectedRows.length}
            </span>
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={reload}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* ────────────────── PENDING TAB ────────────────── */}
      {subTab === "pending" && (
        <>
          {rows.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-700/40 bg-amber-50/50 dark:bg-amber-950/20 p-14 text-center">
              <div className="text-4xl mb-3">🔑</div>
              <div className="font-semibold text-foreground">No pending owner applications</div>
              <div className="text-sm text-muted-foreground mt-1 mb-4">
                All newly registered owner accounts have been reviewed.
              </div>
              <Button variant="outline" size="sm" onClick={reload} className="h-8 gap-1.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                Showing {rows.length} pending owner registration{rows.length === 1 ? "" : "s"} awaiting review.
              </div>

              {rows.map((row) => {
                const isBusy = busy === row.userId;
                const hasDocs = row.documents && row.documents.length > 0;

                return (
                  <div
                    key={row.userId}
                    className="rounded-2xl border border-amber-200/70 dark:border-amber-700/40 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition-shadow space-y-4"
                  >
                    {/* Header row: Owner info + Approval buttons */}
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-border/50">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          {row.avatarUrl ? (
                            <button
                              type="button"
                              onClick={() => openViewer([row.avatarUrl!], 0, `${row.full_name} — Profile / ID Photo`)}
                              className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-indigo-400 dark:border-indigo-500 shadow-sm flex-shrink-0 group cursor-pointer hover:opacity-90 transition-opacity"
                              title="Click to view full photo"
                            >
                              <img src={row.avatarUrl} alt={row.full_name} className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ExternalLink className="h-3.5 w-3.5 text-white" />
                              </div>
                            </button>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-300 dark:border-amber-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-base font-bold text-amber-700 dark:text-amber-300">
                                {row.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-base text-foreground">{row.full_name}</span>
                              <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-300">
                                ⏳ Awaiting Approval
                              </Badge>
                              {row.avatarUrl && (
                                <Badge variant="outline" className="text-[10px] bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 text-indigo-700 dark:text-indigo-300">
                                  📷 Profile Photo
                                </Badge>
                              )}
                              {row.listings.length > 0 && (
                                <Badge variant="outline" className="text-xs bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 text-indigo-700 dark:text-indigo-300">
                                  {row.listings.length} Property Listing{row.listings.length === 1 ? "" : "s"}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{row.email ?? "No email"}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1 ml-0 sm:ml-[60px]">
                          {row.phone && <span>📞 {row.phone}</span>}
                          <span>📅 Registered {new Date(row.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</span>
                        </div>
                      </div>

                      {/* Action Buttons: Approve Owner / Reject Owner */}
                      <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-center">
                        <Button
                          size="sm"
                          disabled={isBusy}
                          onClick={() => doApproveOwner(row)}
                          className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm shadow-emerald-600/30 px-4 h-9"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {isBusy ? "Approving…" : "Approve Owner"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => {
                            setRejectDialogTarget(row);
                            setRejectReason("Incomplete or invalid documents / permits.");
                          }}
                          className="gap-1.5 rounded-xl border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium px-4 h-9"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    </div>

                    {/* Boarding House Documents & Permits Inspection Section */}
                    <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20 p-3.5 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                          Boarding House Documents & Permits (Permit, Clearance, Fire Safety)
                        </div>
                        {hasDocs ? (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 font-medium">
                            ✓ {row.documents!.length} Document{row.documents!.length === 1 ? "" : "s"} attached (Click photo to inspect)
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            ⚠️ No permit documents attached
                          </span>
                        )}
                      </div>

                      {hasDocs ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
                          {row.documents!.map((docUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => openViewer(row.documents!, idx, `${row.full_name} — Document / Permit ${idx + 1}`)}
                              className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all text-left"
                              title={`Inspect Document ${idx + 1}`}
                            >
                              <img src={docUrl} alt={`Permit document ${idx + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                                <span className="text-[10px] text-white font-medium truncate flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" /> View full
                                </span>
                              </div>
                              <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                                Doc {idx + 1}
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          The owner did not attach any permit photos during registration.
                        </p>
                      )}
                    </div>

                    {/* Boarding House Listings section preview */}
                    {row.listings.length > 0 ? (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-2">
                          <Home className="h-3.5 w-3.5 text-indigo-500" />
                          Uploaded Properties (Auto-published once owner is approved)
                        </div>
                        <div className="space-y-2">
                          {row.listings.map((bh) => (
                            <div
                              key={bh.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-700/60"
                            >
                              <div className="flex items-center gap-3">
                                {bh.coverPhotoUrl ? (
                                  <img
                                    src={bh.coverPhotoUrl}
                                    alt={bh.name}
                                    className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center flex-shrink-0">
                                    <Building2 className="h-5 w-5 text-indigo-500" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-sm text-foreground">{bh.name}</div>
                                  <div className="text-xs text-muted-foreground line-clamp-1">
                                    📍 {bh.address}{bh.landmark ? ` (${bh.landmark})` : ""}
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground mt-0.5">
                                    <span className="font-medium text-foreground">₱{peso(bh.monthlyFee)}/mo</span>
                                    <span>•</span>
                                    <span>{bh.numRooms} rooms</span>
                                    <span>•</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">{bh.availableVacancies} vacancies</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
                                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
                                  ✓ Auto-publishes on approval
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-muted-foreground italic bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        New owner registration. Once approved, the owner will be able to access the Owner Dashboard and post boarding house listings.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ────────────────── REJECTED TAB ────────────────── */}
      {subTab === "rejected" && (
        <>
          {rejectedRows.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 p-14 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="font-semibold text-foreground">No rejected owner registrations</div>
              <div className="text-sm text-muted-foreground mt-1 mb-4">
                No owner applications have been rejected.
              </div>
              <Button variant="outline" size="sm" onClick={reload} className="h-8 gap-1.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                Showing {rejectedRows.length} rejected owner registration{rejectedRows.length === 1 ? "" : "s"}. You can re-approve them if their requirements have been resolved.
              </div>

              {rejectedRows.map((row) => {
                const isBusy = busy === row.userId;
                const hasDocs = row.documents && row.documents.length > 0;

                return (
                  <div
                    key={row.logId}
                    className="rounded-2xl border border-rose-200/80 dark:border-rose-800/40 bg-white/80 dark:bg-slate-800/60 backdrop-blur-md p-5 shadow-sm hover:shadow-md transition-shadow space-y-4"
                  >
                    {/* Header row: Owner info + Action buttons */}
                    <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-rose-100 dark:border-rose-900/40">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          {row.avatarUrl ? (
                            <button
                              type="button"
                              onClick={() => openViewer([row.avatarUrl!], 0, `${row.full_name} — Profile Photo`)}
                              className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-rose-300 dark:border-rose-600 shadow-sm flex-shrink-0 group cursor-pointer hover:opacity-90 transition-opacity"
                              title="Click to view full photo"
                            >
                              <img src={row.avatarUrl} alt={row.full_name} className="h-full w-full object-cover" />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ExternalLink className="h-3.5 w-3.5 text-white" />
                              </div>
                            </button>
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/40 border-2 border-rose-300 dark:border-rose-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-base font-bold text-rose-700 dark:text-rose-300">
                                {row.full_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-base text-foreground">{row.full_name}</span>
                              <Badge variant="outline" className="text-xs bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-700 dark:text-rose-300 font-semibold">
                                ❌ Registration Rejected
                              </Badge>
                              {row.avatarUrl && (
                                <Badge variant="outline" className="text-[10px] bg-slate-100 dark:bg-slate-800 border-slate-300 text-muted-foreground">
                                  📷 Profile Attached
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{row.email ?? "No email"}</div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1 ml-0 sm:ml-[60px]">
                          {row.phone && <span>📞 {row.phone}</span>}
                          <span>📅 Rejected on {new Date(row.rejectedAt).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                      </div>

                      {/* Action Buttons: Re-approve or Delete */}
                      <div className="flex items-center gap-2.5 flex-shrink-0 self-start sm:self-center">
                        <Button
                          size="sm"
                          disabled={isBusy}
                          onClick={() => doReapprove(row)}
                          className="gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm shadow-emerald-600/30 px-4 h-9"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {isBusy ? "Processing…" : "Re-approve Owner"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isBusy}
                          onClick={() => doDeleteRejected(row)}
                          className="gap-1.5 rounded-xl border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium px-3 h-9"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Rejection Reason Alert Box */}
                    <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-3.5 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                        <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        Reason for Rejection:
                      </div>
                      <p className="pl-5 text-rose-800 dark:text-rose-200 leading-relaxed font-medium">
                        "{row.reason}"
                      </p>
                    </div>

                    {/* Attached Documents & Permits Section */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-3.5 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          Submitted Documents / Permits
                        </div>
                        {hasDocs ? (
                          <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 font-medium">
                            {row.documents!.length} Document{row.documents!.length === 1 ? "" : "s"} (Click photo to inspect)
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">
                            No documents attached during registration
                          </span>
                        )}
                      </div>

                      {hasDocs && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
                          {row.documents!.map((docUrl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => openViewer(row.documents!, idx, `${row.full_name} — Rejected Document ${idx + 1}`)}
                              className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md hover:border-rose-400 transition-all text-left"
                              title={`Inspect Document ${idx + 1}`}
                            >
                              <img src={docUrl} alt={`Permit document ${idx + 1}`} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                                <span className="text-[10px] text-white font-medium truncate flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" /> View full
                                </span>
                              </div>
                              <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[9px] px-1.5 py-0.5 rounded font-medium">
                                Doc {idx + 1}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Reject Confirmation Dialog */}
      <Dialog open={!!rejectDialogTarget} onOpenChange={(open) => !open && setRejectDialogTarget(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md p-5 sm:p-6 rounded-2xl sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <XCircle className="h-5 w-5" />
              Reject Owner Application
            </DialogTitle>
            <DialogDescription>
              Specify the reason why <strong>{rejectDialogTarget?.full_name}</strong>'s owner registration is being rejected. This will be recorded and shown in the dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="reject-reason" className="text-xs font-semibold">Reason for Rejection</Label>
              <Input
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete or invalid documents / permits."
                className="mt-1.5 text-sm"
              />
            </div>

            {/* Quick Templates */}
            <div>
              <div className="text-[11px] font-medium text-muted-foreground mb-1.5">Quick Suggestions:</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Incomplete or missing Business permit",
                  "Expired permit / clearance",
                  "Blurry or illegible permit photos",
                  "Unverified boarding house location",
                  "Invalid owner identification / photo",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className="text-[10px] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRejectDialogTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              onClick={confirmReject}
              disabled={!!busy}
            >
              {busy ? "Rejecting…" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-Screen Document / Photo Viewer */}
      <ImageViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={viewerImages}
        currentIndex={viewerIndex}
        onIndexChange={setViewerIndex}
        title={viewerTitle}
      />
    </div>
  );
}

