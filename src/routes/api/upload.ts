import { createFileRoute } from "@tanstack/react-router";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const formData = await request.formData();
          const file = formData.get("file") as File | null;
          const userId = formData.get("userId") as string | null;

          if (!file || !userId) {
            return Response.json({ error: "Missing file or userId" }, { status: 400 });
          }

          // Ensure upload directory exists
          await mkdir(UPLOAD_DIR, { recursive: true });

          const ext = file.name.split(".").pop() ?? "jpg";
          const filename = `${userId}-${randomUUID()}.${ext}`;
          const filepath = join(UPLOAD_DIR, filename);

          const buffer = Buffer.from(await file.arrayBuffer());
          await writeFile(filepath, buffer);

          const url = `/uploads/${filename}`;
          return Response.json({ url });
        } catch (e) {
          console.error("Upload error:", e);
          return Response.json({ error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
