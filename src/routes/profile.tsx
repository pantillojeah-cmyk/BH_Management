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
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!loading && !user) navigate({ to: "/customer/login" }); }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    getProfile({ data: { userId: user.id } }).then((data) => {
      const rawName = data?.full_name ?? "";
      if (rawName.includes(",")) {
        const [last, rest] = rawName.split(",");
        setLastName(last.trim());
        const restParts = (rest || "").trim().split(/\s+/);
        if (restParts.length > 1 && (restParts[restParts.length - 1].length <= 2 || restParts[restParts.length - 1].endsWith("."))) {
          setMiddleInitial(restParts.pop() || "");
          setFirstName(restParts.join(" "));
        } else {
          setFirstName((rest || "").trim());
        }
      } else {
        const parts = rawName.trim().split(/\s+/);
        if (parts.length > 1) {
          setLastName(parts.pop() || "");
          setFirstName(parts.join(" "));
        } else {
          setFirstName(rawName);
        }
      }
      setPhone(data?.phone ?? "");
    });
  }, [user]);

  const save = async () => {
    if (!user) return;
    const cleanLast = lastName.trim();
    const cleanFirst = firstName.trim();
    const cleanMi = middleInitial.trim().replace(/\.?$/, middleInitial.trim() ? "." : "");

    if (!cleanLast) {
      toast.error("Last name is required");
      return;
    }
    if (!cleanFirst) {
      toast.error("First name is required");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (/[a-zA-Z]/.test(phone)) {
      toast.error("Letters are not allowed in phone number. Numbers only.");
      return;
    }
    if (phone.replace(/\D/g, "").length > 11 || phone.length > 11) {
      toast.error("Phone number cannot exceed 11 digits");
      return;
    }
    if (!/^\d{11}$/.test(phone.trim())) {
      toast.error("Phone number must be exactly 11 digits");
      return;
    }
    setSaving(true);
    const fullName = cleanMi ? `${cleanLast}, ${cleanFirst} ${cleanMi}` : `${cleanLast}, ${cleanFirst}`;
    try {
      await updateProfile({ data: { userId: user.id, fullName, phone: phone.trim() } });
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
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Last name
            </Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Dela Cruz"
              maxLength={100}
              className="h-11 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-8 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                First name
              </Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Juan"
                maxLength={100}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="col-span-4 space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                M.I.
              </Label>
              <Input
                value={middleInitial}
                onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
                placeholder="e.g. M."
                maxLength={4}
                className="h-11 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone number</Label>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="09*********"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-xl"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Must be 11 numeric digits (e.g. 09*********)
            </p>
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
