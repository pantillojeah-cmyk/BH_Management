// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Use node-server preset so Render can run the output with plain Node.js.
  // Cloudflare Workers (the default) only exports a fetch() handler, not an HTTP server.
  nitro: {
    preset: "node-server",
    output: {
      dir: "dist",
      serverDir: "dist/server",
      publicDir: "dist/client",
    },
  },
  vite: {
    server: {
      host: true,
      port: 0,
      strictPort: false,
      allowedHosts: [
        "bh-management.onrender.com",
        ".onrender.com",
        "localhost",
        "127.0.0.1",
      ],
    },
    preview: {
      host: true,
      allowedHosts: [
        "bh-management.onrender.com",
        ".onrender.com",
        "localhost",
        "127.0.0.1",
      ],
    },
  },
});
