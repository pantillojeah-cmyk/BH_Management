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
      <h1 className="mb-1 text-2xl font-bold">Admin Dashboard</h1>
      <p className="mb-6 text-sm text-muted-foreground">System overview and management</p>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="report">Vacancy Report</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><Overview /></TabsContent>
        <TabsContent value="listings"><Listings /></TabsContent>
        <TabsContent value="users"><UsersTab /></TabsContent>
        <TabsContent value="report"><VacancyReport /></TabsContent>
      </Tabs>
    <div className="flex space-x-2 mb-4">
        <PrintButton />
        <ExportButton fetchUrl="/api/management/export-listings" fileName="listings.csv" />
      </div>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Building2; label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${accent ?? "bg-primary/10 text-primary"}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
}

function Overview() {
  const [stats, setStats] = useState({ houses: 0, owners: 0, customers: 0, vacancies: 0, pending: 0 });
  useEffect(() => {
    getAdminStats().then((data) => setStats(data));
  }, []);

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Building2} label="Total Boarding Houses" value={stats.houses} />
      <StatCard icon={UserCheck} label="Total Owners" value={stats.owners} accent="bg-emerald-100 text-emerald-700" />
      <StatCard icon={Users} label="Total Customers" value={stats.customers} accent="bg-blue-100 text-blue-700" />
      <StatCard icon={Home} label="Available Vacancies" value={stats.vacancies} accent="bg-amber-100 text-amber-700" />
      <div className="rounded-xl border border-border bg-card p-5 sm:col-span-2 lg:col-span-4">
        <div className="text-sm font-semibold">{stats.pending} listing{stats.pending === 1 ? "" : "s"} awaiting approval</div>
        <p className="text-xs text-muted-foreground">Go to the Listings tab to review and approve or reject submissions.</p>
      </div>
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
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No listings.
        </div>
      ) : (
        rows.map((r) => {
          const allPhotos = [r.cover_photo_url, ...r.photos].filter(Boolean) as string[];
          return (
            <div key={r.id} className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Photo strip */}
              {allPhotos.length > 0 && (
                <div className="flex gap-1 overflow-x-auto bg-muted/40 p-2">
                  {allPhotos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`${r.name} photo ${i + 1}`}
                      className={`h-20 w-28 flex-shrink-0 rounded-lg object-cover border border-border ${
                        i === 0 ? "ring-2 ring-primary/40" : ""
                      }`}
                    />
                  ))}
                </div>
              )}
              {/* Info row */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-[200px]">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.address}</div>
                </div>
                <div className="text-sm">{peso(r.monthly_fee)}</div>
                <div className="text-sm">{r.available_vacancies}/{r.num_rooms} vacant</div>
                <Badge variant={r.status === "approved" ? "default" : r.status === "pending" ? "secondary" : "destructive"}>{r.status}</Badge>
                <div className="flex gap-1">
                  {r.status !== "approved" && (
                    <Button size="sm" onClick={() => doSetStatus(r.id, "approved")}>
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => doSetStatus(r.id, "rejected")}>
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                    Delete
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
    <div className="mt-4 space-y-3">
      {/* Search + filter toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        {/* Role filter pills */}
        <div className="flex gap-1">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                roleFilter === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {/* Result count */}
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Email</th>
              <th className="p-3 font-semibold">Role</th>
              <th className="p-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground">
                  {users.length === 0 ? "No users yet." : "No users match your search."}
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isCurrent = u.id === currentUser?.id;
                const roleBadgeClass =
                  u.role === "admin"
                    ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 font-semibold"
                    : u.role === "owner"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 font-semibold"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 font-semibold";

                return (
                  <tr key={u.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{u.full_name}</span>
                        {isCurrent && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                            You
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{u.email ?? "—"}</td>
                    <td className="p-3">
                      <Badge variant="outline" className={`uppercase tracking-wider text-[11px] ${roleBadgeClass}`}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-medium"
                          onClick={() => openEditDialog(u)}
                        >
                          <Edit2 className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                          Edit
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="More Actions">
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
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Total rooms</div>
          <div className="text-2xl font-bold">{totalRooms}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Available vacancies</div>
          <div className="text-2xl font-bold">{totalVac}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Occupancy rate</div>
          <div className="text-2xl font-bold">{occupancyPct}%</div>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr><th className="p-3">Boarding house</th><th className="p-3">Monthly fee</th><th className="p-3">Rooms</th><th className="p-3">Vacancies</th><th className="p-3">Occupancy</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const occ = r.num_rooms ? Math.round(((r.num_rooms - r.available_vacancies) / r.num_rooms) * 100) : 0;
              return (
                <tr key={i} className="border-t border-border">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3">{peso(r.monthly_fee)}</td>
                  <td className="p-3">{r.num_rooms}</td>
                  <td className="p-3">{r.available_vacancies}</td>
                  <td className="p-3">{occ}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} // End of file
