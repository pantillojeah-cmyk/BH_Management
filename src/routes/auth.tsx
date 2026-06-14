import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth, dashboardPath } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Home } from "lucide-react";
import { toast } from "sonner";

const search = z.object({
  mode: fallback(z.enum(["signin", "signup"]).optional(), undefined),
  role: fallback(z.enum(["customer", "owner"]).optional(), undefined),
});

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(search),
  head: () => ({ meta: [{ title: "Sign in — BH Tracker" }, { name: "description", content: "Sign in or create an account on the Boarding House Vacancy Tracker." }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, role } = Route.useSearch();
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: dashboardPath(roles), replace: true });
  }, [user, roles, loading, navigate]);

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4 py-8">
      <Card className="w-full p-6 shadow-elegant">
        <Link to="/" className="mb-6 flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground"><Home className="h-5 w-5" /></div>
          <span className="font-display font-bold">BH Tracker</span>
        </Link>

        <Tabs defaultValue={mode === "signup" ? "signup" : "signin"}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Sign up</TabsTrigger>
          </TabsList>
          <TabsContent value="signin"><SignInForm /></TabsContent>
          <TabsContent value="signup"><SignUpForm defaultRole={role ?? "customer"} /></TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function GoogleButton() {
  const onClick = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error(result.error.message || "Google sign-in failed");
  };
  return (
    <Button type="button" variant="outline" onClick={onClick} className="w-full">
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5c1.6 0 3.1.6 4.2 1.6l3.1-3.1A10 10 0 002 12a10 10 0 0010 10c5.5 0 9.5-3.9 9.5-9.4 0-.6 0-1.2-.2-1.8H12v3.4h5.5c-.2 1.3-1.6 3.8-5.5 3.8a6 6 0 110-12z"/></svg>
      Continue with Google
    </Button>
  );
}

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome back!");
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <GoogleButton />
      <div className="relative my-2 text-center text-xs uppercase text-muted-foreground">
        <span className="bg-card px-2 relative z-10">or</span>
        <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-border" />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" disabled={loading} className="w-full">Sign in</Button>
      <div className="text-center text-xs">
        <Link to="/reset-password" className="text-muted-foreground hover:underline">Forgot password?</Link>
      </div>
    </form>
  );
}

function SignUpForm({ defaultRole }: { defaultRole: "customer" | "owner" }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [requestedRole, setRequestedRole] = useState<"customer" | "owner">(defaultRole);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName, requested_role: requestedRole },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success(requestedRole === "owner" ? "Account created! Your owner application is pending admin approval." : "Account created!");
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <GoogleButton />
      <div className="relative my-2 text-center text-xs uppercase text-muted-foreground">
        <span className="bg-card px-2 relative z-10">or</span>
        <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-border" />
      </div>
      <div>
        <Label>Full name</Label>
        <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label>Password</Label>
        <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <div>
        <Label className="mb-2 block">I am a…</Label>
        <RadioGroup value={requestedRole} onValueChange={(v) => setRequestedRole(v as "customer" | "owner")} className="grid grid-cols-2 gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <RadioGroupItem value="customer" /> <span className="text-sm">Student / Customer</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <RadioGroupItem value="owner" /> <span className="text-sm">Boarding house owner</span>
          </label>
        </RadioGroup>
      </div>
      <Button type="submit" disabled={loading} className="w-full">Create account</Button>
    </form>
  );
}
