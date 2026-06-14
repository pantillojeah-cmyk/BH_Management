import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — BH Tracker" }, { name: "description", content: "Reset your password." }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) setIsRecovery(true);
  }, []);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) toast.error(error.message);
    else toast.success("Check your email for a reset link.");
  };

  const updatePw = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else toast.success("Password updated. You can now sign in.");
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4">
      <Card className="w-full p-6">
        <h1 className="font-display text-2xl font-bold">{isRecovery ? "Set a new password" : "Reset your password"}</h1>
        {isRecovery ? (
          <form onSubmit={updatePw} className="mt-4 space-y-3">
            <div>
              <Label>New password</Label>
              <Input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Update password</Button>
          </form>
        ) : (
          <form onSubmit={sendLink} className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">We'll send you a link to set a new password.</p>
            <div>
              <Label>Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">Send reset link</Button>
            <div className="text-center text-sm"><Link to="/auth" className="hover:underline">Back to sign in</Link></div>
          </form>
        )}
      </Card>
    </div>
  );
}
