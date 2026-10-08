import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { resetAccountPassword } from "@/lib/server-fns";

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultEmail?: string;
  onSuccess?: (email: string) => void;
  title?: string;
}

export function ForgotPasswordModal({
  open,
  onOpenChange,
  defaultEmail = "",
  onSuccess,
  title = "Reset Password",
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const resetForm = () => {
    setEmail(defaultEmail);
    setPhone("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
    setIsDone(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your registered email address.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match. Please recheck.");
      return;
    }

    setBusy(true);
    try {
      await resetAccountPassword({
        data: {
          email: email.trim().toLowerCase(),
          newPassword,
          phone: phone.trim() || undefined,
        },
      });

      toast.success("Password reset successfully! You can now sign in.");
      setIsDone(true);
      if (onSuccess) {
        onSuccess(email.trim().toLowerCase());
      }
    } catch (err) {
      toast.error((err as Error).message || "Failed to reset password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md rounded-3xl border border-white/40 dark:border-white/10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-7">
        <DialogHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm">
            <KeyRound className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-muted-foreground">
            {isDone
              ? "Your password has been successfully updated. You can now use your new password to sign in."
              : "Enter your registered email and choose a new password to retrieve your account."}
          </DialogDescription>
        </DialogHeader>

        {isDone ? (
          <div className="py-6 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Password Changed!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Account: <span className="font-semibold text-foreground">{email}</span>
              </p>
            </div>
            <Button
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/25"
              onClick={handleClose}
            >
              Return to Sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2" autoComplete="off">
            {/* Hidden decoy inputs to absorb browser autofill */}
            <div style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1, overflow: "hidden" }} aria-hidden="true">
              <input type="text" name="fake_email_autofill" tabIndex={-1} autoComplete="username" />
              <input type="password" name="fake_password_autofill" tabIndex={-1} autoComplete="current-password" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fp-email" className="text-xs font-semibold text-foreground">
                Registered Email <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. owner@example.com"
                className="rounded-xl border-border bg-background/80 focus-visible:ring-indigo-500"
                autoComplete="off"
                data-1p-ignore
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="fp-phone" className="text-xs font-semibold text-foreground">
                  Registered Contact / Phone
                </Label>
                <span className="text-[10px] text-muted-foreground">(Optional)</span>
              </div>
              <Input
                id="fp-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 09123456789"
                className="rounded-xl border-border bg-background/80 focus-visible:ring-indigo-500"
                autoComplete="off"
                data-1p-ignore
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fp-newpass" className="text-xs font-semibold text-foreground">
                New Password <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="fp-newpass"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="rounded-xl border-border bg-background/80 pr-10 focus-visible:ring-indigo-500"
                  autoComplete="new-password"
                  data-1p-ignore
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fp-confirmpass" className="text-xs font-semibold text-foreground">
                Confirm New Password <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="fp-confirmpass"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="rounded-xl border-border bg-background/80 pr-10 focus-visible:ring-indigo-500"
                  autoComplete="new-password"
                  data-1p-ignore
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={busy}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md shadow-indigo-500/25"
              >
                {busy ? "Resetting…" : "Reset Password"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
