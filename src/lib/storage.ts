export function isExternalUrl(s: string | null | undefined) {
  return !!s && /^https?:\/\//i.test(s);
}

export async function resolvePhoto(value: string | null | undefined): Promise<string | null> {
  if (!value) return null;
  // All photos are now served from /uploads or are already full URLs
  return value;
}

export async function uploadOwnerPhoto(userId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("userId", userId);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error ?? "Upload failed");
  }
  const { url } = await res.json();
  return url;
}
