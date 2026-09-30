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
        <h1 className="mb-1 text-2xl font-bold">My Profile</h1>
        <p className="mb-6 text-sm text-muted-foreground">Signed in as <span className="font-medium">{user.email}</span> · role <span className="uppercase text-primary">{role}</span></p>
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div>
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
          </div>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>
    </AppShell>
  );
}
