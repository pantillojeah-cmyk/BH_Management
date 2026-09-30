import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { getProfile, updateProfile } from "@/lib/server-fns";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile" }] }),
  component: Profile,
});

function Profile() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/customer/login" }); }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    getProfile({ data: { userId: user.id } }).then((data) => {
      setFullName(data?.full_name ?? "");
      setPhone(data?.phone ?? "");
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({ data: { userId: user.id, fullName: fullName.trim(), phone: phone.trim() || null } });
      toast.success("Profile updated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <h1 className="mb-1 text-2xl font-bold flex items-center gap-2">
          <span>My Profile</span>
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Signed in as <span className="font-semibold text-foreground">{user.email}</span> · role{" "}
          <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            {role}
          </span>
        </p>
        <div className="glass-panel space-y-5 rounded-3xl border border-white/60 dark:border-white/10 p-7 shadow-xl backdrop-blur-2xl">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Maria Santos"
              maxLength={100}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone number</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 09123456789"
              maxLength={30}
              className="h-11 rounded-xl"
            />
          </div>
          <Button
            onClick={save}
            disabled={saving}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white shadow-md shadow-emerald-600/20 border border-white/20 font-semibold"
          >
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
