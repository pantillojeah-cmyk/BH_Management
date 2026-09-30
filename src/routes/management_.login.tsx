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
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 p-4 overflow-hidden">
      {/* Ambient background light orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[34rem] w-[34rem] rounded-full bg-indigo-600/20 blur-[130px] animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 h-[36rem] w-[36rem] rounded-full bg-blue-600/15 blur-[140px] animate-float-slow" />
        <div className="absolute top-1/2 left-1/3 h-[28rem] w-[28rem] rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-md space-y-7 rounded-3xl bg-slate-900/70 p-8 sm:p-10 shadow-2xl border border-white/10 backdrop-blur-2xl">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="ZDSPGC BH Tracker Logo"
            className="mx-auto mb-4 h-20 w-20 rounded-full object-cover border-2 border-indigo-400/40 shadow-xl shadow-indigo-500/20"
          />
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Portal</h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Sign in to access the campus administrator dashboard
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@boarding.com"
              className="h-11 rounded-xl border-white/10 bg-slate-800/60 backdrop-blur-md text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500"
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 rounded-xl border-white/10 bg-slate-800/60 backdrop-blur-md text-white placeholder:text-slate-500 focus-visible:ring-indigo-500/40 focus-visible:border-indigo-500"
              autoComplete="new-password"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 font-semibold text-white shadow-lg shadow-indigo-600/25 border border-white/20 transition-all hover:scale-[1.01]"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Authenticate"}
          </Button>
        </form>

        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs">
          <button
            type="button"
            className="flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Home
          </button>
          <a href="/customer/login" className="text-slate-400 hover:text-white transition-colors">
            Student login →
          </a>
        </div>
      </div>
    </div>
  );
}
