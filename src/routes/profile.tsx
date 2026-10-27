import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { getProfile, updateProfile } from "@/lib/server-fns";
import { uploadOwnerPhoto } from "@/lib/storage";
import { ImageViewerModal } from "@/components/ImageViewerModal";
import { Camera, Upload, User, X, FileText, ExternalLink, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — Boarding House Tracker" }] }),
  component: Profile,
});

function Profile() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // Profile Picture state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);

  // Boarding House Documents & Permits state (for owners)
  const [documents, setDocuments] = useState<string[]>([]);
  const [newDocFiles, setNewDocFiles] = useState<File[]>([]);
  const [newDocPreviews, setNewDocPreviews] = useState<string[]>([]);

  // Full-screen image viewer
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerTitle, setViewerTitle] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);

  const openViewer = (images: string[], index = 0, title = "") => {
    setViewerImages(images);
    setViewerIndex(index);
    setViewerTitle(title);
    setViewerOpen(true);
  };

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/customer/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    getProfile({ data: { userId: user.id } }).then((data) => {
      const rawName = data?.full_name ?? "";
      if (rawName.includes(",")) {
        const [last, rest] = rawName.split(",");
        setLastName(last.trim());
        const restParts = (rest || "").trim().split(/\s+/);
        if (
          restParts.length > 1 &&
          (restParts[restParts.length - 1].length <= 2 || restParts[restParts.length - 1].endsWith("."))
        ) {
          setMiddleInitial(restParts.pop() || "");
          setFirstName(restParts.join(" "));
        } else {
          setFirstName((rest || "").trim());
        }
      } else {
        const parts = rawName.trim().split(/\s+/);
        if (parts.length > 1) {
          setLastName(parts.pop() || "");
          setFirstName(parts.join(" "));
        } else {
          setFirstName(rawName);
        }
      }
      setPhone(data?.phone ?? "");
      setAvatarUrl(data?.avatarUrl ?? null);
      setDocuments(data?.documents ?? []);
    });
  }, [user]);

  const capitalizeWords = (str: string) => str.replace(/\b\w/g, (c) => c.toUpperCase());

  const save = async () => {
    if (!user) return;
    const cleanFirst = capitalizeWords(firstName.trim());
    const cleanLast = capitalizeWords(lastName.trim());
    const cleanMi = middleInitial.trim().toUpperCase().replace(/\.?$/, middleInitial.trim() ? "." : "");

    if (!cleanFirst) {
      toast.error("First Name is required");
      return;
    }
    if (!cleanLast) {
      toast.error("Last Name is required");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    if (/[a-zA-Z]/.test(phone)) {
      toast.error("Letters are not allowed in phone number. Numbers only.");
      return;
    }
    if (phone.replace(/\D/g, "").length > 11 || phone.length > 11) {
      toast.error("Phone number cannot exceed 11 digits");
      return;
    }
    if (!/^\d{11}$/.test(phone.trim())) {
      toast.error("Phone number must be exactly 11 digits");
      return;
    }

    setSaving(true);
    const fullName = cleanMi ? `${cleanLast}, ${cleanFirst} ${cleanMi}` : `${cleanLast}, ${cleanFirst}`;

    try {
      // 1. Upload new profile picture if chosen
      let finalAvatarUrl = avatarUrl;
      if (newAvatarFile) {
        finalAvatarUrl = await uploadOwnerPhoto(user.id, newAvatarFile);
      } else if (avatarRemoved) {
        finalAvatarUrl = null;
      }

      // 2. Upload any newly attached document/permit photos
      const newlyUploadedDocs: string[] = [];
      if (newDocFiles.length > 0) {
        for (const docFile of newDocFiles) {
          const url = await uploadOwnerPhoto(user.id, docFile);
          newlyUploadedDocs.push(url);
        }
      }

      const finalDocs = [...documents, ...newlyUploadedDocs];

      // 3. Save profile
      await updateProfile({
        data: {
          userId: user.id,
          fullName,
          phone: phone.trim(),
          avatarUrl: finalAvatarUrl,
          documents: finalDocs,
        },
      });

      setAvatarUrl(finalAvatarUrl);
      setNewAvatarFile(null);
      setNewAvatarPreview(null);
      setAvatarRemoved(false);
      setDocuments(finalDocs);
      setNewDocFiles([]);
      setNewDocPreviews([]);

      toast.success("Profile and documents updated successfully!");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const currentAvatarDisplay = newAvatarPreview || (!avatarRemoved ? avatarUrl : null);
  const isOwner = role === "owner";

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <span>My Profile</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            Signed in as <span className="font-semibold text-foreground">{user.email}</span> · role{" "}
            <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              {role}
            </span>
          </p>
        </div>

        {/* Profile Card */}
        <div className="glass-panel space-y-6 rounded-3xl border border-white/60 dark:border-white/10 p-6 sm:p-8 shadow-xl backdrop-blur-2xl">
          {/* Profile Picture Upload Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-border/50">
            <div className="relative group">
              <div
                onClick={() => {
                  if (currentAvatarDisplay) {
                    openViewer([currentAvatarDisplay], 0, `${firstName || "User"} — Profile Picture`);
                  }
                }}
                className={`h-24 w-24 rounded-full overflow-hidden border-4 border-indigo-500/40 dark:border-indigo-400/40 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center shadow-lg transition-transform ${
                  currentAvatarDisplay ? "cursor-pointer hover:scale-105" : ""
                }`}
                title={currentAvatarDisplay ? "Click to view full photo" : ""}
              >
                {currentAvatarDisplay ? (
                  <img src={currentAvatarDisplay} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-indigo-400 dark:text-indigo-500" />
                )}
              </div>

              {currentAvatarDisplay && (
                <div className="pointer-events-none absolute inset-0 rounded-full bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ExternalLink className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <Label className="text-sm font-bold text-foreground">Profile Picture / ID Photo</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload a clear photo for your owner profile. Visible to administrators and students.
                </p>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2.5 pt-1">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 shadow-xs transition-colors">
                  <Camera className="h-3.5 w-3.5" />
                  <span>{currentAvatarDisplay ? "Change Photo" : "Upload Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setNewAvatarFile(f);
                        setNewAvatarPreview(URL.createObjectURL(f));
                        setAvatarRemoved(false);
                      }
                    }}
                  />
                </label>

                {currentAvatarDisplay && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewAvatarFile(null);
                      setNewAvatarPreview(null);
                      setAvatarRemoved(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Name & Contact Info Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-8 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  First Name
                </Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(capitalizeWords(e.target.value))}
                  placeholder="e.g. Juan"
                  maxLength={100}
                  autoCapitalize="words"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="col-span-4 space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Middle Initial
                </Label>
                <Input
                  value={middleInitial}
                  onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())}
                  placeholder="e.g. M."
                  maxLength={4}
                  autoCapitalize="characters"
                  className="h-11 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Last Name
              </Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(capitalizeWords(e.target.value))}
                placeholder="e.g. Dela Cruz"
                maxLength={100}
                autoCapitalize="words"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone number</Label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="09*********"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 rounded-xl"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Must be 11 numeric digits (e.g. 09*********)
              </p>
            </div>
          </div>

          {/* Boarding House Permits & Documents Section (For Owners) */}
          {isOwner && (
            <div className="pt-4 border-t border-border/50 space-y-3.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Boarding House Permits & Documents
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mayor's / Business Permit, Barangay Clearance, Fire Safety Certificate, etc.
                  </p>
                </div>

                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {documents.length + newDocPreviews.length} File{documents.length + newDocPreviews.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Existing and newly chosen documents grid */}
              {(documents.length > 0 || newDocPreviews.length > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
                  {/* Existing Saved Documents */}
                  {documents.map((docUrl, idx) => (
                    <div
                      key={`saved-${idx}`}
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all"
                    >
                      <img
                        src={docUrl}
                        alt={`Permit ${idx + 1}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                        onClick={() => openViewer(documents, idx, `Saved Permit Document ${idx + 1}`)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDocuments((prev) => prev.filter((_, i) => i !== idx));
                          toast.info("Document removed from list. Click 'Save Changes' to apply.");
                        }}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                        title="Remove document"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] px-2 py-0.5 text-center truncate font-medium">
                        Permit {idx + 1}
                      </div>
                    </div>
                  ))}

                  {/* Newly Staged Documents */}
                  {newDocPreviews.map((previewUrl, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50/30 shadow-sm"
                    >
                      <img
                        src={previewUrl}
                        alt={`New Permit ${idx + 1}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                        onClick={() => openViewer(newDocPreviews, idx, `New Permit Preview ${idx + 1}`)}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setNewDocFiles((prev) => prev.filter((_, i) => i !== idx));
                          setNewDocPreviews((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                        title="Cancel adding"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-emerald-700/80 text-white text-[9px] px-1 py-0.5 text-center truncate font-bold">
                        New (Pending Save)
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Dropzone */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 rounded-2xl p-4 bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 cursor-pointer transition-colors text-center">
                <Upload className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-1.5" />
                <span className="text-xs font-bold text-foreground">
                  {documents.length > 0 || newDocPreviews.length > 0
                    ? "Add More Permit / Document Photos"
                    : "Attach Boarding House Permits"}
                </span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  Click to select photos from your device (PNG, JPG, JPEG)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    if (files.length > 0) {
                      setNewDocFiles((prev) => [...prev, ...files]);
                      const newUrls = files.map((f) => URL.createObjectURL(f));
                      setNewDocPreviews((prev) => [...prev, ...newUrls]);
                    }
                  }}
                />
              </label>
            </div>
          )}

          {/* Save Button */}
          <Button
            onClick={save}
            disabled={saving}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white shadow-md shadow-emerald-600/20 border border-white/20 font-semibold text-sm"
          >
            {saving ? "Saving Changes…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Full-Screen Image Viewer Modal */}
      <ImageViewerModal
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        images={viewerImages}
        currentIndex={viewerIndex}
        onIndexChange={setViewerIndex}
        title={viewerTitle}
      />
    </AppShell>
  );
}

