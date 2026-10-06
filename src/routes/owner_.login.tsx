import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Building2, Eye, EyeOff, KeyRound, ArrowLeft, Clock, LogOut, CheckCircle2, RotateCcw } from "lucide-react";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { updateProfile } from "@/lib/server-fns";

export const Route = createFileRoute("/owner_/login")({
  head: () => ({ meta: [{ title: "Owner Portal — Boarding House Tracker" }] }),
  component: OwnerAuthPage,
});

const emailSchema = z.string().trim().email("Invalid email").max(255);
const passSchema = z.string().min(6, "Password must be at least 6 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your full name").max(100);

function OwnerAuthPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) {
      if (role === "admin") navigate({ to: "/management" });
      else if (role === "owner") navigate({ to: "/owner" });
      // pending_owner stays on this page to see the waiting screen
      else if (role !== "pending_owner") navigate({ to: "/browse" });
    }
  }, [user, role, navigate]);

  if (user && role === "pending_owner") {
    return <PendingApprovalScreen userName={user.name} email={user.email} />;
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2 overflow-hidden bg-background/50">
      {/* Ambient background light orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[34rem] w-[34rem] rounded-full bg-indigo-500/15 blur-[120px] dark:bg-indigo-500/20 animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 h-[38rem] w-[38rem] rounded-full bg-blue-500/12 blur-[140px] dark:bg-blue-600/15 animate-float-slow" />
      </div>

      <div className="hidden relative bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/logo.png"
            alt="ZDSPGC BH Tracker Logo"
            className="h-12 w-12 rounded-full object-cover border-2 border-white/50 shadow-lg"
          />
          <div>
            <div className="font-bold text-lg leading-tight">BH Vacancy Tracker</div>
            <div className="text-xs text-indigo-200">Owner Portal · ZDSPGC Dimataling</div>
          </div>
        </div>
        <div className="relative z-10 space-y-5 max-w-lg">
          <div className="inline-block rounded-full bg-white/20 border border-white/30 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            Property Owner Dashboard
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">Manage your boarding house with ease.</h2>
          <p className="text-indigo-100/90 leading-relaxed text-sm">Reach more students, manage vacancies in real-time, and handle inquiries securely from one intuitive dashboard.</p>
          <ul className="space-y-2.5 text-sm text-indigo-100">
            <li className="flex items-center gap-2">• List and showcase your rooms with photos</li>
            <li className="flex items-center gap-2">• Instantly update vacancy counts & rooms</li>
            <li className="flex items-center gap-2">• Review reservations and verify tenant holds</li>
          </ul>
        </div>
        <div className="relative z-10 text-xs text-indigo-200/80">For verified boarding house owners near ZDSPGC-Dimataling.</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/60 dark:border-white/15 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 text-center">
            <img
              src="/logo.png"
              alt="ZDSPGC BH Tracker Logo"
              className="mx-auto mb-3.5 h-16 w-16 rounded-full object-cover border-2 border-indigo-500/40 shadow-lg"
            />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Owner Portal</h1>
            <p className="text-xs text-muted-foreground mt-1">Sign in or register your property to start listing</p>
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Register</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>
          <div className="mt-6 flex items-center justify-between border-t border-white/40 dark:border-white/10 pt-4 text-xs">
            <button
              type="button"
              className="flex items-center text-indigo-500 hover:text-indigo-600 transition-colors font-medium"
              onClick={() => navigate({ to: "/" })}
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Home
            </button>
            <a href="/customer/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Student login →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) { toast.error(err.issues[0].message); return; }
    }
    setBusy(true);
    const { error } = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Signed in");
      setEmail("");
      setPassword("");
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="owner@example.com" required autoComplete="off" />
      </div>
      <div>
        <Label htmlFor="si-pass">Password</Label>
        <div className="relative">
          <Input
            id="si-pass"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}

function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      nameSchema.parse(fullName);
      emailSchema.parse(email);
      passSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) { toast.error(err.issues[0].message); return; }
    }
    setBusy(true);
    const { data, error } = await authClient.signUp.email({ email, password, name: fullName });
    if (error) { toast.error(error.message); setBusy(false); return; }
    
    if (data?.user) {
      await updateProfile({ data: { userId: data.user.id, fullName, phone: phone || null } });
      await fetch("/api/user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id, role: "owner" }),
      });
    }
    setBusy(false);
    toast.success("Owner account created — awaiting admin approval.");
    setFullName("");
    setEmail("");
    setPhone("");
    setPassword("");
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 p-3 text-xs text-amber-700 dark:text-amber-300">
        ⏳ After registration, your account will be reviewed by the admin before you can access the Owner Dashboard.
      </div>
      <div>
        <Label htmlFor="su-name">Full name</Label>
        <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="su-phone">Phone (optional)</Label>
        <Input id="su-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+63 9xx xxx xxxx" />
      </div>
      <div>
        <Label htmlFor="su-pass">Password</Label>
        <div className="relative">
          <Input
            id="su-pass"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={busy}>{busy ? "Creating…" : "Create owner account"}</Button>
    </form>
  );
}

function PendingApprovalScreen({ userName, email }: { userName?: string; email?: string }) {
  const { signOut, refreshRole, role } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  // Synchronize with admin approval in real-time (poll every 5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      refreshRole();
    }, 5000);
    return () => clearInterval(timer);
  }, [refreshRole]);

  useEffect(() => {
    if (role === "owner") {
      toast.success("Your owner account has been approved! Redirecting…");
      navigate({ to: "/owner" });
    }
  }, [role, navigate]);

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      await refreshRole();
      if (role === "owner") {
        toast.success("Your account has been approved!");
        navigate({ to: "/owner" });
      } else {
        toast.info("Account is still under admin review. Please wait for admin approval.");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-amber-50/40 to-indigo-50/30 dark:from-slate-950 dark:via-amber-950/20 dark:to-indigo-950/20 overflow-hidden p-6">
      {/* Background orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[30rem] w-[30rem] rounded-full bg-amber-400/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-indigo-400/10 blur-[120px] animate-float-slow" />
      </div>

      <div className="w-full max-w-lg text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img src="/logo.png" alt="Logo" className="h-16 w-16 rounded-full object-cover border-2 border-amber-400/40 shadow-xl" />
        </div>

        {/* Main card */}
        <div className="rounded-3xl border border-amber-200/60 dark:border-amber-700/40 bg-white/80 dark:bg-slate-800/70 backdrop-blur-2xl p-8 shadow-2xl space-y-5">
          {/* Animated clock icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-300 dark:border-amber-600 shadow-lg">
            <Clock className="h-10 w-10 text-amber-600 dark:text-amber-400 animate-spin" style={{ animationDuration: "4s" }} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Account Pending Approval</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {userName ? `Hi ${userName}!` : "Hi there!"} Your owner account has been submitted.
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-300">
              <Clock className="h-4 w-4 flex-shrink-0" />
              What happens next?
            </div>
            <ul className="text-xs text-amber-700/80 dark:text-amber-300/80 space-y-1.5 ml-6">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                Your registration has been received
              </li>
              <li className="flex items-start gap-1.5">
                <Clock className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                Admin will review and approve your account
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                Once approved, this page will automatically redirect you
              </li>
            </ul>
          </div>

          {email && (
            <p className="text-xs text-muted-foreground">
              Registered as: <span className="font-semibold text-foreground">{email}</span>
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <Button
              className="w-full rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
              disabled={checking}
              onClick={handleCheckNow}
            >
              <RotateCcw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
              {checking ? "Checking approval…" : "Check Approval Status"}
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl gap-2 border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              onClick={async () => {
                await signOut();
                navigate({ to: "/owner/login" });
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          If you have been waiting for a long time, please contact your campus administrator.
        </p>
      </div>
    </div>
  );
}
