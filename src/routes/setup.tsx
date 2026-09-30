import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { claimAdminIfFirst } from "@/lib/server-fns";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "Setup — Admin bootstrap" }] }),
  component: Setup,
});

function Setup() {
  const { user, refreshRole } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  const claim = async () => {
    if (!user) { navigate({ to: "/customer/login" }); return; }
    setBusy(true);
    try {
      const ok = await claimAdminIfFirst({ data: { userId: user.id } });
      if (ok) { toast.success("You are now the admin"); await refreshRole(); navigate({ to: "/management" }); }
      else toast.error("An admin already exists for this system.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-lg rounded-xl border border-border bg-card p-8 text-center">
        <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-primary" />
        <h1 className="text-xl font-bold">Bootstrap Admin Access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If no admin has been created for this system yet, you can claim the admin role for the currently signed-in account.
        </p>
        {!user && <p className="mt-4 text-sm">Please <a className="text-primary underline" href="/customer/login">sign in</a> first.</p>}
        {user && (
          <Button onClick={claim} disabled={busy} className="mt-4">
            {busy ? "Claiming…" : "Claim admin role"}
          </Button>
        )}
      </div>
    </AppShell>
  );
}
