import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Building2, Eye, EyeOff, KeyRound, ArrowLeft, Clock, LogOut, CheckCircle2, RotateCcw, AlertCircle, Camera, Upload, User, X, FileText, XCircle } from "lucide-react";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { updateProfile } from "@/lib/server-fns";
import { uploadOwnerPhoto } from "@/lib/storage";
import { ForgotPasswordModal } from "@/components/ForgotPasswordModal";

export const Route = createFileRoute("/owner_/login")({
  head: () => ({ meta: [{ title: "Owner Portal — Boarding House Tracker" }] }),
  component: OwnerAuthPage,
});

const emailSchema = z.string().trim().email("Invalid email").max(255);
const passSchema = z.string().min(6, "Password must be at least 6 characters").max(72);
const nameSchema = z.string().trim().min(2, "Full name is required").max(100);
const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .refine((val) => !/[a-zA-Z]/.test(val), {
    message: "Letters are not allowed. Please enter numbers only.",
  })
  .refine((val) => val.replace(/\D/g, "").length <= 11 && val.length <= 11, {
    message: "Phone number cannot exceed 11 digits.",
  })
  .refine((val) => /^\d{11}$/.test(val), {
    message: "Phone number must be exactly 11 digits (e.g. 09*********).",
  });

function OwnerAuthPage() {
  const navigate = useNavigate();
  const { user, role } = useAuth();

  useEffect(() => {
    if (user && role) {
      if (role === "admin") navigate({ to: "/management" });
      else if (role === "owner") navigate({ to: "/owner" });
      // pending_owner and rejected_owner stay on this page to see the status screen
      else if (role !== "pending_owner" && (role as string) !== "rejected_owner") navigate({ to: "/browse" });
    }
  }, [user, role, navigate]);

  if (user && role === "pending_owner") {
    return <PendingApprovalScreen userName={user.name} email={user.email} />;
  }

  if (user && (role as string) === "rejected_owner") {
    return <RejectedOwnerScreen userName={user.name} email={user.email} />;
  }

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2 overflow-hidden bg-background/50">
      {/* Ambient background light orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[34rem] w-[34rem] rounded-full bg-indigo-500/15 blur-[120px] dark:bg-indigo-500/20 animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 h-[38rem] w-[38rem] rounded-full bg-blue-500/12 blur-[140px] dark:bg-blue-600/15 animate-float-slow" />
      </div>

      <div className="hidden relative bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-950 p-10 xl:p-12 text-white lg:flex lg:flex-col lg:justify-between lg:sticky lg:top-0 lg:h-screen overflow-hidden">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl" />

        {/* Top Header & Intro text positioned up */}
        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png?v=2026"
              alt="ZDSPGC BH Tracker Logo"
              className="h-12 w-12 rounded-full object-contain bg-white p-0.5 border-2 border-white/70 shadow-lg"
            />
            <div>
              <div className="font-bold text-lg leading-tight">BH Vacancy Tracker</div>
              <div className="text-xs text-indigo-200">Owner Portal · ZDSPGC Dimataling</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="inline-block rounded-full bg-white/20 border border-white/30 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
              Property Owner Dashboard
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">Manage your boarding house with ease.</h2>
            <p className="text-indigo-100/90 leading-relaxed text-sm">Reach more students, manage vacancies in real-time, and handle inquiries securely from one intuitive dashboard.</p>
            <ul className="space-y-2.5 text-sm text-indigo-100 pt-1">
              <li className="flex items-center gap-2">• List and showcase your rooms with photos</li>
              <li className="flex items-center gap-2">• Instantly update vacancy counts & rooms</li>
              <li className="flex items-center gap-2">• Review reservations and verify tenant holds</li>
            </ul>
          </div>
        </div>

        <div className="relative z-10 text-xs text-indigo-200/80 pt-6">For verified boarding house owners near ZDSPGC-Dimataling.</div>
      </div>

      <div className="flex items-center justify-center p-4 sm:p-10">
        <div className="w-full max-w-md glass-panel p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/60 dark:border-white/15 shadow-2xl backdrop-blur-2xl">
          <div className="mb-6 text-center">
            <img
              src="/logo.png?v=2026"
              alt="ZDSPGC BH Tracker Logo"
              className="mx-auto mb-3.5 h-16 w-16 rounded-full object-contain bg-white p-1 border-2 border-indigo-500/40 shadow-lg"
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
  const [forgotOpen, setForgotOpen] = useState(false);

  useEffect(() => {
    setEmail("");
    setPassword("");
    const timer = setTimeout(() => {
      setEmail("");
      setPassword("");
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
    <>
      <form onSubmit={submit} className="mt-6 space-y-4" autoComplete="off">
        {/* Hidden decoy inputs to absorb browser autofill */}
        <div style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1, overflow: "hidden" }} aria-hidden="true">
          <input type="text" name="fake_username_autofill" tabIndex={-1} autoComplete="username" />
          <input type="password" name="fake_password_autofill" tabIndex={-1} autoComplete="current-password" />
        </div>

        <div>
          <Label htmlFor="si-email">Email</Label>
          <Input
            id="si-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner@example.com"
            required
            autoComplete="new-password"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="si-pass">Password</Label>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 font-medium transition-colors hover:underline"
            >
              Forgot password?
            </button>
          </div>
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
        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <ForgotPasswordModal
        open={forgotOpen}
        onOpenChange={setForgotOpen}
        defaultEmail={email}
        title="Owner Password Retrieval"
        onSuccess={(retrievedEmail) => {
          setEmail(retrievedEmail);
          setPassword("");
        }}
      />
    </>
  );
}

function SignUpForm() {
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarTouched, setAvatarTouched] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<string[]>([]);
  const [documentTouched, setDocumentTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLastName("");
    setFirstName("");
    setMiddleInitial("");
    setEmail("");
    setPhone("");
    setPassword("");
    setAvatarFile(null);
    setAvatarPreview(null);
    setDocumentFiles([]);
    setDocumentPreviews([]);
    setLastNameTouched(false);
    setFirstNameTouched(false);
    setPhoneTouched(false);
    setEmailTouched(false);
    setPasswordTouched(false);
    setAvatarTouched(false);
    setDocumentTouched(false);
    const timer = setTimeout(() => {
      setEmail("");
      setPassword("");
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getPhoneError = (val: string, touched: boolean) => {
    if (!val) {
      return touched ? "Phone number is required." : null;
    }
    const hasLetters = /[a-zA-Z]/.test(val);
    const hasSpecial = /[^0-9a-zA-Z]/.test(val);
    const digitsOnly = val.replace(/\D/g, "");
    const isTooLong = val.length > 11 || digitsOnly.length > 11;

    if (hasLetters && isTooLong) {
      return "Letters are not allowed and phone number cannot exceed 11 digits.";
    }
    if (hasLetters) {
      return "Letters are not allowed. Please enter numbers only.";
    }
    if (hasSpecial) {
      return "Special characters are not allowed. Numbers only.";
    }
    if (isTooLong) {
      return "Phone number cannot exceed 11 digits.";
    }
    if (touched && digitsOnly.length < 11) {
      return "Phone number must be exactly 11 digits (e.g. 09*********).";
    }
    return null;
  };

  const capitalizeWords = (str: string) => str.replace(/\b\w/g, (c) => c.toUpperCase());

  const avatarError = avatarTouched && !avatarFile ? "Profile picture / ID photo is required." : null;
  const firstNameError = firstNameTouched && !firstName.trim() ? "First Name is required." : null;
  const lastNameError = lastNameTouched && !lastName.trim() ? "Last Name is required." : null;
  const emailError = emailTouched && (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    ? (!email.trim() ? "Email address is required." : "Please enter a valid email address.")
    : null;
  const phoneError = getPhoneError(phone, phoneTouched);
  const passwordError = passwordTouched && (!password || password.length < 6)
    ? (!password ? "Password is required." : "Password must be at least 6 characters.")
    : null;
  const documentError = documentTouched && documentFiles.length === 0
    ? "At least one permit or clearance document is required."
    : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAvatarTouched(true);
    setFirstNameTouched(true);
    setLastNameTouched(true);
    setEmailTouched(true);
    setPhoneTouched(true);
    setPasswordTouched(true);
    setDocumentTouched(true);

    if (!avatarFile) {
      toast.error("Profile picture / ID photo is required.");
      return;
    }

    const cleanFirst = capitalizeWords(firstName.trim());
    const cleanLast = capitalizeWords(lastName.trim());
    const cleanMi = middleInitial.trim().toUpperCase().replace(/\.?$/, middleInitial.trim() ? "." : "");

    if (!cleanFirst) {
      toast.error("First Name is required.");
      return;
    }
    if (!cleanLast) {
      toast.error("Last Name is required.");
      return;
    }

    if (!email.trim()) {
      toast.error("Email address is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    const pErr = getPhoneError(phone, true);
    if (pErr) {
      toast.error(pErr);
      return;
    }

    if (!password) {
      toast.error("Password is required.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (documentFiles.length === 0) {
      toast.error("Please attach at least one permit or clearance document.");
      return;
    }

    const fullName = cleanMi ? `${cleanLast}, ${cleanFirst} ${cleanMi}` : `${cleanLast}, ${cleanFirst}`;

    try {
      nameSchema.parse(fullName);
      emailSchema.parse(email);
      phoneSchema.parse(phone);
      passSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) { toast.error(err.issues[0].message); return; }
    }
    setBusy(true);
    const { data, error } = await authClient.signUp.email({ email, password, name: fullName });
    if (error) { toast.error(error.message); setBusy(false); return; }
    
    if (data?.user) {
      const userId = data.user.id;

      // 1. Upload avatar photo
      let avatarUrl: string | null = null;
      if (avatarFile) {
        try {
          avatarUrl = await uploadOwnerPhoto(userId, avatarFile);
        } catch (err) {
          console.error("Avatar upload failed:", err);
          toast.error("Failed to upload profile picture. Please try again.");
          setBusy(false);
          return;
        }
      }

      // 2. Upload permit/documents
      const uploadedDocs: string[] = [];
      if (documentFiles.length > 0) {
        for (const docFile of documentFiles) {
          try {
            const url = await uploadOwnerPhoto(userId, docFile);
            uploadedDocs.push(url);
          } catch (err) {
            console.error("Document upload failed:", err);
          }
        }
      }

      if (uploadedDocs.length === 0) {
        toast.error("Failed to upload permit documents. Please try again.");
        setBusy(false);
        return;
      }

      // 3. Save profile with avatar and documents
      await updateProfile({
        data: {
          userId,
          fullName,
          phone: phone.trim(),
          avatarUrl,
          documents: uploadedDocs,
        },
      });

      // 4. Register role as owner
      await fetch("/api/user-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: "owner" }),
      });
    }
    setBusy(false);
    toast.success("Owner account created — awaiting admin approval.");
    setLastName("");
    setFirstName("");
    setMiddleInitial("");
    setEmail("");
    setPhone("");
    setPassword("");
    setAvatarFile(null);
    setAvatarPreview(null);
    setDocumentFiles([]);
    setDocumentPreviews([]);
    setLastNameTouched(false);
    setFirstNameTouched(false);
    setPhoneTouched(false);
    setEmailTouched(false);
    setPasswordTouched(false);
    setAvatarTouched(false);
    setDocumentTouched(false);
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" autoComplete="off">
      {/* Hidden decoy inputs to absorb browser autofill */}
      <div style={{ position: "absolute", opacity: 0, height: 0, width: 0, zIndex: -1, overflow: "hidden" }} aria-hidden="true">
        <input type="text" name="fake_username_autofill" tabIndex={-1} autoComplete="username" />
        <input type="password" name="fake_password_autofill" tabIndex={-1} autoComplete="current-password" />
      </div>

      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 p-3 text-xs text-amber-700 dark:text-amber-300">
        ⏳ After registration, your account and submitted documents will be reviewed by the admin before you can access the Owner Dashboard.
      </div>

      {/* Profile Picture Upload */}
      <div className={`space-y-1.5 p-3 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border transition-colors ${
        avatarError
          ? "border-red-500 ring-1 ring-red-500/50"
          : "border-indigo-200/60 dark:border-indigo-800/40"
      }`}>
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
            Profile Picture / ID Photo <span className="text-red-500">*</span>
          </Label>
          <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium bg-indigo-100/60 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
            Required
          </span>
        </div>
        <div className="flex items-center gap-3.5 pt-1">
          <div className={`relative h-14 w-14 rounded-full overflow-hidden border-2 bg-white dark:bg-slate-800 flex items-center justify-center flex-shrink-0 shadow-sm ${
            avatarError ? "border-red-500" : "border-indigo-400/50"
          }`}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Profile Preview" className="h-full w-full object-cover" />
            ) : (
              <User className={`h-7 w-7 ${avatarError ? "text-red-400" : "text-indigo-400"}`} />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 shadow-sm transition-colors">
                <Camera className="h-3.5 w-3.5" />
                <span>{avatarFile ? "Change Photo" : "Attach Profile Photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setAvatarFile(f);
                      setAvatarPreview(URL.createObjectURL(f));
                      setAvatarTouched(false);
                    }
                  }}
                />
              </label>
              {avatarFile && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                  className="text-xs text-rose-500 hover:underline font-medium"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {avatarFile ? avatarFile.name : "Attach photo of the boarding house owner"}
            </p>
          </div>
        </div>
        {avatarError && (
          <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1.5 animate-in fade-in-50">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{avatarError}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-8">
          <Label htmlFor="su-firstname">First Name <span className="text-red-500">*</span></Label>
          <Input
            id="su-firstname"
            placeholder="e.g. Juan"
            value={firstName}
            onChange={(e) => setFirstName(capitalizeWords(e.target.value))}
            onBlur={() => setFirstNameTouched(true)}
            required
            autoCapitalize="words"
            autoComplete="given-name"
            className={firstNameError ? "border-red-500 focus-visible:ring-red-500" : ""}
          />
          {firstNameError && (
            <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1.5 animate-in fade-in-50">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>{firstNameError}</span>
            </p>
          )}
        </div>
        <div className="col-span-4">
          <Label htmlFor="su-mi">Middle Initial</Label>
          <Input
            id="su-mi"
            placeholder="e.g. M."
            maxLength={4}
            value={middleInitial}
            onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
            autoCapitalize="characters"
            autoComplete="additional-name"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="su-lastname">Last Name <span className="text-red-500">*</span></Label>
        <Input
          id="su-lastname"
          placeholder="e.g. Dela Cruz"
          value={lastName}
          onChange={(e) => setLastName(capitalizeWords(e.target.value))}
          onBlur={() => setLastNameTouched(true)}
          required
          autoCapitalize="words"
          autoComplete="family-name"
          className={lastNameError ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {lastNameError && (
          <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1.5 animate-in fade-in-50">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{lastNameError}</span>
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="su-email">Email <span className="text-red-500">*</span></Label>
        <Input
          id="su-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          required
          autoComplete="new-password"
          className={emailError ? "border-red-500 focus-visible:ring-red-500" : ""}
        />
        {emailError && (
          <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1.5 animate-in fade-in-50">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{emailError}</span>
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="su-phone">Phone number <span className="text-red-500">*</span></Label>
        <Input
          id="su-phone"
          type="text"
          inputMode="numeric"
          placeholder="09*********"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onBlur={() => setPhoneTouched(true)}
          autoComplete="tel"
          required
          className={phoneError ? "border-red-500 focus-visible:ring-red-500 text-red-600 dark:text-red-400" : ""}
        />
        {phoneError ? (
          <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1.5 animate-in fade-in-50">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{phoneError}</span>
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground mt-1">
            Must be 11 numeric digits (e.g. 09*********)
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="su-pass">Password <span className="text-red-500">*</span></Label>
        <div className="relative">
          <Input
            id="su-pass"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            className={`pr-10 ${passwordError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
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
        {passwordError ? (
          <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1.5 animate-in fade-in-50">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{passwordError}</span>
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground mt-1">Must be at least 6 characters</p>
        )}
      </div>

      {/* Boarding House Documents / Permit Photos */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Boarding House Documents & Permits <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium bg-indigo-100/60 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              Required
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-300 font-medium bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              For Admin Review
            </span>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Attach photos of your Business Permit, Barangay Clearance, or Fire Safety documents.
        </p>

        {/* Previews grid if any */}
        {documentPreviews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1 pb-1">
            {documentPreviews.map((previewUrl, idx) => (
              <div
                key={idx}
                className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm"
              >
                <img src={previewUrl} alt={`Permit ${idx + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setDocumentFiles((prev) => prev.filter((_, i) => i !== idx));
                    setDocumentPreviews((prev) => prev.filter((_, i) => i !== idx));
                  }}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 shadow transition-opacity"
                  title="Remove document"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1 py-0.5 text-center truncate">
                  Doc {idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload drop zone */}
        <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-3.5 cursor-pointer transition-colors text-center ${
          documentError
            ? "border-red-500 bg-red-50/20 dark:bg-red-950/20 hover:bg-red-50/40"
            : "border-indigo-300 dark:border-indigo-700/60 bg-indigo-50/20 dark:bg-indigo-950/10 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30"
        }`}>
          <Upload className={`h-4 w-4 mb-1 ${documentError ? "text-red-500" : "text-indigo-600 dark:text-indigo-400"}`} />
          <span className="text-xs font-semibold text-foreground">
            {documentFiles.length > 0 ? "Attach more permit photos" : "Upload Permit / Documents"}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Click to choose photos (PNG, JPG)</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) {
                setDocumentFiles((prev) => [...prev, ...files]);
                const newPreviews = files.map((f) => URL.createObjectURL(f));
                setDocumentPreviews((prev) => [...prev, ...newPreviews]);
                setDocumentTouched(false);
              }
            }}
          />
        </label>
        {documentError && (
          <p className="text-xs font-medium text-red-500 mt-1 flex items-center gap-1.5 animate-in fade-in-50">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{documentError}</span>
          </p>
        )}
      </div>

      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2" disabled={busy}>{busy ? "Creating account…" : "Create owner account"}</Button>
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
          <img src="/logo.png?v=2026" alt="Logo" className="h-16 w-16 rounded-full object-cover border-2 border-amber-400/40 shadow-xl" />
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

function RejectedOwnerScreen({ userName, email }: { userName?: string; email?: string }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason] = useState<string>("Incomplete or invalid documents / permits.");

  useEffect(() => {
    fetch("/api/user-role")
      .then((res) => res.json())
      .then((d) => {
        if (d?.reason) setReason(d.reason);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-rose-50/40 to-slate-100 dark:from-slate-950 dark:via-rose-950/20 dark:to-slate-900 overflow-hidden p-6">
      {/* Ambient background light orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[30rem] w-[30rem] rounded-full bg-rose-400/10 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-slate-400/10 blur-[120px] animate-float-slow" />
      </div>

      <div className="w-full max-w-lg text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <img src="/logo.png?v=2026" alt="Logo" className="h-16 w-16 rounded-full object-cover border-2 border-rose-400/40 shadow-xl" />
        </div>

        {/* Main card */}
        <div className="rounded-3xl border border-rose-200/60 dark:border-rose-700/40 bg-white/80 dark:bg-slate-800/70 backdrop-blur-2xl p-8 shadow-2xl space-y-5">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/40 border-2 border-rose-300 dark:border-rose-600 shadow-lg">
            <XCircle className="h-10 w-10 text-rose-600 dark:text-rose-400" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Registration Declined</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {userName ? `Hi ${userName},` : "Notice:"} your owner registration was not approved.
            </p>
          </div>

          <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-700 p-4 text-left space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Reason Provided by Admin:
            </div>
            <p className="text-xs text-rose-800 dark:text-rose-200 leading-relaxed font-medium">
              "{reason}"
            </p>
          </div>

          {email && (
            <p className="text-xs text-muted-foreground">
              Account: <span className="font-semibold text-foreground">{email}</span>
            </p>
          )}

          <p className="text-xs text-muted-foreground">
            You may visit the campus administration office or re-register with updated documents.
          </p>

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
    </div>
  );
}
