import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Building2, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { updateProfile } from "@/lib/server-fns";

export const Route = createFileRoute("/customer_/login")({
  head: () => ({ meta: [{ title: "Customer Login — Boarding House Tracker" }] }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Invalid email").max(255);
const passSchema = z.string().min(6, "Password must be at least 6 characters").max(72);
const nameSchema = z.string().trim().min(2, "Enter your full name").max(100);

function AuthPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) {
      console.log("Redirecting to browse. User:", user.email, "Role:", role);
      navigate({ to: "/browse" });
    }
  }, [user, role, navigate]);

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2 overflow-hidden bg-background/50">
      {/* Ambient background light orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[34rem] w-[34rem] rounded-full bg-emerald-500/15 blur-[120px] dark:bg-emerald-500/20 animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 h-[38rem] w-[38rem] rounded-full bg-teal-400/12 blur-[140px] dark:bg-teal-500/15 animate-float-slow" />
      </div>

      <div className="hidden relative bg-gradient-to-br from-emerald-700 via-teal-800 to-emerald-900 p-12 text-white lg:flex lg:flex-col lg:justify-between overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <img
            src="/logo.png"
            alt="ZDSPGC BH Tracker Logo"
            className="h-12 w-12 rounded-full object-cover border-2 border-white/50 shadow-lg"
          />
          <div>
            <div className="font-bold text-lg leading-tight">BH Vacancy Tracker</div>
            <div className="text-xs text-emerald-200">ZDSPGC-Dimataling Campus</div>
          </div>
        </div>
        <div className="relative z-10 space-y-5 max-w-lg">
          <div className="inline-block rounded-full bg-white/20 border border-white/30 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            Student & Employee Portal
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">Find your boarding house near campus the easy way.</h2>
          <p className="text-emerald-100/90 leading-relaxed text-sm">Real-time vacancies, verified listings, and direct reservation holds for students and staff — all in one place.</p>
          <ul className="space-y-2.5 text-sm text-emerald-100">
            <li className="flex items-center gap-2">• Search by rent fee, amenities, and available rooms</li>
            <li className="flex items-center gap-2">• Save your favorite boarding houses for later</li>
            <li className="flex items-center gap-2">• Reserve a room hold for up to 48 hours</li>
          </ul>
        </div>
        <div className="relative z-10 text-xs text-emerald-200/80">For students, faculty, staff, and visitors of ZDSPGC-Dimataling.</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/60 dark:border-white/15 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 text-center">
            <img
              src="/logo.png"
              alt="ZDSPGC BH Tracker Logo"
              className="mx-auto mb-3.5 h-16 w-16 rounded-full object-cover border-2 border-emerald-500/40 shadow-lg"
            />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome to BH Tracker</h1>
            <p className="text-xs text-muted-foreground mt-1">Sign in or create an account to manage your reservations</p>
          </div>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t border-white/40 dark:border-white/10 text-center text-xs text-muted-foreground">
            Are you a boarding house owner? <a href="/owner/login" className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">Owner Portal</a>
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
      setEmail("");
      setPassword("");
      toast.success("Signed in");
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="off" required />
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
            autoComplete="new-password"
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
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}

function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const role = "customer";
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
    // Save profile and role via server function
    if (data?.user) {
      await updateProfile({ data: { userId: data.user.id, fullName, phone: phone || null } });
      // Register role via API
      await fetch("/api/user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id, role }),
      });
    }
    setBusy(false);
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    toast.success("Account created — you're signed in.");
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <Label htmlFor="su-name">Full name</Label>
        <Input id="su-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
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
            autoComplete="new-password"
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

      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
    </form>
  );
}
