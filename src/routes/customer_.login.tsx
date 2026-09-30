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
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-primary to-primary/70 p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">BH Vacancy Tracker</div>
            <div className="text-xs opacity-80">ZDSPGC-Dimataling Campus</div>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Find your boarding house near ZDSPGC Dimataling Campus — the easy way.</h2>
          <p className="opacity-90">Real-time vacancies, verified listings, and direct messaging with boarding house owners in ZDSPGC Dimataling — all in one place.</p>
          <ul className="space-y-2 text-sm opacity-90">
            <li>• Search by rent, amenities, and vacancy</li>
            <li>• Save your favorite boarding houses near campus</li>
            <li>• Message owners directly</li>
          </ul>
        </div>
        <div className="text-xs opacity-70">For students, faculty, staff, and visitors of ZDSPGC-Dimataling.</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin"><SignInForm /></TabsContent>
            <TabsContent value="signup"><SignUpForm /></TabsContent>
          </Tabs>
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
