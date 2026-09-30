import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : (import.meta.env.VITE_APP_URL || "https://campus-boarding-finder-afa540be-3.onrender.com"),
});
