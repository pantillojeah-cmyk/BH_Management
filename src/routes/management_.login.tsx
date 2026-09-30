import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";


import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { getUserRole } from "@/lib/server-fns";

export const Route = createFileRoute("/management_/login")({
  head: () => ({ meta: [{ title: "Admin Portal - Login" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        const role = await getUserRole({ data: { userId: data.user.id } });
        if (role === "admin") {
          toast.success("Welcome back, Admin");
          setEmail("");
          setPassword("");
          navigate({ to: "/management" });
        } else {
          toast.error("Unauthorized: Not an administrator account.");
          await authClient.signOut();
          setEmail("");
          setPassword("");
          setLoading(false);
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-900 p-8 shadow-2xl border border-slate-800">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10">
            <ShieldCheck className="h-8 w-8 text-indigo-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Portal</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access the administrator dashboard
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@boarding.com"
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-5 focus-visible:ring-indigo-500"
              autoComplete="new-password"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-700"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Authenticate"}
          </Button>
        </form>

          <div className="flex items-center mb-4 cursor-pointer text-indigo-400 hover:underline" onClick={() => navigate({ to: '/' })}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Home
          </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Return to <a href="/" className="text-indigo-400 hover:underline">main site</a>
        </div>
      </div>
    </div>
  );
}
